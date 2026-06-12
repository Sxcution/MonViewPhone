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
vite_process = None
chrome_process = None
current_mode = None
instance_mutex = None

APP_NAME = "MonViewPhone"
BASE_URL = "http://localhost:11000/"
NORMAL_URL = "http://localhost:11000/"
DEV_URL = "http://localhost:5173/"
BACKEND_PORT = 11000
VITE_PORT = 5173
LAUNCHER_CONFIG_FILE = "launcher_config.json"
CHROME_PROFILE_DIR = "chrome-profile"
APP_MUTEX_NAME = r"Local\MonViewPhone_SingleInstance"


def load_launcher_mode():
    try:
        if os.path.exists(LAUNCHER_CONFIG_FILE):
            with open(LAUNCHER_CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                mode = data.get("mode")
                if mode in ["normal", "dev"]:
                    return mode
    except Exception:
        pass
    return "normal"


def save_launcher_mode(mode):
    try:
        with open(LAUNCHER_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump({"mode": mode}, f, indent=2)
    except Exception as e:
        print(f"Failed to save launcher config: {e}")


def get_app_url(mode):
    if mode == "dev":
        return DEV_URL
    return NORMAL_URL


def show_error_message(title, message):
    try:
        ctypes.windll.user32.MessageBoxW(0, message, title, 0x10)  # 0x10 is MB_ICONERROR
    except Exception:
        print(f"[{title}] {message}", file=sys.stderr)


def verify_data_safety():
    url = f"{BASE_URL}api/goog/device/settings"
    try:
        # Give Go server a bit of time to respond, up to 15 retries
        data = None
        for attempt in range(15):
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'MonViewPhone-Launcher'})
                with urllib.request.urlopen(req, timeout=2) as response:
                    if response.status == 200:
                        data = json.loads(response.read().decode('utf-8'))
                        break
            except Exception:
                time.sleep(0.5)
        else:
            return False, "Không thể kết nối đến backend server để kiểm tra dữ liệu."
        
        # Check keys
        vault_str = data.get("monviewphone:device-account-vault")
        if not vault_str:
            return False, "Thiếu trường dữ liệu tài khoản (monviewphone:device-account-vault) trên server."
            
        try:
            vault = json.loads(vault_str)
        except Exception as e:
            return False, f"Không thể giải mã JSON vault: {e}"
            
        devices = vault.get("devices", {})
        device_count = len(devices)
        
        wechat_account_count = 0
        total_account_count = 0
        has_emma_zhao = False
        
        for udid, dev in devices.items():
            platforms = dev.get("platforms", {})
            for platform, accounts in platforms.items():
                if isinstance(accounts, list):
                    total_account_count += len(accounts)
                    if platform == "wechat":
                        wechat_account_count += len(accounts)
                    for acc in accounts:
                        if acc and "Emma Zhao" in acc.get("name", ""):
                            has_emma_zhao = True

        tile_order_str = data.get("tileOrder")
        tile_order_ok = False
        tile_order_count = 0
        if tile_order_str:
            try:
                tile_order = json.loads(tile_order_str)
                if isinstance(tile_order, list):
                    tile_order_count = len(tile_order)
                    if tile_order_count >= 35:
                        tile_order_ok = True
            except Exception:
                pass
                
        tile_order_numbers_str = data.get("tileOrderNumbers")
        tile_order_numbers_ok = False
        tile_order_numbers_count = 0
        if tile_order_numbers_str:
            try:
                tile_order_numbers = json.loads(tile_order_numbers_str)
                if isinstance(tile_order_numbers, dict):
                    tile_order_numbers_count = len(tile_order_numbers)
                    if tile_order_numbers_count >= 35:
                        tile_order_numbers_ok = True
            except Exception:
                pass

        # Check conditions
        core_passed = (
            device_count >= 35 and 
            wechat_account_count >= 104 and 
            has_emma_zhao
        )
        
        if not core_passed:
            err_msg = (
                "DATA SAFETY CHECK FAILED - không mở app để tránh ghi đè dữ liệu!\n\n"
                f"- Số thiết bị trong vault: {device_count} (Yêu cầu >= 35)\n"
                f"- Số tài khoản WeChat: {wechat_account_count} (Yêu cầu >= 104)\n"
                f"- Tìm thấy Emma Zhao: {'CÓ' if has_emma_zhao else 'KHÔNG'}\n\n"
                "Vui lòng tắt launcher, restore lại settings.json / Data.db từ thư mục Backup mới nhất trước khi chạy lại."
            )
            return False, err_msg
            
        if not tile_order_ok or not tile_order_numbers_ok:
            print("[Auto-Repair] tileOrder or tileOrderNumbers missing/incomplete. Backend will repair on load.")
            
        return True, ""
    except Exception as e:
        return False, f"Lỗi xảy ra trong quá trình verify dữ liệu: {e}"


def close_app_window():
    global chrome_process
    if chrome_process:
        try:
            chrome_process.terminate()
            chrome_process.wait(timeout=2)
        except Exception:
            try:
                chrome_process.kill()
            except Exception:
                pass
        chrome_process = None
        
    try:
        ps_command = (
            f"Get-CimInstance Win32_Process -Filter \"name = 'chrome.exe'\" | "
            f"Where-Object {{ $_.CommandLine -like '*{CHROME_PROFILE_DIR}*' }} | "
            f"ForEach-Object {{ Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }}"
        )
        subprocess.run(
            ["powershell", "-NoProfile", "-Command", ps_command],
            creationflags=subprocess.CREATE_NO_WINDOW,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except Exception as e:
        print(f"Fallback close window failed: {e}")


def open_app(icon=None, item=None, mode=None):
    global chrome_process, current_mode
    if mode is None:
        mode = current_mode or load_launcher_mode()
        
    url = get_app_url(mode)
    close_app_window()
    
    project_root = os.path.dirname(os.path.abspath(__file__))
    profile_dir = os.path.join(project_root, CHROME_PROFILE_DIR)
    
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        "chrome"
    ]
    opened = False
    for path in chrome_paths:
        try:
            chrome_process = subprocess.Popen(
                [path, f"--user-data-dir={profile_dir}", f"--app={url}"],
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            opened = True
            break
        except FileNotFoundError:
            continue
            
    if not opened:
        try:
            chrome_process = subprocess.Popen(
                ["cmd", "/c", "start", "chrome", f"--user-data-dir={profile_dir}", f"--app={url}"],
                creationflags=subprocess.CREATE_NO_WINDOW
            )
        except Exception:
            webbrowser.open(url)


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


def start_vite_dev_server():
    global vite_process
    
    if is_port_open(VITE_PORT):
        return True
        
    client_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "client")
    
    # Try npm run dev
    try:
        vite_process = subprocess.Popen(
            ["cmd", "/c", "npm", "run", "dev"],
            cwd=client_dir,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
    except Exception as e:
        print(f"Failed to start Vite with npm: {e}")
        try:
            vite_process = subprocess.Popen(
                ["cmd", "/c", "npm.cmd", "run", "dev"],
                cwd=client_dir,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
        except Exception as e2:
            print(f"Failed to start Vite with npm.cmd: {e2}")
            show_error_message(
                "Lỗi khởi động Vite",
                f"Không thể khởi chạy npm run dev. Lỗi: {e2}"
            )
            return False
            
    # Wait for port 5173 to be open
    vite_ready = False
    for _ in range(40):
        if is_port_open(VITE_PORT):
            vite_ready = True
            break
        time.sleep(0.5)
        
    if not vite_ready:
        show_error_message(
            "Lỗi khởi động",
            "Không thể khởi động Dev Mode / Vite ở cổng 5173"
        )
        return False
        
    return True


def stop_vite_dev_server():
    global vite_process
    
    if vite_process:
        try:
            vite_process.terminate()
            vite_process.wait(timeout=2)
        except Exception:
            try:
                vite_process.kill()
            except Exception:
                pass
        vite_process = None
        
    try:
        ps_command = (
            "Get-CimInstance Win32_Process -Filter \"name = 'node.exe'\" | "
            "Where-Object { $_.CommandLine -like '*vite*' -and ($_.CommandLine -like '*client*' -or $_.CommandLine -like '*MonViewPhone*') } | "
            "ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
        )
        subprocess.run(
            ["powershell", "-NoProfile", "-Command", ps_command],
            creationflags=subprocess.CREATE_NO_WINDOW,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except Exception as e:
        print(f"Fallback stop vite server failed: {e}")


def clean_up():
    global go_process
    close_app_window()
    stop_vite_dev_server()
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


def switch_mode(icon, mode):
    global current_mode
    
    if mode == "normal":
        dist_html = os.path.join(os.path.dirname(os.path.abspath(__file__)), "client", "dist", "index.html")
        if not os.path.exists(dist_html):
            show_error_message(
                "Chưa build frontend",
                "Chưa build frontend. Vui lòng chạy:\n\ncd client && npm run build\n\ntrước khi khởi động ở Normal Mode."
            )
            return

    if mode == current_mode:
        close_app_window()
        ensure_mode_ready(mode)
        open_app(mode=mode)
        return

    save_launcher_mode(mode)
    current_mode = mode

    close_app_window()

    if mode == "normal":
        stop_vite_dev_server()
    else:
        start_vite_dev_server()

    ensure_mode_ready(mode)
    open_app(mode=mode)


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
        TrayMenuItem(
            "Khởi chạy mode",
            TrayMenu(
                TrayMenuItem(
                    "Dev Mode",
                    lambda icon, item: switch_mode(icon, "dev"),
                    checked=lambda item: current_mode == "dev"
                ),
                TrayMenuItem(
                    "Normal Mode",
                    lambda icon, item: switch_mode(icon, "normal"),
                    checked=lambda item: current_mode == "normal"
                ),
            )
        ),
        TrayMenuItem("Restart", restart_application),
        TrayMenuItem("Exit", exit_application)
    )

    icon = TrayIcon(APP_NAME, image, APP_NAME, menu)
    return icon


def ensure_mode_ready(mode):
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
        return False

    if mode == "normal":
        stop_vite_dev_server()
    elif mode == "dev":
        if not start_vite_dev_server():
            return False
            
    return True


def main():
    global current_mode
    if not acquire_single_instance_lock():
        return

    current_mode = load_launcher_mode()

    # Check index.html build first (only in normal mode)
    if current_mode == "normal":
        dist_html = os.path.join(os.path.dirname(os.path.abspath(__file__)), "client", "dist", "index.html")
        if not os.path.exists(dist_html):
            show_error_message(
                "Chưa build frontend",
                "Chưa build frontend. Vui lòng chạy:\n\ncd client && npm run build\n\ntrước khi khởi động ứng dụng."
            )
            sys.exit(1)

    if not ensure_mode_ready(current_mode):
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
    open_app(mode=current_mode)
    
    icon = create_tray_icon()
    icon.run()


if __name__ == "__main__":
    # Ensure working directory is the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    main()
