package adb

import (
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

const monSpaceAutostartScript = "Start-MonSpaceV2Users.ps1"

func runMonSpaceV2Autostart(serial string) {
	if serial == "" || !monSpaceAutostartAllowed(serial) {
		return
	}

	root, ok := monViewPhoneRoot()
	if !ok {
		log.Printf("[MonSpaceV2 AutoStart] repo root not found; skip %s", serial)
		return
	}

	script := filepath.Join(root, "sprict", monSpaceAutostartScript)
	if _, err := os.Stat(script); err != nil {
		log.Printf("[MonSpaceV2 AutoStart] script missing: %s", script)
		return
	}

	go func() {
		log.Printf("[MonSpaceV2 AutoStart] running for %s", serial)
		cmd := exec.Command("powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, "-Serial", serial, "-AdbPath", GetAdbPath())
		out, err := cmd.CombinedOutput()
		if err != nil {
			log.Printf("[MonSpaceV2 AutoStart] %s failed: %v output=%s", serial, err, strings.TrimSpace(string(out)))
			return
		}
		log.Printf("[MonSpaceV2 AutoStart] %s done: %s", serial, strings.TrimSpace(string(out)))
	}()
}

func monSpaceAutostartAllowed(serial string) bool {
	root, ok := monViewPhoneRoot()
	if !ok {
		return false
	}

	data, err := os.ReadFile(filepath.Join(root, "sprict", "monspacev2-autostart-serials.txt"))
	if err != nil {
		return false
	}

	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		if line == serial {
			return true
		}
	}
	return false
}

func monViewPhoneRoot() (string, bool) {
	wd, err := os.Getwd()
	if err == nil {
		if root, ok := findMonViewPhoneRoot(wd); ok {
			return root, true
		}
	}

	exe, err := os.Executable()
	if err == nil {
		if root, ok := findMonViewPhoneRoot(filepath.Dir(exe)); ok {
			return root, true
		}
	}

	return "", false
}

func findMonViewPhoneRoot(start string) (string, bool) {
	dir := start
	for i := 0; i < 4; i++ {
		if _, err := os.Stat(filepath.Join(dir, "sprict")); err == nil {
			return dir, true
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return "", false
}

func shouldRunMonSpaceV2Autostart(exists bool, previous Device, current Device) bool {
	return current.Status == StatusOnline && (!exists || previous.Status != StatusOnline)
}
