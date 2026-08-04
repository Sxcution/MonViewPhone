package main

import (
	"fmt"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"unicode"

	"server-go/adb"
)

const (
	notDirectoryMarker = "__MONVIEW_NOT_DIRECTORY__"
	notFileMarker      = "__MONVIEW_NOT_FILE__"
	fileListSentinel   = "MONV1"
)

type phoneFileRequest struct {
	UDID string `json:"udid"`
	Path string `json:"path"`
}

type phoneFileEntry struct {
	Name       string `json:"name"`
	Path       string `json:"path"`
	IsDir      bool   `json:"isDir"`
	Size       int64  `json:"size"`
	ModifiedAt int64  `json:"modifiedAt"`
}

func normalizePhoneUDID(raw string) (string, error) {
	udid := strings.TrimSpace(raw)
	if udid == "" {
		return "", fmt.Errorf("missing udid")
	}
	if len(udid) > 255 || strings.IndexFunc(udid, func(r rune) bool {
		return unicode.IsSpace(r) || unicode.IsControl(r)
	}) >= 0 {
		return "", fmt.Errorf("invalid udid")
	}
	return udid, nil
}

func normalizeAndroidPath(raw string, allowRoot bool) (string, error) {
	if raw == "" {
		return "", fmt.Errorf("missing path")
	}
	if strings.IndexByte(raw, 0) >= 0 || !strings.HasPrefix(raw, "/") {
		return "", fmt.Errorf("invalid Android path")
	}
	remotePath := path.Clean(raw)
	if !allowRoot && remotePath == "/" {
		return "", fmt.Errorf("root path is not a file")
	}
	return remotePath, nil
}

func validateDeleteAndroidPath(raw string) (string, error) {
	remotePath, err := normalizeAndroidPath(raw, false)
	if err != nil {
		return "", err
	}
	if isSharedStorageFilePath(remotePath) {
		return remotePath, nil
	}
	return "", fmt.Errorf("delete is only allowed inside shared storage")
}

func isSharedStorageFilePath(remotePath string) bool {
	for _, prefix := range []string{"/sdcard/", "/mnt/sdcard/", "/storage/self/primary/"} {
		if strings.HasPrefix(remotePath, prefix) && len(remotePath) > len(prefix) {
			return true
		}
	}

	const emulatedPrefix = "/storage/emulated/"
	if !strings.HasPrefix(remotePath, emulatedPrefix) {
		return false
	}
	rest := strings.TrimPrefix(remotePath, emulatedPrefix)
	slash := strings.IndexByte(rest, '/')
	if slash <= 0 || slash == len(rest)-1 {
		return false
	}
	for _, r := range rest[:slash] {
		if r < '0' || r > '9' {
			return false
		}
	}
	return true
}

func readPhoneFileRequest(r *http.Request, allowRoot bool) (phoneFileRequest, error) {
	var req phoneFileRequest
	if err := readJSON(r, &req); err != nil {
		return phoneFileRequest{}, fmt.Errorf("invalid JSON")
	}

	udid, err := normalizePhoneUDID(req.UDID)
	if err != nil {
		return phoneFileRequest{}, err
	}
	remotePath, err := normalizeAndroidPath(req.Path, allowRoot)
	if err != nil {
		return phoneFileRequest{}, err
	}
	return phoneFileRequest{UDID: udid, Path: remotePath}, nil
}

func phoneDirectoryListCommand(remoteDir string) string {
	quotedPath := shellQuote(remoteDir)
	return "dir=" + quotedPath +
		"; if [ ! -d \"$dir\" ]; then echo " + notDirectoryMarker + " >&2; exit 64; fi" +
		"; cd \"$dir\" || exit 64" +
		"; printf '" + fileListSentinel + "\\000'" +
		"; for entry in ./* ./.[!.]* ./..?*; do" +
		" if [ ! -e \"$entry\" ] && [ ! -L \"$entry\" ]; then continue; fi" +
		"; name=${entry#./}" +
		"; if [ -d \"$entry\" ]; then kind=d; else kind=f; fi" +
		"; metadata=$(stat -c '%s:%Y' \"$entry\" 2>/dev/null) || metadata=0:0" +
		"; size=${metadata%%:*}; modified=${metadata#*:}" +
		"; printf '%s\\000%s\\000%s\\000%s\\000' \"$name\" \"$kind\" \"$size\" \"$modified\"" +
		"; done"
}

func parsePhoneDirectoryListing(remoteDir, output string) ([]phoneFileEntry, error) {
	entries := make([]phoneFileEntry, 0)
	if output == "" {
		return entries, nil
	}
	if !strings.HasSuffix(output, "\x00") {
		return nil, fmt.Errorf("directory listing ended mid-record")
	}
	fields := strings.Split(strings.TrimSuffix(output, "\x00"), "\x00")
	if len(fields) == 0 || fields[0] != fileListSentinel {
		return nil, fmt.Errorf("directory listing sentinel is missing")
	}
	fields = fields[1:]
	if len(fields)%4 != 0 {
		return nil, fmt.Errorf("directory listing has %d fields", len(fields))
	}
	for index := 0; index < len(fields); index += 4 {
		name, kind := fields[index], fields[index+1]
		if name == "" || name == "." || name == ".." || strings.Contains(name, "/") {
			return nil, fmt.Errorf("invalid file name in directory listing")
		}
		if kind != "d" && kind != "f" {
			return nil, fmt.Errorf("invalid file type %q", kind)
		}
		size, err := strconv.ParseInt(fields[index+2], 10, 64)
		if err != nil || size < 0 {
			return nil, fmt.Errorf("invalid file size %q", fields[index+2])
		}
		modifiedAt, err := strconv.ParseInt(fields[index+3], 10, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid modified time %q", fields[index+3])
		}
		entries = append(entries, phoneFileEntry{
			Name:       name,
			Path:       path.Join(remoteDir, name),
			IsDir:      kind == "d",
			Size:       size,
			ModifiedAt: modifiedAt,
		})
	}
	return entries, nil
}

func safeLocalSegment(raw, fallback string) string {
	var b strings.Builder
	for _, r := range strings.TrimSpace(raw) {
		if unicode.IsControl(r) || strings.ContainsRune(`<>:"/\|?*`, r) {
			b.WriteByte('_')
		} else {
			b.WriteRune(r)
		}
	}
	safe := strings.Trim(b.String(), " .")
	if safe == "" {
		safe = fallback
	}
	switch strings.ToUpper(strings.SplitN(safe, ".", 2)[0]) {
	case "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9":
		safe = "_" + safe
	}
	return safe
}

func exportDirectory(projectRoot, udid string) string {
	return filepath.Join(projectRoot, "exports", safeLocalSegment(udid, "device"))
}

func collisionFileName(name string, index int) string {
	if index <= 0 {
		return name
	}
	ext := filepath.Ext(name)
	stem := strings.TrimSuffix(name, ext)
	if stem == "" {
		stem, ext = name, ""
	}
	return fmt.Sprintf("%s (%d)%s", stem, index, ext)
}

func createExportPart(dir string) (string, error) {
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}
	file, err := os.CreateTemp(dir, ".monview-export-*.part")
	if err != nil {
		return "", err
	}
	partPath := file.Name()
	if err := file.Close(); err != nil {
		_ = os.Remove(partPath)
		return "", err
	}
	return partPath, nil
}

func finalizeExportFile(partPath, dir, name string) (string, error) {
	defer os.Remove(partPath)
	for index := 0; ; index++ {
		candidate := filepath.Join(dir, collisionFileName(name, index))
		err := os.Link(partPath, candidate)
		if os.IsExist(err) {
			continue
		}
		if err != nil {
			return "", err
		}
		return candidate, nil
	}
}

func monViewPhoneProjectRoot() (string, error) {
	workingDir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	workingDir, err = filepath.Abs(workingDir)
	if err != nil {
		return "", err
	}
	if strings.EqualFold(filepath.Base(workingDir), "server-go") {
		return filepath.Dir(workingDir), nil
	}
	if info, statErr := os.Stat(filepath.Join(workingDir, "server-go")); statErr == nil && info.IsDir() {
		return workingDir, nil
	}
	if executable, executableErr := os.Executable(); executableErr == nil {
		executableDir := filepath.Dir(executable)
		if strings.EqualFold(filepath.Base(executableDir), "server-go") {
			return filepath.Dir(executableDir), nil
		}
	}
	return workingDir, nil
}

func handlePhoneFilesList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}
	req, err := readPhoneFileRequest(r, true)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": err.Error()})
		return
	}

	output, err := adb.Shell(req.UDID, phoneDirectoryListCommand(req.Path))
	if err != nil {
		status := http.StatusInternalServerError
		if strings.Contains(output, notDirectoryMarker) {
			status = http.StatusBadRequest
		}
		writeJSON(w, status, jsonResponse{"success": false, "error": err.Error(), "output": output})
		return
	}

	entries, err := parsePhoneDirectoryListing(req.Path, output)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, jsonResponse{
		"success": true,
		"path":    req.Path,
		"entries": entries,
	})
}

func handlePhoneFileExport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}
	req, err := readPhoneFileRequest(r, false)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": err.Error()})
		return
	}

	checkOutput, err := adb.Shell(req.UDID, "if [ ! -f "+shellQuote(req.Path)+" ]; then echo "+notFileMarker+" >&2; exit 64; fi")
	if err != nil {
		status := http.StatusInternalServerError
		message := err.Error()
		if strings.Contains(checkOutput, notFileMarker) {
			status = http.StatusBadRequest
			message = "Selected path is not a file"
		}
		writeJSON(w, status, jsonResponse{"success": false, "error": message, "output": checkOutput})
		return
	}

	projectRoot, err := monViewPhoneProjectRoot()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	fileName := safeLocalSegment(path.Base(req.Path), "exported-file")
	exportDir := exportDirectory(projectRoot, req.UDID)
	partPath, err := createExportPart(exportDir)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	defer os.Remove(partPath)
	if _, err := adb.Command("-s", req.UDID, "pull", req.Path, partPath); err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	savedPath, err := finalizeExportFile(partPath, exportDir, fileName)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, jsonResponse{
		"success":   true,
		"fileName":  filepath.Base(savedPath),
		"savedPath": savedPath,
	})
}

func handlePhoneFileDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}
	var req phoneFileRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "invalid JSON"})
		return
	}
	udid, err := normalizePhoneUDID(req.UDID)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	remotePath, err := validateDeleteAndroidPath(req.Path)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": err.Error()})
		return
	}

	quotedPath := shellQuote(remotePath)
	command := "if [ ! -f " + quotedPath + " ] && [ ! -L " + quotedPath + " ]; then echo " + notFileMarker + " >&2; exit 64; fi; rm -- " + quotedPath
	output, err := adb.Shell(udid, command)
	if err != nil {
		status := http.StatusInternalServerError
		if strings.Contains(output, notFileMarker) {
			status = http.StatusBadRequest
		}
		writeJSON(w, status, jsonResponse{"success": false, "error": err.Error(), "output": output})
		return
	}
	writeJSON(w, http.StatusOK, jsonResponse{"success": true, "path": remotePath})
}
