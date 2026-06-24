import zipfile
import os

zip_path = r"C:\Users\Mon\Desktop\Protect\MonViewPhone\xiaowei\tools\xwdb.zip"

def list_zip(path):
    if not os.path.exists(path):
        print("File not found")
        return
    
    print(f"Listing zip: {path}")
    with zipfile.ZipFile(path, "r") as z:
        for info in z.infolist():
            print(f"{info.filename:50} | {info.file_size:10} bytes")

if __name__ == "__main__":
    list_zip(zip_path)
