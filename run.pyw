import ctypes
from ctypes import wintypes
import os
import socket
import sys
import time
import subprocess
import threading
import webbrowser
from PIL import Image, ImageDraw, ImageFont
from pystray import Icon as TrayIcon, Menu as TrayMenu, MenuItem as TrayMenuItem

# Global references to the subprocesses
go_process = None
npm_process = None
instance_mutex = None

APP_NAME = "MonViewPhone"
BASE_URL = "http://localhost:5173/"
BACKEND_PORT = 11000
FRONTEND_PORT = 5173
APP_MUTEX_NAME = r"Local\MonViewPhone_SingleInstance"


def open_app(icon=None, item=None):
    # Try opening with Chrome app mode
    try:
        # Check if Chrome is available and open in standalone app mode
        # Chrome is usually installed in Program Files or Program Files (x86)
        chrome_paths = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            "chrome"
        ]
        opened = False
        for path in chrome_paths:
            try:
                # Test running the process
                subprocess.Popen(
                    [path, f"--app={BASE_URL}"],
                    creationflags=subprocess.CREATE_NO_WINDOW
                )
                opened = True
                break
            except FileNotFoundError:
                continue
        
        if not opened:
            # Fallback to start chrome command
            subprocess.Popen(
                ["cmd", "/c", f"start chrome --app={BASE_URL}"],
                creationflags=subprocess.CREATE_NO_WINDOW
            )
    except Exception:
        # Fallback to default browser
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
        # Da co launcher dang quan ly server/frontend, khong start them tien trinh moi.
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

    # Start server-go.exe in its directory
    server_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "server-go")
    exe_path = os.path.join(server_dir, "server-go.exe")
    if os.path.exists(exe_path):
        go_process = subprocess.Popen(
            [exe_path],
            cwd=server_dir,
            creationflags=subprocess.CREATE_NO_WINDOW
        )


def start_frontend():
    global npm_process

    # Neu Vite da lang nghe cong 5173 thi khong start them npm run dev.
    if is_port_open(FRONTEND_PORT):
        npm_process = None
        return

    # Start npm run dev in client directory
    client_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "client")
    npm_process = subprocess.Popen(
        ["cmd", "/c", "npm run dev"],
        cwd=client_dir,
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
    global go_process, npm_process

    terminate_process(go_process)
    terminate_process(npm_process)
    go_process = None
    npm_process = None


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

    start_backend()
    start_frontend()
    
    # Wait for servers to start
    time.sleep(3)
    
    open_app()
    
    icon = create_tray_icon()
    icon.run()


if __name__ == "__main__":
    # Ensure working directory is the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    main()
