import urllib.request
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

url = "http://localhost:11000/api/goog/device/settings"

def post_settings(payload):
    req_data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=req_data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            return response.getcode(), res_data
    except urllib.error.HTTPError as e:
        err_text = e.read().decode('utf-8')
        return e.code, err_text
    except Exception as e:
        return 999, str(e)

# Test 1: Empty body {}
print("Testing empty body {}...")
code, resp = post_settings({})
print(f"Status: {code}, Response: {resp}")
assert code == 400 and "empty payload" in resp.lower()

# Test 2: Empty key ""
print("\nTesting empty key...")
code, resp = post_settings({"": "some-value"})
print(f"Status: {code}, Response: {resp}")
assert code == 400 and "empty key" in resp.lower()

# Test 3: Null value
print("\nTesting null value...")
code, resp = post_settings({"some-key": None})
print(f"Status: {code}, Response: {resp}")
assert code == 400 and "null value" in resp.lower()

# Test 4: short tileOrder
print("\nTesting short tileOrder (<35 length)...")
code, resp = post_settings({"tileOrder": json.dumps(["device1", "device2"])})
print(f"Status: {code}, Response: {resp}")
assert code == 400 and "tileorder" in resp.lower() and "minimum 35" in resp.lower()

# Test 5: short tileOrderNumbers
print("\nTesting short tileOrderNumbers (<35 keys)...")
code, resp = post_settings({"tileOrderNumbers": json.dumps({"device1": 1, "device2": 2})})
print(f"Status: {code}, Response: {resp}")
assert code == 400 and "tileordernumbers" in resp.lower() and "minimum 35" in resp.lower()

# Test 6: non-string value
print("\nTesting non-string value...")
code, resp = post_settings({"syncTimeHotkey": 1234})
print(f"Status: {code}, Response: {resp}")
assert code == 400 and "must be a string" in resp.lower()

# Test 7: Valid patch (should succeed and merge)
print("\nTesting valid syncTimeHotkey save...")
code, resp = post_settings({"syncTimeHotkey": "Ctrl+Shift+T"})
print(f"Status: {code}, Response: {resp}")
assert code == 200

# Verify it was saved and merged
try:
    with urllib.request.urlopen(url, timeout=5) as response:
        settings = json.loads(response.read().decode('utf-8'))
        hotkey = settings.get("syncTimeHotkey")
        print(f"Verified saved hotkey: {hotkey}")
        assert hotkey == "Ctrl+Shift+T"
except Exception as e:
    print(f"Verification failed: {e}")
    sys.exit(1)

# Clean up hotkey (POST empty string, which is in allowlist)
print("\nTesting clean up hotkey (empty string)...")
code, resp = post_settings({"syncTimeHotkey": ""})
print(f"Status: {code}, Response: {resp}")
assert code == 200

# Verify cleaned up
try:
    with urllib.request.urlopen(url, timeout=5) as response:
        settings = json.loads(response.read().decode('utf-8'))
        hotkey = settings.get("syncTimeHotkey")
        print(f"Verified cleaned hotkey: {hotkey}")
        assert hotkey == ""
except Exception as e:
    print(f"Verification failed: {e}")
    sys.exit(1)

print("\nALL BACKEND GUARD TESTS PASSED SUCCESSFULLY!")
