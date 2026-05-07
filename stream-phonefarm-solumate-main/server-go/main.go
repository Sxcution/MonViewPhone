package main

import (
	"log"
	"net/http"
	"server-go/adb"
	"server-go/websocket"
)

func main() {
	log.Println("Starting Solumate Go Backend...")

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
