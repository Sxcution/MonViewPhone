package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
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
		return "content://media/external/downloads/media", "application/octet-stream", "Download/", false
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

func pushFileToProfileAwarePath(udid, tmpPath, remotePath string) error {
	remotePath = strings.TrimSpace(remotePath)
	userID := userIDFromRemotePath(remotePath)
	fileName := path.Base(remotePath)
	if fileName == "." || fileName == "/" || fileName == "" {
		fileName = path.Base(tmpPath)
	}
	safeTmpName := sanitizeFileName(fileName)
	ext := strings.TrimPrefix(strings.ToLower(path.Ext(fileName)), ".")
	uri, mimeType, relPath, isMedia := mediaStoreTarget(ext)

	if isMedia {
		deviceTmp := fmt.Sprintf("/data/local/tmp/%d_%s", time.Now().UnixNano(), safeTmpName)
		if _, err := adb.Command("-s", udid, "push", tmpPath, deviceTmp); err != nil {
			return err
		}
		defer adb.Shell(udid, "rm "+shellQuote(deviceTmp))

		uniqueFileName := fmt.Sprintf("vsp_%d_%s", time.Now().UnixNano(), safeTmpName)
		insertCmd := fmt.Sprintf(
			"content insert --user %d --uri %s --bind _display_name:s:%s --bind mime_type:s:%s --bind relative_path:s:%s",
			userID,
			uri,
			shellQuote(uniqueFileName),
			shellQuote(mimeType),
			shellQuote(relPath),
		)
		if _, err := adb.Shell(udid, insertCmd); err != nil {
			return err
		}

		queryCmd := fmt.Sprintf(
			"content query --user %d --uri %s --projection _id --where %s",
			userID,
			uri,
			shellDoubleQuote("_display_name='"+uniqueFileName+"'"),
		)
		queryOut, err := adb.Shell(udid, queryCmd)
		if err != nil {
			return err
		}
		match := mediaIDPattern.FindStringSubmatch(queryOut)
		if len(match) < 2 {
			return fmt.Errorf("failed to retrieve MediaStore ID for inserted media file")
		}

		mediaURI := uri + "/" + match[1]
		writeCmd := fmt.Sprintf("cat %s | content write --user %d --uri %s", shellQuote(deviceTmp), userID, mediaURI)
		if _, err := adb.Shell(udid, writeCmd); err != nil {
			return err
		}

		updateCmd := fmt.Sprintf(
			"content update --user %d --uri %s --bind _display_name:s:%s",
			userID,
			mediaURI,
			shellQuote(fileName),
		)
		if _, err := adb.Shell(udid, updateCmd); err != nil {
			return err
		}
		return nil
	}

	if userID > 0 {
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

	parent := path.Dir(remotePath)
	if parent != "." && parent != "/" {
		_, _ = adb.Shell(udid, "mkdir -p "+shellQuote(parent))
	}
	_, err := adb.Command("-s", udid, "push", tmpPath, remotePath)
	return err
}

func adbInstallUploaded(udid, apkPath string, userID *int) (string, error) {
	remote := "/data/local/tmp/" + sanitizeFileName(filepath.Base(apkPath))
	if _, err := adb.Command("-s", udid, "push", apkPath, remote); err != nil {
		return "", err
	}
	defer adb.Command("-s", udid, "shell", "rm", remote)

	args := []string{"-s", udid, "shell", "pm", "install", "-r"}
	if userID != nil {
		args = append(args, "--user", strconv.Itoa(*userID))
	}
	args = append(args, remote)

	out, err := adb.Command(args...)
	if err != nil {
		return out, err
	}
	if !strings.Contains(strings.ToLower(out), "success") {
		return out, fmt.Errorf("pm install failed: %s", strings.TrimSpace(out))
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

	out, err := adb.Shell(strings.TrimSpace(req.UDID), "pm list users")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
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
	writeJSON(w, http.StatusOK, jsonResponse{"success": true, "profiles": profiles, "raw": out})
}

func handleAdbCommand(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	var req struct {
		UDID    string `json:"udid"`
		Command string `json:"command"`
	}
	if err := readJSON(r, &req); err != nil || strings.TrimSpace(req.UDID) == "" || strings.TrimSpace(req.Command) == "" {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": `Invalid "udid" or "command"`})
		return
	}

	udid := strings.TrimSpace(req.UDID)
	command := strings.TrimSpace(req.Command)
	var out string
	var err error

	if strings.HasPrefix(command, "adb ") {
		parts := strings.Fields(command)
		cleaned := make([]string, 0, len(parts)+1)
		for i := 1; i < len(parts); i++ {
			if parts[i] == "-s" && i+1 < len(parts) {
				i++
				continue
			}
			cleaned = append(cleaned, parts[i])
		}
		args := append([]string{"-s", udid}, cleaned...)
		out, err = adb.Command(args...)
	} else {
		out, err = adb.Shell(udid, command)
	}

	if err != nil {
		writeJSON(w, http.StatusOK, jsonResponse{"success": false, "output": err.Error(), "error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, jsonResponse{"success": true, "output": out})
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
	out, err := adbInstallUploaded(strings.TrimSpace(req.UDID), resolved, nil)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error(), "output": out})
		return
	}
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
	out, err := adbInstallUploaded(strings.TrimSpace(req.UDID), resolved, req.UserID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error(), "output": out})
		return
	}
	writeJSON(w, http.StatusOK, jsonResponse{"success": true, "output": out})
}

func handlePushFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
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
	writeJSON(w, http.StatusOK, jsonResponse{"success": true})
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
