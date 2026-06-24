import os
import re

bridge_path = r"C:\Users\Mon\Desktop\Protect\MonViewPhone\xiaowei\bridge.exe"

def analyze_bridge(path):
    if not os.path.exists(path):
        print("File not found")
        return
    
    size = os.path.getsize(path)
    print(f"Size: {size} bytes ({size / 1024 / 1024:.2f} MB)")
    
    with open(path, "rb") as f:
        data = f.read(10 * 1024 * 1024)
        
        signatures = {
            b"go.buildid": "Go compiler signature",
            b"rustc": "Rust compiler signature",
            b"PyInstaller": "PyInstaller signature",
            b"UPX!": "UPX compression signature",
            b"Microsoft.NET": ".NET runtime signature",
        }
        
        for sig, name in signatures.items():
            if sig in data:
                print(f"Found signature: {name}")
                
        # Extract keywords
        ascii_strings = re.findall(b"[a-zA-Z0-9_/\\.\\-\\:\\?&=%\\+]{6,}", data)
        keywords = [b"scrcpy", b"adb", b"socket", b"websocket", b"xiaowei", b"port", b"bridge"]
        
        matches = {kw: [] for kw in keywords}
        for s in ascii_strings:
            for kw in keywords:
                if kw.lower() in s.lower():
                    matches[kw].append(s.decode("ascii", errors="ignore"))
                    
        for kw, string_list in matches.items():
            unique_strings = sorted(list(set(string_list)))
            if unique_strings:
                print(f"\n--- Matches for: {kw.decode('ascii')} (Count: {len(unique_strings)}) ---")
                for s in unique_strings[:15]:
                    print(s)

if __name__ == "__main__":
    analyze_bridge(bridge_path)
