package websocket

import (
	"log"
	"net/http"
	"server-go/adb"
	"strings"
	"sync"
	"time"
)

type DeviceDescriptor struct {
	Udid         string `json:"udid"`
	State        string `json:"state"`
	Model        string `json:"ro.product.model,omitempty"`
	Manufacturer string `json:"ro.product.manufacturer,omitempty"`
	Release      string `json:"ro.build.version.release,omitempty"`
	Sdk          string `json:"ro.build.version.sdk,omitempty"`
	Board        string `json:"ro.product.board,omitempty"`
	Platform     string `json:"ro.board.platform,omitempty"`
}

var (
	devicePropCache sync.Map // map[string]map[string]string
)

func getDeviceProperties(udid string) map[string]string {
	if val, ok := devicePropCache.Load(udid); ok {
		return val.(map[string]string)
	}

	props := make(map[string]string)
	devicePropCache.Store(udid, props)

	go func() {
		fetched := make(map[string]string)
		keys := []string{
			"ro.product.model",
			"ro.product.manufacturer",
			"ro.build.version.release",
			"ro.build.version.sdk",
			"ro.product.board",
			"ro.board.platform",
		}
		for _, key := range keys {
			out, err := adb.Shell(udid, "getprop "+key)
			if err == nil {
				fetched[key] = strings.TrimSpace(out)
			}
		}
		devicePropCache.Store(udid, fetched)
	}()

	return props
}

// EvictStaleDeviceProps removes cached properties for devices no longer in the active set.
// Call this periodically from the cleanup goroutine in main.go.
func EvictStaleDeviceProps(activeUdids map[string]bool) {
	devicePropCache.Range(func(key, value any) bool {
		udid := key.(string)
		if !activeUdids[udid] {
			devicePropCache.Delete(udid)
			log.Printf("[Cleanup] Evicted stale devicePropCache entry for %s", udid)
		}
		return true
	})
}

type DeviceListEvent struct {
	List []DeviceDescriptor `json:"list"`
	Id   string             `json:"id"`
	Name string             `json:"name"`
}

type TrackerMessage struct {
	Id   int64           `json:"id"`
	Type string          `json:"type"`
	Data DeviceListEvent `json:"data"`
}

type SimpleDevicePayload struct {
	Device       string `json:"device"`
	StatusRecodd string `json:"status_recodd"`
	IPv4         string `json:"ipv4"`
	UUID         string `json:"uuid"`
	ConnectType  string `json:"connect_type"`
}

func physicalUUIDForDevice(id string, connectType string) string {
	if connectType != "wifi" {
		return id
	}
	if serial, ok := adb.ResolveWifiSerial(id); ok {
		return serial
	}
	return id
}

func simpleDevicePayloads(tracker *adb.Tracker) []SimpleDevicePayload {
	devices := tracker.GetDevices()
	payloads := make([]SimpleDevicePayload, 0, len(devices))
	for id, dev := range devices {
		if dev.Status != adb.StatusOnline {
			continue
		}
		connectType := "usb"
		ipv4 := ""
		if len(id) > 0 {
			for i := 0; i < len(id); i++ {
				if id[i] == ':' {
					connectType = "wifi"
					ipv4 = id[:i]
					break
				}
			}
		}
		uuid := physicalUUIDForDevice(id, connectType)

		// Khong emit WiFi endpoint chua resolve duoc serial goc
		if connectType == "wifi" && strings.Contains(uuid, ":") {
			log.Printf("[devices-list] skipped unmapped wifi endpoint %s", id)
			continue
		}

		payloads = append(payloads, SimpleDevicePayload{
			Device:       id,
			StatusRecodd: "stop",
			IPv4:         ipv4,
			UUID:         uuid,
			ConnectType:  connectType,
		})
	}
	return payloads
}

func HandleSimpleDevicesList(w http.ResponseWriter, r *http.Request, tracker *adb.Tracker) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade devices-list connection: %v", err)
		return
	}
	defer ws.Close()

	// Read loop: required by gorilla/websocket to handle ping/pong/close frames
	readDone := make(chan struct{})
	go func() {
		defer close(readDone)
		for {
			if _, _, err := ws.ReadMessage(); err != nil {
				return
			}
		}
	}()

	for {
		select {
		case <-readDone:
			return
		default:
		}
		if err := ws.WriteJSON(simpleDevicePayloads(tracker)); err != nil {
			if !isExpectedCloseError(err) && !isClientDisconnect(err) {
				log.Printf("Devices-list WS write error: %v", err)
			}
			break
		}
		time.Sleep(2 * time.Second)
	}
}

func HandleDeviceList(w http.ResponseWriter, r *http.Request, tracker *adb.Tracker) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade device-list connection: %v", err)
		return
	}
	defer ws.Close()

	// Read loop: required by gorilla/websocket to handle ping/pong/close frames
	readDone := make(chan struct{})
	go func() {
		defer close(readDone)
		for {
			if _, _, err := ws.ReadMessage(); err != nil {
				return
			}
		}
	}()

	// Simple polling loop for now. In a real app we'd use channels to subscribe to tracker changes.
	for {
		select {
		case <-readDone:
			return
		default:
		}
		devices := tracker.GetDevices()
		var descList []DeviceDescriptor
		for id, dev := range devices {
			props := getDeviceProperties(id)
			descList = append(descList, DeviceDescriptor{
				Udid:         id,
				State:        string(dev.Status),
				Model:        props["ro.product.model"],
				Manufacturer: props["ro.product.manufacturer"],
				Release:      props["ro.build.version.release"],
				Sdk:          props["ro.build.version.sdk"],
				Board:        props["ro.product.board"],
				Platform:     props["ro.board.platform"],
			})
		}

		msg := TrackerMessage{
			Id:   time.Now().UnixNano() / int64(time.Millisecond),
			Type: "devicelist",
			Data: DeviceListEvent{
				List: descList,
				Id:   "server-go",
				Name: "Go Backend",
			},
		}

		err = ws.WriteJSON(msg)
		if err != nil {
			if !isExpectedCloseError(err) && !isClientDisconnect(err) {
				log.Printf("Device list WS write error: %v", err)
			}
			break
		}

		time.Sleep(2 * time.Second)
	}
}

func isClientDisconnect(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "use of closed network connection") ||
		strings.Contains(msg, "connection reset by peer") ||
		strings.Contains(msg, "connection was aborted") ||
		strings.Contains(msg, "broken pipe")
}
