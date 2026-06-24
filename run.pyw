import ctypes
from ctypes import wintypes
import os
import socket
import sys
import time
import subprocess
import urllib.request
import json
import webbrowser
from PIL import Image, ImageDraw, ImageFont
from pystray import Icon as TrayIcon, Menu as TrayMenu, MenuItem as TrayMenuItem

# Global references to the subprocesses
go_process = None
instance_mutex = None

APP_NAME = "MonViewPhone"
BASE_URL = "http://localhost:11000/"
BACKEND_PORT = 11000
APP_MUTEX_NAME = r"Local\MonViewPhone_SingleInstance"


def show_error_message(title, message):
    try:
        ctypes.windll.user32.MessageBoxW(0, message, title, 0x10)  # 0x10 is MB_ICONERROR
    except Exception:
        print(f"[{title}] {message}", file=sys.stderr)


def verify_data_safety():
    return True, ""


def open_app(icon=None, item=None):
    # Try opening with Chrome app mode
    try:
        chrome_paths = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            "chrome"
        ]
        opened = False
        for path in chrome_paths:
            try:
                subprocess.Popen(
                    [path, f"--app={BASE_URL}"],
                    creationflags=subprocess.CREATE_NO_WINDOW
                )
                opened = True
                break
            except FileNotFoundError:
                continue
        
        if not opened:
            subprocess.Popen(
                ["cmd", "/c", f"start chrome --app={BASE_URL}"],
                creationflags=subprocess.CREATE_NO_WINDOW
            )
    except Exception:
        webbrowser.open(BASE_URL)


def acquire_single_instance_lock():
    """Chi cho phep 1 launcher MonViewPhone chay cung luc."""
    global instance_mutex

    if os.name != "nt":
        return True

    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.CreateMutexW.argtypes = [wintypes.LPVOID, wintypes.BOOL, wintypes.LPCWSTR]
    kernel32.CreateMutexW.restype = wintypes.HANDLE

    instance_mutex = kernel32.CreateMutexW(None, False, APP_MUTEX_NAME)
    if not instance_mutex:
        return True

    if ctypes.get_last_error() == 183:  # ERROR_ALREADY_EXISTS
        open_app()
        return False

    return True


def is_port_open(port, host="127.0.0.1"):
    try:
        with socket.create_connection((host, port), timeout=0.35):
            return True
    except OSError:
        return False


def start_backend():
    global go_process

    # Neu backend da lang nghe cong 11000 thi khong start them server-go.exe.
    if is_port_open(BACKEND_PORT):
        go_process = None
        return

    server_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "server-go")
    exe_path = os.path.join(server_dir, "server-go.exe")
    if os.path.exists(exe_path):
        go_process = subprocess.Popen(
            [exe_path],
            cwd=server_dir,
            creationflags=subprocess.CREATE_NO_WINDOW
        )


def terminate_process(process):
    if not process:
        return

    try:
        process.terminate()
        process.wait(timeout=3)
    except Exception:
        pass


def clean_up():
    global go_process

    terminate_process(go_process)
    go_process = None


def exit_application(icon, item):
    icon.stop()
    clean_up()


def restart_application(icon, item):
    icon.stop()
    clean_up()
    script_dir = os.path.dirname(os.path.abspath(__file__))
    subprocess.Popen(
        [sys.executable] + sys.argv,
        cwd=script_dir,
        creationflags=subprocess.CREATE_NO_WINDOW
    )
    sys.exit(0)


def create_tray_icon():
    icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "IconMonViewPhone.png")
    image = None
    if os.path.exists(icon_path):
        try:
            image = Image.open(icon_path)
        except Exception as e:
            print(f"Failed to load tray icon image: {e}")

    if image is None:
        width, height = 64, 64
        image = Image.new('RGB', (width, height), color='#2596be')
        draw = ImageDraw.Draw(image)
        try:
            font = ImageFont.truetype("arial.ttf", 40)
            draw.text((15, 8), "P", fill="#ffffff", font=font)
        except Exception:
            draw.text((15, 10), "P", fill="#ffffff")

    menu = TrayMenu(
        TrayMenuItem("Open", open_app, default=True),
        TrayMenuItem("Restart", restart_application),
        TrayMenuItem("Exit", exit_application)
    )

    icon = TrayIcon(APP_NAME, image, APP_NAME, menu)
    return icon


def main():
    if not acquire_single_instance_lock():
        return

    # Check index.html build first
    dist_html = os.path.join(os.path.dirname(os.path.abspath(__file__)), "client", "dist", "index.html")
    if not os.path.exists(dist_html):
        show_error_message(
            "Chưa build frontend",
            "Chưa build frontend. Vui lòng chạy:\n\ncd client && npm run build\n\ntrước khi khởi động ứng dụng."
        )
        sys.exit(1)

    start_backend()
    
    # Wait for backend to listen
    backend_ready = False
    for _ in range(30):
        if is_port_open(BACKEND_PORT):
            backend_ready = True
            break
        time.sleep(0.5)

    if not backend_ready:
        show_error_message(
            "Lỗi khởi động",
            "Không thể kết nối đến server-go.exe ở cổng 11000 sau 15 giây."
        )
        sys.exit(1)

    # Perform data safety check
    ok, error_msg = verify_data_safety()
    if not ok:
        show_error_message(
            "DATA SAFETY CHECK FAILED",
            error_msg
        )
        clean_up()
        sys.exit(1)

    # Open Chrome App
    open_app()
    
    icon = create_tray_icon()
    icon.run()


if __name__ == "__main__":
    # Ensure working directory is the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    main()
