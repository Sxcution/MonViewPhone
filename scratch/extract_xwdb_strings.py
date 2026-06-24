import zipfile
import re
import os

zip_path = r"C:\Users\Mon\Desktop\Protect\MonViewPhone\xiaowei\tools\xwdb.zip"

def extract_xwdb_strings(path):
    if not os.path.exists(path):
        print("File not found")
        return
    
    with zipfile.ZipFile(path, "r") as z:
        data = z.read("system/bin/xwdb")
        
    print("Searching for ASCII strings...")
    ascii_strings = re.findall(b"[a-zA-Z0-9_/\\.\\-\\:\\?&=%\\+]{6,}", data)
    
    # We will search for interesting keywords
    keywords = [
        b"adb", b"socket", b"port", b"shell", b"exec", b"bridge", b"input",
        b"touch", b"key", b"event", b"scrcpy", b"com.genymobile", b"write",
        b"server", b"client", b"system", b"debug", b"log", b"listen"
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
            print(f"\n--- Matches for: {kw.decode('ascii')} (Count: {len(unique_strings)}) ---")
            for s in unique_strings[:15]:
                print(s)

if __name__ == "__main__":
    extract_xwdb_strings(zip_path)
