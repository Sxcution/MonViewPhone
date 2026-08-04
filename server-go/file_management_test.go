package main

import (
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

func TestNormalizeAndroidPath(t *testing.T) {
	tests := []struct {
		name      string
		raw       string
		allowRoot bool
		want      string
		wantErr   bool
	}{
		{name: "spaces", raw: "/storage/emulated/0/My Files/a.txt", want: "/storage/emulated/0/My Files/a.txt"},
		{name: "newline filename", raw: "/storage/emulated/0/a\nb.txt", want: "/storage/emulated/0/a\nb.txt"},
		{name: "clean traversal", raw: "/sdcard/Download/../a.txt", want: "/sdcard/a.txt"},
		{name: "root allowed", raw: "/", allowRoot: true, want: "/"},
		{name: "root file rejected", raw: "/", wantErr: true},
		{name: "relative rejected", raw: "sdcard/a.txt", wantErr: true},
		{name: "NUL rejected", raw: "/sdcard/a\x00b.txt", wantErr: true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got, err := normalizeAndroidPath(test.raw, test.allowRoot)
			if (err != nil) != test.wantErr || got != test.want {
				t.Fatalf("normalizeAndroidPath(%q) = %q, %v; want %q, error=%v", test.raw, got, err, test.want, test.wantErr)
			}
		})
	}
}

func TestValidateDeleteAndroidPath(t *testing.T) {
	for _, safe := range []string{
		"/sdcard/Download/a.txt",
		"/mnt/sdcard/Download/a.txt",
		"/storage/self/primary/Download/a.txt",
		"/storage/emulated/0/Download/a.txt",
		"/storage/emulated/12/Download/a.txt",
	} {
		if got, err := validateDeleteAndroidPath(safe); err != nil || got != safe {
			t.Fatalf("safe path %q rejected: got %q, err=%v", safe, got, err)
		}
	}
	for _, dangerous := range []string{
		"/",
		"/sdcard",
		"/storage/emulated/0",
		"/storage/emulated/not-a-user/a.txt",
		"/sdcard/../system/build.prop",
		"/data/local/tmp/a.txt",
		"/system/build.prop",
	} {
		if _, err := validateDeleteAndroidPath(dangerous); err == nil {
			t.Fatalf("dangerous path %q was accepted", dangerous)
		}
	}
}

func TestPhoneDirectoryListingKeepsNewlinesAndMetadata(t *testing.T) {
	got, err := parsePhoneDirectoryListing(
		"/sdcard/Download",
		fileListSentinel+"\x00 leading\nnewline.txt\x00f\x00123\x001721234567\x00Folder Name\x00d\x004096\x001721234568\x00",
	)
	if err != nil {
		t.Fatal(err)
	}
	want := []phoneFileEntry{
		{
			Name:       " leading\nnewline.txt",
			Path:       "/sdcard/Download/ leading\nnewline.txt",
			Size:       123,
			ModifiedAt: 1721234567,
		},
		{
			Name:       "Folder Name",
			Path:       "/sdcard/Download/Folder Name",
			IsDir:      true,
			Size:       4096,
			ModifiedAt: 1721234568,
		},
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("parsePhoneDirectoryListing() = %#v; want %#v", got, want)
	}
}

func TestPhoneDirectoryListingRejectsPartialRecord(t *testing.T) {
	if _, err := parsePhoneDirectoryListing("/sdcard", "partial\nname"); err == nil {
		t.Fatal("partial non-NUL record was accepted")
	}
	if _, err := parsePhoneDirectoryListing("/sdcard", "wrong\x00"); err == nil {
		t.Fatal("listing without the sentinel was accepted")
	}
}

func TestExportPathAndCollisionName(t *testing.T) {
	root := filepath.Join("C:", "MonViewPhone")
	if got, want := exportDirectory(root, "192.168.1.2:5555"), filepath.Join(root, "exports", "192.168.1.2_5555"); got != want {
		t.Fatalf("exportDirectory() = %q; want %q", got, want)
	}
	tests := map[int]string{
		0: "backup.json",
		1: "backup (1).json",
		2: "backup (2).json",
	}
	for index, want := range tests {
		if got := collisionFileName("backup.json", index); got != want {
			t.Fatalf("collisionFileName(%d) = %q; want %q", index, got, want)
		}
	}
	if got := safeLocalSegment("CON.json", "fallback"); got != "_CON.json" {
		t.Fatalf("safeLocalSegment() = %q; want %q", got, "_CON.json")
	}
}

func TestFinalizeExportCollisionAndCleanup(t *testing.T) {
	dir := t.TempDir()
	existingPath := filepath.Join(dir, "backup.json")
	if err := os.WriteFile(existingPath, []byte("old"), 0644); err != nil {
		t.Fatal(err)
	}
	partPath, err := createExportPart(dir)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(partPath, []byte("complete"), 0644); err != nil {
		t.Fatal(err)
	}

	savedPath, err := finalizeExportFile(partPath, dir, "backup.json")
	if err != nil {
		t.Fatal(err)
	}
	if want := filepath.Join(dir, "backup (1).json"); savedPath != want {
		t.Fatalf("finalizeExportFile() = %q; want %q", savedPath, want)
	}
	if got, err := os.ReadFile(existingPath); err != nil || string(got) != "old" {
		t.Fatalf("existing export changed: %q, %v", got, err)
	}
	if got, err := os.ReadFile(savedPath); err != nil || string(got) != "complete" {
		t.Fatalf("saved export = %q, %v; want complete", got, err)
	}
	if _, err := os.Stat(partPath); !os.IsNotExist(err) {
		t.Fatalf("part file was not cleaned: %v", err)
	}
}
