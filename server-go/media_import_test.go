package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
	"testing"
	"time"
)

func TestWriteMediaImportBatch(t *testing.T) {
	path := filepath.Join(t.TempDir(), "one.png")
	if err := os.WriteFile(path, []byte("abc"), 0600); err != nil {
		t.Fatal(err)
	}
	files, err := inspectLocalMediaImportFiles([]string{path})
	if err != nil {
		t.Fatal(err)
	}
	var output bytes.Buffer
	if err := writeMediaImportBatch(&output, files); err != nil {
		t.Fatal(err)
	}
	digest := sha256.Sum256([]byte("abc"))
	expected := fmt.Sprintf(
		"IMPORT\t%s\t3\t%s\nabc\nEND\n",
		base64.StdEncoding.EncodeToString([]byte("one.png")),
		hex.EncodeToString(digest[:]),
	)
	if output.String() != expected {
		t.Fatalf("unexpected batch frame:\n%q\nwant:\n%q", output.String(), expected)
	}
}

func TestValidateMediaImportName(t *testing.T) {
	for _, name := range []string{"photo.png", "ảnh 1.JPEG", "x.webp", "x.gif"} {
		if err := validateMediaImportName(name); err != nil {
			t.Fatalf("%s should be accepted: %v", name, err)
		}
	}
	for _, name := range []string{"QR.png", "x.bmp", "../x.png", "x.mp4", ""} {
		if err := validateMediaImportName(name); err == nil {
			t.Fatalf("%q should be rejected", name)
		}
	}
}

func TestRememberMediaImportNameRejectsCaseInsensitiveDuplicate(t *testing.T) {
	seen := make(map[string]struct{})
	if err := rememberMediaImportName(seen, "Photo.JPG"); err != nil {
		t.Fatal(err)
	}
	if err := rememberMediaImportName(seen, "photo.jpg"); err == nil {
		t.Fatal("expected duplicate image name to be rejected")
	}
}

func TestValidateMediaImportStatusUsesExactFields(t *testing.T) {
	valid := "Result: Bundle[{elapsed_ms=17, success=true, files=1, bytes=3}]"
	elapsed, ok := validateMediaImportStatus(valid, 1, 3)
	if !ok || elapsed != 17 {
		t.Fatalf("valid status rejected: elapsed=%d ok=%v", elapsed, ok)
	}
	for _, status := range []string{
		"Bundle[{elapsed_ms=17, success=true, files=10, bytes=3}]",
		"Bundle[{elapsed_ms=17, success=true, files=1, bytes=30}]",
		"Bundle[{elapsed_ms=17, success=trueish, files=1, bytes=3}]",
		"Bundle[{elapsed_ms=17, success=true, xfiles=1, bytes=3}]",
	} {
		if _, ok := validateMediaImportStatus(status, 1, 3); ok {
			t.Fatalf("inexact status accepted: %s", status)
		}
	}
}

func TestLiveMediaImport(t *testing.T) {
	serial := os.Getenv("MONVIEW_MEDIA_TEST_SERIAL")
	source := os.Getenv("MONVIEW_MEDIA_TEST_IMAGE")
	userText := os.Getenv("MONVIEW_MEDIA_TEST_USER")
	if serial == "" || source == "" || userText == "" {
		t.Skip("set MONVIEW_MEDIA_TEST_SERIAL, MONVIEW_MEDIA_TEST_IMAGE, and MONVIEW_MEDIA_TEST_USER")
	}
	userID, err := strconv.Atoi(userText)
	if err != nil || userID < 0 {
		t.Fatalf("invalid MONVIEW_MEDIA_TEST_USER %q", userText)
	}
	data, err := os.ReadFile(source)
	if err != nil {
		t.Fatal(err)
	}
	prefix := fmt.Sprintf("monview_batch_live_%d", time.Now().Unix())
	tempDir := t.TempDir()
	paths := make([]string, 3)
	for index := range paths {
		paths[index] = filepath.Join(tempDir, fmt.Sprintf("%s_%d.png", prefix, index+1))
		if err := os.WriteFile(paths[index], data, 0600); err != nil {
			t.Fatal(err)
		}
	}
	repeats := 1
	if text := os.Getenv("MONVIEW_MEDIA_TEST_REPEATS"); text != "" {
		repeats, err = strconv.Atoi(text)
		if err != nil || repeats < 1 {
			t.Fatalf("invalid MONVIEW_MEDIA_TEST_REPEATS %q", text)
		}
	}
	for run := 1; run <= repeats; run++ {
		runPaths := make([]string, len(paths))
		for index, sourcePath := range paths {
			runPaths[index] = filepath.Join(
				tempDir,
				fmt.Sprintf("%s_r%d_%d.png", prefix, run, index+1),
			)
			if err := os.Rename(sourcePath, runPaths[index]); err != nil {
				if err := os.WriteFile(runPaths[index], data, 0600); err != nil {
					t.Fatal(err)
				}
			}
		}
		body, err := json.Marshal(map[string]interface{}{
			"udid":       serial,
			"userId":     userID,
			"localPaths": runPaths,
		})
		if err != nil {
			t.Fatal(err)
		}
		request := httptest.NewRequest(
			http.MethodPost,
			"/api/goog/device/push-local-file",
			bytes.NewReader(body),
		)
		recorder := httptest.NewRecorder()
		handlePushLocalFile(recorder, request)
		t.Logf("device rows use prefix %s_r%d", prefix, run)
		t.Logf("response %d: %s", run, recorder.Body.String())
		if recorder.Code != http.StatusOK {
			t.Fatalf("live media batch %d failed with status %d", run, recorder.Code)
		}
		paths = runPaths
	}
}
