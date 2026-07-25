import ctypes
from ctypes import wintypes
import json
import os
import socket
import subprocess
import sys
import time
import urllib.request
import webbrowser
from PIL import Image, ImageDraw, ImageFont
from pystray import Icon as TrayIcon, Menu as TrayMenu, MenuItem as TrayMenuItem

APP_NAME = "MonViewPhone V2"
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_URL = "http://localhost:11000/"
BACKEND_PORT = 11000
STREAM_NODE_PORT = 11080
STREAM_NODE_BUILD_ID = "tango-v2-uhid-control-1"
APP_MUTEX_NAME = r"Local\MonViewPhoneV2_SingleInstance"

instance_mutex = None
go_process = None
stream_node_process = None
go_log_file = None
stream_node_log_file = None


def logs_dir():
    path = os.path.join(ROOT_DIR, "logs")
    os.makedirs(path, exist_ok=True)
    return path


def log_launcher(message):
    line = f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {message}\n"
    try:
        with open(os.path.join(logs_dir(), "launcher.log"), "a", encoding="utf-8") as f:
            f.write(line)
    except Exception:
        pass


def show_error(title, message):
    log_launcher(f"{title}: {message}")
    try:
        ctypes.windll.user32.MessageBoxW(0, message, title, 0x10)
    except Exception:
        print(f"[{title}] {message}", file=sys.stderr)


def acquire_single_instance_lock():
    global instance_mutex
    if os.name != "nt":
        return True
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.CreateMutexW.argtypes = [wintypes.LPVOID, wintypes.BOOL, wintypes.LPCWSTR]
    kernel32.CreateMutexW.restype = wintypes.HANDLE
    instance_mutex = kernel32.CreateMutexW(None, False, APP_MUTEX_NAME)
    if instance_mutex and ctypes.get_last_error() == 183:
        open_app()
        return False
    return True


def is_port_open(port):
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.4):
            return True
    except OSError:
        return False


def pid_on_port(port):
    try:
        out = subprocess.check_output(
            "netstat -ano -p tcp",
            shell=True,
            creationflags=subprocess.CREATE_NO_WINDOW,
        ).decode("utf-8", errors="ignore")
        for line in out.splitlines():
            parts = line.split()
            if len(parts) >= 5 and parts[0].upper() == "TCP" and parts[1].endswith(f":{port}") and parts[3].upper() == "LISTENING":
                try:
                    return int(parts[4])
                except ValueError:
                    return None
    except Exception as e:
        log_launcher(f"pid_on_port({port}) failed: {e}")
    return None


def process_name(pid):
    try:
        out = subprocess.check_output(
            f'tasklist /FI "PID eq {pid}" /FO CSV /NH',
            shell=True,
            creationflags=subprocess.CREATE_NO_WINDOW,
        ).decode("utf-8", errors="ignore").strip()
        if out and "INFO:" not in out:
            return out.split(",")[0].strip('"')
    except Exception as e:
        log_launcher(f"process_name({pid}) failed: {e}")
    return ""


def kill_pid(pid, reason=""):
    log_launcher(f"Killing PID {pid}. {reason}")
    try:
        subprocess.run(
            f"taskkill /F /PID {pid}",
            shell=True,
            creationflags=subprocess.CREATE_NO_WINDOW,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception as e:
        log_launcher(f"kill_pid({pid}) failed: {e}")


def http_get_json(url, timeout=1.0):
    handler = urllib.request.ProxyHandler({})
    opener = urllib.request.build_opener(handler)
    req = urllib.request.Request(url)
    with opener.open(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8", errors="ignore"))


def check_go_ready():
    if not is_port_open(BACKEND_PORT):
        return False
    try:
        handler = urllib.request.ProxyHandler({})
        opener = urllib.request.build_opener(handler)
        req = urllib.request.Request(BASE_URL)
        with opener.open(req, timeout=1.0) as response:
            text = response.read(4096).decode("utf-8", errors="ignore").lower()
            return response.status == 200 and ("html" in text or "monview" in text or "phone" in text)
    except Exception as e:
        log_launcher(f"check_go_ready failed: {e}")
        return False


def stream_node_health():
    if not is_port_open(STREAM_NODE_PORT):
        return None
    try:
        return http_get_json(f"http://127.0.0.1:{STREAM_NODE_PORT}/healthz", timeout=1.0)
    except Exception as e:
        log_launcher(f"stream_node_health failed: {e}")
        return None


def check_stream_node_ready():
    data = stream_node_health()
    return bool(
        data
        and data.get("ok") is True
        and data.get("name") == "monviewphone-stream-node"
        and data.get("buildId") == STREAM_NODE_BUILD_ID
    )


def start_backend():
    global go_process, go_log_file
    pid = pid_on_port(BACKEND_PORT)
    if pid:
        name = process_name(pid).lower()
        if name == "server-go.exe" or check_go_ready():
            log_launcher(f"Reusing Go backend on {BACKEND_PORT}, PID={pid}")
            return
        show_error("Cổng 11000 bị chiếm", f"Cổng 11000 đang bị chiếm bởi {process_name(pid) or 'ứng dụng khác'} (PID {pid}).")
        sys.exit(1)

    exe = os.path.join(ROOT_DIR, "server-go", "server-go.exe")
    if not os.path.exists(exe):
        show_error("Thiếu server-go.exe", "Thiếu file server-go/server-go.exe. Chạy build_v2_all.bat trước.")
        sys.exit(1)

    log_path = os.path.join(logs_dir(), "server-go-current.log")
    go_log_file = open(log_path, "w", encoding="utf-8")
    go_log_file.write(f"--- START Go Backend {time.strftime('%Y-%m-%d %H:%M:%S')} ---\n")
    go_log_file.flush()
    log_launcher(f"Starting Go backend: {exe}")
    go_process = subprocess.Popen([exe], cwd=os.path.dirname(exe), stdout=go_log_file, stderr=subprocess.STDOUT, creationflags=subprocess.CREATE_NO_WINDOW)


def ensure_stream_node_built():
    stream_dir = os.path.join(ROOT_DIR, "stream-node")
    dist_index = os.path.join(stream_dir, "dist", "index.js")
    node_modules = os.path.join(stream_dir, "node_modules")
    if os.path.exists(dist_index) and os.path.isdir(node_modules):
        return
    setup_bat = os.path.join(ROOT_DIR, "setup_stream_node.bat")
    if not os.path.exists(setup_bat):
        show_error("Thiếu setup_stream_node.bat", "Không tìm thấy setup_stream_node.bat để cài stream-node.")
        sys.exit(1)
    result = subprocess.run([setup_bat], cwd=ROOT_DIR, capture_output=True, text=True, creationflags=subprocess.CREATE_NO_WINDOW)
    if result.returncode != 0:
        show_error("Lỗi setup stream-node", f"Không setup được stream-node.\n\n{result.stderr or result.stdout}")
        sys.exit(1)


def start_stream_node():
    global stream_node_process, stream_node_log_file
    pid = pid_on_port(STREAM_NODE_PORT)
    if pid:
        data = stream_node_health()
        name = process_name(pid).lower()
        if data and data.get("name") == "monviewphone-stream-node" and data.get("buildId") == STREAM_NODE_BUILD_ID:
            log_launcher(f"Reusing matching stream-node build {STREAM_NODE_BUILD_ID}, PID={pid}")
            return
        if data and data.get("name") == "monviewphone-stream-node":
            kill_pid(pid, f"Old stream-node buildId={data.get('buildId')!r}, expected={STREAM_NODE_BUILD_ID}")
            time.sleep(1.0)
        elif name == "node.exe":
            kill_pid(pid, "node.exe on stream-node port 11080; restarting MonViewPhoneV2 stream-node")
            time.sleep(1.0)
        else:
            show_error("Cổng 11080 bị chiếm", f"Cổng 11080 đang bị chiếm bởi {process_name(pid) or 'ứng dụng khác'} (PID {pid}).")
            sys.exit(1)

    ensure_stream_node_built()
    stream_dir = os.path.join(ROOT_DIR, "stream-node")
    dist_index = os.path.join(stream_dir, "dist", "index.js")
    if not os.path.exists(dist_index):
        show_error("Thiếu stream-node/dist/index.js", "stream-node chưa build đúng. Chạy build_v2_all.bat trước.")
        sys.exit(1)

    log_path = os.path.join(logs_dir(), "stream-node-current.log")
    stream_node_log_file = open(log_path, "w", encoding="utf-8")
    stream_node_log_file.write(f"--- START stream-node {time.strftime('%Y-%m-%d %H:%M:%S')} build={STREAM_NODE_BUILD_ID} ---\n")
    stream_node_log_file.flush()
    log_launcher(f"Starting stream-node build {STREAM_NODE_BUILD_ID}: node {dist_index}")
    env = os.environ.copy()
    stream_node_process = subprocess.Popen(["node", dist_index], cwd=stream_dir, env=env, stdout=stream_node_log_file, stderr=subprocess.STDOUT, creationflags=subprocess.CREATE_NO_WINDOW)


def terminate_process(process):
    if not process:
        return
    try:
        process.terminate()
        process.wait(timeout=3)
    except Exception:
        try: process.kill()
        except Exception: pass


def cleanup():
    global go_process, stream_node_process, go_log_file, stream_node_log_file
    log_launcher("Cleaning up launcher-owned processes")
    terminate_process(stream_node_process)
    terminate_process(go_process)
    stream_node_process = None
    go_process = None
    for f in (go_log_file, stream_node_log_file):
        try:
            if f: f.close()
        except Exception:
            pass
    go_log_file = None
    stream_node_log_file = None


def open_app(icon=None, item=None):
    chrome_paths = [r"C:\Program Files\Google\Chrome\Application\chrome.exe", r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe", "chrome"]
    for path in chrome_paths:
        try:
            subprocess.Popen([
                path, 
                f"--app={BASE_URL}",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding"
            ], creationflags=subprocess.CREATE_NO_WINDOW)
            return
        except Exception:
            continue
    webbrowser.open(BASE_URL)


def kill_chrome_app():
    log_launcher("Closing current Chrome App window...")
    cmd = (
        f"powershell -NoProfile -ExecutionPolicy Bypass -Command "
        f"\"Get-CimInstance Win32_Process -Filter \\\"Name = 'chrome.exe'\\\" | "
        f"Where-Object {{ $_.CommandLine -like '*--app=http://localhost:{BACKEND_PORT}*' }} | "
        f"ForEach-Object {{ Stop-Process -Id $_.ProcessId -Force }}\""
    )
    try:
        subprocess.run(
            cmd,
            shell=True,
            creationflags=subprocess.CREATE_NO_WINDOW,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except Exception as e:
        log_launcher(f"kill_chrome_app failed: {e}")


def exit_application(icon, item):
    icon.stop()
    kill_chrome_app()
    cleanup()
    sys.exit(0)


def restart_application(icon, item):
    icon.stop()
    kill_chrome_app()
    cleanup()
    subprocess.Popen([sys.executable] + sys.argv, cwd=ROOT_DIR, creationflags=subprocess.CREATE_NO_WINDOW)
    sys.exit(0)


def create_tray_icon():
    icon_path = os.path.join(ROOT_DIR, "assets", "IconMonViewPhone.png")
    image = None
    if os.path.exists(icon_path):
        try: image = Image.open(icon_path)
        except Exception: image = None
    if image is None:
        image = Image.new("RGB", (64, 64), color="#2596be")
        draw = ImageDraw.Draw(image)
        try: draw.text((15, 8), "V", fill="#ffffff", font=ImageFont.truetype("arial.ttf", 40))
        except Exception: draw.text((15, 10), "V", fill="#ffffff")
    menu = TrayMenu(TrayMenuItem("Open", open_app, default=True), TrayMenuItem("Restart", restart_application), TrayMenuItem("Exit", exit_application))
    return TrayIcon(APP_NAME, image, APP_NAME, menu)


def validate_files():
    if not os.path.exists(os.path.join(ROOT_DIR, "client", "dist", "index.html")):
        show_error("Chưa build frontend", "Thiếu client/dist/index.html. Chạy build_v2_all.bat trước."); sys.exit(1)
    jar1 = os.path.join(ROOT_DIR, "stream-node", "vendor", "scrcpy-server-v3.3.4.jar")
    jar2 = os.path.join(ROOT_DIR, "server-go", "bin", "scrcpy-server-v3.3.4.jar")
    if not os.path.exists(jar1) and not os.path.exists(jar2):
        show_error("Thiếu scrcpy-server-v3.3.4.jar", f"Thiếu jar ở:\n{jar1}\nhoặc\n{jar2}"); sys.exit(1)


def wait_ready(label, predicate, seconds, log_file):
    for _ in range(int(seconds * 2)):
        if predicate(): return True
        time.sleep(0.5)
    show_error(f"Lỗi khởi động {label}", f"Không khởi động được {label}.\nXem log: {log_file}"); cleanup(); sys.exit(1)


def main():
    if not acquire_single_instance_lock(): return
    os.chdir(ROOT_DIR)
    validate_files(); start_backend(); start_stream_node()
    wait_ready("Go backend 11000", check_go_ready, 20, os.path.join(logs_dir(), "server-go-current.log"))
    wait_ready("stream-node 11080", check_stream_node_ready, 20, os.path.join(logs_dir(), "stream-node-current.log"))
    open_app()
    try:
        log_launcher("Starting system tray icon..."); create_tray_icon().run()
    except Exception as e:
        log_launcher(f"Failed tray icon: {e}")
        try:
            while True: time.sleep(10)
        finally: cleanup()


if __name__ == "__main__":
    main()
