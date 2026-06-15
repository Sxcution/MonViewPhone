package main

import (
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

		mediaSuccess := false
		if _, err := adb.Shell(udid, insertCmd); err == nil {
			queryCmd := fmt.Sprintf(
				"content query --user %d --uri %s --projection _id --where %s",
				userID,
				uri,
				shellDoubleQuote("_display_name='"+uniqueFileName+"'"),
			)
			if queryOut, err := adb.Shell(udid, queryCmd); err == nil {
				match := mediaIDPattern.FindStringSubmatch(queryOut)
				if len(match) >= 2 {
					mediaURI := uri + "/" + match[1]
					writeCmd := fmt.Sprintf("cat %s | content write --user %d --uri %s", shellQuote(deviceTmp), userID, mediaURI)
					if _, err := adb.Shell(udid, writeCmd); err == nil {
						updateCmd := fmt.Sprintf(
							"content update --user %d --uri %s --bind _display_name:s:%s",
							userID,
							mediaURI,
							shellQuote(fileName),
						)
						if _, err := adb.Shell(udid, updateCmd); err == nil {
							mediaSuccess = true
						}
					}
				}
			}
		}

		if !mediaSuccess {
			// Fallback: copy file normally and trigger media scanner
			parent := path.Dir(remotePath)
			if parent != "." && parent != "/" {
				_, _ = adb.Shell(udid, "mkdir -p "+shellQuote(parent))
			}
			if _, err := adb.Shell(udid, "cp "+shellQuote(deviceTmp)+" "+shellQuote(remotePath)); err != nil {
				return err
			}
			// Trigger media scanner so Gallery sees it
			scannerCmd := fmt.Sprintf("am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file://%s --user %d", shellQuote(remotePath), userID)
			_, _ = adb.Shell(udid, scannerCmd)
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
				if err := json.Unmarshal([]byte(strRaw), &parsed); err != nil || len(parsed) < 35 {
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
				if err := json.Unmarshal([]byte(strRaw), &parsed); err != nil || len(parsed) < 35 {
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
				if dbDevices >= 35 && len(list) < 35 {
					writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": fmt.Sprintf("Refusing to save tileOrder: length %d < 35 (minimum 35 required)", len(list))})
					return
				}
			} else if k == "tileOrderNumbers" {
				var obj map[string]interface{}
				if err := json.Unmarshal([]byte(valStr), &obj); err != nil {
					writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": fmt.Sprintf("Invalid tileOrderNumbers JSON: %v", err)})
					return
				}
				if dbDevices >= 35 && len(obj) < 35 {
					writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": fmt.Sprintf("Refusing to save tileOrderNumbers: keys length %d < 35 (minimum 35 required)", len(obj))})
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
			if err := json.Unmarshal([]byte(incomingOrderNumbersRaw), &orderMap); err == nil && len(orderMap) >= 35 {
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
			var dbDevices int
			_ = db.QueryRow("SELECT COUNT(*) FROM devices").Scan(&dbDevices)
			db.Close()
			if dbDevices >= 35 && len(req.OrderNumbers) < 35 {
				writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Cannot downgrade orderNumbers below 35"})
				return
			}
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
		UDID       string `json:"udid"`
		LocalPath  string `json:"localPath"`
		RemotePath string `json:"remotePath"`
	}
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid request body: " + err.Error()})
		return
	}

	req.UDID = strings.TrimSpace(req.UDID)
	req.LocalPath = strings.TrimSpace(req.LocalPath)
	req.RemotePath = strings.TrimSpace(req.RemotePath)

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

	writeJSON(w, http.StatusOK, jsonResponse{"success": true})
}
