package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"server-go/adb"
)

var (
	pushedAppHelpersMutex sync.Mutex
	pushedAppHelpers      = make(map[string]bool)
	packageNameRegex      = regexp.MustCompile(`^[a-zA-Z0-9._-]+$`)
)

type appActionRequest struct {
	UDID        string `json:"udid"`
	UserID      int    `json:"userId"`
	PackageName string `json:"packageName"`
}

type appListResponseItem struct {
	PackageName    string   `json:"packageName"`
	DisplayName    string   `json:"displayName"`
	UserID         int      `json:"userId"`
	BaseApkPath    string   `json:"baseApkPath"`
	SplitApkPaths  []string `json:"splitApkPaths"`
	IsSystem       bool     `json:"isSystem"`
	Enabled        bool     `json:"enabled"`
	Icon           string   `json:"icon"` // Base64 PNG
}

func validatePackageName(name string) bool {
	return packageNameRegex.MatchString(name)
}

func findProjectRoot() string {
	wd, err := os.Getwd()
	if err == nil {
		if fileExists(filepath.Join(wd, "client")) && fileExists(filepath.Join(wd, "server-go")) {
			return wd
		}
		parent := filepath.Dir(wd)
		if fileExists(filepath.Join(parent, "client")) && fileExists(filepath.Join(parent, "server-go")) {
			return parent
		}
	}
	exePath, err := os.Executable()
	if err == nil {
		exeDir := filepath.Dir(exePath)
		if fileExists(filepath.Join(exeDir, "client")) && fileExists(filepath.Join(exeDir, "server-go")) {
			return exeDir
		}
		parent := filepath.Dir(exeDir)
		if fileExists(filepath.Join(parent, "client")) && fileExists(filepath.Join(parent, "server-go")) {
			return parent
		}
	}
	return wd
}

func handleAppsList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	var req struct {
		UDID   string `json:"udid"`
		UserID int    `json:"userId"`
	}
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid JSON"})
		return
	}

	udid := strings.TrimSpace(req.UDID)
	if udid == "" || req.UserID < 0 {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid udid or userId"})
		return
	}

	// 1. Ensure the Java helper is pushed to the device
	localJar, err := filepath.Abs(filepath.Join("appmanagement", "bin", "monview-app-management.jar"))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": err.Error()})
		return
	}

	remoteJar := "/data/local/tmp/monview-app-management.jar"

	pushedAppHelpersMutex.Lock()
	alreadyPushed := pushedAppHelpers[udid]
	pushedAppHelpersMutex.Unlock()

	if !alreadyPushed {
		if _, err := adb.Command("-s", udid, "push", localJar, remoteJar); err != nil {
			// Try without absolute path just in case
			if _, err2 := adb.Command("-s", udid, "push", filepath.Join("appmanagement", "bin", "monview-app-management.jar"), remoteJar); err2 != nil {
				writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": fmt.Sprintf("Failed to push app helper: %v", err2)})
				return
			}
		}
		pushedAppHelpersMutex.Lock()
		pushedAppHelpers[udid] = true
		pushedAppHelpersMutex.Unlock()
	}

	// 2. Run the helper via app_process
	cmd := fmt.Sprintf(
		"CLASSPATH=%s app_process / com.monviewphone.appmanagement.AppManagerHelper %d",
		shellQuote(remoteJar),
		req.UserID,
	)

	out, err := adb.Shell(udid, cmd)
	if err != nil {
		// Try pushing again just in case helper was deleted
		if _, errPush := adb.Command("-s", udid, "push", localJar, remoteJar); errPush == nil {
			out, err = adb.Shell(udid, cmd)
		}
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": fmt.Sprintf("Failed to run app helper: %v, output: %s", err, out)})
			return
		}
	}

	// Helper returns a JSON array of apps
	var apps []appListResponseItem
	if err := json.Unmarshal([]byte(strings.TrimSpace(out)), &apps); err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": fmt.Sprintf("Failed to parse app list JSON: %v, output: %s", err, out)})
		return
	}

	writeJSON(w, http.StatusOK, jsonResponse{"success": true, "apps": apps})
}

func handleAppsExtract(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	var req appActionRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid JSON"})
		return
	}

	udid := strings.TrimSpace(req.UDID)
	packageName := strings.TrimSpace(req.PackageName)
	if udid == "" || packageName == "" || req.UserID < 0 {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid request fields"})
		return
	}

	if !validatePackageName(packageName) {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid packageName syntax"})
		return
	}

	// Query paths of the package via adb pm path
	pmCmd := fmt.Sprintf("pm path --user %d %s", req.UserID, packageName)
	out, err := adb.Shell(udid, pmCmd)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": fmt.Sprintf("Failed to get apk paths: %v, output: %s", err, out)})
		return
	}

	var apkPaths []string
	lines := strings.Split(out, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "package:") {
			apkPaths = append(apkPaths, strings.TrimPrefix(line, "package:"))
		}
	}

	if len(apkPaths) == 0 {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": "No APK paths found for package (app might not be installed for user)"})
		return
	}

	// Prepare output APK directory
	projectRoot := findProjectRoot()
	apkDir := filepath.Join(projectRoot, "APK")
	if err := os.MkdirAll(apkDir, 0755); err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": fmt.Sprintf("Failed to create APK directory: %v", err)})
		return
	}

	timestamp := time.Now().Format("20060102_150405")
	var savedPaths []string
	outputDir := ""

	if len(apkPaths) == 1 {
		// Single APK app
		destFile := fmt.Sprintf("%s_%s.apk", packageName, timestamp)
		destPath := filepath.Join(apkDir, destFile)
		
		// Pull APK
		if _, err := adb.Command("-s", udid, "pull", apkPaths[0], destPath); err != nil {
			writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": fmt.Sprintf("Failed to pull APK: %v", err)})
			return
		}
		
		savedPaths = append(savedPaths, destPath)
		outputDir = destPath
	} else {
		// Split APK app
		subDirName := fmt.Sprintf("%s_%s", packageName, timestamp)
		subDirPath := filepath.Join(apkDir, subDirName)
		if err := os.MkdirAll(subDirPath, 0755); err != nil {
			writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": fmt.Sprintf("Failed to create split directory: %v", err)})
			return
		}

		for _, remotePath := range apkPaths {
			baseName := filepath.Base(remotePath)
			// Ensure safe file name
			if !validatePackageName(strings.TrimSuffix(baseName, filepath.Ext(baseName))) {
				baseName = "split_" + filepath.Base(remotePath)
			}
			destPath := filepath.Join(subDirPath, baseName)
			if _, err := adb.Command("-s", udid, "pull", remotePath, destPath); err != nil {
				writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": fmt.Sprintf("Failed to pull split APK: %v", err)})
				return
			}
			savedPaths = append(savedPaths, destPath)
		}
		outputDir = subDirPath
	}

	writeJSON(w, http.StatusOK, jsonResponse{
		"success":     true,
		"packageName": packageName,
		"outputDir":   outputDir,
		"savedPaths":  savedPaths,
		"count":       len(savedPaths),
	})
}

func handleAppsForceStop(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	var req appActionRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid JSON"})
		return
	}

	udid := strings.TrimSpace(req.UDID)
	packageName := strings.TrimSpace(req.PackageName)
	if udid == "" || packageName == "" || req.UserID < 0 {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid request fields"})
		return
	}

	if !validatePackageName(packageName) {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid packageName syntax"})
		return
	}

	cmd := fmt.Sprintf("am force-stop --user %d %s", req.UserID, packageName)
	out, err := adb.Shell(udid, cmd)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": fmt.Sprintf("Failed to force-stop app: %v, output: %s", err, out)})
		return
	}

	writeJSON(w, http.StatusOK, jsonResponse{"success": true, "output": strings.TrimSpace(out)})
}

func handleAppsOpen(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	var req appActionRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid JSON"})
		return
	}

	udid := strings.TrimSpace(req.UDID)
	packageName := strings.TrimSpace(req.PackageName)
	if udid == "" || packageName == "" || req.UserID < 0 {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid request fields"})
		return
	}

	if !validatePackageName(packageName) {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid packageName syntax"})
		return
	}

	// Try to resolve launch activity name using cmd package resolve-activity
	resolveCmd := fmt.Sprintf("cmd package resolve-activity --brief --user %d %s", req.UserID, packageName)
	resolveOut, resolveErr := adb.Shell(udid, resolveCmd)

	var launchActivity string
	if resolveErr == nil {
		lines := strings.Split(resolveOut, "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if strings.Contains(line, "/") && !strings.Contains(strings.ToLower(line), "no activity found") {
				launchActivity = line
				break
			}
		}
	}

	var out string
	var err error

	if launchActivity != "" {
		// Launch using am start
		startCmd := fmt.Sprintf("am start --user %d -n %s", req.UserID, launchActivity)
		out, err = adb.Shell(udid, startCmd)
	} else {
		// Fallback to monkey command
		var monkeyCmd string
		if req.UserID == 0 {
			monkeyCmd = fmt.Sprintf("monkey -p %s -c android.intent.category.LAUNCHER 1", packageName)
		} else {
			monkeyCmd = fmt.Sprintf("monkey -p %s --user %d -c android.intent.category.LAUNCHER 1", packageName, req.UserID)
		}
		out, err = adb.Shell(udid, monkeyCmd)
	}

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": fmt.Sprintf("Failed to open app: %v, output: %s", err, out)})
		return
	}

	writeJSON(w, http.StatusOK, jsonResponse{"success": true, "output": strings.TrimSpace(out)})
}


func handleAppsClearCache(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	var req appActionRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid JSON"})
		return
	}

	udid := strings.TrimSpace(req.UDID)
	packageName := strings.TrimSpace(req.PackageName)
	if udid == "" || packageName == "" || req.UserID < 0 {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid request fields"})
		return
	}

	if !validatePackageName(packageName) {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid packageName syntax"})
		return
	}

	// 1. Probe for root/su availability
	suCheck, err := adb.Shell(udid, "which su")
	if err != nil || strings.TrimSpace(suCheck) == "" {
		writeJSON(w, http.StatusOK, jsonResponse{"success": false, "error": "unsupported", "message": "Thiết bị/ROM không hỗ trợ xóa riêng cache (yêu cầu root)"})
		return
	}

	// 2. Perform cache directory removal using su
	// Delete 'cache' and 'code_cache' of the package for the specific user
	cachePath := fmt.Sprintf("/data/user/%d/%s/cache", req.UserID, packageName)
	codeCachePath := fmt.Sprintf("/data/user/%d/%s/code_cache", req.UserID, packageName)
	
	cmd := fmt.Sprintf("su -c \"rm -rf %s %s\"", shellQuote(cachePath), shellQuote(codeCachePath))
	out, err := adb.Shell(udid, cmd)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": fmt.Sprintf("Failed to clear cache: %v, output: %s", err, out)})
		return
	}

	writeJSON(w, http.StatusOK, jsonResponse{"success": true})
}

func handleAppsUninstall(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	var req appActionRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid JSON"})
		return
	}

	udid := strings.TrimSpace(req.UDID)
	packageName := strings.TrimSpace(req.PackageName)
	if udid == "" || packageName == "" || req.UserID < 0 {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid request fields"})
		return
	}

	if !validatePackageName(packageName) {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid packageName syntax"})
		return
	}

	cmd := fmt.Sprintf("pm uninstall --user %d %s", req.UserID, packageName)
	out, err := adb.Shell(udid, cmd)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResponse{"success": false, "error": fmt.Sprintf("Failed to uninstall app: %v, output: %s", err, out)})
		return
	}

	writeJSON(w, http.StatusOK, jsonResponse{"success": true, "output": strings.TrimSpace(out)})
}
