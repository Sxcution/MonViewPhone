package main

import (
	"fmt"
	"net"
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
		results = append(results, handleDeviceConnectItem(item))
	}

	writeJSON(w, http.StatusOK, jsonResponse{
		"success": true,
		"results": results,
	})
}

func handleDeviceConnectItem(item deviceConnectItem) deviceConnectResult {
	item.Device = strings.TrimSpace(item.Device)
	item.Connect = strings.ToLower(strings.TrimSpace(item.Connect))
	if item.Connect == "adb" {
		item.Connect = "usb"
	}

	result := deviceConnectResult{
		Device:  item.Device,
		Connect: item.Connect,
		UUID:    item.Device,
	}

	if item.Device == "" {
		result.Success = false
		result.Error = "device is required"
		return result
	}

	switch item.Connect {
	case "wifi":
		return connectDeviceWifi(item, result)
	case "usb":
		return disconnectDeviceWifi(item, result)
	default:
		result.Success = false
		result.Error = fmt.Sprintf("unsupported connection mode: %q", item.Connect)
		return result
	}
}

func connectDeviceWifi(item deviceConnectItem, result deviceConnectResult) deviceConnectResult {
	if strings.Contains(item.Device, ":") {
		result.Success = false
		result.Error = "wifi connect requires a USB serial, not an ip:port endpoint"
		return result
	}

	port := item.Port
	if port <= 0 {
		port = 5555
	}
	if port < 1 || port > 65535 {
		result.Success = false
		result.Error = "invalid tcpip port"
		return result
	}

	ip, err := getDeviceWifiIP(item.Device)
	if err != nil {
		result.Success = false
		result.Error = err.Error()
		return result
	}

	if _, err := adb.Command("-s", item.Device, "tcpip", strconv.Itoa(port)); err != nil {
		result.Success = false
		result.Error = fmt.Sprintf("adb tcpip failed: %v", err)
		return result
	}

	time.Sleep(1100 * time.Millisecond)

	endpoint := net.JoinHostPort(ip, strconv.Itoa(port))
	result.Endpoint = endpoint
	if _, err := adb.Command("connect", endpoint); err != nil {
		result.Success = false
		result.Error = fmt.Sprintf("adb connect failed: %v", err)
		return result
	}

	if !isAdbDeviceOnline(endpoint) {
		result.Success = false
		result.Error = "wifi endpoint is not online after adb connect"
		return result
	}

	adb.RememberWifiEndpoint(endpoint, item.Device)
	result.ConnectType = "wifi"
	result.Success = true
	return result
}

func disconnectDeviceWifi(item deviceConnectItem, result deviceConnectResult) deviceConnectResult {
	endpoint := ""
	if strings.Contains(item.Device, ":") {
		endpoint = item.Device
		if serial, ok := adb.SerialForWifiEndpoint(endpoint); ok {
			result.UUID = serial
		}
	} else if mappedEndpoint, ok := adb.WifiEndpointForSerial(item.Device); ok {
		endpoint = mappedEndpoint
	}

	if endpoint != "" {
		_, _ = adb.Command("disconnect", endpoint)
		adb.ForgetWifiEndpoint(endpoint)
		result.Endpoint = endpoint
	}

	result.ConnectType = "usb"
	result.Success = true
	return result
}

func getDeviceWifiIP(serial string) (string, error) {
	out, err := adb.CommandTimeout(5*time.Second, "-s", serial, "shell", "ip", "route", "get", "8.8.8.8")
	if err == nil {
		if ip := parseIPRouteSource(out); ip != "" {
			return ip, nil
		}
	}

	out, err = adb.CommandTimeout(5*time.Second, "-s", serial, "shell", "ip", "-f", "inet", "addr", "show", "wlan0")
	if err == nil {
		if ip := parseInetAddress(out); ip != "" {
			return ip, nil
		}
	}

	return "", fmt.Errorf("could not find WiFi IP for %s", serial)
}

func parseIPRouteSource(output string) string {
	fields := strings.Fields(output)
	for i := 0; i < len(fields)-1; i++ {
		if fields[i] == "src" {
			if ip := parseIPv4(fields[i+1]); ip != "" {
				return ip
			}
		}
	}
	return ""
}

func parseInetAddress(output string) string {
	for _, line := range strings.Split(output, "\n") {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "inet ") {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}
		ip, _, err := net.ParseCIDR(fields[1])
		if err == nil && ip != nil {
			if ipv4 := ip.To4(); ipv4 != nil {
				return ipv4.String()
			}
		}
	}
	return ""
}

func parseIPv4(value string) string {
	ip := net.ParseIP(value)
	if ip == nil {
		return ""
	}
	ipv4 := ip.To4()
	if ipv4 == nil {
		return ""
	}
	return ipv4.String()
}

func isAdbDeviceOnline(device string) bool {
	out, err := adb.CommandTimeout(5*time.Second, "devices")
	if err != nil {
		return false
	}
	for _, line := range strings.Split(out, "\n") {
		fields := strings.Fields(strings.TrimSpace(line))
		if len(fields) >= 2 && fields[0] == device && fields[1] == "device" {
			return true
		}
	}
	return false
}
