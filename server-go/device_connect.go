package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"server-go/adb"
)

type deviceConnectItem struct {
	Device  string `json:"device"`
	Connect string `json:"connect"`
	Port    int    `json:"port"`
}

type deviceConnectResult struct {
	Device      string `json:"device"`
	Connect     string `json:"connect"`
	Endpoint    string `json:"endpoint,omitempty"`
	UUID        string `json:"uuid,omitempty"`
	ConnectType string `json:"connect_type,omitempty"`
	Success     bool   `json:"success"`
	Error       string `json:"error,omitempty"`
}

type deviceConnectResponse struct {
	Success bool                  `json:"success"`
	Results []deviceConnectResult `json:"results"`
}

func handleDevicesConnect(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, jsonResponse{"success": false, "error": "Method not allowed"})
		return
	}

	var reqItems []deviceConnectItem
	if err := readJSON(r, &reqItems); err != nil {
		writeJSON(w, http.StatusBadRequest, jsonResponse{"success": false, "error": "Invalid JSON payload"})
		return
	}

	results := make([]deviceConnectResult, 0, len(reqItems))

	for _, item := range reqItems {
		item.Device = strings.TrimSpace(item.Device)
		item.Connect = strings.ToLower(strings.TrimSpace(item.Connect))

		if item.Device == "" {
			results = append(results, deviceConnectResult{
				Success: false,
				Error:   "Device serial cannot be empty",
			})
			continue
		}

		if item.Connect == "wifi" {
			// Do not allow connect to WiFi from an IP:PORT format
			if strings.Contains(item.Device, ":") {
				results = append(results, deviceConnectResult{
					Device:  item.Device,
					Connect: item.Connect,
					Success: false,
					Error:   "Cannot establish WiFi connection from an IP:PORT device; use USB serial",
				})
				continue
			}

			// Perform connect logic
			port := item.Port
			if port <= 0 {
				port = 5555
			}

			ip, err := getDeviceWifiIP(item.Device)
			if err != nil {
				results = append(results, deviceConnectResult{
					Device:  item.Device,
					Connect: item.Connect,
					Success: false,
					Error:   fmt.Sprintf("Failed to retrieve WiFi IP: %v", err),
				})
				continue
			}

			// adb tcpip PORT
			_, tcpipErr := adb.Command("-s", item.Device, "tcpip", strconv.Itoa(port))
			if tcpipErr != nil {
				results = append(results, deviceConnectResult{
					Device:  item.Device,
					Connect: item.Connect,
					Success: false,
					Error:   fmt.Sprintf("adb tcpip failed: %v", tcpipErr),
				})
				continue
			}

			// Sleep for stability (800ms - 1500ms)
			time.Sleep(1000 * time.Millisecond)

			endpoint := fmt.Sprintf("%s:%d", ip, port)
			_, connectErr := adb.Command("connect", endpoint)
			if connectErr != nil {
				results = append(results, deviceConnectResult{
					Device:  item.Device,
					Connect: item.Connect,
					Success: false,
					Error:   fmt.Sprintf("adb connect failed: %v", connectErr),
				})
				continue
			}

			// Verify connection
			devicesOut, devErr := adb.Command("devices")
			isOnline := false
			if devErr == nil {
				lines := strings.Split(devicesOut, "\n")
				for _, line := range lines {
					line = strings.TrimSpace(line)
					if strings.HasPrefix(line, endpoint) {
						fields := strings.Fields(line)
						if len(fields) >= 2 && fields[1] == "device" {
							isOnline = true
							break
						}
					}
				}
			}

			if !isOnline {
				results = append(results, deviceConnectResult{
					Device:  item.Device,
					Connect: item.Connect,
					Success: false,
					Error:   "Device not listed as online after adb connect",
				})
				continue
			}

			// Save mapping
			adb.WifiEndpointMu.Lock()
			adb.WifiEndpointToSerial[endpoint] = item.Device
			adb.WifiEndpointMu.Unlock()

			results = append(results, deviceConnectResult{
				Device:      item.Device,
				Connect:     item.Connect,
				Endpoint:    endpoint,
				UUID:        item.Device,
				ConnectType: "wifi",
				Success:     true,
			})

		} else if item.Connect == "usb" {
			// Disconnect WiFi if mapped
			var targetEndpoint string
			adb.WifiEndpointMu.RLock()
			for ep, ser := range adb.WifiEndpointToSerial {
				if ser == item.Device {
					targetEndpoint = ep
					break
				}
			}
			adb.WifiEndpointMu.RUnlock()

			// Also handle if the Device string itself is the IP:PORT endpoint
			if targetEndpoint == "" && strings.Contains(item.Device, ":") {
				targetEndpoint = item.Device
			}

			if targetEndpoint != "" {
				_, disconnectErr := adb.Command("disconnect", targetEndpoint)
				if disconnectErr != nil {
					log.Printf("[ADB Connect] Disconnect failed for %s: %v", targetEndpoint, disconnectErr)
				}
				// Remove mapping
				adb.WifiEndpointMu.Lock()
				delete(adb.WifiEndpointToSerial, targetEndpoint)
				adb.WifiEndpointMu.Unlock()
			}

			results = append(results, deviceConnectResult{
				Device:  item.Device,
				Connect: item.Connect,
				Success: true,
			})

		} else {
			results = append(results, deviceConnectResult{
				Device:  item.Device,
				Connect: item.Connect,
				Success: false,
				Error:   fmt.Sprintf("Unsupported connection mode: %q", item.Connect),
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(deviceConnectResponse{
		Success: true,
		Results: results,
	})
}

func getDeviceWifiIP(serial string) (string, error) {
	// Method 1: ip route get 8.8.8.8
	out, err := adb.Shell(serial, "ip route get 8.8.8.8")
	if err == nil {
		ip := parseIPRoute(out)
		if ip != "" {
			return ip, nil
		}
	}

	// Method 2: ip -f inet addr show wlan0
	out, err = adb.Shell(serial, "ip -f inet addr show wlan0")
	if err == nil {
		ip := parseIPAddrShow(out)
		if ip != "" {
			return ip, nil
		}
	}

	return "", fmt.Errorf("could not retrieve IP address via route or wlan0")
}

func parseIPRoute(output string) string {
	fields := strings.Fields(output)
	for i := 0; i < len(fields)-1; i++ {
		if fields[i] == "src" {
			return fields[i+1]
		}
	}
	return ""
}

func parseIPAddrShow(output string) string {
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "inet ") {
			fields := strings.Fields(line)
			if len(fields) >= 2 {
				ipAndSubnet := fields[1]
				parts := strings.Split(ipAndSubnet, "/")
				if len(parts) > 0 {
					return parts[0]
				}
			}
		}
	}
	return ""
}
