import os

xw_path = r"C:\Users\Mon\Desktop\Protect\MonViewPhone\xiaowei\backupData\2026-06-21_0-4.xw"

def inspect_xw(path):
    if not os.path.exists(path):
        print("File not found")
        return
    
    with open(path, "rb") as f:
        header = f.read(256)
        print(f"Header hex: {header.hex()}")
        print(f"Header text: {header}")
        
if __name__ == "__main__":
    inspect_xw(xw_path)
