package adb

import (
	"encoding/json"
	"log"
	"os"
	"strings"
	"sync"
	"time"
)

var (
	WifiEndpointMu     sync.RWMutex
	WifiEndpointToSerial = map[string]string{}

	persistPath string

	// resolveFailedCache : Cache endpoint da thu resolve nhung that bai, tranh spam getprop moi 2s
	resolveFailedMu    sync.Mutex
	resolveFailedCache = map[string]time.Time{}
	resolveRetryAfter  = 30 * time.Second
)

// InitWifiMappingPersistence : Khoi tao persistence, load mapping tu disk
func InitWifiMappingPersistence(path string) {
	persistPath = path
	loadFromDisk()
	log.Printf("[wifi-mapping] loaded %d persisted endpoint mappings from %s", len(WifiEndpointToSerial), path)
}

func RememberWifiEndpoint(endpoint string, serial string) {
	WifiEndpointMu.Lock()
	defer WifiEndpointMu.Unlock()
	if endpoint == "" || serial == "" {
		return
	}
	WifiEndpointToSerial[endpoint] = serial
	saveToDisk()
}

func ForgetWifiEndpoint(endpoint string) {
	WifiEndpointMu.Lock()
	defer WifiEndpointMu.Unlock()
	delete(WifiEndpointToSerial, endpoint)
	saveToDisk()

	// Xoa khoi failed cache neu co
	resolveFailedMu.Lock()
	delete(resolveFailedCache, endpoint)
	resolveFailedMu.Unlock()
}

func SerialForWifiEndpoint(endpoint string) (string, bool) {
	WifiEndpointMu.RLock()
	defer WifiEndpointMu.RUnlock()
	serial, ok := WifiEndpointToSerial[endpoint]
	return serial, ok && serial != ""
}

func WifiEndpointForSerial(serial string) (string, bool) {
	WifiEndpointMu.RLock()
	defer WifiEndpointMu.RUnlock()
	for endpoint, mappedSerial := range WifiEndpointToSerial {
		if mappedSerial == serial {
			return endpoint, true
		}
	}
	return "", false
}

// ResolveWifiSerial : Tim serial goc cho WiFi endpoint
// Uu tien mapping RAM, neu chua co thi chay adb getprop
func ResolveWifiSerial(endpoint string) (string, bool) {
	// 1. Check in-memory map
	if serial, ok := SerialForWifiEndpoint(endpoint); ok {
		return serial, true
	}

	// 2. Check failed cache de tranh spam
	resolveFailedMu.Lock()
	if failedAt, ok := resolveFailedCache[endpoint]; ok {
		if time.Since(failedAt) < resolveRetryAfter {
			resolveFailedMu.Unlock()
			return "", false
		}
		// Het thoi gian retry, xoa cache va thu lai
		delete(resolveFailedCache, endpoint)
	}
	resolveFailedMu.Unlock()

	// 3. Chay adb getprop de tim serial goc
	serial := resolveSerialViaGetprop(endpoint)
	if serial == "" {
		// Luu vao failed cache
		resolveFailedMu.Lock()
		resolveFailedCache[endpoint] = time.Now()
		resolveFailedMu.Unlock()
		log.Printf("[wifi-mapping] failed to resolve serial for endpoint %s", endpoint)
		return "", false
	}

	// 4. Luu mapping va persist
	log.Printf("[wifi-mapping] resolved endpoint %s -> serial %s via getprop", endpoint, serial)
	RememberWifiEndpoint(endpoint, serial)
	return serial, true
}

// resolveSerialViaGetprop : Chay cac lenh getprop de tim serial goc cua thiet bi
func resolveSerialViaGetprop(endpoint string) string {
	props := []string{
		"ro.serialno",
		"ro.boot.serialno",
		"ro.product.serial",
	}
	for _, prop := range props {
		out, err := Shell(endpoint, "getprop "+prop)
		if err != nil {
			continue
		}
		serial := strings.TrimSpace(out)
		// Serial hop le: khong rong, khong chua ':', khong phai "unknown"
		if serial != "" && !strings.Contains(serial, ":") && serial != "unknown" {
			return serial
		}
	}
	return ""
}

// saveToDisk : Ghi mapping ra file JSON (goi trong lock)
func saveToDisk() {
	if persistPath == "" {
		return
	}
	data, err := json.MarshalIndent(WifiEndpointToSerial, "", "  ")
	if err != nil {
		log.Printf("[wifi-mapping] failed to marshal mappings: %v", err)
		return
	}
	if err := os.WriteFile(persistPath, data, 0644); err != nil {
		log.Printf("[wifi-mapping] failed to save mappings to %s: %v", persistPath, err)
	}
}

// loadFromDisk : Doc mapping tu file JSON
func loadFromDisk() {
	if persistPath == "" {
		return
	}
	data, err := os.ReadFile(persistPath)
	if err != nil {
		if !os.IsNotExist(err) {
			log.Printf("[wifi-mapping] failed to read mappings from %s: %v", persistPath, err)
		}
		return
	}
	var loaded map[string]string
	if err := json.Unmarshal(data, &loaded); err != nil {
		log.Printf("[wifi-mapping] failed to parse mappings from %s: %v", persistPath, err)
		return
	}
	WifiEndpointMu.Lock()
	defer WifiEndpointMu.Unlock()
	for endpoint, serial := range loaded {
		if endpoint != "" && serial != "" {
			WifiEndpointToSerial[endpoint] = serial
		}
	}
}
