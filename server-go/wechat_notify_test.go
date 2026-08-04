package main

import (
	"testing"
	"time"
)

func TestParseMonhelperWechatEvent(t *testing.T) {
	now := time.UnixMilli(123456789)
	event, ok := parseMonhelperWechatEvent(
		"device-1",
		"08-01 10:00:00.000 I/MonWechatNotify: HELPER_V5 WECHAT_POSTED eventId=42-1 user=12 key=wechat-key title=Alice text=Hello",
		map[int]string{12: "Space 1"},
		now,
	)
	if !ok {
		t.Fatal("expected Monhelper event")
	}
	if event.UDID != "device-1" || event.UserID != 12 || event.ProfileName != "Space 1" {
		t.Fatalf("wrong target: %+v", event)
	}
	if event.ID != "42-1" || event.Title != "Alice" || event.Text != "Hello" {
		t.Fatalf("wrong payload: %+v", event)
	}
	if event.TimestampMs != now.UnixMilli() {
		t.Fatalf("wrong timestamp: %d", event.TimestampMs)
	}
}

func TestParseMonhelperWechatEventRejectsLegacyNovaLine(t *testing.T) {
	_, ok := parseMonhelperWechatEvent(
		"device-1",
		"08-01 10:00:00.000 I/MonWechatNotify: WECHAT_POSTED user=12 key=wechat-key title=Alice text=Hello",
		map[int]string{12: "Space 1"},
		time.Now(),
	)
	if ok {
		t.Fatal("legacy Nova listener line must not produce a Monhelper event")
	}
}

func TestParseMonhelperWechatRemovedEvent(t *testing.T) {
	event, ok := parseMonhelperWechatEvent(
		"device-1",
		"08-01 10:00:00.000 I/MonWechatNotify: HELPER_V5 WECHAT_REMOVED user=12 key=wechat-key",
		map[int]string{12: "Space 1"},
		time.UnixMilli(123456789),
	)
	if !ok {
		t.Fatal("expected removed event")
	}
	if event.Type != "WECHAT_REMOVED" || event.UserID != 12 || event.Key != "wechat-key" {
		t.Fatalf("wrong removed event: %+v", event)
	}
}

func TestParseMonhelperUsers(t *testing.T) {
	match := monhelperUserRE.FindStringSubmatch("UserInfo{10:Work profile:1030} running")
	if match == nil || match[1] != "10" || match[2] != "Work profile" {
		t.Fatalf("wrong user parse: %#v", match)
	}
}
