package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os/exec"
	"regexp"
	"server-go/adb"
	"strconv"
	"strings"
	"sync"
	"time"
)

const monhelperWechatListener = "com.monviewphone.mediaimport/.WechatNotificationListener"

var (
	monhelperUserRE  = regexp.MustCompile(`UserInfo\{(\d+):([^:}]*)`)
	monhelperEventRE = regexp.MustCompile(
		`\bHELPER_V5\s+(WECHAT_POSTED|WECHAT_ACTIVE)\s+eventId=(\S+)\s+user=(\d+)\s+key=(\S+)\s+title=(.*?)\s+text=(.*)$`)
	monhelperRemovedRE = regexp.MustCompile(
		`\bHELPER_V5\s+WECHAT_REMOVED\s+user=(\d+)\s+key=(\S+)\s*$`)
)

type monhelperProfile struct {
	ID   int
	Name string
}

type monhelperWechatEvent struct {
	UDID        string `json:"udid"`
	Type        string `json:"type"`
	ID          string `json:"id"`
	UserID      int    `json:"userId"`
	ProfileName string `json:"profileName"`
	Key         string `json:"key"`
	Title       string `json:"title"`
	Text        string `json:"text"`
	TimestampMs int64  `json:"timestampMs"`
}

type monhelperSubscriber struct {
	events  chan monhelperWechatEvent
	allowed map[string]struct{}
}

type monhelperNotifyHub struct {
	tracker     *adb.Tracker
	mu          sync.Mutex
	subscribers map[*monhelperSubscriber]struct{}
	collectors  map[string]context.CancelFunc
	wake        chan struct{}
}

func newMonhelperNotifyHub(tracker *adb.Tracker) *monhelperNotifyHub {
	return &monhelperNotifyHub{
		tracker:     tracker,
		subscribers: make(map[*monhelperSubscriber]struct{}),
		collectors:  make(map[string]context.CancelFunc),
		wake:        make(chan struct{}, 1),
	}
}

func (hub *monhelperNotifyHub) run() {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
		case <-hub.wake:
		}
		hub.reconcileCollectors()
	}
}

func (hub *monhelperNotifyHub) signal() {
	select {
	case hub.wake <- struct{}{}:
	default:
	}
}

func (hub *monhelperNotifyHub) reconcileCollectors() {
	devices := hub.tracker.GetDevices()
	desired := make(map[string]struct{})

	hub.mu.Lock()
	for subscriber := range hub.subscribers {
		for udid := range subscriber.allowed {
			if device, ok := devices[udid]; ok && device.Status == adb.StatusOnline {
				desired[udid] = struct{}{}
			}
		}
	}
	for udid, cancel := range hub.collectors {
		if _, keep := desired[udid]; keep {
			continue
		}
		cancel()
		delete(hub.collectors, udid)
	}
	for udid := range desired {
		if _, running := hub.collectors[udid]; running {
			continue
		}
		ctx, cancel := context.WithCancel(context.Background())
		hub.collectors[udid] = cancel
		go hub.collectDevice(ctx, udid)
	}
	hub.mu.Unlock()
}

func (hub *monhelperNotifyHub) subscribe(allowed map[string]struct{}) *monhelperSubscriber {
	subscriber := &monhelperSubscriber{
		events:  make(chan monhelperWechatEvent, 64),
		allowed: allowed,
	}
	hub.mu.Lock()
	hub.subscribers[subscriber] = struct{}{}
	hub.mu.Unlock()
	hub.signal()
	return subscriber
}

func (hub *monhelperNotifyHub) unsubscribe(subscriber *monhelperSubscriber) {
	hub.mu.Lock()
	delete(hub.subscribers, subscriber)
	hub.mu.Unlock()
	hub.signal()
}

func (hub *monhelperNotifyHub) publish(event monhelperWechatEvent) {
	hub.mu.Lock()
	defer hub.mu.Unlock()
	for subscriber := range hub.subscribers {
		if _, ok := subscriber.allowed[event.UDID]; !ok {
			continue
		}
		select {
		case subscriber.events <- event:
		default:
			log.Printf("[%s] Dropping Monhelper event for a slow browser subscriber", event.UDID)
		}
	}
}

func (hub *monhelperNotifyHub) handleEvents(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	allowed := make(map[string]struct{})
	for _, udid := range r.URL.Query()["udid"] {
		if udid = strings.TrimSpace(udid); udid != "" {
			allowed[udid] = struct{}{}
		}
	}
	if len(allowed) == 0 {
		http.Error(w, "At least one udid is required", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.WriteHeader(http.StatusOK)
	_, _ = io.WriteString(w, ": connected\n\n")
	flusher.Flush()

	subscriber := hub.subscribe(allowed)
	defer hub.unsubscribe(subscriber)
	heartbeat := time.NewTicker(15 * time.Second)
	defer heartbeat.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case <-heartbeat.C:
			if _, err := io.WriteString(w, ": keepalive\n\n"); err != nil {
				return
			}
			flusher.Flush()
		case event := <-subscriber.events:
			payload, err := json.Marshal(event)
			if err != nil {
				continue
			}
			if _, err := fmt.Fprintf(w, "data: %s\n\n", payload); err != nil {
				return
			}
			flusher.Flush()
		}
	}
}

func (hub *monhelperNotifyHub) collectDevice(ctx context.Context, udid string) {
	for {
		if ctx.Err() != nil {
			return
		}
		profiles, err := listMonhelperWechatProfiles(udid)
		if err != nil || len(profiles) == 0 {
			if !waitMonhelperRetry(ctx, 30*time.Second) {
				return
			}
			continue
		}

		profileNames := make(map[int]string, len(profiles))
		for _, profile := range profiles {
			profileNames[profile.ID] = profile.Name
		}

		cmd := exec.CommandContext(
			ctx,
			adb.GetAdbPath(),
			"-s", udid,
			"logcat", "-v", "time", "-T", "1",
			"-s", "MonWechatNotify:I", "*:S",
		)
		stdout, err := cmd.StdoutPipe()
		if err != nil {
			if !waitMonhelperRetry(ctx, 2*time.Second) {
				return
			}
			continue
		}
		cmd.Stderr = io.Discard
		if err := cmd.Start(); err != nil {
			if !waitMonhelperRetry(ctx, 2*time.Second) {
				return
			}
			continue
		}

		// Start listening before enabling services so LISTENER_CONNECTED/ACTIVE
		// events cannot race ahead of the host collector.
		go ensureMonhelperWechatProfiles(udid, profiles)
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			if event, ok := parseMonhelperWechatEvent(udid, scanner.Text(), profileNames, time.Now()); ok {
				hub.publish(event)
			}
		}
		_ = cmd.Wait()
		if !waitMonhelperRetry(ctx, 2*time.Second) {
			return
		}
	}
}

func waitMonhelperRetry(ctx context.Context, delay time.Duration) bool {
	timer := time.NewTimer(delay)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-timer.C:
		return true
	}
}

func listMonhelperWechatProfiles(udid string) ([]monhelperProfile, error) {
	output, err := adb.CommandTimeout(15*time.Second, "-s", udid, "shell", "pm", "list", "users")
	if err != nil {
		return nil, err
	}

	profiles := make([]monhelperProfile, 0, 6)
	for _, line := range strings.Split(output, "\n") {
		match := monhelperUserRE.FindStringSubmatch(line)
		if match == nil {
			continue
		}
		userID, err := strconv.Atoi(match[1])
		if err != nil {
			continue
		}
		packages, err := adb.CommandTimeout(
			15*time.Second,
			"-s", udid, "shell", "pm", "list", "packages",
			"--user", strconv.Itoa(userID), "com.tencent.mm",
		)
		if err != nil || !strings.Contains(packages, "package:com.tencent.mm") {
			continue
		}
		name := strings.TrimSpace(match[2])
		if name == "" {
			name = fmt.Sprintf("User %d", userID)
		}
		profiles = append(profiles, monhelperProfile{ID: userID, Name: name})
	}
	return profiles, nil
}

func ensureMonhelperWechatProfiles(udid string, profiles []monhelperProfile) {
	if err := ensureMediaImporter(udid, 0); err != nil {
		log.Printf("[%s] Monhelper v%d install failed: %v", udid, mediaImporterVersion, err)
		return
	}
	for _, profile := range profiles {
		if profile.ID != 0 {
			if output, err := adb.CommandTimeout(
				60*time.Second,
				"-s", udid, "shell", "cmd", "package", "install-existing",
				"--user", strconv.Itoa(profile.ID), mediaImporterPackage,
			); err != nil {
				log.Printf("[%s] Monhelper install-existing user %d failed: %v (%s)",
					udid, profile.ID, err, strings.TrimSpace(output))
				continue
			}
		}
		if output, err := adb.CommandTimeout(
			30*time.Second,
			"-s", udid, "shell", "cmd", "notification", "allow_listener",
			monhelperWechatListener, strconv.Itoa(profile.ID),
		); err != nil {
			log.Printf("[%s] Monhelper listener user %d failed: %v (%s)",
				udid, profile.ID, err, strings.TrimSpace(output))
		}
	}
}

func parseMonhelperWechatEvent(
	udid string,
	line string,
	profileNames map[int]string,
	now time.Time,
) (monhelperWechatEvent, bool) {
	trimmed := strings.TrimSpace(line)
	if removed := monhelperRemovedRE.FindStringSubmatch(trimmed); removed != nil {
		userID, err := strconv.Atoi(removed[1])
		if err != nil {
			return monhelperWechatEvent{}, false
		}
		profileName := strings.TrimSpace(profileNames[userID])
		if profileName == "" {
			profileName = fmt.Sprintf("User %d", userID)
		}
		key := strings.TrimSpace(removed[2])
		return monhelperWechatEvent{
			UDID:        udid,
			Type:        "WECHAT_REMOVED",
			ID:          "removed-" + key,
			UserID:      userID,
			ProfileName: profileName,
			Key:         key,
			TimestampMs: now.UnixMilli(),
		}, true
	}

	match := monhelperEventRE.FindStringSubmatch(trimmed)
	if match == nil {
		return monhelperWechatEvent{}, false
	}
	userID, err := strconv.Atoi(match[3])
	if err != nil {
		return monhelperWechatEvent{}, false
	}
	eventID := strings.TrimSpace(match[2])
	profileName := strings.TrimSpace(profileNames[userID])
	if profileName == "" {
		profileName = fmt.Sprintf("User %d", userID)
	}
	return monhelperWechatEvent{
		UDID:        udid,
		Type:        match[1],
		ID:          eventID,
		UserID:      userID,
		ProfileName: profileName,
		Key:         strings.TrimSpace(match[4]),
		Title:       strings.TrimSpace(match[5]),
		Text:        strings.TrimSpace(match[6]),
		TimestampMs: now.UnixMilli(),
	}, true
}
