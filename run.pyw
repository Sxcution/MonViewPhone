import os
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

APP_NAME = "MonViewPhone"
BASE_URL = "http://localhost:5173/"

def start_backend():
    global go_process
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
    # Start npm run dev in client directory
    client_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "client")
    npm_process = subprocess.Popen(
        ["cmd", "/c", "npm run dev"],
        cwd=client_dir,
        creationflags=subprocess.CREATE_NO_WINDOW
    )

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

def clean_up():
    global go_process, npm_process
    if go_process:
        go_process.terminate()
        go_process.wait()
    if npm_process:
        # Since npm run dev starts child processes, kill the process tree
        subprocess.run(
            ["taskkill", "/F", "/T", "/PID", str(npm_process.pid)],
            creationflags=subprocess.CREATE_NO_WINDOW
        )
        npm_process.terminate()
        npm_process.wait()
    # Also taskkill server-go.exe to make sure it's dead
    subprocess.run(
        ["taskkill", "/F", "/IM", "server-go.exe"],
        creationflags=subprocess.CREATE_NO_WINDOW
    )

def exit_application(icon, item):
    icon.stop()
    clean_up()

def create_tray_icon():
    width, height = 64, 64
    image = Image.new('RGB', (width, height), color='#2596be')
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype("arial.ttf", 40)
        draw.text((15, 8), "P", fill="#ffffff", font=font)
    except Exception:
        draw.text((15, 10), "P", fill="#ffffff")

    menu = TrayMenu(
        TrayMenuItem("Open MonViewPhone", open_app, default=True),
        TrayMenuItem("Exit", exit_application)
    )

    icon = TrayIcon(APP_NAME, image, APP_NAME, menu)
    return icon

def main():
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
