package main

import (
	"encoding/base64"
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

func handleSettings(w http.ResponseWriter, r *http.Request) {
	settingsFile := filepath.Join(".", "settings.json")

	if r.Method == http.MethodGet {
		data, err := os.ReadFile(settingsFile)
		if err != nil {
			if os.IsNotExist(err) {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				w.Write([]byte("{}"))
				return
			}
			writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
			return
		}
		var settings map[string]interface{}
		if err := json.Unmarshal(data, &settings); err == nil {
			if vaultRaw, ok, err := loadDeviceAccountVaultFromDB(); err != nil {
				writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
				return
			} else if ok {
				settings[deviceAccountVaultKey] = vaultRaw
				settings["monviewphone:device-account-db"] = "data/Data.db"
				if body, err := json.Marshal(settings); err == nil {
					data = body
				}
			}
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
			settings[k] = v
		}

		incomingVaultRaw, hasIncomingVault := temp[deviceAccountVaultKey].(string)
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

		body, err = json.Marshal(settings)
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

func handleSetWallpaper(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	var req struct {
		UDID  string `json:"udid"`
		Image string `json:"image"`
	}
	if err := readJSON(r, &req); err != nil || strings.TrimSpace(req.UDID) == "" || strings.TrimSpace(req.Image) == "" {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid request parameters"})
		return
	}

	udid := strings.TrimSpace(req.UDID)
	imgData := req.Image
	if idx := strings.Index(imgData, ","); idx != -1 {
		imgData = imgData[idx+1:]
	}

	dec, err := base64.StdEncoding.DecodeString(imgData)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid image base64 data: " + err.Error()})
		return
	}

	root, err := uploadDir()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": "Failed to resolve upload directory: " + err.Error()})
		return
	}
	if err := os.MkdirAll(root, 0755); err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": "Failed to create upload directory: " + err.Error()})
		return
	}

	// 1. Write the image locally
	localImgPath := filepath.Join(root, fmt.Sprintf("wp-%d-%s.png", time.Now().UnixNano(), udid))
	if err := os.WriteFile(localImgPath, dec, 0644); err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": "Failed to write local image: " + err.Error()})
		return
	}
	defer os.Remove(localImgPath)

	// 2. Write the jar locally from embedded base64
	jarB64 := "UEsDBBQACAgIAAAAIQAAAAAAAAAAAAAAAAALAAkAY2xhc3Nlcy5kZXhVVAUAAQAAAACNll1sHFcVx8987PeuvbuJ43Zx4smu2ziNvWs7cWJ7HavESSor3iTqJkbESO3szPXuNLsz49mxs6ElBCHRIKASIOAhFRVISFDxUKl9KA8FCVGEeEB5QhT1DSQeQAipCB7oA/97Z9ZeB5Cw/NO5c86555577pnZa7Jecub0PJUWPlB+eetrb/rXrj6sfum3f0789f7P73/xweu/SxG5RNTbOJOn8G8Kumcp0D/BpUSUgXwEqUK2ZSLu/FVI/NOYQvRKnOgzkMUo0TNgBTTBA/AV8Br4Bvg2eAjeAD8DvwcfgXMxohfAZ8HXwQ/Be+AR+BP4GIxjjdPgObAJPPAa+A54E/wK/Ab8DXwE/gn+BShBdAo8D24CC9wD3wTfBz8F74Nfg0fgA/AH8A+gJImGgAYmwSkwC86C58B1sAmawE0G9YEglJDSFNRtCAyDLMhRULtD4DAYAUfAaFjrJ0EBfAIcByfAJDgJngEoA+EY6MOI2JbgjxhHwnUp9OHjv0AZDfP4O8bxMJePwzHPQ40G6xwK5xbDMfcvheN0dH/MY0708x/Qj0V5LkkaF+sFMotVyqFcDPM+LWSClvnaqNI54rnHxNoRzFwgnnOwkyj008RzTVJV7FWiFbE3hWaEjNJcKM+ImsdoSayvCr+hMO4QunQ2zKMi9h2hsxScVS4b1ITC/IR/isJ8Al3ffjSUo6E9jrhKOIuf2RhOtyCdony+VBqhMTVH+UhNVSL2TJKySppKx49QLSbhOUcvSpNyJhpEHkUMSUo9IXGJ5+9Fgtzc7JBYPQ2tgj3+APr3eV+8lc/NZ9PUwPoFWSNbi5FG29ks/PJ0OZWihqxQQTkmLHPwmYI1Ae+0XFDOU0kdIXsmRXNqWimpR5Alz6iOp4KKL0U0sF6IpmVu5TZ4yuOyTIsyVlWwqqqI2KvhqttZEtH37fIBe1GJkqtF6G2xXzs7zL1TBXWZ8pdLTdQqHqMaGIsrXEoNtGf+JEaJRhx7WsIoyXO6EkunSiaqqKhUi6jSdjaO6GmqkZrYzmbQCWKc5DmfUhspVIGeEpmkaHIok5oczaRsTUJNAtvToc3ORlHhQDfW988F2slIhrY1GZoTKcxG3VPhrobC97mG8YuQVXTMG6IfU/QjISV6B1KB509Ev0mkSqn3M+n/pu9LhH+35XiMCYR60rv/Pme9Wrv1QfTvZUrYPPYuDR+WBoZfkV2jsqZqfHlu8svy9ZR+fC3ji2f7/erHMrDoRwe6GNZdM8RIYfxpZHCb4Ms8s6J51GKLlu25a9Q/uLCxET9ru23mG8Zq22926UTl3WrzUzNd7Qm87VP6e22q7vMq+m23mSeZtldX7cNRuP7jk7D1y1bq9/t+qyjrTq2z3o+SWskrZO8vgbWSVlf5w+36Ni6bpueY5kV3XUrj8ev0pN7doMHsv1KGLBKo3umpqe7LcvoVp5nBgwX1g2nU+k49q7F7rgtx2aVFmsjaqXO/L0lJiYu9Xzm2Xp7b88XdOO263j+TJWe/r9i8Pxe0nf1iuVULmP/a7a749d9j+mdKo3smf6H+rpn2XvqQ4G6rdvNygXHaTPdrlJuQCkônjuxXF3qGcz1Lcc+OH0NBRLFOz6gvOrUd4xWjfktxxyYlx9wudZ4SdRvUIf0LLv5mE6c7MFUbrQ8547eaLMqFQbUHttqI2YlWLdKsfrN1dVL9TrlBstY5hNorO7rno/VtDt9g2a0EIWVy2VSb3z6+iXSbnbRF0va4Gxt2epA+YKr+60VkjZI3kCTbaDJNtBkJ/f9uujgLcfrdya6R1t3jNta1/AYs8v01EHXXUvXtqBp6NyHhSdVJukW5Tf/82AObf6XUh5Q9muZ0U2zvuO6Hut2mUmFsI3LeAPKnzR8a9fy76KeTDcpYrSdLiOFeR6prGf5FMMOruodRnG8kMFLmsPoIjPausfMoNCUgmqt/24m8BDqsxgG2++/l1HL3nVuM5I6pHbw3Li5Pj07DbpDa2fgHTEiAlF26bEXiUo2RWRanxWbFdv77BrW/RQunfv4sLLRV41ZpvFpaLJesWpIl4n12rrvOumO47JhKGx04SppXenjRYzbnd3Ot3iEmreZVPFjmVP665VXJqp6nZb+vQsZmwhFXPrzGyjYc4tNObPnjZn2SKbWTTmt87NmeeMeUOfX1ww5xF0l3ldrIVJC+W58ty0yXaLnxPfRvnL2odR/hFUvnBf/XFMSvwi1v/df+wewOWzFNyD+TezfxfGNffAfbh/J47Q/r04Svt3Y0kL5vD7saIFev4bL2WD+xu/y+FnUniform8/k+hD7iJIN8phMiQuMGPP7+b8BUEsHCMoRhsbNBgAA2AsAAFBLAQIUABQACAgIAAAAIQDKEYbGzQYAANgLAAALAAkAAAAAAAAAAAAAAAAAAABjbGFzc2VzLmRleFVUBQABAAAAAFBLBQYAAAAAAQABAEIAAAAPBwAAAAA="
	jarDec, err := base64.StdEncoding.DecodeString(jarB64)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": "Internal error decoding jar: " + err.Error()})
		return
	}
	localJarPath := filepath.Join(root, "wallpaper_helper.jar")
	if err := os.WriteFile(localJarPath, jarDec, 0644); err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": "Failed to write local jar helper: " + err.Error()})
		return
	}

	// 3. Push the jar helper to the device
	remoteJarPath := "/data/local/tmp/wallpaper_helper.jar"
	if _, err := adb.Command("-s", udid, "push", localJarPath, remoteJarPath); err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": "Failed to push jar helper to device: " + err.Error()})
		return
	}

	// 4. Push the image to the device
	remoteImgPath := "/data/local/tmp/temp_wallpaper.png"
	if _, err := adb.Command("-s", udid, "push", localImgPath, remoteImgPath); err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": "Failed to push wallpaper image to device: " + err.Error()})
		return
	}
	defer adb.Shell(udid, "rm "+shellQuote(remoteImgPath))

	// 5. Run the helper program on the device to set the wallpaper
	cmdStr := fmt.Sprintf("CLASSPATH=%s app_process /data/local/tmp com.monviewphone.helper.SetWallpaper %s", remoteJarPath, remoteImgPath)
	out, err := adb.Shell(udid, cmdStr)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": "Failed to execute wallpaper setter on device: " + err.Error(), "output": out})
		return
	}

	if !strings.Contains(out, "SUCCESS") {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": "Setter failed, output: " + out})
		return
	}

	writeJSON(w, http.StatusOK, jsonResponse{"success": true})
}
