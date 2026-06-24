import re
import os

pe_path = r"C:\Users\Mon\Desktop\Protect\MonViewPhone\xiaowei\xiaowei.exe"

def extract_strings(path):
    if not os.path.exists(path):
        print("File not found")
        return
    
    print("Reading file...")
    with open(path, "rb") as f:
        data = f.read()
    
    print("Searching for ASCII strings...")
    # Find ascii strings of length >= 6
    ascii_strings = re.findall(b"[a-zA-Z0-9_/\\.\\-\\:\\?&=%\\+]{6,}", data)
    
    # We will search for interesting keywords
    keywords = [
        b"scrcpy", b"genymobile", b"app_process", b"adb", b"websocket", b"socket", 
        b"XWCaptureScreen", b"xiaowei", b"bridge", b"ws://", b"http://", b"sys_config",
        b"ffmpeg", b"codec", b"encoder", b"bitrate", b"fps", b"width", b"height",
        b"packet", b"h264", b"avc", b"hevc", b"h265", b"screen", b"capture",
        b"OMX.", b"cabi", b"rust", b"slint", b"qmetaobject", b"cxx-qt", b"qt"
    ]
    
    matches = {}
    for kw in keywords:
        matches[kw] = []
        
    for s in ascii_strings:
        for kw in keywords:
            if kw.lower() in s.lower():
                matches[kw].append(s.decode("ascii", errors="ignore"))
                
    for kw, string_list in matches.items():
        unique_strings = sorted(list(set(string_list)))
        if unique_strings:
            print(f"\n--- Matches for keyword: {kw.decode('ascii')} (Count: {len(unique_strings)}) ---")
            # Print up to 40 strings for this keyword to avoid cluttering
            for s in unique_strings[:40]:
                print(s)
            if len(unique_strings) > 40:
                print(f"... and {len(unique_strings) - 40} more")

if __name__ == "__main__":
    extract_strings(pe_path)
