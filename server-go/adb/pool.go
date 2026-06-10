package adb

import (
	"bufio"
	"fmt"
	"io"
	"os/exec"
	"strings"
	"sync"
	"time"
)

type PersistentShell struct {
	udid   string
	cmd    *exec.Cmd
	stdin  io.WriteCloser
	stdout *bufio.Reader
	mu     sync.Mutex
	closed bool
}

var (
	poolMu sync.RWMutex
	pool   = make(map[string]*PersistentShell)
)

func getOrStartPersistentShell(udid string) (*PersistentShell, error) {
	poolMu.RLock()
	shell, exists := pool[udid]
	poolMu.RUnlock()

	if exists && !shell.closed {
		return shell, nil
	}

	poolMu.Lock()
	defer poolMu.Unlock()

	shell, exists = pool[udid]
	if exists && !shell.closed {
		return shell, nil
	}

	cmd := exec.Command(GetAdbPath(), "-s", udid, "shell")
	
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to get stdin: %v", err)
	}
	
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to get stdout: %v", err)
	}
	
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start adb shell: %v", err)
	}

	shell = &PersistentShell{
		udid:   udid,
		cmd:    cmd,
		stdin:  stdin,
		stdout: bufio.NewReader(stdout),
		closed: false,
	}

	// Monitor the process to remove it from the pool if it exits
	go func(s *PersistentShell) {
		s.cmd.Wait()
		poolMu.Lock()
		s.closed = true
		if pool[s.udid] == s {
			delete(pool, s.udid)
		}
		poolMu.Unlock()
	}(shell)

	pool[udid] = shell
	return shell, nil
}

// FastShell executes a shell command on the device using a persistent adb shell.
// This is significantly faster than launching a new adb process.
func FastShell(udid string, command string) (string, error) {
	shell, err := getOrStartPersistentShell(udid)
	if err != nil {
		return "", err
	}

	return shell.Execute(command)
}

func (s *PersistentShell) Execute(command string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.closed {
		return "", fmt.Errorf("persistent shell closed")
	}

	delimiter := fmt.Sprintf("__END_CMD_%d__", time.Now().UnixNano())
	
	cmdPayload := fmt.Sprintf("%s\necho '%s'\n", command, delimiter)
	
	if _, err := io.WriteString(s.stdin, cmdPayload); err != nil {
		s.stdin.Close()
		return "", fmt.Errorf("failed to write to shell: %v", err)
	}

	var outputBuilder strings.Builder
	for {
		line, err := s.stdout.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				break
			}
			s.stdin.Close()
			return "", fmt.Errorf("failed to read from shell: %v", err)
		}
		
		cleanLine := strings.TrimRight(line, "\r\n")
		if cleanLine == delimiter {
			break
		}
		
		outputBuilder.WriteString(line)
	}

	return outputBuilder.String(), nil
}

// ClosePersistentShell closes the persistent shell for a given device
func ClosePersistentShell(udid string) {
	poolMu.Lock()
	defer poolMu.Unlock()

	if shell, exists := pool[udid]; exists {
		io.WriteString(shell.stdin, "exit\n")
		shell.stdin.Close()
		shell.closed = true
		delete(pool, udid)
	}
}
