import os
import shutil

src = r"C:\Program Files (x86)\xiaowei"
dst = r"C:\Users\Mon\Desktop\Protect\MonViewPhone\xiaowei"

def copy_dir(src, dst):
    if not os.path.exists(dst):
        os.makedirs(dst)
    
    for item in os.listdir(src):
        s = os.path.join(src, item)
        d = os.path.join(dst, item)
        
        if os.path.isdir(s):
            # Skip large folders if any, but let's copy normally
            print(f"Copying directory {item}...")
            shutil.copytree(s, d, dirs_exist_ok=True)
        else:
            # Skip huge APK files to save time and space
            if item.endswith(".apk"):
                print(f"Skipping huge APK file: {item}")
                continue
            print(f"Copying file {item}...")
            shutil.copy2(s, d)

if __name__ == "__main__":
    print(f"Starting copy from {src} to {dst}...")
    copy_dir(src, dst)
    print("Copy completed successfully!")
