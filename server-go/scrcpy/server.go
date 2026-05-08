package scrcpy

import (
	"log"
	"server-go/adb"
	"time"
)

const (
	TempPath    = "/data/local/tmp/"
	FileName    = "scrcpy-server.jar"
	ProcessName = "app_process"
	ArgsString  = "/ com.genymobile.scrcpy.Server 1.25 log_level=info bit_rate=4000000 max_size=0 max_fps=0 lock_video_orientation=-1 tunnel_forward=true crop=- display_id=0 control=true display_id=0 show_touches=false stay_awake=true server_uid=-1 power_off_on_close=false clipboard_autosync=false downsize_on_error=true cleanup=true"
)

func StartServer(udid string) error {
	// Push scrcpy-server.jar
	log.Printf("[%s] Pushing scrcpy-server.jar...", udid)
	err := adb.Push(udid, "scrcpy-server.jar", TempPath+FileName)
	if err != nil {
		log.Printf("[%s] Failed to push scrcpy-server.jar: %v", udid, err)
		return err
	}

	// Start server via app_process
	runCmd := "CLASSPATH=" + TempPath + FileName + " nohup app_process " + ArgsString
	log.Printf("[%s] Starting scrcpy server: %s", udid, runCmd)
	_, err = adb.RunShellAsync(udid, runCmd)
	if err != nil {
		log.Printf("[%s] Failed to start scrcpy server: %v", udid, err)
		return err
	}

	// Give it some time to start
	time.Sleep(1 * time.Second)
	return nil
}

func ForwardPort(udid string) (string, error) {
	// ADB forward tcp:0 localabstract:scrcpy
	port, err := adb.Forward(udid, "tcp:0", "localabstract:scrcpy")
	if err != nil {
		return "", err
	}
	return port, nil
}
