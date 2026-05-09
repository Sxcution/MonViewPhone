package main

import (
	"log"
	"net/http"
	"os/exec"
	"server-go/adb"
	"server-go/websocket"
	"time"
)

// warmUpAdb đảm bảo adb server đã sẵn sàng trước khi server Go nhận kết nối
func warmUpAdb() {
	log.Println("[ADB] Warming up adb server...")
	for i := 0; i < 5; i++ {
		cmd := exec.Command("adb", "start-server")
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
	log.Println("Starting Solumate Go Backend...")

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
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		action := r.URL.Query().Get("action")
		switch action {
		case "proxy-adb":
			websocket.HandleProxyAdb(w, r)
		case "goog-device-list":
			websocket.HandleDeviceList(w, r, tracker)
		default:
			// Fallback simple message for REST
			w.Write([]byte("Solumate Go Backend is running! Action: " + action))
		}
	})

	port := ":11000"
	log.Printf("Server listening on port %s", port)

	err := http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
