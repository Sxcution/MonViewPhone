package websocket

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"server-go/adb"
	"strings"
	"sync"
	"time"

	gws "github.com/gorilla/websocket"
)

const (
	RawScrcpyVersion    = "3.3.4"
	RawLocalJarName     = "scrcpy-server-v3.3.4.jar"
	RawRemoteJarPath    = "/data/local/tmp/monview-scrcpy-server-v3.3.4.jar"
	RawServerClass      = "com.genymobile.scrcpy.Server"
	RawDefaultMaxSize   = "720"
	RawDefaultBitRate   = "393216"
	RawDefaultMaxFps    = "12"
	rawDialTimeout      = 12 * time.Second
	rawFirstFrameWindow = 15 * time.Second
)

var (
	rawSessionLocks sync.Map
	rawActive       sync.Map
)

type rawSession struct {
	cancel func()
}

func rawLockForDevice(udid string) *sync.Mutex {
	v, _ := rawSessionLocks.LoadOrStore(udid, &sync.Mutex{})
	return v.(*sync.Mutex)
}

func safeSocketName(udid string) string {
	re := regexp.MustCompile(`[^a-zA-Z0-9_]+`)
	s := re.ReplaceAllString(udid, "_")
	if len(s) > 48 {
		s = s[:48]
	}
	return "monview_raw_" + s
}

func rawServerJarPath() string {
	exePath, err := os.Executable()
	if err == nil {
		p := filepath.Join(filepath.Dir(exePath), "bin", RawLocalJarName)
		if _, statErr := os.Stat(p); statErr == nil {
			return p
		}
	}

	wd, err := os.Getwd()
	if err == nil {
		p := filepath.Join(wd, "bin", RawLocalJarName)
		if _, statErr := os.Stat(p); statErr == nil {
			return p
		}

		p = filepath.Join(wd, "server-go", "bin", RawLocalJarName)
		if _, statErr := os.Stat(p); statErr == nil {
			return p
		}
	}

	return filepath.Join("server-go", "bin", RawLocalJarName)
}

func md5File(path string) (string, error) {
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

func rawShell(udid string, command string, timeout time.Duration) (string, error) {
	ctxTimeout := timeout
	if ctxTimeout <= 0 {
		ctxTimeout = 10 * time.Second
	}

	done := make(chan struct{})
	var out []byte
	var err error

	go func() {
		defer close(done)
		out, err = exec.Command(adb.GetAdbPath(), "-s", udid, "shell", command).CombinedOutput()
	}()

	select {
	case <-done:
		return string(out), err
	case <-time.After(ctxTimeout):
		return "", fmt.Errorf("adb shell timeout after %s: %s", ctxTimeout, command)
	}
}

func rawRemoteMD5(udid string) string {
	out, err := rawShell(udid, "md5sum "+RawRemoteJarPath+" 2>/dev/null | awk '{print $1}'", 8*time.Second)
	if err != nil {
		return ""
	}

	fields := strings.Fields(strings.TrimSpace(out))
	if len(fields) == 0 {
		return ""
	}

	return fields[0]
}

func ensureRawServerJar(udid string) error {
	localJar := rawServerJarPath()

	localMD5, err := md5File(localJar)
	if err != nil {
		return fmt.Errorf("raw scrcpy jar not found or unreadable: %s: %w", localJar, err)
	}

	remoteMD5 := rawRemoteMD5(udid)
	if strings.EqualFold(localMD5, remoteMD5) {
		log.Printf("[%s] raw-v2 jar md5 matched, skip push md5=%s", udid, localMD5)
		return nil
	}

	log.Printf("[%s] pushing raw-v2 jar local=%s localMD5=%s remoteMD5=%s", udid, localJar, localMD5, remoteMD5)

	if err := adb.Push(udid, localJar, RawRemoteJarPath); err != nil {
		return fmt.Errorf("push raw scrcpy jar failed: %w", err)
	}

	return nil
}

func getFreeLocalPort() (int, error) {
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, err
	}
	defer l.Close()

	return l.Addr().(*net.TCPAddr).Port, nil
}

func adbForwardRaw(udid string, localPort int, socketName string) error {
	cmd := exec.Command(
		adb.GetAdbPath(),
		"-s", udid,
		"forward",
		fmt.Sprintf("tcp:%d", localPort),
		"localabstract:"+socketName,
	)

	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("adb forward failed: %w output=%s", err, string(out))
	}

	return nil
}

func adbRemoveRawForward(udid string, localPort int) {
	cmd := exec.Command(
		adb.GetAdbPath(),
		"-s", udid,
		"forward",
		"--remove",
		fmt.Sprintf("tcp:%d", localPort),
	)

	if out, err := cmd.CombinedOutput(); err != nil {
		log.Printf("[%s] raw-v2 remove forward tcp:%d failed: %v output=%s", udid, localPort, err, string(out))
	}
}

func killRawScrcpyServer(udid string) {
	// Kill only our raw-v2 server command, not the old ws6 server.
	cmd := "pkill -f '" + RawRemoteJarPath + "' 2>/dev/null || true"
	_, _ = rawShell(udid, cmd, 5*time.Second)
}

func startRawScrcpyServer(udid string, scid string) (*exec.Cmd, error) {
	args := []string{
		"-s", udid,
		"shell",
		"CLASSPATH=" + RawRemoteJarPath,
		"app_process",
		"/",
		RawServerClass,
		RawScrcpyVersion,

		"scid=" + scid,
		"log_level=info",
		"tunnel_forward=true",

		// stream only; control/audio để sau
		"video=true",
		"audio=false",
		"control=false",

		// quan trọng: output raw H.264, bỏ meta/header
		"raw_stream=true",

		// giữ server sống tới khi TCP bị đóng, không tự xóa jar
		"cleanup=false",

		// cấu hình nhẹ cho grid 36 máy
		"max_size=" + RawDefaultMaxSize,
		"video_bit_rate=" + RawDefaultBitRate,
		"max_fps=" + RawDefaultMaxFps,

		// ổn định hơn cho màn hình ít thay đổi
		"power_on=true",
	}

	cmd := exec.Command(adb.GetAdbPath(), args...)

	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	if err := cmd.Start(); err != nil {
		return nil, err
	}

	go func() {
		buf := make([]byte, 4096)
		for {
			n, err := stdout.Read(buf)
			if n > 0 {
				log.Printf("[%s] raw-v2 server stdout: %s", udid, strings.TrimSpace(string(buf[:n])))
			}
			if err != nil {
				return
			}
		}
	}()

	go func() {
		buf := make([]byte, 4096)
		for {
			n, err := stderr.Read(buf)
			if n > 0 {
				log.Printf("[%s] raw-v2 server stderr: %s", udid, strings.TrimSpace(string(buf[:n])))
			}
			if err != nil {
				return
			}
		}
	}()

	go func() {
		err := cmd.Wait()
		log.Printf("[%s] raw-v2 server process exited: %v", udid, err)
	}()

	return cmd, nil
}

type prefixConn struct {
	net.Conn
	prefixByte byte
	hasPrefix  bool
}

func (c *prefixConn) Read(b []byte) (int, error) {
	if c.hasPrefix {
		if len(b) > 0 {
			b[0] = c.prefixByte
			c.hasPrefix = false
			return 1, nil
		}
	}
	return c.Conn.Read(b)
}

func dialRawStream(localPort int) (net.Conn, error) {
	deadline := time.Now().Add(rawDialTimeout)
	addr := fmt.Sprintf("127.0.0.1:%d", localPort)

	var lastErr error
	for time.Now().Before(deadline) {
		conn, err := net.DialTimeout("tcp", addr, 1000*time.Millisecond)
		if err != nil {
			lastErr = err
			time.Sleep(150 * time.Millisecond)
			continue
		}

		// Set a short read deadline to check if ADB successfully connected to the device socket
		conn.SetReadDeadline(time.Now().Add(100 * time.Millisecond))
		var oneByte [1]byte
		_, readErr := conn.Read(oneByte[:])
		if readErr != nil {
			netErr, ok := readErr.(net.Error)
			if ok && netErr.Timeout() {
				// Timeout means the connection is alive (socket exists), but no data sent yet
				conn.SetReadDeadline(time.Time{})
				return conn, nil
			}
			// Connection refused/closed/EOF means socket is not ready yet
			conn.Close()
			lastErr = readErr
			time.Sleep(150 * time.Millisecond)
			continue
		}

		// Data byte read successfully means connection is fully ready
		conn.SetReadDeadline(time.Time{})
		return &prefixConn{Conn: conn, prefixByte: oneByte[0], hasPrefix: true}, nil
	}

	return nil, fmt.Errorf("dial raw stream timeout: %w", lastErr)
}

func closePreviousRawSession(udid string) {
	if v, ok := rawActive.Load(udid); ok {
		if s, ok := v.(*rawSession); ok && s.cancel != nil {
			log.Printf("[%s] closing previous raw-v2 session", udid)
			s.cancel()
		}
		rawActive.Delete(udid)
	}
}

func HandleProxyScrcpyRaw(w http.ResponseWriter, r *http.Request) {
	udid := r.URL.Query().Get("udid")
	if udid == "" {
		http.Error(w, "Missing udid", http.StatusBadRequest)
		return
	}

	clientWs, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[%s] Failed to upgrade raw proxy connection: %v", udid, err)
		return
	}
	defer clientWs.Close()

	lock := rawLockForDevice(udid)
	lock.Lock()
	defer lock.Unlock()

	traceStart := time.Now()
	log.Printf("[%s] raw-v2 trace: browser_ws_connected", udid)

	closePreviousRawSession(udid)

	cancelCh := make(chan struct{})
	cancelOnce := sync.Once{}
	cancel := func() {
		cancelOnce.Do(func() {
			close(cancelCh)
		})
	}
	rawActive.Store(udid, &rawSession{cancel: cancel})
	defer rawActive.Delete(udid)

	scidInt := time.Now().UnixNano() & 0x7fffffff
	scidVal := fmt.Sprintf("%08x", scidInt)
	socketName := "scrcpy_" + scidVal
	localPort := 0
	var rawConn net.Conn
	var serverCmd *exec.Cmd

	cleanup := func() {
		cancel()

		if rawConn != nil {
			_ = rawConn.Close()
		}

		if serverCmd != nil && serverCmd.Process != nil {
			_ = serverCmd.Process.Kill()
		}

		if localPort != 0 {
			adbRemoveRawForward(udid, localPort)
		}
	}
	defer cleanup()

	if err := ensureRawServerJar(udid); err != nil {
		log.Printf("[%s] raw-v2 ensure jar failed: %v", udid, err)
		writeProxyClose(clientWs, "raw-v2 ensure jar failed: "+err.Error())
		return
	}

	killRawScrcpyServer(udid)

	localPort, err = getFreeLocalPort()
	if err != nil {
		log.Printf("[%s] raw-v2 get port failed: %v", udid, err)
		writeProxyClose(clientWs, "raw-v2 get port failed: "+err.Error())
		return
	}

	if err := adbForwardRaw(udid, localPort, socketName); err != nil {
		log.Printf("[%s] raw-v2 adb forward failed: %v", udid, err)
		writeProxyClose(clientWs, "raw-v2 adb forward failed: "+err.Error())
		return
	}

	log.Printf("[%s] raw-v2 trace: adb_forward_ready elapsed=%s local_port=%d socket=%s",
		udid,
		time.Since(traceStart),
		localPort,
		socketName,
	)

	serverCmd, err = startRawScrcpyServer(udid, scidVal)
	if err != nil {
		log.Printf("[%s] raw-v2 start server failed: %v", udid, err)
		writeProxyClose(clientWs, "raw-v2 start server failed: "+err.Error())
		return
	}

	log.Printf("[%s] raw-v2 trace: server_started elapsed=%s", udid, time.Since(traceStart))

	time.Sleep(300 * time.Millisecond)
	rawConn, err = dialRawStream(localPort)
	if err != nil {
		log.Printf("[%s] raw-v2 dial failed: %v", udid, err)
		writeProxyClose(clientWs, "raw-v2 dial failed: "+err.Error())
		return
	}

	log.Printf("[%s] raw-v2 trace: raw_tcp_connected elapsed=%s", udid, time.Since(traceStart))

	errCh := make(chan error, 2)
	firstFrameOnce := sync.Once{}
	firstFrameCh := make(chan struct{})

	// Browser -> raw stream: hiện chưa dùng control, chỉ đọc để detect browser đóng.
	go func() {
		for {
			_, _, err := clientWs.ReadMessage()
			if err != nil {
				errCh <- fmt.Errorf("browser ws closed: %w", err)
				return
			}
		}
	}()

	// raw TCP H.264 -> browser WebSocket binary
	go func() {
		buf := make([]byte, 64*1024)

		for {
			n, err := rawConn.Read(buf)
			if n > 0 {
				chunk := make([]byte, n)
				copy(chunk, buf[:n])

				firstFrameOnce.Do(func() {
					log.Printf("[%s] raw-v2 trace: first_raw_bytes elapsed=%s bytes=%d",
						udid,
						time.Since(traceStart),
						n,
					)
					close(firstFrameCh)
				})

				if err := clientWs.WriteMessage(gws.BinaryMessage, chunk); err != nil {
					errCh <- fmt.Errorf("browser ws write failed: %w", err)
					return
				}
			}

			if err != nil {
				errCh <- fmt.Errorf("raw tcp read failed: %w", err)
				return
			}
		}
	}()

	firstFrameTimer := time.NewTimer(rawFirstFrameWindow)
	defer firstFrameTimer.Stop()

	go func() {
		select {
		case <-firstFrameCh:
			firstFrameTimer.Stop()
		case <-cancelCh:
			firstFrameTimer.Stop()
		case <-firstFrameTimer.C:
			log.Printf("[%s] raw-v2 first frame timeout after %s", udid, rawFirstFrameWindow)
			cancel()
		}
	}()

	select {
	case err := <-errCh:
		log.Printf("[%s] raw-v2 session ended after %s: %v", udid, time.Since(traceStart), err)

	case <-cancelCh:
		log.Printf("[%s] raw-v2 session cancelled after %s", udid, time.Since(traceStart))
	}
}
