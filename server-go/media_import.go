package main

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"server-go/adb"
)

const (
	mediaImporterPackage       = "com.monviewphone.mediaimport"
	mediaImporterAuthority     = "content://com.monviewphone.mediaimport"
	mediaImporterVersion       = 5
	mediaImportMaxFiles        = 100
	mediaImportMaxFileBytes    = int64(512 * 1024 * 1024)
	mediaImportMaxBatchBytes   = int64(2 * 1024 * 1024 * 1024)
	mediaImportRequestOverhead = int64(16 * 1024 * 1024)
)

var (
	mediaImporterInstallMu sync.Mutex
	mediaImporterReady     sync.Map
)

type mediaImportFile struct {
	Path   string
	Name   string
	Size   int64
	SHA256 string
}

type mediaImportResult struct {
	Files            int   `json:"files"`
	Bytes            int64 `json:"bytes"`
	ProviderElapsed  int64 `json:"providerElapsedMs"`
	TotalElapsed     int64 `json:"totalElapsedMs"`
	InstalledOrReady bool  `json:"helperReady"`
}

func validateMediaImportName(name string) error {
	if name == "" || len(name) > 240 || name == "." || name == ".." ||
		strings.ContainsAny(name, `/\`) || filepath.Base(name) != name {
		return fmt.Errorf("invalid image file name %q", name)
	}
	for _, char := range name {
		if char < 0x20 {
			return fmt.Errorf("invalid image file name %q", name)
		}
	}
	ext := strings.ToLower(filepath.Ext(name))
	switch ext {
	case ".png", ".jpg", ".jpeg", ".webp", ".gif":
	default:
		return fmt.Errorf("unsupported batch image extension %q", ext)
	}
	if strings.EqualFold(strings.TrimSuffix(name, filepath.Ext(name)), "QR") {
		return fmt.Errorf("%s must use the legacy QR fan-out path", name)
	}
	return nil
}

func rememberMediaImportName(seen map[string]struct{}, name string) error {
	key := strings.ToLower(name)
	if _, exists := seen[key]; exists {
		return fmt.Errorf("duplicate image file name %q", name)
	}
	seen[key] = struct{}{}
	return nil
}

func inspectMediaImportFile(localPath string) (mediaImportFile, error) {
	info, err := os.Stat(localPath)
	if err != nil {
		return mediaImportFile{}, err
	}
	if !info.Mode().IsRegular() {
		return mediaImportFile{}, fmt.Errorf("%s is not a regular file", localPath)
	}
	name := filepath.Base(localPath)
	if err := validateMediaImportName(name); err != nil {
		return mediaImportFile{}, err
	}
	if info.Size() <= 0 || info.Size() > mediaImportMaxFileBytes {
		return mediaImportFile{}, fmt.Errorf("%s has invalid size %d", name, info.Size())
	}

	input, err := os.Open(localPath)
	if err != nil {
		return mediaImportFile{}, err
	}
	defer input.Close()
	digest := sha256.New()
	if _, err := io.Copy(digest, input); err != nil {
		return mediaImportFile{}, err
	}
	return mediaImportFile{
		Path:   localPath,
		Name:   name,
		Size:   info.Size(),
		SHA256: hex.EncodeToString(digest.Sum(nil)),
	}, nil
}

func inspectLocalMediaImportFiles(paths []string) ([]mediaImportFile, error) {
	if len(paths) == 0 || len(paths) > mediaImportMaxFiles {
		return nil, fmt.Errorf("batch must contain 1-%d images", mediaImportMaxFiles)
	}
	files := make([]mediaImportFile, 0, len(paths))
	seenNames := make(map[string]struct{}, len(paths))
	var total int64
	for _, localPath := range paths {
		file, err := inspectMediaImportFile(strings.TrimSpace(localPath))
		if err != nil {
			return nil, err
		}
		if err := rememberMediaImportName(seenNames, file.Name); err != nil {
			return nil, err
		}
		if file.Size > mediaImportMaxBatchBytes-total {
			return nil, fmt.Errorf("batch exceeds %d bytes", mediaImportMaxBatchBytes)
		}
		total += file.Size
		files = append(files, file)
	}
	return files, nil
}

func stageMultipartMediaImport(
	w http.ResponseWriter,
	r *http.Request,
) ([]mediaImportFile, func(), error) {
	r.Body = http.MaxBytesReader(
		w,
		r.Body,
		mediaImportMaxBatchBytes+mediaImportRequestOverhead,
	)
	reader, err := r.MultipartReader()
	if err != nil {
		return nil, nil, fmt.Errorf("invalid multipart batch: %w", err)
	}
	root, err := uploadDir()
	if err != nil {
		return nil, nil, err
	}
	if err := os.MkdirAll(root, 0755); err != nil {
		return nil, nil, err
	}
	tempDir, err := os.MkdirTemp(root, "media-import-")
	if err != nil {
		return nil, nil, err
	}
	cleanup := func() { _ = os.RemoveAll(tempDir) }

	files := make([]mediaImportFile, 0)
	seenNames := make(map[string]struct{})
	var total int64
	for {
		part, nextErr := reader.NextPart()
		if nextErr == io.EOF {
			break
		}
		if nextErr != nil {
			cleanup()
			return nil, nil, nextErr
		}
		if part.FormName() != "files" || part.FileName() == "" {
			_, _ = io.Copy(io.Discard, part)
			_ = part.Close()
			continue
		}
		if len(files) >= mediaImportMaxFiles {
			_ = part.Close()
			cleanup()
			return nil, nil, fmt.Errorf(
				"batch exceeds %d images", mediaImportMaxFiles)
		}

		name := filepath.Base(part.FileName())
		if err := validateMediaImportName(name); err != nil {
			_ = part.Close()
			cleanup()
			return nil, nil, err
		}
		if err := rememberMediaImportName(seenNames, name); err != nil {
			_ = part.Close()
			cleanup()
			return nil, nil, err
		}
		localPath := filepath.Join(tempDir, fmt.Sprintf("%03d.part", len(files)))
		output, err := os.OpenFile(
			localPath,
			os.O_CREATE|os.O_EXCL|os.O_WRONLY,
			0600,
		)
		if err != nil {
			_ = part.Close()
			cleanup()
			return nil, nil, err
		}
		digest := sha256.New()
		size, copyErr := io.Copy(
			io.MultiWriter(output, digest),
			io.LimitReader(part, mediaImportMaxFileBytes+1),
		)
		closeErr := output.Close()
		_ = part.Close()
		if copyErr != nil {
			cleanup()
			return nil, nil, copyErr
		}
		if closeErr != nil {
			cleanup()
			return nil, nil, closeErr
		}
		if size <= 0 || size > mediaImportMaxFileBytes {
			cleanup()
			return nil, nil, fmt.Errorf("%s has invalid size %d", name, size)
		}
		if size > mediaImportMaxBatchBytes-total {
			cleanup()
			return nil, nil, fmt.Errorf(
				"batch exceeds %d bytes", mediaImportMaxBatchBytes)
		}
		total += size
		files = append(files, mediaImportFile{
			Path:   localPath,
			Name:   name,
			Size:   size,
			SHA256: hex.EncodeToString(digest.Sum(nil)),
		})
	}
	if len(files) == 0 {
		cleanup()
		return nil, nil, fmt.Errorf("batch contains no images")
	}
	return files, cleanup, nil
}

func writeMediaImportBatch(output io.Writer, files []mediaImportFile) error {
	for _, file := range files {
		header := fmt.Sprintf(
			"IMPORT\t%s\t%d\t%s\n",
			base64.StdEncoding.EncodeToString([]byte(file.Name)),
			file.Size,
			file.SHA256,
		)
		if _, err := io.WriteString(output, header); err != nil {
			return err
		}
		input, err := os.Open(file.Path)
		if err != nil {
			return err
		}
		written, copyErr := io.CopyN(output, input, file.Size)
		closeErr := input.Close()
		if copyErr != nil {
			return copyErr
		}
		if closeErr != nil {
			return closeErr
		}
		if written != file.Size {
			return fmt.Errorf(
				"%s changed while preparing batch", file.Name)
		}
		if _, err := io.WriteString(output, "\n"); err != nil {
			return err
		}
	}
	_, err := io.WriteString(output, "END\n")
	return err
}

func createMediaImportBatchFile(files []mediaImportFile) (string, func(), error) {
	root, err := uploadDir()
	if err != nil {
		return "", nil, err
	}
	if err := os.MkdirAll(root, 0755); err != nil {
		return "", nil, err
	}
	// ponytail: a disk-backed frame reuses the proven ADB stdin-file helper.
	// Replace with io.Pipe only if host-disk staging becomes measurable.
	output, err := os.CreateTemp(root, "media-import-*.batch")
	if err != nil {
		return "", nil, err
	}
	path := output.Name()
	cleanup := func() { _ = os.Remove(path) }
	if err := writeMediaImportBatch(output, files); err != nil {
		_ = output.Close()
		cleanup()
		return "", nil, err
	}
	if err := output.Close(); err != nil {
		cleanup()
		return "", nil, err
	}
	return path, cleanup, nil
}

func mediaImporterPing(udid string, userID int) (string, bool) {
	command := fmt.Sprintf(
		"content call --user %d --uri %s --method ping 2>&1",
		userID,
		mediaImporterAuthority,
	)
	out, err := adb.CommandTimeout(
		30*time.Second,
		"-s", udid, "shell", command,
	)
	expectedVersion := fmt.Sprintf("version=%d", mediaImporterVersion)
	expectedUser := fmt.Sprintf("process_user=%d", userID)
	ok := err == nil &&
		strings.Contains(out, "success=true") &&
		strings.Contains(out, expectedVersion) &&
		strings.Contains(out, expectedUser) &&
		!strings.Contains(out, "Error while accessing provider")
	return out, ok
}

func mediaImporterAPKPath() (string, error) {
	apkPath, err := filepath.Abs(filepath.Join(
		"mediaimport", "bin", "Monhelper.apk"))
	if err != nil {
		return "", err
	}
	if _, err := os.Stat(apkPath); err != nil {
		return "", fmt.Errorf("media importer APK missing at %s: %w", apkPath, err)
	}
	return apkPath, nil
}

func ensureMediaImporter(udid string, userID int) error {
	if userID < 0 {
		return fmt.Errorf("media batch importer requires a non-negative userId")
	}
	readyKey := fmt.Sprintf("%s:%d:v%d", udid, userID, mediaImporterVersion)
	if _, ready := mediaImporterReady.Load(readyKey); ready {
		return nil
	}
	if err := ensureUserStarted(udid, userID); err != nil {
		return err
	}
	if _, ok := mediaImporterPing(udid, userID); ok {
		mediaImporterReady.Store(readyKey, struct{}{})
		return nil
	}

	// ponytail: one global install lock is enough for this local controller.
	// Split per device only if concurrent first installs become measurable.
	mediaImporterInstallMu.Lock()
	defer mediaImporterInstallMu.Unlock()
	if _, ok := mediaImporterPing(udid, userID); ok {
		mediaImporterReady.Store(readyKey, struct{}{})
		return nil
	}

	apkPath, err := mediaImporterAPKPath()
	if err != nil {
		return err
	}
	if _, ownerReady := mediaImporterPing(udid, 0); !ownerReady {
		if out, err := adbInstallLocalApkForUser(udid, apkPath, 0); err != nil {
			return fmt.Errorf("install media importer owner package failed: %w; output: %s", err, strings.TrimSpace(out))
		}
	}
	out, err := adb.CommandTimeout(
		60*time.Second,
		"-s", udid,
		"shell", "cmd", "package", "install-existing",
		"--user", strconv.Itoa(userID),
		mediaImporterPackage,
	)
	if err != nil {
		return fmt.Errorf(
			"enable media importer for user %d failed: %w; output: %s",
			userID, err, strings.TrimSpace(out))
	}
	if pingOut, ok := mediaImporterPing(udid, userID); !ok {
		return fmt.Errorf(
			"media importer ping failed for user %d: %s",
			userID, strings.TrimSpace(pingOut))
	}
	mediaImporterReady.Store(readyKey, struct{}{})
	return nil
}

func forgetMediaImporter(udid string, userID int) {
	mediaImporterReady.Delete(
		fmt.Sprintf("%s:%d:v%d", udid, userID, mediaImporterVersion))
}

func sumMediaImportBytes(files []mediaImportFile) int64 {
	var total int64
	for _, file := range files {
		total += file.Size
	}
	return total
}

func mediaImportBundleField(output, key string) (string, bool) {
	marker := key + "="
	for offset := 0; offset < len(output); {
		relative := strings.Index(output[offset:], marker)
		if relative < 0 {
			return "", false
		}
		start := offset + relative
		if start > 0 && !strings.ContainsRune(" \t\r\n{[,", rune(output[start-1])) {
			offset = start + len(marker)
			continue
		}
		valueStart := start + len(marker)
		valueEnd := valueStart
		for valueEnd < len(output) &&
			!strings.ContainsRune(" \t\r\n,}]", rune(output[valueEnd])) {
			valueEnd++
		}
		if valueEnd > valueStart {
			return output[valueStart:valueEnd], true
		}
		offset = valueStart
	}
	return "", false
}

func validateMediaImportStatus(
	output string,
	expectedFiles int,
	expectedBytes int64,
) (int64, bool) {
	success, hasSuccess := mediaImportBundleField(output, "success")
	filesText, hasFiles := mediaImportBundleField(output, "files")
	bytesText, hasBytes := mediaImportBundleField(output, "bytes")
	elapsedText, hasElapsed := mediaImportBundleField(output, "elapsed_ms")
	files, filesErr := strconv.ParseInt(filesText, 10, 64)
	bytes, bytesErr := strconv.ParseInt(bytesText, 10, 64)
	elapsed, elapsedErr := strconv.ParseInt(elapsedText, 10, 64)
	ok := hasSuccess && success == "true" &&
		hasFiles && filesErr == nil && files == int64(expectedFiles) &&
		hasBytes && bytesErr == nil && bytes == expectedBytes &&
		hasElapsed && elapsedErr == nil && elapsed >= 0 &&
		!strings.Contains(output, "Error while accessing provider")
	return elapsed, ok
}

func mediaImporterBatchStatus(
	udid string,
	userID int,
	runID string,
	timeout time.Duration,
) (string, error) {
	command := fmt.Sprintf(
		"content call --user %d --uri %s --method status --arg %s 2>&1",
		userID,
		mediaImporterAuthority,
		runID,
	)
	return adb.CommandTimeout(
		timeout,
		"-s", udid, "shell", command,
	)
}

func pushMediaImportBatch(
	udid string,
	userID int,
	files []mediaImportFile,
) (mediaImportResult, error) {
	started := time.Now()
	if err := ensureMediaImporter(udid, userID); err != nil {
		return mediaImportResult{}, err
	}
	batchPath, cleanup, err := createMediaImportBatchFile(files)
	if err != nil {
		return mediaImportResult{}, err
	}
	defer cleanup()

	runID := fmt.Sprintf("mvp_%d", time.Now().UnixNano())
	streamURI := fmt.Sprintf("%s/batch/%s", mediaImporterAuthority, runID)
	streamOut, streamErr := adb.CommandWithStdinFileTimeout(
		20*time.Minute,
		batchPath,
		"-s", udid,
		"exec-in", "content", "write",
		"--user", strconv.Itoa(userID),
		"--uri", streamURI,
	)

	totalBytes := sumMediaImportBytes(files)
	statusOut, statusErr := mediaImporterBatchStatus(
		udid, userID, runID, 20*time.Minute)
	providerElapsed, statusOK := validateMediaImportStatus(
		statusOut, len(files), totalBytes)
	if !statusOK {
		retryOut, retryErr := mediaImporterBatchStatus(
			udid, userID, runID, 20*time.Minute)
		if retryErr == nil {
			statusOut = retryOut
			statusErr = nil
			providerElapsed, statusOK = validateMediaImportStatus(
				statusOut, len(files), totalBytes)
		} else if statusErr != nil {
			statusOut = retryOut
			statusErr = retryErr
		}
	}
	// The provider's exact persisted result is authoritative even when the
	// streaming command reports a late transport error after commit.
	if statusOK {
		return mediaImportResult{
			Files:            len(files),
			Bytes:            totalBytes,
			ProviderElapsed:  providerElapsed,
			TotalElapsed:     time.Since(started).Milliseconds(),
			InstalledOrReady: true,
		}, nil
	}
	if streamErr != nil {
		forgetMediaImporter(udid, userID)
		return mediaImportResult{}, fmt.Errorf(
			"media batch stream failed: %w; output: %s; status: %s",
			streamErr,
			strings.TrimSpace(streamOut),
			strings.TrimSpace(statusOut),
		)
	}
	if statusErr != nil {
		forgetMediaImporter(udid, userID)
		return mediaImportResult{}, fmt.Errorf(
			"media batch status failed: %w; output: %s",
			statusErr, strings.TrimSpace(statusOut))
	}

	forgetMediaImporter(udid, userID)
	return mediaImportResult{}, fmt.Errorf(
		"media batch rejected: %s", strings.TrimSpace(statusOut))
}

func handleMultipartMediaImport(w http.ResponseWriter, r *http.Request) {
	udid := strings.TrimSpace(r.Header.Get("X-UDID"))
	userID, err := strconv.Atoi(strings.TrimSpace(r.Header.Get("X-User-ID")))
	if udid == "" || err != nil || userID <= 0 {
		writeJSON(w, http.StatusBadRequest, jsonResponse{
			"success": false,
			"error":   "Invalid X-UDID or secondary X-User-ID",
		})
		return
	}
	files, cleanup, err := stageMultipartMediaImport(w, r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{
			"success": false,
			"error":   err.Error(),
		})
		return
	}
	defer cleanup()
	result, err := pushMediaImportBatch(udid, userID, files)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{
			"success": false,
			"error":   err.Error(),
		})
		return
	}
	writeJSON(w, http.StatusOK, jsonResponse{
		"success": true,
		"batch":   result,
	})
}

func handleLocalMediaImport(
	w http.ResponseWriter,
	udid string,
	userID int,
	localPaths []string,
) {
	udid = strings.TrimSpace(udid)
	if udid == "" || userID < 0 {
		writeJSON(w, http.StatusBadRequest, jsonResponse{
			"success": false,
			"error":   "Invalid udid or userId",
		})
		return
	}
	files, err := inspectLocalMediaImportFiles(localPaths)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{
			"success": false,
			"error":   err.Error(),
		})
		return
	}
	result, err := pushMediaImportBatch(udid, userID, files)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{
			"success": false,
			"error":   err.Error(),
		})
		return
	}
	writeJSON(w, http.StatusOK, jsonResponse{
		"success": true,
		"batch":   result,
	})
}
