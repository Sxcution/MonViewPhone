package main

import (
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"server-go/adb"
	"server-go/scrcpy"
	"server-go/websocket"
	"strings"
	"time"
)

var userProfileEnv = "%USERPROFILE%"

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	if err != nil {
		return err
	}
	return out.Sync()
}

func fileExists(filename string) bool {
	info, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return false
	}
	return !info.IsDir()
}

func ensureAdbKeys() {
	log.Println("[ADB] Checking ADB keys...")

	// 1. Get %USERPROFILE%\.android
	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Printf("[ADB] Failed to get user home directory: %v", err)
		return
	}
	androidDir := filepath.Join(homeDir, ".android")
	androidKey := filepath.Join(androidDir, "adbkey")
	androidPub := filepath.Join(androidDir, "adbkey.pub")

	// 2. Get project root Backup/adb
	exePath, err := os.Executable()
	if err != nil {
		exePath = "."
	}
	projectRoot := filepath.Dir(filepath.Dir(exePath))
	backupDir := filepath.Join(projectRoot, "Backup", "adb")
	backupKey := filepath.Join(backupDir, "adbkey")
	backupPub := filepath.Join(backupDir, "adbkey.pub")

	// 3. Get xiaowei backup dir
	xiaoweiDir := `C:\Program Files (x86)\xiaowei\backup`
	xiaoweiKey := filepath.Join(xiaoweiDir, "adbkey")
	xiaoweiPub := filepath.Join(xiaoweiDir, "adbkey.pub")

	// Checking and copying flow
	androidKeyExists := fileExists(androidKey)
	backupKeyExists := fileExists(backupKey)
	xiaoweiKeyExists := fileExists(xiaoweiKey)

	if androidKeyExists {
		// Scenario A: Copy from %USERPROFILE%\.android to Backup/adb
		log.Println("[ADB] Found key in " + userProfileEnv + "\\.android. Ensuring project Backup...")
		if err := os.MkdirAll(backupDir, 0755); err != nil {
			log.Printf("[ADB] Failed to create backup directory: %v", err)
			return
		}

		// Copy key
		if err := copyFile(androidKey, backupKey); err != nil {
			log.Printf("[ADB] Failed to backup adbkey: %v", err)
		} else {
			log.Println("[ADB] Successfully backed up adbkey to Backup/adb")
		}

		// Copy pub
		if fileExists(androidPub) {
			if err := copyFile(androidPub, backupPub); err != nil {
				log.Printf("[ADB] Failed to backup adbkey.pub: %v", err)
			} else {
				log.Println("[ADB] Successfully backed up adbkey.pub to Backup/adb")
			}
		}
	} else if backupKeyExists {
		// Scenario B: Restore from Backup/adb to %USERPROFILE%\.android
		log.Println("[ADB] Key missing in " + userProfileEnv + "\\.android but exists in project Backup. Restoring...")
		if err := os.MkdirAll(androidDir, 0755); err != nil {
			log.Printf("[ADB] Failed to create .android directory: %v", err)
			return
		}

		// Copy key
		if err := copyFile(backupKey, androidKey); err != nil {
			log.Printf("[ADB] Failed to restore adbkey: %v", err)
		} else {
			log.Println("[ADB] Successfully restored adbkey to " + userProfileEnv + "\\.android")
		}

		// Copy pub
		if fileExists(backupPub) {
			if err := copyFile(backupPub, androidPub); err != nil {
				log.Printf("[ADB] Failed to restore adbkey.pub: %v", err)
			} else {
				log.Println("[ADB] Successfully restored adbkey.pub to " + userProfileEnv + "\\.android")
			}
		}
	} else if xiaoweiKeyExists {
		// Scenario C: Both missing, but xiaowei backup key exists. Sync from xiaowei to both.
		log.Println("[ADB] Keys missing in both locations but found in xiaowei backup. Syncing from xiaowei...")

		// Ensure both dirs exist
		if err := os.MkdirAll(backupDir, 0755); err != nil {
			log.Printf("[ADB] Failed to create backup directory: %v", err)
		}
		if err := os.MkdirAll(androidDir, 0755); err != nil {
			log.Printf("[ADB] Failed to create .android directory: %v", err)
		}

		// Copy key to backup
		if err := copyFile(xiaoweiKey, backupKey); err != nil {
			log.Printf("[ADB] Failed to copy xiaowei adbkey to backup: %v", err)
		} else {
			log.Println("[ADB] Successfully copied xiaowei adbkey to Backup/adb")
		}

		// Copy key to .android
		if err := copyFile(xiaoweiKey, androidKey); err != nil {
			log.Printf("[ADB] Failed to copy xiaowei adbkey to .android: %v", err)
		} else {
			log.Println("[ADB] Successfully copied xiaowei adbkey to " + userProfileEnv + "\\.android")
		}

		// Copy pub to backup
		if fileExists(xiaoweiPub) {
			if err := copyFile(xiaoweiPub, backupPub); err != nil {
				log.Printf("[ADB] Failed to copy xiaowei adbkey.pub to backup: %v", err)
			} else {
				log.Println("[ADB] Successfully copied xiaowei adbkey.pub to Backup/adb")
			}

			// Copy pub to .android
			if err := copyFile(xiaoweiPub, androidPub); err != nil {
				log.Printf("[ADB] Failed to copy xiaowei adbkey.pub to .android: %v", err)
			} else {
				log.Println("[ADB] Successfully copied xiaowei adbkey.pub to " + userProfileEnv + "\\.android")
			}
		}
	} else {
		log.Println("[ADB] No existing keys found in target, project backup, or xiaowei backup.")
	}
}

// warmUpAdb đảm bảo adb server đã sẵn sàng trước khi server Go nhận kết nối
func warmUpAdb() {
	// Khôi phục/Sao lưu ADB Keys trước khi chạy start-server
	ensureAdbKeys()

	log.Println("[ADB] Warming up adb server...")
	for i := 0; i < 5; i++ {
		cmd := exec.Command(adb.GetAdbPath(), "start-server")
		err := cmd.Run()
		if err == nil {
			log.Println("[ADB] adb server ready.")
			return
		}
		log.Printf("[ADB] adb start-server attempt %d failed: %v, retrying...", i+1, err)
		time.Sleep(2 * time.Second)
	}
	log.Println("[ADB] Warning: adb server may not be ready, continuing anyway.")
}

func findDistDir() string {
	wd, err := os.Getwd()
	if err == nil {
		path := filepath.Join(wd, "client", "dist")
		if fileExists(filepath.Join(path, "index.html")) {
			return path
		}
		path = filepath.Join(wd, "..", "client", "dist")
		if fileExists(filepath.Join(path, "index.html")) {
			return path
		}
	}

	exePath, err := os.Executable()
	if err == nil {
		exeDir := filepath.Dir(exePath)
		path := filepath.Join(exeDir, "client", "dist")
		if fileExists(filepath.Join(path, "index.html")) {
			return path
		}
		path = filepath.Join(exeDir, "..", "client", "dist")
		if fileExists(filepath.Join(path, "index.html")) {
			return path
		}
	}

	return ""
}

func main() {
	log.Println("Starting MonViewPhone Go Backend...")

	// Warm up ADB trước khi làm gì khác
	warmUpAdb()

	// Load WiFi endpoint -> serial mapping tu disk
	adb.InitWifiMappingPersistence("wifi_mapping.json")

	// Start ADB Tracker
	tracker := adb.NewTracker()
	tracker.Start()

	// Wait a moment for tracker to poll devices first
	time.Sleep(500 * time.Millisecond)

	// Clean up stale ADB forwards on startup
	adb.CleanAllForwards()

	// Clean up existing scrcpy servers
	scrcpy.CleanAllMonViewPhoneServers(tracker)

	// Clean up old uploaded APK files at startup
	CleanOldUploads()

	// Start periodic cleanup goroutine (every 5 minutes):
	// evicts stale sync.Map entries and cleans old uploads
	go func() {
		for {
			time.Sleep(5 * time.Minute)
			devices := tracker.GetDevices()
			activeUdids := make(map[string]bool, len(devices))
			for id, dev := range devices {
				if dev.Status == adb.StatusOnline {
					activeUdids[id] = true
				}
			}
			log.Printf("[Cleanup] Running periodic cleanup (%d active devices)", len(activeUdids))
			websocket.EvictStaleDeviceProps(activeUdids)
			scrcpy.CleanDeviceLocks(activeUdids)
			CleanPushedHelpers(activeUdids)
			CleanOldUploads()
			// NOTE: adb.CleanAllForwards() is NOT called here — it would kill active streams.
			// It only runs at startup when no streams are connected.
		}
	}()

	// Cache findDistDir() once at startup
	cachedDistDir := findDistDir()
	if cachedDistDir != "" {
		log.Printf("Frontend dist dir: %s", cachedDistDir)
	} else {
		log.Println("Warning: Frontend dist dir not found. Run 'cd client && npm run build'")
	}

	// Setup HTTP handler with action query param router
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-UDID, X-Filename, X-File-Size, X-Remote-Path")
		w.Header().Set("Access-Control-Expose-Headers", "Content-Disposition, Content-Length")
		w.Header().Set("X-MonViewPhone-Backend", "server-go")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.URL.Path == "/healthz" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"ok":true,"backend":"server-go"}`))
			return
		}

		// Route APIs explicitly
		if strings.HasPrefix(r.URL.Path, "/api/") {
			switch r.URL.Path {
			case "/api/devices/connect":
				handleDevicesConnect(w, r)
				return
			case "/api/goog/device/user-profiles":
				handleUserProfiles(w, r)
				return
			case "/api/goog/device/adb-command":
				handleAdbCommand(w, r)
				return
			case "/api/goog/device/sync-clipboard-to-pc":
				handleSyncPhoneClipboardToPC(w, r)
				return
			case "/api/goog/device/install-apk-binary":
				handleInstallApkBinary(w, r)
				return
			case "/api/goog/device/install-uploaded":
				handleInstallUploaded(w, r)
				return
			case "/api/goog/device/install-apk-user":
				handleInstallApkUser(w, r)
				return
			case "/api/goog/device/push-file":
				handlePushFile(w, r)
				return
			case "/api/goog/device/pull-file":
				handlePullFile(w, r)
				return
			case "/api/goog/device/settings":
				handleSettings(w, r)
				return
			case "/api/goog/device/order":
				handleDeviceOrder(w, r)
				return
			case "/api/goog/device/account-vault":
				handleAccountVault(w, r)
				return
			case "/api/goog/device/display-power":
				handleDisplayPower(w, r)
				return
			case "/api/goog/pc/open-file-dialog":
				handleOpenFileDialog(w, r)
				return
			case "/api/goog/device/push-local-file":
				handlePushLocalFile(w, r)
				return
			default:
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusNotFound)
				w.Write([]byte(`{"success":false,"error":"API route not found"}`))
				return
			}
		}

		// Route actions
		action := r.URL.Query().Get("action")
		if action != "" {
			switch action {
			case "proxy-adb":
				websocket.HandleProxyAdb(w, r)
				return
			case "devices-list":
				websocket.HandleSimpleDevicesList(w, r, tracker)
				return
			case "goog-device-list":
				websocket.HandleDeviceList(w, r, tracker)
				return
			default:
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(`{"success":false,"error":"Invalid action: ` + action + `"}`))
				return
			}
		}

		// Serve static frontend
		w.Header().Set("Cache-Control", "no-store, max-age=0")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")

		distDir := cachedDistDir
		if distDir == "" {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`<html><body style="font-family: sans-serif; padding: 50px; background: #111; color: #eee; text-align: center;">` +
				`<h2 style="color: #e53e3e;">Frontend build not found</h2>` +
				`<p>Please build the frontend by running:</p>` +
				`<code style="background: #222; padding: 10px; border-radius: 4px; display: inline-block; color: #f6ad55; font-size: 16px;">cd client && npm run build</code>` +
				`</body></html>`))
			return
		}

		cleanPath := filepath.Clean(r.URL.Path)
		targetFile := filepath.Join(distDir, cleanPath)
		if strings.HasPrefix(targetFile, distDir) {
			if info, err := os.Stat(targetFile); err == nil && !info.IsDir() {
				http.ServeFile(w, r, targetFile)
				return
			}
		}

		// SPA Fallback
		http.ServeFile(w, r, filepath.Join(distDir, "index.html"))
	})

	portValue := os.Getenv("MONVIEWPHONE_GO_PORT")
	if portValue == "" {
		portValue = os.Getenv("PORT")
	}
	if portValue == "" {
		portValue = "11000"
	}
	port := portValue
	if port[0] != ':' {
		port = ":" + port
	}
	log.Printf("Server listening on port %s", port)

	err := http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
