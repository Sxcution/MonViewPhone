package websocket

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for dev
	},
}

// HandleConnections manages incoming WebSocket requests
func HandleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}
	defer ws.Close()

	log.Printf("Client connected from %v", r.RemoteAddr)

	for {
		var msg map[string]interface{}
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("Error reading json: %v", err)
			break
		}

		log.Printf("Received message: %v", msg)

		// Echo back for now
		err = ws.WriteJSON(msg)
		if err != nil {
			log.Printf("Error writing json: %v", err)
			break
		}
	}
}
