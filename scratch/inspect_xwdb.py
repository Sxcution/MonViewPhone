import zipfile
import os

zip_path = r"C:\Users\Mon\Desktop\Protect\MonViewPhone\xiaowei\tools\xwdb.zip"

def inspect_xwdb(path):
    if not os.path.exists(path):
        print("File not found")
        return
    
    with zipfile.ZipFile(path, "r") as z:
        data = z.read("system/bin/xwdb")
        print(f"Size: {len(data)} bytes")
        # ELF signature is usually \x7fELF
        if data.startswith(b"\x7fELF"):
            print("Verified: It is an Android ELF executable!")
            # Check if 32-bit or 64-bit
            # Byte 5: 1 = 32-bit, 2 = 64-bit
            bit_type = data[4]
            if bit_type == 1:
                print("Architecture: 32-bit ARM")
            elif bit_type == 2:
                print("Architecture: 64-bit ARM (ARM64)")
            else:
                print(f"Unknown architecture byte: {bit_type}")
        else:
            print("It is NOT an ELF file.")
            
if __name__ == "__main__":
    inspect_xwdb(zip_path)
