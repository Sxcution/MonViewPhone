package main

import "testing"

func TestShouldRepushAppHelper(t *testing.T) {
	for output, want := range map[string]bool{
		"ClassNotFoundException: com.monviewphone.appmanagement.AppManagerHelper":                             true,
		"Could not find or load main class com.monviewphone.appmanagement.AppManagerHelper":                   true,
		"Failed to open dex file /data/local/tmp/monview-app-management.jar":                                  true,
		"adb command failed: err=exit status 134 stderr=\"Assertion failed: src == nullptr\" output: Aborted": false,
		"ClassNotFoundException: com.samsung.android.calendar.LiveIconLoader":                                 false,
		"java.lang.NoClassDefFoundError: com.samsung.android.calendar.LiveIconLoader\n\tat com.monviewphone.appmanagement.AppManagerHelper.main(AppManagerHelper.java:105)\nCaused by: java.lang.ClassNotFoundException: Didn't find class \"com.samsung.android.calendar.LiveIconLoader\"": false,
		"Failed to open dex file /data/local/tmp/some-other-helper.jar": false,
	} {
		if got := shouldRepushAppHelper(output); got != want {
			t.Fatalf("shouldRepushAppHelper(%q) = %v, want %v", output, got, want)
		}
	}
}
