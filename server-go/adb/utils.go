package adb

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"
)

const (
	defaultCommandTimeout = 15 * time.Second
	pushTimeout           = 60 * time.Second
	forwardTimeout        = 8 * time.Second
	removeForwardTimeout  = 5 * time.Second
	shellTimeout          = 15 * time.Second
)

var (
	adbPath string
	once    sync.Once
)

func GetAdbPath() string {
	once.Do(func() {
		xiaoweiAdb := `C:\Program Files (x86)\xiaowei\tools\adb.exe`
		if _, err := os.Stat(xiaoweiAdb); err == nil {
			adbPath = xiaoweiAdb
			return
		}
		adbPath = "adb"
	})
	return adbPath
}

func timeoutForArgs(args []string) time.Duration {
	for i, arg := range args {
		switch arg {
		case "push", "pull", "install":
			return pushTimeout
		case "forward":
			if i+1 < len(args) && args[i+1] == "--remove" {
				return removeForwardTimeout
			}
			return forwardTimeout
		case "shell":
			return shellTimeout
		}
	}
	return defaultCommandTimeout
}

func formatCommandError(path string, args []string, timeout time.Duration, stderr string, err error) error {
	stderr = strings.TrimSpace(stderr)
	if err == context.DeadlineExceeded {
		return fmt.Errorf("adb command timed out: path=%q args=%v timeout=%s stderr=%q", path, args, timeout, stderr)
	}
	return fmt.Errorf("adb command failed: path=%q args=%v timeout=%s err=%v stderr=%q", path, args, timeout, err, stderr)
}

// Command executes an adb command
func Command(args ...string) (string, error) {
	return CommandTimeout(timeoutForArgs(args), args...)
}

func CommandTimeout(timeout time.Duration, args ...string) (string, error) {
	if timeout <= 0 {
		timeout = defaultCommandTimeout
	}
	path := GetAdbPath()
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, path, args...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if ctx.Err() == context.DeadlineExceeded {
		return "", formatCommandError(path, args, timeout, stderr.String(), context.DeadlineExceeded)
	}
	if err != nil {
		return "", formatCommandError(path, args, timeout, stderr.String(), err)
	}
	return stdout.String(), nil
}

func CommandWithStdinFileTimeout(timeout time.Duration, stdinPath string, args ...string) (string, error) {
	if timeout <= 0 {
		timeout = defaultCommandTimeout
	}
	path := GetAdbPath()
	input, err := os.Open(stdinPath)
	if err != nil {
		return "", err
	}
	defer input.Close()

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, path, args...)
	cmd.Stdin = input
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err = cmd.Run()
	if ctx.Err() == context.DeadlineExceeded {
		return "", formatCommandError(path, args, timeout, stderr.String(), context.DeadlineExceeded)
	}
	if err != nil {
		return "", formatCommandError(path, args, timeout, stderr.String(), err)
	}
	return stdout.String(), nil
}

// Push pushes a file to the device
func Push(udid, localPath, remotePath string) error {
	_, err := CommandTimeout(pushTimeout, "-s", udid, "push", localPath, remotePath)
	return err
}

// Forward sets up a tcp forward from localhost to the device
func Forward(udid, localPort, remote string) (string, error) {
	// example: adb -s udid forward tcp:0 localabstract:scrcpy
	out, err := CommandTimeout(forwardTimeout, "-s", udid, "forward", localPort, remote)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(out), nil
}

// RemoveForward removes a forward
func RemoveForward(udid, localPort string) error {
	_, err := CommandTimeout(removeForwardTimeout, "-s", udid, "forward", "--remove", localPort)
	return err
}

// Shell runs a shell command
func Shell(udid string, cmd string) (string, error) {
	return CommandTimeout(shellTimeout, "-s", udid, "shell", cmd)
}

// RunShellAsync runs a shell command asynchronously and returns the exec.Cmd
func RunShellAsync(udid string, shellCmd string) (*exec.Cmd, error) {
	cmd := exec.Command(GetAdbPath(), "-s", udid, "shell", shellCmd)
	err := cmd.Start()
	return cmd, err
}
