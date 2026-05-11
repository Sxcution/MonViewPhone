import psutil
import time
import os
import sys
from datetime import datetime

# <!-- [monitor_adb.py] : Script giám sát các lệnh ADB được thực thi trên hệ thống -->
# Script này theo dõi các tiến trình adb.exe mới và ghi lại dòng lệnh đầy đủ.

LOG_FILE = "adb_commands_log.txt"

def monitor_adb():
    # Sử dụng tiếng Anh cho output console để tránh lỗi Unicode trên terminal Windows cũ
    print(f"[*] Monitoring ADB commands... Logging to {LOG_FILE}")
    print("[*] Press Ctrl+C to stop.")
    
    # Tập hợp các PID đã xử lý để tránh log lặp lại
    # <!-- [processed_pids] : Danh sách PID đã được ghi log -->
    processed_pids = set()

    try:
        while True:
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    # Kiểm tra nếu tiến trình là adb.exe
                    # <!-- [proc_name] : Tên tiến trình -->
                    proc_name = proc.info['name']
                    if proc_name and proc_name.lower() == 'adb.exe':
                        pid = proc.info['pid']
                        
                        if pid not in processed_pids:
                            # <!-- [cmdline] : Dòng lệnh đầy đủ của adb -->
                            cmdline = proc.info['cmdline']
                            if cmdline:
                                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
                                log_entry = f"[{timestamp}] PID: {pid} | Command: {' '.join(cmdline)}"
                                
                                # Ghi vào file (luôn dùng utf-8)
                                with open(LOG_FILE, "a", encoding="utf-8") as f:
                                    f.write(log_entry + "\n")
                                
                                # In ra console
                                try:
                                    print(log_entry)
                                except UnicodeEncodeError:
                                    # Fallback nếu console không hỗ trợ ký tự lạ (thường adb cmd không có)
                                    print(f"[{timestamp}] PID: {pid} | Command logged to file.")
                                
                            processed_pids.add(pid)
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    continue
            
            # Dọn dẹp set processed_pids
            # Chỉ giữ lại các PID vẫn đang chạy để tránh set phình to
            try:
                current_pids = {p.pid for p in psutil.process_iter(['pid'])}
                processed_pids &= current_pids
            except:
                pass
            
            # Đợi 0.1s để không ngốn CPU nhưng bắt được các lệnh chạy nhanh
            time.sleep(0.1) 
            
    except KeyboardInterrupt:
        print("\n[*] Monitoring stopped.")

if __name__ == "__main__":
    monitor_adb()
