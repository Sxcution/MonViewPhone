package adb

import (
	"log"
	"os/exec"
	"strings"
	"sync"
	"time"
)

type DeviceStatus string

const (
	StatusOnline       DeviceStatus = "device"
	StatusOffline      DeviceStatus = "offline"
	StatusUnauthorized DeviceStatus = "unauthorized"
)

type Device struct {
	ID     string
	Status DeviceStatus
}

type Tracker struct {
	devices map[string]Device
	mu      sync.RWMutex
}

func NewTracker() *Tracker {
	return &Tracker{
		devices: make(map[string]Device),
	}
}

func (t *Tracker) GetDevices() map[string]Device {
	t.mu.RLock()
	defer t.mu.RUnlock()
	
	// Return a copy to avoid race conditions
	copy := make(map[string]Device)
	for k, v := range t.devices {
		copy[k] = v
	}
	return copy
}

func (t *Tracker) Start() {
	log.Println("Starting ADB Device Tracker...")
	go func() {
		for {
			t.pollDevices()
			time.Sleep(2 * time.Second)
		}
	}()
}

func (t *Tracker) pollDevices() {
	cmd := exec.Command("adb", "devices")
	output, err := cmd.Output()
	if err != nil {
		log.Printf("ADB command failed (is adb installed and in PATH?): %v", err)
		return
	}

	lines := strings.Split(string(output), "\n")
	currentDevices := make(map[string]Device)

	// skip first line "List of devices attached"
	for i := 1; i < len(lines); i++ {
		line := strings.TrimSpace(lines[i])
		if line == "" {
			continue
		}

		parts := strings.Fields(line)
		if len(parts) >= 2 {
			id := parts[0]
			status := DeviceStatus(parts[1])
			
			device := Device{ID: id, Status: status}
			currentDevices[id] = device

			t.mu.RLock()
			_, exists := t.devices[id]
			t.mu.RUnlock()

			if !exists {
				log.Printf("[ADB Tracker] Device connected: %s (Status: %s)", id, status)
			}
		}
	}

	// Check for disconnected devices
	t.mu.RLock()
	for id := range t.devices {
		if _, exists := currentDevices[id]; !exists {
			log.Printf("[ADB Tracker] Device disconnected: %s", id)
		}
	}
	t.mu.RUnlock()

	t.mu.Lock()
	t.devices = currentDevices
	t.mu.Unlock()
}

