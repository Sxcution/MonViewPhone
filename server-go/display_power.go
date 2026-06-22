package main

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"sync"

	"server-go/adb"
)

type displayPowerRequest struct {
	UDID         string `json:"udid"`
	Mode         string `json:"mode"`
	DisplayIndex int    `json:"displayIndex"`
}

func handleDisplayPower(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	var req displayPowerRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid JSON"})
		return
	}

	udid := strings.TrimSpace(req.UDID)
	mode := strings.ToLower(strings.TrimSpace(req.Mode))
	if udid == "" || (mode != "off" && mode != "on") {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": `Invalid "udid" or "mode"`})
		return
	}
	if req.DisplayIndex < 0 {
		req.DisplayIndex = 0
	}

	output, method, err := setDisplayPower(udid, mode, req.DisplayIndex)
	if err != nil {
		writeJSON(w, http.StatusOK, jsonResponse{
			"success": false,
			"error":   err.Error(),
			"output":  output,
			"method":  method,
		})
		return
	}

	writeJSON(w, http.StatusOK, jsonResponse{
		"success": true,
		"output":  output,
		"method":  method,
	})
}

var (
	pushedHelpersMutex sync.Mutex
	pushedHelpers      = make(map[string]bool)
)

func setDisplayPower(udid string, mode string, displayIndex int) (string, string, error) {
	var failures []string

	// Prioritize surfacecontrol-helper for all devices because it can power the
	// physical display without toggling Android wakefulness on ROMs that allow it.
	out, err := runDisplayPowerHelper(udid, mode, displayIndex, false)
	if err == nil {
		if mode == "on" {
			_, _ = adb.Shell(udid, "input keyevent 224 && wm dismiss-keyguard")
		}
		return out, "surfacecontrol-helper", nil
	}
	failures = append(failures, fmt.Sprintf("surfacecontrol-helper: %v", err))

	retryOut, retryErr := runDisplayPowerHelper(udid, mode, displayIndex, true)
	if retryErr == nil {
		if mode == "on" {
			_, _ = adb.Shell(udid, "input keyevent 224 && wm dismiss-keyguard")
		}
		return retryOut, "surfacecontrol-helper-repush", nil
	}
	failures = append(failures, fmt.Sprintf("surfacecontrol-helper-repush: %v", retryErr))

	// Fallback to cmd display only for sdk < 35 (Android 14 and below)
	sdkOut, _ := adb.Shell(udid, "getprop ro.build.version.sdk")
	sdk, _ := strconv.Atoi(strings.TrimSpace(sdkOut))
	if sdk < 35 {
		cmdMode := "power-off"
		if mode == "on" {
			cmdMode = "power-on"
		}
		fallbackOut, fallbackErr := adb.Shell(udid, fmt.Sprintf("cmd display %s %d", cmdMode, displayIndex))
		if fallbackErr == nil {
			return fallbackOut, "cmd-display", nil
		} else {
			failures = append(failures, fmt.Sprintf("cmd-display: %v", fallbackErr))
		}
	}

	if len(failures) > 0 {
		return out, "surfacecontrol-helper", fmt.Errorf("%s", strings.Join(failures, "; "))
	}
	return out, "surfacecontrol-helper", err
}

func runDisplayPowerHelper(udid string, mode string, displayIndex int, forcePush bool) (string, error) {
	localJar, err := filepath.Abs(filepath.Join("displaypower", "bin", "monview-display-power.jar"))
	if err != nil {
		return "", err
	}

	remoteJar := "/data/local/tmp/monview-display-power.jar"

	pushedHelpersMutex.Lock()
	alreadyPushed := pushedHelpers[udid]
	pushedHelpersMutex.Unlock()

	if forcePush || !alreadyPushed {
		if out, err := adb.Command("-s", udid, "push", localJar, remoteJar); err != nil {
			return out, fmt.Errorf("push display power helper failed: %w", err)
		}
		pushedHelpersMutex.Lock()
		pushedHelpers[udid] = true
		pushedHelpersMutex.Unlock()
	}

	cmd := fmt.Sprintf(
		"CLASSPATH=%s app_process / com.monviewphone.displaypower.DisplayPower %s %d",
		shellQuote(remoteJar),
		shellQuote(mode),
		displayIndex,
	)

	out, err := adb.Shell(udid, cmd)
	if err != nil {
		return out, fmt.Errorf("display power helper failed: %w", err)
	}
	return out, nil
}
