package adb

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"
)

// Command executes an adb command
func Command(args ...string) (string, error) {
	cmd := exec.Command("adb", args...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("adb %v failed: %v, stderr: %s", args, err, stderr.String())
	}
	return stdout.String(), nil
}

// Push pushes a file to the device
func Push(udid, localPath, remotePath string) error {
	_, err := Command("-s", udid, "push", localPath, remotePath)
	return err
}

// Forward sets up a tcp forward from localhost to the device
func Forward(udid, localPort, remote string) (string, error) {
	// example: adb -s udid forward tcp:0 localabstract:scrcpy
	out, err := Command("-s", udid, "forward", localPort, remote)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(out), nil
}

// RemoveForward removes a forward
func RemoveForward(udid, localPort string) error {
	_, err := Command("-s", udid, "forward", "--remove", localPort)
	return err
}

// Shell runs a shell command
func Shell(udid string, cmd string) (string, error) {
	return Command("-s", udid, "shell", cmd)
}

// RunShellAsync runs a shell command asynchronously and returns the exec.Cmd
func RunShellAsync(udid string, shellCmd string) (*exec.Cmd, error) {
	cmd := exec.Command("adb", "-s", udid, "shell", shellCmd)
	err := cmd.Start()
	return cmd, err
}
