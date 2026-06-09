package main

import (
	"log"
	"net/http"
	"os"
	"os/exec"
	"server-go/adb"
	"server-go/websocket"
	"time"
)

// warmUpAdb đảm bảo adb server đã sẵn sàng trước khi server Go nhận kết nối
func warmUpAdb() {
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

func main() {
	log.Println("Starting MonViewPhone Go Backend...")

	// Warm up ADB trước khi làm gì khác
	warmUpAdb()

	// Start ADB Tracker
	tracker := adb.NewTracker()
	tracker.Start()

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

		switch r.URL.Path {
		case "/api/goog/device/user-profiles":
			handleUserProfiles(w, r)
			return
		case "/api/goog/device/adb-command":
			handleAdbCommand(w, r)
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
		case "/api/goog/device/set-wallpaper":
			handleSetWallpaper(w, r)
			return
		case "/api/goog/device/display-power":
			handleDisplayPower(w, r)
			return
		}

		action := r.URL.Query().Get("action")
		switch action {
		case "proxy-adb":
			websocket.HandleProxyAdb(w, r)
		case "devices-list":
			websocket.HandleSimpleDevicesList(w, r, tracker)
		case "goog-device-list":
			websocket.HandleDeviceList(w, r, tracker)
		default:
			// Fallback simple message for REST
			w.Write([]byte("MonViewPhone Go Backend is running! Action: " + action))
		}
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
