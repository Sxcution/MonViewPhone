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
	Udid  string `json:"udid"`
	State string `json:"state"`
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

var wifiDeviceUUIDCache sync.Map

func physicalUUIDForDevice(id string, connectType string) string {
	if connectType != "wifi" {
		return id
	}
	adb.WifiEndpointMu.RLock()
	serial, exists := adb.WifiEndpointToSerial[id]
	adb.WifiEndpointMu.RUnlock()
	if exists && serial != "" {
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
		payloads = append(payloads, SimpleDevicePayload{
			Device:       id,
			StatusRecodd: "stop",
			IPv4:         ipv4,
			UUID:         physicalUUIDForDevice(id, connectType),
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

	for {
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

	// Simple polling loop for now. In a real app we'd use channels to subscribe to tracker changes.
	for {
		devices := tracker.GetDevices()
		var descList []DeviceDescriptor
		for id, dev := range devices {
			descList = append(descList, DeviceDescriptor{
				Udid:  id,
				State: string(dev.Status),
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
