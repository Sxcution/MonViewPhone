package websocket

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"server-go/adb"
	"server-go/scrcpy"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type deviceWsSession struct {
	port string
	ws   *websocket.Conn
}

// HandleProxyAdb implements the same logic as Node.js WebsocketProxyOverAdb:
// 1. Client connects via WS with ?action=proxy-adb&udid=XXX&remote=tcp:8886&path=/
// 2. Server calls adb forward to map the device remote to a local TCP port
// 3. Server opens a WebSocket client to ws://127.0.0.1:{port}{path}
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

	clientWs, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[%s] Failed to upgrade proxy connection: %v", udid, err)
		return
	}
	defer clientWs.Close()

	log.Printf("[%s] Proxy WS connected (remote=%s, path=%s)", udid, remote, wsPath)

	traceStart := time.Now()
	log.Printf("[%s] Stream trace: browser_ws_connected remote=%s path=%s", udid, remote, wsPath)

	session, err := connectDeviceWsWithRecovery(udid, remote, wsPath, pathRequestsRestart(wsPath))
	if err != nil {
		if remote == "tcp:8886" {
			log.Printf("[%s] ADB online but scrcpy WS not responding: %v", udid, err)
			writeProxyClose(clientWs, "ADB online but scrcpy WS not responding")
			return
		}
		log.Printf("[%s] device WS proxy failed: %v", udid, err)
		writeProxyClose(clientWs, fmt.Sprintf("device WS proxy failed: %v", err))
		return
	}

	log.Printf("[%s] Stream trace: device_ws_connected elapsed=%s local_port=%s", udid, time.Since(traceStart), session.port)

	deviceWs := session.ws
	defer deviceWs.Close()
	defer func() {
		log.Printf("[%s] Removing adb forward on port %s", udid, session.port)
		if err := adb.RemoveForward(udid, "tcp:"+session.port); err != nil {
			log.Printf("[%s] Failed to remove adb forward on port %s: %v", udid, session.port, err)
		}
	}()

	log.Printf("[%s] Device WS connected, starting bidirectional pipe", udid)

	var firstBrowserConfigOnce sync.Once
	var firstDeviceFrameOnce sync.Once

	done := make(chan struct{}, 2)
	var closeOnce sync.Once
	closeBoth := func() {
		closeOnce.Do(func() {
			_ = deviceWs.Close()
			_ = clientWs.Close()
		})
	}

	go func() {
		defer func() {
			closeBoth()
			done <- struct{}{}
		}()
		for {
			msgType, msg, err := clientWs.ReadMessage()
			if err != nil {
				if !isExpectedCloseError(err) {
					log.Printf("[%s] Browser->Device read error: %v", udid, err)
				}
				return
			}
			firstBrowserConfigOnce.Do(func() {
				log.Printf("[%s] Stream trace: first_browser_payload elapsed=%s bytes=%d type=%d",
					udid,
					time.Since(traceStart),
					len(msg),
					msgType,
				)
			})
			if err := deviceWs.SetWriteDeadline(time.Now().Add(5 * time.Second)); err != nil {
				log.Printf("[%s] Failed to set write deadline on device WS: %v", udid, err)
				return
			}
			if err := deviceWs.WriteMessage(msgType, msg); err != nil {
				if !isExpectedCloseError(err) {
					log.Printf("[%s] Browser->Device write error: %v", udid, err)
				}
				return
			}
		}
	}()

	go func() {
		defer func() {
			closeBoth()
			done <- struct{}{}
		}()
		for {
			msgType, msg, err := deviceWs.ReadMessage()
			if err != nil {
				if !isExpectedCloseError(err) {
					log.Printf("[%s] Device->Browser read error: %v", udid, err)
				}
				return
			}
			firstDeviceFrameOnce.Do(func() {
				log.Printf("[%s] Stream trace: first_device_payload elapsed=%s bytes=%d type=%d",
					udid,
					time.Since(traceStart),
					len(msg),
					msgType,
				)
			})
			if err := clientWs.SetWriteDeadline(time.Now().Add(5 * time.Second)); err != nil {
				log.Printf("[%s] Failed to set write deadline on client WS: %v", udid, err)
				return
			}
			if err := clientWs.WriteMessage(msgType, msg); err != nil {
				if !isExpectedCloseError(err) {
					log.Printf("[%s] Device->Browser write error: %v", udid, err)
				}
				return
			}
		}
	}()

	<-done
	closeBoth()
	select {
	case <-done:
	case <-time.After(2 * time.Second):
		log.Printf("[%s] Proxy session cleanup timed out waiting for peer pipe", udid)
	}
	log.Printf("[%s] Proxy session ended", udid)
}

func writeProxyClose(ws *websocket.Conn, message string) {
	_ = ws.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(4005, message))
}

func connectDeviceWsWithRecovery(udid, remote, wsPath string, restartRequested bool) (*deviceWsSession, error) {
	maxAttempts := 1
	if remote == "tcp:8886" {
		maxAttempts = 3
	}

	var lastErr error
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		if remote == "tcp:8886" {
			if err := prepareScrcpyServerForAttempt(udid, attempt, restartRequested); err != nil {
				lastErr = err
				log.Printf("[%s] scrcpy server prepare failed (attempt %d/%d): %v", udid, attempt, maxAttempts, err)
				if attempt < maxAttempts {
					log.Printf("[%s] ADB online but scrcpy WS not responding, restarting device scrcpy server", udid)
				}
				continue
			}
		}

		session, err := dialForwardedDeviceWs(udid, remote, wsPath, attempt, maxAttempts)
		if err == nil {
			return session, nil
		}
		lastErr = err
		if remote == "tcp:8886" && attempt < maxAttempts {
			log.Printf("[%s] ADB online but scrcpy WS not responding, restarting device scrcpy server", udid)
		}
	}

	if lastErr == nil {
		lastErr = fmt.Errorf("device WS dial failed")
	}
	return nil, lastErr
}

func prepareScrcpyServerForAttempt(udid string, attempt int, restartRequested bool) error {
	if attempt == 1 && !restartRequested {
		return scrcpy.EnsureServer(udid)
	}
	if attempt == 1 {
		log.Printf("[%s] restart=1 requested, restarting device scrcpy server before dial", udid)
	}
	return scrcpy.ForceRestartServer(udid)
}

func dialForwardedDeviceWs(udid, remote, wsPath string, attempt, maxAttempts int) (*deviceWsSession, error) {
	// Clean stale forwards for this device before creating a new one.
	// scrcpy-server is single-client: duplicate forwards cause "Waiting for response" stuck.
	adb.CleanForwardsForDevice(udid, remote)

	portStr, err := adb.Forward(udid, "tcp:0", remote)
	if err != nil {
		return nil, fmt.Errorf("adb forward failed (attempt %d/%d): %w", attempt, maxAttempts, err)
	}

	port := strings.TrimPrefix(strings.TrimSpace(portStr), "tcp:")
	if port == "" {
		return nil, fmt.Errorf("adb forward returned an empty local port (attempt %d/%d)", attempt, maxAttempts)
	}

	log.Printf("[%s] Forwarded %s -> localhost:%s (attempt %d/%d)", udid, remote, port, attempt, maxAttempts)

	targetURL := buildTargetURL(port, wsPath)
	log.Printf("[%s] Connecting to device WS: %s (attempt %d/%d)", udid, targetURL, attempt, maxAttempts)

	dialer := websocket.Dialer{HandshakeTimeout: 5 * time.Second}
	deviceWs, _, err := dialer.Dial(targetURL, nil)
	if err != nil {
		log.Printf("[%s] Failed to dial device WS on attempt %d/%d (local port %s): %v", udid, attempt, maxAttempts, port, err)
		removeForwardForAttempt(udid, port)
		return nil, fmt.Errorf("device WS dial failed (attempt %d/%d, local port %s): %w", attempt, maxAttempts, port, err)
	}

	return &deviceWsSession{port: port, ws: deviceWs}, nil
}

func removeForwardForAttempt(udid, port string) {
	log.Printf("[%s] Removing failed adb forward on port %s", udid, port)
	if err := adb.RemoveForward(udid, "tcp:"+port); err != nil {
		log.Printf("[%s] Failed to remove failed adb forward on port %s: %v", udid, port, err)
	}
}

func buildTargetURL(port, wsPath string) string {
	targetPath := wsPath
	targetQuery := ""
	if queryStart := strings.Index(targetPath, "?"); queryStart >= 0 {
		targetQuery = targetPath[queryStart+1:]
		targetPath = targetPath[:queryStart]
	}
	if targetPath == "" {
		targetPath = "/"
	}

	targetURL := url.URL{
		Scheme:   "ws",
		Host:     "127.0.0.1:" + port,
		Path:     targetPath,
		RawQuery: targetQuery,
	}
	return targetURL.String()
}

func pathRequestsRestart(wsPath string) bool {
	queryStart := strings.Index(wsPath, "?")
	if queryStart < 0 || queryStart+1 >= len(wsPath) {
		return false
	}
	values, err := url.ParseQuery(wsPath[queryStart+1:])
	if err != nil {
		return strings.Contains(wsPath[queryStart+1:], "restart=1")
	}
	restart := values.Get("restart")
	return restart == "1" || strings.EqualFold(restart, "true")
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
