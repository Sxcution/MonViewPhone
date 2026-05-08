package websocket

import (
	"log"
	"net/http"
	"server-go/adb"
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
			log.Printf("Device list WS write error: %v", err)
			break
		}

		time.Sleep(2 * time.Second)
	}
}
