import os

pe_path = r"C:\Users\Mon\Desktop\Protect\MonViewPhone\xiaowei\xiaowei.exe"

def analyze_exe(path):
    if not os.path.exists(path):
        print("File not found")
        return
    
    size = os.path.getsize(path)
    print(f"Size: {size} bytes ({size / 1024 / 1024:.2f} MB)")
    
    with open(path, "rb") as f:
        data = f.read(100 * 1024 * 1024) # Read up to 100MB
        
        # Check signatures
        signatures = {
            b"go.buildid": "Go compiler signature",
            b"rustc": "Rust compiler signature",
            b"PyInstaller": "PyInstaller signature",
            b"UPX!": "UPX compression signature",
            b"electron.asar": "Electron / ASAR signature",
            b"node.js": "Node.js signature",
            b"V8 version": "V8 JavaScript Engine signature",
            b"Microsoft.NET": ".NET runtime signature",
            b"Qt": "Qt framework signature"
        }
        
        found = False
        for sig, name in signatures.items():
            if sig in data:
                print(f"Found signature: {name} (contains {sig})")
                found = True
        
        if not found:
            print("No standard runtime/framework signatures found in first 100MB.")

if __name__ == "__main__":
    analyze_exe(pe_path)
