package websocket

import (
	"log"
	"net/http"
)

func HandleProxyScrcpyRaw(w http.ResponseWriter, r *http.Request) {
	udid := r.URL.Query().Get("udid")
	if udid == "" {
		http.Error(w, "Missing udid", http.StatusBadRequest)
		return
	}

	clientWs, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[%s] Failed to upgrade raw proxy connection: %v", udid, err)
		return
	}
	defer clientWs.Close()

	log.Printf("[%s] raw-v2 stream requested but not implemented yet", udid)
	writeProxyClose(clientWs, "raw-v2 stream not implemented yet")
}
