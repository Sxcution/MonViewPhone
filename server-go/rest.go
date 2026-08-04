package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"server-go/adb"
)

type userProfile struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type jsonResponse map[string]interface{}

var userInfoPattern = regexp.MustCompile(`UserInfo\{(\d+):([^:}]*)`)
var storageUserPattern = regexp.MustCompile(`^/storage/emulated/(\d+)/`)
var mediaIDPattern = regexp.MustCompile(`_id=(\d+)`)
var contentURIPattern = regexp.MustCompile(`content://[a-zA-Z0-9./_:-]+`)
var clipboardB64Pattern = regexp.MustCompile(`(?:^|\s)text_b64=([A-Za-z0-9+/=]*)`)
var clipboardTimestampPattern = regexp.MustCompile(`(?:^|\s)timestamp=(\d+)`)

var phoneClipboardSync = struct {
	sync.Mutex
	run        sync.Mutex
	last       map[string]string
	activeUDID string
	started    bool
}{last: make(map[string]string)}

type phoneClipboardSnapshot struct {
	UserID    int
	Text      string
	Encoded   string
	Timestamp int64
}

type phoneClipboardReadResult struct {
	snapshot phoneClipboardSnapshot
	err      error
}

type phoneClipboardSyncResult struct {
	Changed bool
	Empty   bool
	Bytes   int
	UserID  int
}

func writeJSON(w http.ResponseWriter, status int, payload jsonResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func readJSON(r *http.Request, out interface{}) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(out)
}

func uploadDir() (string, error) {
	return filepath.Abs(filepath.Join(".", "uploads"))
}

func findAndroidBuildTool(name string) (string, error) {
	roots := []string{}
	if androidHome := strings.TrimSpace(os.Getenv("ANDROID_HOME")); androidHome != "" {
		roots = append(roots, androidHome)
	}
	if androidSDK := strings.TrimSpace(os.Getenv("ANDROID_SDK_ROOT")); androidSDK != "" {
		roots = append(roots, androidSDK)
	}
	if localAppData := strings.TrimSpace(os.Getenv("LOCALAPPDATA")); localAppData != "" {
		roots = append(roots, filepath.Join(localAppData, "Android", "Sdk"))
	}
	roots = append(roots, filepath.Join(os.Getenv("USERPROFILE"), "AppData", "Local", "Android", "Sdk"))

	for _, root := range roots {
		buildTools := filepath.Join(root, "build-tools")
		entries, err := os.ReadDir(buildTools)
		if err != nil {
			continue
		}
		versions := make([]string, 0, len(entries))
		for _, entry := range entries {
			if entry.IsDir() {
				versions = append(versions, entry.Name())
			}
		}
		sort.Sort(sort.Reverse(sort.StringSlice(versions)))
		for _, version := range versions {
			candidate := filepath.Join(buildTools, version, name)
			if _, err := os.Stat(candidate); err == nil {
				return candidate, nil
			}
		}
	}

	if candidate, err := exec.LookPath(name); err == nil {
		return candidate, nil
	}
	return "", fmt.Errorf("missing Android build tool %s", name)
}

func runExternalTool(tool string, args ...string) error {
	var cmd *exec.Cmd
	if strings.HasSuffix(strings.ToLower(tool), ".bat") {
		cmd = exec.Command("cmd", append([]string{"/c", tool}, args...)...)
	} else {
		cmd = exec.Command(tool, args...)
	}
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("%s failed: %v: %s", filepath.Base(tool), err, strings.TrimSpace(string(out)))
	}
	return nil
}

func repairApkForAndroidRInstall(apkPath string) (string, func(), error) {
	root, err := uploadDir()
	if err != nil {
		return "", nil, err
	}
	tmpDir, err := os.MkdirTemp(root, "apkfix-")
	if err != nil {
		return "", nil, err
	}
	cleanup := func() { _ = os.RemoveAll(tmpDir) }

	decoded := filepath.Join(tmpDir, "decoded")
	rebuilt := filepath.Join(tmpDir, "rebuilt-target29-unsigned.apk")
	aligned := filepath.Join(tmpDir, "aligned.apk")
	signed := filepath.Join(tmpDir, "signed.apk")

	apktool, err := filepath.Abs("apktool.jar")
	if err != nil {
		cleanup()
		return "", nil, err
	}
	if _, err := os.Stat(apktool); err != nil {
		cleanup()
		return "", nil, fmt.Errorf("missing apktool.jar at %s", apktool)
	}

	if err := runExternalTool("java", "-jar", apktool, "d", "-f", "-s", "-o", decoded, apkPath); err != nil {
		cleanup()
		return "", nil, err
	}
	if err := forceApktoolTargetSDK(decoded, 29); err != nil {
		cleanup()
		return "", nil, err
	}
	if err := runExternalTool("java", "-jar", apktool, "b", decoded, "-o", rebuilt); err != nil {
		cleanup()
		return "", nil, err
	}

	zipalign, err := findAndroidBuildTool("zipalign.exe")
	if err != nil {
		cleanup()
		return "", nil, err
	}
	if err := runExternalTool(zipalign, "-p", "-f", "4", rebuilt, aligned); err != nil {
		cleanup()
		return "", nil, err
	}

	apksigner, err := findAndroidBuildTool("apksigner.bat")
	if err != nil {
		cleanup()
		return "", nil, err
	}
	debugKeystore := filepath.Join(os.Getenv("USERPROFILE"), ".android", "debug.keystore")
	if _, err := os.Stat(debugKeystore); err != nil {
		cleanup()
		return "", nil, fmt.Errorf("missing debug keystore %s", debugKeystore)
	}
	if err := runExternalTool(apksigner, "sign", "--ks", debugKeystore, "--ks-key-alias", "androiddebugkey", "--ks-pass", "pass:android", "--key-pass", "pass:android", "--v4-signing-enabled", "false", "--out", signed, aligned); err != nil {
		cleanup()
		return "", nil, err
	}

	return signed, cleanup, nil
}

func forceApktoolTargetSDK(decodedDir string, target int) error {
	ymlPath := filepath.Join(decodedDir, "apktool.yml")
	data, err := os.ReadFile(ymlPath)
	if err != nil {
		return err
	}
	re := regexp.MustCompile(`(?m)^(\s*targetSdkVersion:\s*)\d+`)
	text := string(data)
	if !re.MatchString(text) {
		return fmt.Errorf("targetSdkVersion not found in %s", ymlPath)
	}
	text = re.ReplaceAllString(text, "${1}"+strconv.Itoa(target))
	return os.WriteFile(ymlPath, []byte(text), 0644)
}

// CleanOldUploads removes uploaded APK temp files older than 1 hour.
// Call this at startup and periodically to prevent disk space leaks.
func CleanOldUploads() {
	root, err := uploadDir()
	if err != nil {
		return
	}
	entries, err := os.ReadDir(root)
	if err != nil {
		return
	}
	cutoff := time.Now().Add(-1 * time.Hour)
	removed := 0
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			continue
		}
		if info.ModTime().Before(cutoff) {
			if err := os.Remove(filepath.Join(root, entry.Name())); err == nil {
				removed++
			}
		}
	}
	if removed > 0 {
		log.Printf("[Cleanup] Removed %d old uploaded files from uploads/", removed)
	}
}

func safeUploadPath(filePath string) (string, error) {
	root, err := uploadDir()
	if err != nil {
		return "", err
	}
	resolved, err := filepath.Abs(filePath)
	if err != nil {
		return "", err
	}
	rel, err := filepath.Rel(root, resolved)
	if err != nil {
		return "", err
	}
	if rel == "." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) || rel == ".." || filepath.IsAbs(rel) {
		return "", fmt.Errorf("filePath not allowed")
	}
	return resolved, nil
}

func sanitizeFileName(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "upload.apk"
	}
	var b strings.Builder
	for _, r := range name {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' || r == '-' || r == '.' {
			b.WriteRune(r)
		} else {
			b.WriteByte('_')
		}
	}
	if b.Len() == 0 {
		return "upload.apk"
	}
	return b.String()
}

func shellQuote(s string) string {
	return "'" + strings.ReplaceAll(s, "'", "'\\''") + "'"
}

func shellDoubleQuote(s string) string {
	s = strings.ReplaceAll(s, `\`, `\\`)
	s = strings.ReplaceAll(s, `"`, `\"`)
	s = strings.ReplaceAll(s, `$`, `\$`)
	s = strings.ReplaceAll(s, "`", "\\`")
	return `"` + s + `"`
}

func mediaStoreTarget(ext string) (uri string, mimeType string, relPath string, ok bool) {
	ext = strings.ToLower(strings.TrimPrefix(ext, "."))
	switch ext {
	case "jpg", "jpeg", "png", "gif", "webp", "bmp":
		if ext == "jpg" {
			ext = "jpeg"
		}
		return "content://media/external/images/media", "image/" + ext, "DCIM/Camera/", true
	case "mp4", "mkv", "avi", "mov":
		return "content://media/external/video/media", "video/" + ext, "DCIM/Camera/", true
	case "mp3", "wav", "ogg", "m4a":
		return "content://media/external/audio/media", "audio/" + ext, "Music/", true
	default:
		return "content://media/external/downloads/media", "application/octet-stream", "Download/", true
	}
}

func userIDFromRemotePath(remotePath string) int {
	match := storageUserPattern.FindStringSubmatch(strings.TrimSpace(remotePath))
	if len(match) < 2 {
		return 0
	}
	id, err := strconv.Atoi(match[1])
	if err != nil {
		return 0
	}
	return id
}

func isUserRunning(usersOut string, userID int) bool {
	needle := fmt.Sprintf("UserInfo{%d:", userID)
	for _, line := range strings.Split(usersOut, "\n") {
		if strings.Contains(line, needle) && strings.Contains(line, "running") {
			return true
		}
	}
	return false
}

func ensureUserStarted(udid string, userID int) error {
	if userID <= 0 {
		return nil
	}
	out, _ := adb.CommandTimeout(10*time.Second, "-s", udid, "shell", "pm", "list", "users")
	if isUserRunning(out, userID) {
		return nil
	}
	startOut, err := adb.CommandTimeout(60*time.Second, "-s", udid, "shell", "am", "start-user", "-w", strconv.Itoa(userID))
	if err != nil {
		return fmt.Errorf("start user %d failed: %w; output: %s", userID, err, strings.TrimSpace(startOut))
	}
	out, err = adb.CommandTimeout(10*time.Second, "-s", udid, "shell", "pm", "list", "users")
	if err != nil || !isUserRunning(out, userID) {
		return fmt.Errorf("user %d is not running after start: %s", userID, strings.TrimSpace(out))
	}
	return nil
}

func mediaStoreInsertURI(udid string, userID int, uri, mimeType, relPath, uniqueFileName string) (string, error) {
	cmd := fmt.Sprintf(
		"inserted_out=$(content insert --user %d --uri %s --bind _display_name:s:%s --bind mime_type:s:%s --bind relative_path:s:%s); "+
			"uri=$(echo \"$inserted_out\" | grep -o -E \"content://[a-zA-Z0-9./_:-]+\"); "+
			"if [ -z \"$uri\" ]; then "+
			"row=$(content query --user %d --uri %s --projection _id:_display_name 2>/dev/null | grep -F -- %s | tail -n 1 || true); "+
			"id=$(echo \"$row\" | grep -o -E \"_id=[0-9]+\" | head -n 1 | cut -d'=' -f2 | tr -d '\\r'); "+
			"if [ ! -z \"$id\" ]; then uri=\"%s/$id\"; fi; "+
			"fi; "+
			"if [ ! -z \"$uri\" ]; then echo \"$uri\"; else echo \"MediaStore row not found for %s\" >&2; false; fi",
		userID, uri, shellQuote(uniqueFileName), shellQuote(mimeType), shellQuote(relPath),
		userID, uri, shellQuote(uniqueFileName), uri,
		shellQuote(uniqueFileName),
	)
	out, err := adb.CommandTimeout(30*time.Second, "-s", udid, "shell", cmd)
	if err != nil {
		return "", err
	}
	matches := contentURIPattern.FindAllString(out, -1)
	if len(matches) == 0 {
		return "", fmt.Errorf("MediaStore insert returned no content URI: %q", strings.TrimSpace(out))
	}
	return matches[len(matches)-1], nil
}

func pushMediaStoreViaExecIn(udid, tmpPath, fileName, uri, mimeType, relPath string, userID int) error {
	uniqueFileName := fmt.Sprintf("vsp_%d_%s", time.Now().UnixNano(), sanitizeFileName(fileName))
	contentURI, err := mediaStoreInsertURI(udid, userID, uri, mimeType, relPath, uniqueFileName)
	if err != nil {
		return err
	}

	if _, err := adb.CommandWithStdinFileTimeout(3*time.Minute, tmpPath, "-s", udid, "exec-in", "content", "write", "--user", strconv.Itoa(userID), "--uri", contentURI); err != nil {
		return err
	}

	updateCmd := fmt.Sprintf("content update --user %d --uri %s --bind _display_name:s:%s", userID, shellQuote(contentURI), shellQuote(fileName))
	if _, err := adb.CommandTimeout(30*time.Second, "-s", udid, "shell", updateCmd); err != nil {
		return err
	}
	return nil
}

func pushMediaStoreViaDeviceTmp(udid, tmpPath, fileName, uri, mimeType, relPath string, userID int) error {
	safeTmpName := sanitizeFileName(fileName)
	deviceTmp := fmt.Sprintf("/data/local/tmp/%d_%s", time.Now().UnixNano(), safeTmpName)
	if _, err := adb.Command("-s", udid, "push", tmpPath, deviceTmp); err != nil {
		return err
	}
	defer adb.Shell(udid, "rm "+shellQuote(deviceTmp))

	uniqueFileName := fmt.Sprintf("vsp_%d_%s", time.Now().UnixNano(), safeTmpName)

	// Optimize by chaining all MediaStore operations in a single shell command.
	// This reduces the number of host-device ADB round-trips from 4 to 1.
	// It supports devices where content insert runs silently (e.g. crDroid 9.8 / Android 13)
	// by querying all rows and filtering for the unique name. Do not use SQL --where here:
	// some Android content CLI builds strip the quotes and turn dotted names into invalid tokens.
	cmd := fmt.Sprintf(
		"inserted_out=$(content insert --user %d --uri %s --bind _display_name:s:%s --bind mime_type:s:%s --bind relative_path:s:%s); "+
			"uri=$(echo \"$inserted_out\" | grep -o -E \"content://[a-zA-Z0-9./_:-]+\"); "+
			"if [ -z \"$uri\" ]; then "+
			"row=$(content query --user %d --uri %s --projection _id:_display_name 2>/dev/null | grep -F -- %s | tail -n 1 || true); "+
			"id=$(echo \"$row\" | grep -o -E \"_id=[0-9]+\" | head -n 1 | cut -d'=' -f2 | tr -d '\\r'); "+
			"if [ ! -z \"$id\" ]; then uri=\"%s/$id\"; fi; "+
			"fi; "+
			"if [ ! -z \"$uri\" ]; then "+
			"cat %s | content write --user %d --uri \"$uri\" && "+
			"content update --user %d --uri \"$uri\" --bind _display_name:s:%s; "+
			"else echo \"MediaStore row not found for %s\" >&2; false; fi",
		userID, uri, shellQuote(uniqueFileName), shellQuote(mimeType), shellQuote(relPath),
		userID, uri, shellQuote(uniqueFileName), uri,
		shellQuote(deviceTmp), userID,
		userID, shellQuote(fileName),
		shellQuote(uniqueFileName),
	)

	if _, err := adb.CommandTimeout(3*time.Minute, "-s", udid, "shell", cmd); err != nil {
		return fmt.Errorf("MediaStore push failed for user %d path %s: %w", userID, fileName, err)
	}

	return nil
}

func pushFileToProfileAwarePath(udid, tmpPath, remotePath string) error {
	remotePath = strings.TrimSpace(remotePath)
	userID := userIDFromRemotePath(remotePath)
	fileName := path.Base(remotePath)
	if fileName == "." || fileName == "/" || fileName == "" {
		fileName = path.Base(tmpPath)
	}
	safeTmpName := sanitizeFileName(fileName)
	ext := strings.TrimPrefix(strings.ToLower(path.Ext(fileName)), ".")
	uri, mimeType, relPath, useMediaStore := mediaStoreTarget(ext)

	// CASE 1: Work Profile / Secondary User (userID > 0) pushing public media/download files.
	// We MUST use the MediaStore Content Provider API since direct adb push or cp to /storage/emulated/{userID}/
	// will fail with Permission Denied due to multi-user storage isolation.
	if userID > 0 && useMediaStore {
		if err := ensureUserStarted(udid, userID); err != nil {
			return err
		}
		if err := pushMediaStoreViaExecIn(udid, tmpPath, fileName, uri, mimeType, relPath, userID); err == nil {
			return nil
		}
		if err := pushMediaStoreViaDeviceTmp(udid, tmpPath, fileName, uri, mimeType, relPath, userID); err != nil {
			return fmt.Errorf("MediaStore push failed for user %d path %s: %w", userID, remotePath, err)
		}
		return nil
	}

	// CASE 2: Work Profile / Secondary User (userID > 0) pushing non-media files.
	// We use the temporary copy method.
	if userID > 0 {
		if err := ensureUserStarted(udid, userID); err != nil {
			return err
		}
		deviceTmp := fmt.Sprintf("/data/local/tmp/%d_%s", time.Now().UnixNano(), safeTmpName)
		if _, err := adb.Command("-s", udid, "push", tmpPath, deviceTmp); err != nil {
			return err
		}
		defer adb.Shell(udid, "rm "+shellQuote(deviceTmp))

		parent := path.Dir(remotePath)
		if parent != "." && parent != "/" {
			_, _ = adb.Shell(udid, "mkdir -p "+shellQuote(parent))
		}
		if _, err := adb.Shell(udid, "cp "+shellQuote(deviceTmp)+" "+shellQuote(remotePath)); err != nil {
			return err
		}
		return nil
	}

	// CASE 3: Primary User (userID == 0) pushing any file.
	// Fast Path: Push directly using optimized ADB sync protocol, then trigger media scanner if it's media.
	parent := path.Dir(remotePath)
	if parent != "." && parent != "/" {
		_, _ = adb.Shell(udid, "mkdir -p "+shellQuote(parent))
	}
	if _, err := adb.Command("-s", udid, "push", tmpPath, remotePath); err != nil {
		return err
	}

	if useMediaStore {
		scannerCmd := fmt.Sprintf("am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file://%s --user %d", shellQuote(remotePath), userID)
		_, _ = adb.Shell(udid, scannerCmd)
	}

	return nil
}

func listUserProfilesForDevice(udid string) ([]userProfile, string, error) {
	out, err := adb.Shell(strings.TrimSpace(udid), "pm list users")
	if err != nil {
		return nil, out, err
	}

	profiles := make([]userProfile, 0)
	for _, match := range userInfoPattern.FindAllStringSubmatch(out, -1) {
		id, err := strconv.Atoi(match[1])
		if err != nil {
			continue
		}
		name := strings.TrimSpace(match[2])
		if name == "" {
			name = fmt.Sprintf("User %d", id)
		}
		profiles = append(profiles, userProfile{ID: id, Name: name})
	}
	if len(profiles) == 0 {
		profiles = append(profiles, userProfile{ID: 0, Name: "Owner"})
	}
	sort.Slice(profiles, func(i, j int) bool {
		return profiles[i].ID < profiles[j].ID
	})
	return profiles, out, nil
}

func isQRImageRemotePath(remotePath string) bool {
	base := path.Base(strings.TrimSpace(remotePath))
	ext := path.Ext(base)
	nameWithoutExt := strings.TrimSuffix(base, ext)
	if !strings.EqualFold(nameWithoutExt, "QR") {
		return false
	}
	extLower := strings.ToLower(strings.TrimPrefix(ext, "."))
	switch extLower {
	case "png", "jpg", "jpeg", "gif", "webp", "bmp", "mp4", "mkv", "avi", "mov":
		return true
	}
	return false
}

func relativeDirFromRemotePath(remotePath, fallback string) string {
	cleaned := path.Clean(strings.ReplaceAll(strings.TrimSpace(remotePath), "\\", "/"))
	rel := ""
	if strings.HasPrefix(cleaned, "/storage/emulated/") {
		parts := strings.SplitN(strings.TrimPrefix(cleaned, "/storage/emulated/"), "/", 2)
		if len(parts) == 2 {
			rel = parts[1]
		}
	} else if strings.HasPrefix(cleaned, "/sdcard/") {
		rel = strings.TrimPrefix(cleaned, "/sdcard/")
	} else if strings.HasPrefix(cleaned, "sdcard/") {
		rel = strings.TrimPrefix(cleaned, "sdcard/")
	}

	relDir := path.Dir(rel)
	relDir = strings.Trim(relDir, "/")
	if relDir == "" || relDir == "." {
		return strings.Trim(fallback, "/")
	}
	return relDir
}

type qrClonePushResult struct {
	UserID     int    `json:"userId"`
	Name       string `json:"name"`
	RemotePath string `json:"remotePath"`
	Success    bool   `json:"success"`
	Error      string `json:"error,omitempty"`
}

func pushQRToCloneUsers(udid, tmpPath, sourceRemotePath string) ([]qrClonePushResult, error) {
	sourceUserID := userIDFromRemotePath(sourceRemotePath)
	profiles, _, err := listUserProfilesForDevice(udid)
	if err != nil {
		return nil, err
	}

	fileName := path.Base(sourceRemotePath)
	relDir := relativeDirFromRemotePath(sourceRemotePath, "DCIM/Camera")
	results := make([]qrClonePushResult, 0)
	failures := make([]string, 0)
	for _, profile := range profiles {
		if profile.ID <= 0 || profile.ID == sourceUserID {
			continue
		}
		targetPath := fmt.Sprintf("/storage/emulated/%d/%s/%s", profile.ID, relDir, fileName)
		result := qrClonePushResult{
			UserID:     profile.ID,
			Name:       profile.Name,
			RemotePath: targetPath,
		}
		if err := pushFileToProfileAwarePath(udid, tmpPath, targetPath); err != nil {
			result.Error = err.Error()
			failures = append(failures, fmt.Sprintf("user %d: %s", profile.ID, err.Error()))
		} else {
			result.Success = true
		}
		results = append(results, result)
	}

	if len(failures) > 0 {
		return results, fmt.Errorf("%s clone push failed: %s", fileName, strings.Join(failures, "; "))
	}
	return results, nil
}

func adbInstallUploaded(udid, apkPath string, userID *int) (string, error) {
	targetUserID := 0
	if userID != nil {
		targetUserID = *userID
	}

	out, err := adbInstallLocalApkForUser(udid, apkPath, targetUserID)
	if err != nil {
		diagnostic := out + "\n" + err.Error()
		if !strings.Contains(diagnostic, "resources.arsc") {
			return out, err
		}

		fixedApk, cleanup, fixErr := repairApkForAndroidRInstall(apkPath)
		if fixErr != nil {
			return out, fmt.Errorf("%w; APK repair failed: %v", err, fixErr)
		}
		defer cleanup()

		retryOut, retryErr := adbInstallLocalApkForUser(udid, fixedApk, targetUserID)
		if retryErr != nil {
			return retryOut, fmt.Errorf("%w; repaired APK install failed: %v", err, retryErr)
		}
		return strings.TrimSpace(retryOut) + "\nInstalled after APK resource alignment/sign repair.", nil
	}
	if !strings.Contains(strings.ToLower(out), "success") {
		return out, fmt.Errorf("adb install failed: %s", strings.TrimSpace(out))
	}
	return out, nil
}

func adbInstallLocalApkForUser(udid, apkPath string, userID int) (string, error) {
	// ponytail: always pass an explicit user; bare install can target all users on some Android builds.
	out, err := adb.CommandTimeout(180*time.Second, "-s", udid, "install", "--user", strconv.Itoa(userID), "-r", apkPath)
	if err != nil {
		return out, err
	}
	if !strings.Contains(strings.ToLower(out), "success") {
		return out, fmt.Errorf("adb install failed: %s", strings.TrimSpace(out))
	}
	return out, nil
}

func handleUserProfiles(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	var req struct {
		UDID string `json:"udid"`
	}
	if err := readJSON(r, &req); err != nil || strings.TrimSpace(req.UDID) == "" {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": `Invalid "udid"`})
		return
	}

	profiles, out, err := listUserProfilesForDevice(req.UDID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, jsonResponse{"success": true, "profiles": profiles, "raw": out})
}

func handleAdbCommand(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	var req struct {
		UDID    string   `json:"udid"`
		Command string   `json:"command"`
		Kind    string   `json:"kind"`
		Args    []string `json:"args"`
	}
	if err := readJSON(r, &req); err != nil || strings.TrimSpace(req.UDID) == "" {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": `Invalid "udid"`})
		return
	}

	udid := strings.TrimSpace(req.UDID)
	command := strings.TrimSpace(req.Command)
	kind := strings.TrimSpace(req.Kind)

	if kind == "host-adb" {
		if len(req.Args) == 0 {
			writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": `Invalid "args" for host-adb`})
			return
		}
	} else if kind == "shell" {
		if command == "" {
			writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": `Invalid "command" for shell`})
			return
		}
	} else if kind == "" {
		if command == "" {
			writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": `Invalid "command"`})
			return
		}
		// Backward compatibility fallback
		if strings.HasPrefix(command, "adb ") {
			kind = "host-adb"
			parts := strings.Fields(command)
			cleaned := make([]string, 0, len(parts))
			for i := 1; i < len(parts); i++ {
				if parts[i] == "-s" && i+1 < len(parts) {
					i++
					continue
				}
				cleaned = append(cleaned, parts[i])
			}
			req.Args = cleaned
		} else {
			kind = "shell"
		}
	} else {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": fmt.Sprintf(`Unsupported kind: %q`, kind)})
		return
	}

	isDebugEnabled := os.Getenv("MONVIEWPHONE_ADB_DEBUG") == "1" || strings.Contains(command, "com.tencent.mm/com.tencent.mm.ui.LauncherUI")
	if isDebugEnabled {
		log.Printf("[ADB_COMMAND_DEBUG] request received - udid: %s, kind: %s, command: %s, args: %v", udid, kind, command, req.Args)
	}

	startTime := time.Now()
	var out string
	var err error

	if kind == "host-adb" {
		adbArgs := append([]string{"-s", udid}, req.Args...)
		out, err = adb.CommandTimeout(60*time.Second, adbArgs...)
	} else {
		out, err = adb.CommandTimeout(60*time.Second, "-s", udid, "shell", command)
	}

	durationMs := time.Since(startTime).Milliseconds()
	if isDebugEnabled {
		errStr := "nil"
		if err != nil {
			errStr = err.Error()
		}
		log.Printf("[ADB_COMMAND_DEBUG] result - duration: %d ms, error: %s, output: %s", durationMs, errStr, out)
	}

	if err != nil {
		writeJSON(w, http.StatusOK, jsonResponse{"success": false, "output": err.Error(), "error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, jsonResponse{"success": true, "output": out})
}

func handleSyncPhoneClipboardToPC(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	var req struct {
		UDID string `json:"udid"`
	}
	if err := readJSON(r, &req); err != nil || strings.TrimSpace(req.UDID) == "" {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": `Invalid "udid"`})
		return
	}
	udid := strings.TrimSpace(req.UDID)
	setActivePhoneClipboardSyncUDID(udid)

	result, err := syncPhoneClipboardToPCOnce(udid)
	if err != nil {
		writeJSON(w, http.StatusOK, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, jsonResponse{
		"success": true,
		"changed": result.Changed,
		"empty":   result.Empty,
		"bytes":   result.Bytes,
		"userId":  result.UserID,
	})
}

func setActivePhoneClipboardSyncUDID(udid string) {
	phoneClipboardSync.Lock()
	phoneClipboardSync.activeUDID = udid
	shouldStart := !phoneClipboardSync.started
	phoneClipboardSync.started = true
	phoneClipboardSync.Unlock()

	if shouldStart {
		go runPhoneClipboardAutoSync()
	}
}

func runPhoneClipboardAutoSync() {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()
	for range ticker.C {
		phoneClipboardSync.Lock()
		udid := phoneClipboardSync.activeUDID
		phoneClipboardSync.Unlock()
		if udid == "" {
			continue
		}
		_, _ = syncPhoneClipboardToPCOnce(udid)
	}
}

func syncPhoneClipboardToPCOnce(udid string) (phoneClipboardSyncResult, error) {
	phoneClipboardSync.run.Lock()
	defer phoneClipboardSync.run.Unlock()

	snapshot, err := readLatestPhoneClipboard(udid)
	if err != nil {
		return phoneClipboardSyncResult{}, err
	}
	text := snapshot.Text
	if text == "" {
		return phoneClipboardSyncResult{Empty: true}, nil
	}
	syncKey := fmt.Sprintf("%d:%d:%s", snapshot.UserID, snapshot.Timestamp, snapshot.Encoded)

	phoneClipboardSync.Lock()
	if phoneClipboardSync.last[udid] == syncKey {
		phoneClipboardSync.Unlock()
		return phoneClipboardSyncResult{UserID: snapshot.UserID, Bytes: len([]byte(text))}, nil
	}
	phoneClipboardSync.Unlock()

	if err := setWindowsClipboard(text); err != nil {
		return phoneClipboardSyncResult{}, err
	}
	phoneClipboardSync.Lock()
	phoneClipboardSync.last[udid] = syncKey
	phoneClipboardSync.Unlock()
	return phoneClipboardSyncResult{Changed: true, Bytes: len([]byte(text)), UserID: snapshot.UserID}, nil
}

func readLatestPhoneClipboard(udid string) (phoneClipboardSnapshot, error) {
	profiles, _, err := listUserProfilesForDevice(udid)
	if err != nil {
		profiles = []userProfile{{ID: 0, Name: "Owner"}}
	}

	results := make(chan phoneClipboardReadResult, len(profiles))
	for _, profile := range profiles {
		userID := profile.ID
		go func() {
			snapshot, err := readPhoneClipboardForUser(udid, userID)
			results <- phoneClipboardReadResult{snapshot: snapshot, err: err}
		}()
	}

	var best phoneClipboardSnapshot
	var lastErr error
	for range profiles {
		result := <-results
		if result.err != nil {
			lastErr = result.err
			continue
		}
		snapshot := result.snapshot
		if snapshot.Text == "" {
			continue
		}
		if best.Text == "" || snapshot.Timestamp >= best.Timestamp {
			best = snapshot
		}
	}
	if best.Text != "" {
		return best, nil
	}
	if lastErr != nil {
		return phoneClipboardSnapshot{}, lastErr
	}
	return phoneClipboardSnapshot{}, nil
}

func readPhoneClipboardForUser(udid string, userID int) (phoneClipboardSnapshot, error) {
	out, err := adb.CommandTimeout(
		5*time.Second,
		"-s", udid,
		"shell", "content", "query", "--user", strconv.Itoa(userID), "--uri", "content://com.mon.monkeybroad.clipboard/text",
	)
	if err != nil {
		return phoneClipboardSnapshot{}, err
	}
	matches := clipboardB64Pattern.FindStringSubmatch(out)
	if len(matches) < 2 {
		return phoneClipboardSnapshot{}, fmt.Errorf("Chưa cài MonKeybroad bản hỗ trợ copy từ điện thoại")
	}
	data, err := base64.StdEncoding.DecodeString(matches[1])
	if err != nil {
		return phoneClipboardSnapshot{}, fmt.Errorf("Clipboard điện thoại trả dữ liệu không hợp lệ")
	}
	timestamp := int64(0)
	if tsMatch := clipboardTimestampPattern.FindStringSubmatch(out); len(tsMatch) >= 2 {
		if parsed, err := strconv.ParseInt(tsMatch[1], 10, 64); err == nil {
			timestamp = parsed
		}
	}
	return phoneClipboardSnapshot{UserID: userID, Text: string(data), Encoded: matches[1], Timestamp: timestamp}, nil
}

func setWindowsClipboard(text string) error {
	tmp, err := os.CreateTemp("", "monviewphone-clipboard-*.txt")
	if err != nil {
		return err
	}
	tmpPath := tmp.Name()
	defer os.Remove(tmpPath)
	if _, err := tmp.WriteString(text); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}

	cmd := exec.Command(
		"powershell.exe",
		"-NoProfile",
		"-NonInteractive",
		"-Command",
		"Set-Clipboard -Value (Get-Content -LiteralPath $env:MONVIEWPHONE_CLIPBOARD_FILE -Raw -Encoding UTF8)",
	)
	cmd.Env = append(os.Environ(), "MONVIEWPHONE_CLIPBOARD_FILE="+tmpPath)
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("Không ghi được clipboard PC: %v: %s", err, strings.TrimSpace(string(out)))
	}
	return nil
}

func handleInstallApkBinary(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	udid := strings.TrimSpace(r.Header.Get("X-UDID"))
	if udid == "" {
		udid = strings.TrimSpace(r.URL.Query().Get("udid"))
	}
	if udid == "" {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": `Invalid "udid"`})
		return
	}

	fileName := r.Header.Get("X-Filename")
	if fileName == "" {
		fileName = r.URL.Query().Get("fileName")
	}
	if decoded, err := url.QueryUnescape(fileName); err == nil {
		fileName = decoded
	}

	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 500<<20))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	defer r.Body.Close()
	if len(body) == 0 {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Empty apk payload"})
		return
	}
	if expected := strings.TrimSpace(r.Header.Get("X-File-Size")); expected != "" {
		if size, err := strconv.Atoi(expected); err == nil && size != len(body) {
			writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": fmt.Sprintf("Size mismatch: got %d, expected %d", len(body), size)})
			return
		}
	}

	root, err := uploadDir()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	if err := os.MkdirAll(root, 0755); err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	tmpPath := filepath.Join(root, fmt.Sprintf("ws-scrcpy-upload-%d-%s", time.Now().UnixNano(), sanitizeFileName(fileName)))
	if err := os.WriteFile(tmpPath, body, 0644); err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, jsonResponse{"success": true, "filePath": tmpPath})
}

func handleInstallUploaded(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	var req struct {
		UDID     string `json:"udid"`
		FilePath string `json:"filePath"`
	}
	if err := readJSON(r, &req); err != nil || strings.TrimSpace(req.UDID) == "" || strings.TrimSpace(req.FilePath) == "" {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": `Invalid "udid" or "filePath"`})
		return
	}
	resolved, err := safeUploadPath(req.FilePath)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	if _, err := os.Stat(resolved); err != nil {
		writeJSON(w, http.StatusNotFound, jsonResponse{"success": false, "error": "file not found"})
		return
	}
	udid := strings.TrimSpace(req.UDID)
	log.Printf("[APK_INSTALL] start udid=%s file=%s", udid, filepath.Base(resolved))
	out, err := adbInstallUploaded(udid, resolved, nil)
	if err != nil {
		log.Printf("[APK_INSTALL] failed udid=%s file=%s error=%v output=%s", udid, filepath.Base(resolved), err, strings.TrimSpace(out))
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error(), "output": out})
		return
	}
	log.Printf("[APK_INSTALL] success udid=%s file=%s output=%s", udid, filepath.Base(resolved), strings.TrimSpace(out))
	writeJSON(w, http.StatusOK, jsonResponse{"success": true, "output": out})
}

func handleInstallApkUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	var req struct {
		UDID     string `json:"udid"`
		FilePath string `json:"filePath"`
		UserID   *int   `json:"userId"`
	}
	if err := readJSON(r, &req); err != nil || strings.TrimSpace(req.UDID) == "" || strings.TrimSpace(req.FilePath) == "" {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": `Invalid "udid" or "filePath"`})
		return
	}
	resolved, err := safeUploadPath(req.FilePath)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	if _, err := os.Stat(resolved); err != nil {
		writeJSON(w, http.StatusNotFound, jsonResponse{"success": false, "error": "file not found"})
		return
	}
	udid := strings.TrimSpace(req.UDID)
	userLabel := "owner"
	if req.UserID != nil {
		userLabel = strconv.Itoa(*req.UserID)
	}
	log.Printf("[APK_INSTALL_USER] start udid=%s user=%s file=%s", udid, userLabel, filepath.Base(resolved))
	out, err := adbInstallUploaded(udid, resolved, req.UserID)
	if err != nil {
		log.Printf("[APK_INSTALL_USER] failed udid=%s user=%s file=%s error=%v output=%s", udid, userLabel, filepath.Base(resolved), err, strings.TrimSpace(out))
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error(), "output": out})
		return
	}
	log.Printf("[APK_INSTALL_USER] success udid=%s user=%s file=%s output=%s", udid, userLabel, filepath.Base(resolved), strings.TrimSpace(out))
	writeJSON(w, http.StatusOK, jsonResponse{"success": true, "output": out})
}

func handlePushFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}
	if strings.TrimSpace(r.Header.Get("X-User-ID")) != "" {
		handleMultipartMediaImport(w, r)
		return
	}

	udid := strings.TrimSpace(r.Header.Get("X-UDID"))
	remotePath := strings.TrimSpace(r.Header.Get("X-Remote-Path"))
	if decoded, err := url.QueryUnescape(remotePath); err == nil {
		remotePath = decoded
	}
	if udid == "" || remotePath == "" {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Missing X-UDID or X-Remote-Path header"})
		return
	}

	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 500<<20))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	defer r.Body.Close()
	if len(body) == 0 {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Empty file payload"})
		return
	}

	root, err := uploadDir()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	if err := os.MkdirAll(root, 0755); err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	tmpPath := filepath.Join(root, fmt.Sprintf("push-%d", time.Now().UnixNano()))
	if err := os.WriteFile(tmpPath, body, 0644); err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	defer os.Remove(tmpPath)

	if err := pushFileToProfileAwarePath(udid, tmpPath, remotePath); err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
	}

	resp := jsonResponse{"success": true}
	if isQRImageRemotePath(remotePath) {
		qrResults, err := pushQRToCloneUsers(udid, tmpPath, remotePath)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, jsonResponse{
				"success":        false,
				"error":          err.Error(),
				"qrCloneResults": qrResults,
			})
			return
		}
		resp["qrCloneCount"] = len(qrResults)
		resp["qrCloneResults"] = qrResults
	}
	writeJSON(w, http.StatusOK, resp)
}

func handlePullFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	var req struct {
		UDID       string `json:"udid"`
		RemotePath string `json:"remotePath"`
	}
	if err := readJSON(r, &req); err != nil || strings.TrimSpace(req.UDID) == "" || strings.TrimSpace(req.RemotePath) == "" {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Missing udid or remotePath"})
		return
	}

	root, err := uploadDir()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	if err := os.MkdirAll(root, 0755); err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	tmpPath := filepath.Join(root, fmt.Sprintf("pull-%d", time.Now().UnixNano()))
	if _, err := adb.Command("-s", strings.TrimSpace(req.UDID), "pull", strings.TrimSpace(req.RemotePath), tmpPath); err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
	}
	defer os.Remove(tmpPath)

	file, err := os.Open(tmpPath)
	if err != nil {
		writeJSON(w, http.StatusNotFound, jsonResponse{"success": false, "error": "File not found on device"})
		return
	}
	defer file.Close()
	stat, _ := file.Stat()
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, path.Base(strings.TrimSpace(req.RemotePath))))
	if stat != nil {
		w.Header().Set("Content-Length", strconv.FormatInt(stat.Size(), 10))
	}
	_, _ = io.Copy(w, file)
}

func handleSettings(w http.ResponseWriter, r *http.Request) {
	settingsFile := filepath.Join(".", "settings.json")

	if r.Method == http.MethodGet {
		data, err := os.ReadFile(settingsFile)
		var settings map[string]interface{}
		if err != nil {
			if !os.IsNotExist(err) {
				writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
				return
			}
			settings = make(map[string]interface{})
		} else {
			if err := json.Unmarshal(data, &settings); err != nil {
				settings = make(map[string]interface{})
			}
		}

		if vaultRaw, ok, err := loadDeviceAccountVaultFromDB(); err == nil && ok {
			settings[deviceAccountVaultKey] = vaultRaw
			settings["monviewphone:device-account-db"] = "data/Data.db"
		}

		orderDB, err := getDeviceOrderFromDB()
		if err == nil && len(orderDB) > 0 {
			// 1. Repair tileOrderNumbers
			shouldRepairOrderNumbers := false
			if settings["tileOrderNumbers"] == nil {
				shouldRepairOrderNumbers = true
			} else if strRaw, isStr := settings["tileOrderNumbers"].(string); isStr {
				var parsed map[string]interface{}
				if err := json.Unmarshal([]byte(strRaw), &parsed); err != nil || len(parsed) == 0 {
					shouldRepairOrderNumbers = true
				}
			} else {
				shouldRepairOrderNumbers = true
			}
			if shouldRepairOrderNumbers {
				if b, err := json.Marshal(orderDB); err == nil {
					settings["tileOrderNumbers"] = string(b)
				}
			}

			// 2. Repair tileOrder
			shouldRepairTileOrder := false
			if settings["tileOrder"] == nil {
				shouldRepairTileOrder = true
			} else if strRaw, isStr := settings["tileOrder"].(string); isStr {
				var parsed []interface{}
				if err := json.Unmarshal([]byte(strRaw), &parsed); err != nil || len(parsed) == 0 {
					shouldRepairTileOrder = true
				}
			} else {
				shouldRepairTileOrder = true
			}
			if shouldRepairTileOrder {
				type udidOrder struct {
					udid string
					ord  int
				}
				var list []udidOrder
				for udid, ord := range orderDB {
					list = append(list, udidOrder{udid: udid, ord: ord})
				}
				sort.Slice(list, func(i, j int) bool {
					return list[i].ord < list[j].ord
				})
				var sortedUDIDs []string
				for _, item := range list {
					sortedUDIDs = append(sortedUDIDs, item.udid)
				}
				if b, err := json.Marshal(sortedUDIDs); err == nil {
					settings["tileOrder"] = string(b)
				}
			}
		}

		if body, err := json.Marshal(settings); err == nil {
			data = body
		} else {
			data = []byte("{}")
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(data)
		return
	}

	if r.Method == http.MethodPost {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": err.Error()})
			return
		}
		defer r.Body.Close()

		var temp map[string]interface{}
		if err := json.Unmarshal(body, &temp); err != nil {
			writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid JSON: " + err.Error()})
			return
		}

		if len(temp) == 0 {
			writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Refusing to save empty payload"})
			return
		}

		// Reject empty keys or null values
		for k, v := range temp {
			if k == "" {
				writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Refusing to save empty key"})
				return
			}
			if v == nil {
				writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": fmt.Sprintf("Refusing to save key %q with null value", k)})
				return
			}
		}

		// Read existing settings
		existingData, err := os.ReadFile(settingsFile)
		var settings map[string]interface{}
		if err == nil {
			_ = json.Unmarshal(existingData, &settings)
		}
		if settings == nil {
			settings = make(map[string]interface{})
		}

		// Query current devices in DB for limit thresholds
		dbDevices := 0
		db, err := openDeviceAccountDB()
		if err == nil {
			_ = db.QueryRow("SELECT COUNT(*) FROM devices").Scan(&dbDevices)
			db.Close()
		}

		// Perform validations on incoming keys
		for k, v := range temp {
			valStr, isStr := v.(string)
			if !isStr {
				writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": fmt.Sprintf("Refusing to save key %q: value must be a string", k)})
				return
			}

			if k == deviceAccountVaultKey {
				if err := validateNewVaultAgainstDB(valStr); err != nil {
					writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": err.Error()})
					return
				}
			} else if k == "tileOrder" {
				var list []interface{}
				if err := json.Unmarshal([]byte(valStr), &list); err != nil {
					writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": fmt.Sprintf("Invalid tileOrder JSON: %v", err)})
					return
				}
			} else if k == "tileOrderNumbers" {
				var obj map[string]interface{}
				if err := json.Unmarshal([]byte(valStr), &obj); err != nil {
					writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": fmt.Sprintf("Invalid tileOrderNumbers JSON: %v", err)})
					return
				}
			}
		}

		// Merge new keys from temp into settings
		for k, v := range temp {
			if k != deviceAccountVaultKey && k != "tileOrderNumbers" {
				settings[k] = v
			}
		}

		incomingVaultRaw, hasIncomingVault := temp[deviceAccountVaultKey].(string)

		if incomingOrderNumbersRaw, ok := temp["tileOrderNumbers"].(string); ok {
			var orderMap map[string]int
			if err := json.Unmarshal([]byte(incomingOrderNumbersRaw), &orderMap); err == nil {
				_ = updateDeviceOrderInDB(orderMap)
			}
		}
		if hasIncomingVault {
			if err := syncDeviceAccountVaultToDB(incomingVaultRaw); err != nil {
				writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": "Failed to sync device account DB: " + err.Error()})
				return
			}
			settings["monviewphone:device-account-db"] = "data/Data.db"
			if vaultRaw, ok, err := loadDeviceAccountVaultFromDB(); err != nil {
				writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
				return
			} else if ok {
				settings[deviceAccountVaultKey] = vaultRaw
			}
		} else {
			if vaultRaw, ok, err := loadDeviceAccountVaultFromDB(); err != nil {
				writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
				return
			} else if ok {
				settings[deviceAccountVaultKey] = vaultRaw
				settings["monviewphone:device-account-db"] = "data/Data.db"
			}
		}

		// Prepare settings to save to settings.json - exclude vault and tileOrderNumbers
		saveSettings := make(map[string]interface{})
		for k, v := range settings {
			if k != deviceAccountVaultKey && k != "tileOrderNumbers" {
				saveSettings[k] = v
			}
		}

		body, err = json.Marshal(saveSettings)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
			return
		}

		if err := os.WriteFile(settingsFile, body, 0644); err != nil {
			writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, jsonResponse{"success": true})
		return
	}

	writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
}

func handleDeviceOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		order, err := getDeviceOrderFromDB()
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"success": true, "orderNumbers": order})
		return
	}

	if r.Method == http.MethodPost {
		var req struct {
			OrderNumbers map[string]int `json:"orderNumbers"`
		}
		if err := readJSON(r, &req); err != nil {
			writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid request parameters"})
			return
		}

		if len(req.OrderNumbers) == 0 {
			writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "orderNumbers cannot be empty"})
			return
		}

		for k, v := range req.OrderNumbers {
			if k == "" {
				writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "UDID key cannot be empty"})
				return
			}
			if v <= 0 {
				writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Order value must be > 0"})
				return
			}
		}

		db, err := openDeviceAccountDB()
		if err == nil {
			db.Close()
		}

		if err := updateDeviceOrderInDB(req.OrderNumbers); err != nil {
			writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
			return
		}

		writeJSON(w, http.StatusOK, jsonResponse{"success": true})
		return
	}

	writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
}

func handleAccountVault(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		vaultRaw, ok, err := loadDeviceAccountVaultFromDB()
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
			return
		}
		if !ok {
			writeJSON(w, http.StatusNotFound, jsonResponse{"success": false, "error": "Vault not found in DB"})
			return
		}
		var vault map[string]interface{}
		json.Unmarshal([]byte(vaultRaw), &vault)
		writeJSON(w, http.StatusOK, map[string]interface{}{"success": true, "vault": vault})
		return
	}

	if r.Method == http.MethodPost {
		var req struct {
			Vault map[string]interface{} `json:"vault"`
		}
		if err := readJSON(r, &req); err != nil {
			writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid request parameters"})
			return
		}

		vaultBytes, err := json.Marshal(req.Vault)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid vault JSON"})
			return
		}
		vaultStr := string(vaultBytes)

		if err := validateNewVaultAgainstDB(vaultStr); err != nil {
			writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": err.Error()})
			return
		}

		if err := syncDeviceAccountVaultToDB(vaultStr); err != nil {
			writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
			return
		}

		writeJSON(w, http.StatusOK, jsonResponse{"success": true})
		return
	}

	writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
}

func handleOpenFileDialog(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	var req struct {
		InitialDir string `json:"initialDir"`
		Multi      bool   `json:"multi"`
		Filter     string `json:"filter"`
	}
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid request body: " + err.Error()})
		return
	}

	dir := req.InitialDir
	warning := ""
	if dir == "" {
		dir = getFallbackDir()
	} else {
		if fi, err := os.Stat(dir); err != nil || !fi.IsDir() {
			dir = getFallbackDir()
			warning = fmt.Sprintf("Directory %q not found, fallback to %q", req.InitialDir, dir)
		}
	}

	filter := req.Filter
	if filter == "" {
		filter = "Images and Videos|*.jpg;*.jpeg;*.png;*.webp;*.bmp;*.gif;*.mp4;*.mov;*.mkv|All Files|*.*"
	}

	psScript := fmt.Sprintf(`[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.InitialDirectory = '%s'
$dialog.Multiselect = $%t
$dialog.Filter = '%s'
$result = $dialog.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    $out = @{
        success = $true
        cancelled = $false
        files = $dialog.FileNames
    }
} else {
    $out = @{
        success = $true
        cancelled = $true
        files = @()
    }
}
$out | ConvertTo-Json -Compress`,
		strings.ReplaceAll(dir, "'", "''"),
		req.Multi,
		strings.ReplaceAll(filter, "'", "''"),
	)

	tmpFile, err := os.CreateTemp("", "open-dialog-*.ps1")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": "Failed to create temp script: " + err.Error()})
		return
	}
	tmpPath := tmpFile.Name()
	defer os.Remove(tmpPath)

	if _, err := tmpFile.WriteString(psScript); err != nil {
		tmpFile.Close()
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": "Failed to write temp script: " + err.Error()})
		return
	}
	tmpFile.Close()

	// Execute powershell script
	cmd := exec.Command("powershell.exe", "-NoProfile", "-STA", "-ExecutionPolicy", "Bypass", "-File", tmpPath)
	output, err := cmd.Output()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": "Failed to run file dialog: " + err.Error()})
		return
	}

	// Parse JSON output from PowerShell
	var result struct {
		Success   bool     `json:"success"`
		Cancelled bool     `json:"cancelled"`
		Files     []string `json:"files"`
	}
	if err := json.Unmarshal(output, &result); err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": "Failed to parse dialog output: " + err.Error(), "raw": string(output)})
		return
	}

	resp := jsonResponse{
		"success":   result.Success,
		"cancelled": result.Cancelled,
		"files":     result.Files,
	}
	if warning != "" {
		resp["warning"] = warning
	}

	writeJSON(w, http.StatusOK, resp)
}

func getFallbackDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return "."
	}
	downloads := filepath.Join(home, "Downloads")
	if fi, err := os.Stat(downloads); err == nil && fi.IsDir() {
		return downloads
	}
	desktop := filepath.Join(home, "Desktop")
	if fi, err := os.Stat(desktop); err == nil && fi.IsDir() {
		return desktop
	}
	return home
}

func handlePushLocalFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	var req struct {
		UDID       string   `json:"udid"`
		LocalPath  string   `json:"localPath"`
		RemotePath string   `json:"remotePath"`
		UserID     int      `json:"userId"`
		LocalPaths []string `json:"localPaths"`
	}
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid request body: " + err.Error()})
		return
	}

	req.UDID = strings.TrimSpace(req.UDID)
	req.LocalPath = strings.TrimSpace(req.LocalPath)
	req.RemotePath = strings.TrimSpace(req.RemotePath)

	if len(req.LocalPaths) > 0 {
		handleLocalMediaImport(w, req.UDID, req.UserID, req.LocalPaths)
		return
	}

	if req.UDID == "" || req.LocalPath == "" || req.RemotePath == "" {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Missing udid, localPath, or remotePath"})
		return
	}

	if _, err := os.Stat(req.LocalPath); err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Local file not found: " + err.Error()})
		return
	}

	if err := pushFileToProfileAwarePath(req.UDID, req.LocalPath, req.RemotePath); err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
	}

	resp := jsonResponse{"success": true}
	if isQRImageRemotePath(req.RemotePath) {
		qrResults, err := pushQRToCloneUsers(req.UDID, req.LocalPath, req.RemotePath)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, jsonResponse{
				"success":        false,
				"error":          err.Error(),
				"qrCloneResults": qrResults,
			})
			return
		}
		resp["qrCloneCount"] = len(qrResults)
		resp["qrCloneResults"] = qrResults
	}

	writeJSON(w, http.StatusOK, resp)
}
