package websocket

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"server-go/adb"
	"strings"

	"github.com/gorilla/websocket"
)

// HandleProxyAdb implements the same logic as Node.js WebsocketProxyOverAdb:
// 1. Client connects via WS with ?action=proxy-adb&udid=XXX&remote=tcp:8886&path=/
// 2. Server calls `adb forward` to map the device's "remote" to a local TCP port
// 3. Server opens a *WebSocket client* to ws://127.0.0.1:{port}{path}
// 4. Bidirectional pipe between the two WebSockets
func HandleProxyAdb(w http.ResponseWriter, r *http.Request) {
	udid := r.URL.Query().Get("udid")
	remote := r.URL.Query().Get("remote")
	wsPath := r.URL.Query().Get("path")

	if udid == "" {
		http.Error(w, "Missing udid", http.StatusBadRequest)
		return
	}
	if remote == "" {
		remote = "tcp:8886"
	}
	if wsPath == "" {
		wsPath = "/"
	}

	// Upgrade the browser connection to WebSocket
	clientWs, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[%s] Failed to upgrade proxy connection: %v", udid, err)
		return
	}
	defer clientWs.Close()

	log.Printf("[%s] Proxy WS connected (remote=%s, path=%s)", udid, remote, wsPath)

	// Step 1: adb forward tcp:0 <remote>  →  get local port
	portStr, err := adb.Forward(udid, "tcp:0", remote)
	if err != nil {
		log.Printf("[%s] adb forward failed: %v", udid, err)
		clientWs.WriteMessage(websocket.CloseMessage,
			websocket.FormatCloseMessage(4005, fmt.Sprintf("adb forward failed: %v", err)))
		return
	}
	// portStr may already be just the number, or "tcp:NNNNN"
	port := strings.TrimPrefix(portStr, "tcp:")
	log.Printf("[%s] Forwarded %s → localhost:%s", udid, remote, port)

	// Step 2: Open a WebSocket client to the forwarded port (same as Node.js WebsocketProxy.init)
	targetUrl := url.URL{
		Scheme: "ws",
		Host:   "127.0.0.1:" + port,
		Path:   wsPath,
	}
	log.Printf("[%s] Connecting to device WS: %s", udid, targetUrl.String())

	dialer := websocket.Dialer{}
	deviceWs, _, err := dialer.Dial(targetUrl.String(), nil)
	if err != nil {
		log.Printf("[%s] Failed to dial device WS %s: %v", udid, targetUrl.String(), err)
		clientWs.WriteMessage(websocket.CloseMessage,
			websocket.FormatCloseMessage(4005, fmt.Sprintf("device WS dial failed: %v", err)))
		// Clean up the forward
		adb.RemoveForward(udid, "tcp:"+port)
		return
	}
	defer deviceWs.Close()

	log.Printf("[%s] Device WS connected, starting bidirectional pipe", udid)

	done := make(chan struct{}, 2)

	// Pipe: Browser → Device
	go func() {
		defer func() { done <- struct{}{} }()
		for {
			msgType, msg, err := clientWs.ReadMessage()
			if err != nil {
				if !isExpectedCloseError(err) {
					log.Printf("[%s] Browser→Device read error: %v", udid, err)
				}
				return
			}
			if err := deviceWs.WriteMessage(msgType, msg); err != nil {
				if !isExpectedCloseError(err) {
					log.Printf("[%s] Browser→Device write error: %v", udid, err)
				}
				return
			}
		}
	}()

	// Pipe: Device → Browser
	go func() {
		defer func() { done <- struct{}{} }()
		for {
			msgType, msg, err := deviceWs.ReadMessage()
			if err != nil {
				if !isExpectedCloseError(err) {
					log.Printf("[%s] Device→Browser read error: %v", udid, err)
				}
				return
			}
			if err := clientWs.WriteMessage(msgType, msg); err != nil {
				if !isExpectedCloseError(err) {
					log.Printf("[%s] Device→Browser write error: %v", udid, err)
				}
				return
			}
		}
	}()

	// Wait for either direction to finish
	<-done
	log.Printf("[%s] Proxy session ended", udid)
}

func isExpectedCloseError(err error) bool {
	if err == io.EOF {
		return true
	}
	return websocket.IsCloseError(err,
		websocket.CloseNormalClosure,
		websocket.CloseGoingAway,
		websocket.CloseAbnormalClosure,
	)
}
