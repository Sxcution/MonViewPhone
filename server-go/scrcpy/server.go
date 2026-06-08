package scrcpy

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"server-go/adb"
	"strings"
	"sync"
	"time"
)

const (
	TempPath      = "/data/local/tmp/"
	FileName      = "scrcpy-server.jar"
	PidFilePath   = "/data/local/tmp/ws_scrcpy.pid"
	LogFilePath   = "/data/local/tmp/ws_scrcpy.log"
	ProcessName   = "app_process"
	ServerPackage = "com.genymobile.scrcpy.Server"
	ServerVersion = "1.19-ws6"
	ServerType    = "web"
	LogLevel      = "ERROR"
	ServerPort    = "8886"
	ServerPortHex = "22B6"
	ListenAll     = "true"
	ArgsString    = "/ " + ServerPackage + " " + ServerVersion + " " + ServerType + " " + LogLevel + " " + ServerPort + " " + ListenAll
)

type serverProcess struct {
	pid     string
	cmdline string
}

var deviceLocks sync.Map

func lockForDevice(udid string) *sync.Mutex {
	value, _ := deviceLocks.LoadOrStore(udid, &sync.Mutex{})
	return value.(*sync.Mutex)
}

func serverJarPath() string {
	if exe, err := os.Executable(); err == nil {
		candidate := filepath.Join(filepath.Dir(exe), FileName)
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}
	return FileName
}

func shellSafe(udid string, cmd string) string {
	out, err := adb.Shell(udid, cmd)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(out)
}

func listServerProcesses(udid string) []serverProcess {
	cmd := fmt.Sprintf(`for p in $(pidof %s 2>/dev/null); do C=$(cat /proc/$p/cmdline 2>/dev/null | tr "\0" " "); case "$C" in *%s*) echo "$p $C";; esac; done`, ProcessName, ServerPackage)
	out := shellSafe(udid, cmd)
	if out == "" {
		return nil
	}
	lines := strings.Split(out, "\n")
	processes := make([]serverProcess, 0, len(lines))
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		parts := strings.SplitN(line, " ", 2)
		if len(parts) != 2 {
			continue
		}
		processes = append(processes, serverProcess{
			pid:     strings.TrimSpace(parts[0]),
			cmdline: strings.TrimSpace(parts[1]),
		})
	}
	return processes
}

func isExpectedServer(proc serverProcess) bool {
	return strings.Contains(proc.cmdline, ServerPackage) &&
		strings.Contains(proc.cmdline, ServerVersion) &&
		strings.Contains(proc.cmdline, ServerType) &&
		strings.Contains(proc.cmdline, ServerPort)
}

func isPortListening(udid string) bool {
	cmd := fmt.Sprintf(`cat /proc/net/tcp /proc/net/tcp6 2>/dev/null | grep -i ":%s" || true`, ServerPortHex)
	out := shellSafe(udid, cmd)
	return strings.Contains(strings.ToUpper(out), ":"+ServerPortHex) && strings.Contains(out, " 0A ")
}

func killStaleServers(udid string, processes []serverProcess) {
	for _, proc := range processes {
		if proc.pid == "" || isExpectedServer(proc) {
			continue
		}
		log.Printf("[%s] Killing stale scrcpy server PID %s (%s)", udid, proc.pid, proc.cmdline)
		_ = shellSafe(udid, "kill "+proc.pid+" 2>/dev/null || true")
	}
}

func hasExpectedServer(udid string) bool {
	for _, proc := range listServerProcesses(udid) {
		if isExpectedServer(proc) {
			return isPortListening(udid)
		}
	}
	return false
}

func waitForServer(udid string) error {
	deadline := time.Now().Add(30 * time.Second)
	for time.Now().Before(deadline) {
		if hasExpectedServer(udid) {
			return nil
		}
		time.Sleep(300 * time.Millisecond)
	}
	logTail := shellSafe(udid, "cat "+LogFilePath+" 2>/dev/null | tail -20")
	if logTail != "" {
		return fmt.Errorf("failed to start scrcpy server: %s", logTail)
	}
	return fmt.Errorf("failed to start scrcpy server")
}

func EnsureServer(udid string) error {
	lock := lockForDevice(udid)
	lock.Lock()
	defer lock.Unlock()

	processes := listServerProcesses(udid)
	for _, proc := range processes {
		if isExpectedServer(proc) && isPortListening(udid) {
			return nil
		}
	}

	killStaleServers(udid, processes)
	_ = shellSafe(udid, "rm -f "+PidFilePath+" "+LogFilePath)
	time.Sleep(300 * time.Millisecond)
	return StartServer(udid)
}

func StartServer(udid string) error {
	// Push scrcpy-server.jar
	log.Printf("[%s] Pushing scrcpy-server.jar...", udid)
	err := adb.Push(udid, serverJarPath(), TempPath+FileName)
	if err != nil {
		log.Printf("[%s] Failed to push scrcpy-server.jar: %v", udid, err)
		return err
	}

	// Start server via app_process
	runCmd := "CLASSPATH=" + TempPath + FileName + " nohup app_process " + ArgsString + " >" + LogFilePath + " 2>&1 &"
	log.Printf("[%s] Starting scrcpy server: %s", udid, runCmd)
	_, err = adb.Shell(udid, runCmd)
	if err != nil {
		log.Printf("[%s] Failed to start scrcpy server: %v", udid, err)
		return err
	}

	return waitForServer(udid)
}

func ForwardPort(udid string) (string, error) {
	// ADB forward tcp:0 localabstract:scrcpy
	port, err := adb.Forward(udid, "tcp:0", "localabstract:scrcpy")
	if err != nil {
		return "", err
	}
	return port, nil
}
