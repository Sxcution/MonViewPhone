package scrcpy

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"io"
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

var (
	deviceLocks sync.Map
	serverOps   = make(chan struct{}, 12) // allow 12 concurrent server operations (was 6)

	restartInFlight sync.Map
	restartMutex    sync.Mutex
	lastRestartAt   sync.Map
)

const ForceRestartCooldown = 12 * time.Second

func lockForDevice(udid string) *sync.Mutex {
	value, _ := deviceLocks.LoadOrStore(udid, &sync.Mutex{})
	return value.(*sync.Mutex)
}

// CleanDeviceLocks removes mutex entries for devices no longer in the active set.
// Call this periodically from the cleanup goroutine in main.go.
func CleanDeviceLocks(activeUdids map[string]bool) {
	deviceLocks.Range(func(key, value any) bool {
		udid := key.(string)
		if !activeUdids[udid] {
			deviceLocks.Delete(udid)
			log.Printf("[Cleanup] Evicted stale deviceLock for %s", udid)
		}
		return true
	})
}

func withServerOpSlot(fn func() error) error {
	serverOps <- struct{}{}
	defer func() {
		<-serverOps
	}()
	return fn()
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

func localFileMD5(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	h := md5.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}

	return hex.EncodeToString(h.Sum(nil)), nil
}

func remoteServerJarMD5(udid string) string {
	out := shellSafe(udid, "md5sum "+TempPath+FileName+" 2>/dev/null | awk '{print $1}'")
	fields := strings.Fields(strings.TrimSpace(out))
	if len(fields) == 0 {
		return ""
	}
	return fields[0]
}

func shouldPushServerJar(udid string, localPath string) bool {
	localMd5, err := localFileMD5(localPath)
	if err != nil {
		log.Printf("[%s] Cannot calculate local scrcpy-server.jar md5, will push: %v", udid, err)
		return true
	}

	remoteMd5 := remoteServerJarMD5(udid)
	if remoteMd5 == "" {
		log.Printf("[%s] Remote scrcpy-server.jar missing, will push", udid)
		return true
	}

	if !strings.EqualFold(localMd5, remoteMd5) {
		log.Printf("[%s] Remote scrcpy-server.jar md5 mismatch, will push local=%s remote=%s", udid, localMd5, remoteMd5)
		return true
	}

	log.Printf("[%s] scrcpy-server.jar md5 matched, skipping push md5=%s", udid, localMd5)
	return false
}

func shellSafe(udid string, cmd string) string {
	out, err := adb.Shell(udid, cmd)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(out)
}

func isCleanUpProcess(proc serverProcess) bool {
	return strings.Contains(proc.cmdline, "com.genymobile.scrcpy.CleanUp")
}

func listServerProcesses(udid string) []serverProcess {
	cmd := fmt.Sprintf(`for p in $(pidof %s %s64 2>/dev/null); do C=$(cat /proc/$p/cmdline 2>/dev/null | tr "\0" " "); case "$C" in *com.genymobile.scrcpy*) echo "$p $C";; esac; done`, ProcessName, ProcessName)
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
		if proc.pid == "" {
			continue
		}
		if !isExpectedServer(proc) && !isCleanUpProcess(proc) {
			log.Printf("[%s] Skip foreign scrcpy server PID %s (%s)", udid, proc.pid, proc.cmdline)
			continue
		}
		log.Printf("[%s] Killing stale MonViewPhone scrcpy process PID %s (%s)", udid, proc.pid, proc.cmdline)
		_ = shellSafe(udid, "kill "+proc.pid+" 2>/dev/null || true")
	}
}

func killMonViewPhoneScrcpyServers(udid string) error {
	for _, proc := range listServerProcesses(udid) {
		if proc.pid == "" {
			continue
		}
		if isExpectedServer(proc) || isCleanUpProcess(proc) {
			log.Printf("[%s] Killing MonViewPhone scrcpy process PID %s (%s)", udid, proc.pid, proc.cmdline)
			_ = shellSafe(udid, "kill -9 "+proc.pid+" 2>/dev/null || true")
		} else {
			log.Printf("[%s] Skip foreign scrcpy server PID %s (%s)", udid, proc.pid, proc.cmdline)
		}
	}
	return nil
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
	return withServerOpSlot(func() error {
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
		return startServerUnlocked(udid)
	})
}

func canForceRestartNow(udid string) bool {
	if v, ok := lastRestartAt.Load(udid); ok {
		last := v.(time.Time)
		if time.Since(last) < ForceRestartCooldown {
			log.Printf("[%s] ForceRestartServer cooldown active, skip restart (%s remaining)",
				udid,
				ForceRestartCooldown-time.Since(last),
			)
			return false
		}
	}
	lastRestartAt.Store(udid, time.Now())
	return true
}

func ForceRestartServer(udid string) error {
	if !canForceRestartNow(udid) {
		return EnsureServer(udid)
	}

	restartMutex.Lock()
	if chIntf, ok := restartInFlight.Load(udid); ok {
		restartMutex.Unlock()
		log.Printf("[%s] ForceRestartServer already in flight, waiting for result...", udid)
		err := <-chIntf.(chan error)
		return err
	}

	ch := make(chan error, 1)
	restartInFlight.Store(udid, ch)
	restartMutex.Unlock()

	err := withServerOpSlot(func() error {
		lock := lockForDevice(udid)
		lock.Lock()
		defer lock.Unlock()

		if err := killMonViewPhoneScrcpyServers(udid); err != nil {
			return fmt.Errorf("failed to kill scrcpy server: %w", err)
		}
		if _, err := adb.Shell(udid, "rm -f "+PidFilePath+" "+LogFilePath); err != nil {
			return fmt.Errorf("failed to remove scrcpy temp files: %w", err)
		}
		time.Sleep(500 * time.Millisecond)
		return startServerUnlocked(udid)
	})

	ch <- err
	close(ch)
	restartInFlight.Delete(udid)
	return err
}

func StartServer(udid string) error {
	return withServerOpSlot(func() error {
		lock := lockForDevice(udid)
		lock.Lock()
		defer lock.Unlock()
		return startServerUnlocked(udid)
	})
}

func startServerUnlocked(udid string) error {
	localJar := serverJarPath()

	if shouldPushServerJar(udid, localJar) {
		log.Printf("[%s] Pushing scrcpy-server.jar...", udid)
		err := adb.Push(udid, localJar, TempPath+FileName)
		if err != nil {
			log.Printf("[%s] Failed to push scrcpy-server.jar: %v", udid, err)
			return err
		}
	}

	// Start server via app_process
	runCmd := "CLASSPATH=" + TempPath + FileName + " nohup app_process " + ArgsString + " >" + LogFilePath + " 2>&1 &"
	log.Printf("[%s] Starting scrcpy server: %s", udid, runCmd)
	_, err := adb.Shell(udid, runCmd)
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

func CleanAllMonViewPhoneServers(tracker *adb.Tracker) {
	devices := tracker.GetDevices()
	log.Printf("[Startup] Cleaning up existing scrcpy servers on %d devices...", len(devices))
	var wg sync.WaitGroup
	for id, dev := range devices {
		if dev.Status == adb.StatusOnline {
			wg.Add(1)
			go func(udid string) {
				defer wg.Done()
				log.Printf("[%s] Startup cleanup: force killing existing scrcpy server", udid)
				_ = killMonViewPhoneScrcpyServers(udid)
				_ = shellSafe(udid, "rm -f "+PidFilePath+" "+LogFilePath)
			}(id)
		}
	}
	wg.Wait()
	log.Printf("[Startup] Cleanup completed for %d devices", len(devices))
}
