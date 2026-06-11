import os
import shutil
import json
import sqlite3
import sys
from datetime import datetime

# Configure stdout/stderr to use UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# 1. Create backup folder YYYYMMDD-HHMMSS
now_str = datetime.now().strftime("%Y%m%d-%H%M%S")
backup_dir = f"c:\\Users\\Mon\\Desktop\\Protect\\MonViewPhone\\Backup\\pre-fix-settings-post-vault-sync-{now_str}"
os.makedirs(backup_dir, exist_ok=True)
print(f"Created backup directory: {backup_dir}")

# 2. Source paths
src_settings = "c:\\Users\\Mon\\Desktop\\Protect\\MonViewPhone\\server-go\\settings.json"
src_db = "c:\\Users\\Mon\\Desktop\\Protect\\MonViewPhone\\server-go\\data\\Data.db"
src_db_wal = "c:\\Users\\Mon\\Desktop\\Protect\\MonViewPhone\\server-go\\data\\Data.db-wal"
src_db_shm = "c:\\Users\\Mon\\Desktop\\Protect\\MonViewPhone\\server-go\\data\\Data.db-shm"

# Copy files if they exist
for src in [src_settings, src_db, src_db_wal, src_db_shm]:
    if os.path.exists(src):
        dst = os.path.join(backup_dir, os.path.basename(src))
        shutil.copy2(src, dst)
        print(f"Copied {src} to {dst}")

# 3. Read settings.json
settings_devices = 0
settings_wechat = 0
settings_has_emma = False
tile_order_count = 0
tile_order_numbers_count = 0

if os.path.exists(src_settings):
    try:
        with open(src_settings, "r", encoding="utf-8") as f:
            settings_data = json.load(f)
            
        vault_str = settings_data.get("monviewphone:device-account-vault")
        if vault_str:
            vault = json.loads(vault_str)
            devices = vault.get("devices", {})
            settings_devices = len(devices)
            
            for dev in devices.values():
                wechat_list = dev.get("platforms", {}).get("wechat", [])
                settings_wechat += len(wechat_list)
                for acc in wechat_list:
                    if "Emma Zhao" in acc.get("name", ""):
                        settings_has_emma = True
                        
        tile_order_str = settings_data.get("tileOrder")
        if tile_order_str:
            tile_order = json.loads(tile_order_str)
            if isinstance(tile_order, list):
                tile_order_count = len(tile_order)
                
        tile_order_numbers_str = settings_data.get("tileOrderNumbers")
        if tile_order_numbers_str:
            tile_order_numbers = json.loads(tile_order_numbers_str)
            if isinstance(tile_order_numbers, dict):
                tile_order_numbers_count = len(tile_order_numbers)
    except Exception as e:
        print(f"Error parsing settings.json: {e}")

# 4. Read Data.db
db_devices = 0
db_wechat = 0
db_has_emma = False

if os.path.exists(src_db):
    try:
        conn = sqlite3.connect(src_db)
        cursor = conn.cursor()
        
        # Count devices
        cursor.execute("SELECT COUNT(*) FROM devices")
        db_devices = cursor.fetchone()[0]
        
        # Count WeChat accounts
        cursor.execute("SELECT COUNT(*) FROM accounts WHERE platform = 'wechat'")
        db_wechat = cursor.fetchone()[0]
        
        # Check for Emma Zhao
        cursor.execute("SELECT COUNT(*) FROM accounts WHERE name LIKE '%Emma Zhao%'")
        db_has_emma = cursor.fetchone()[0] > 0
        
        conn.close()
    except Exception as e:
        print(f"Error querying Data.db: {e}")

# 5. Safety thresholds check
devices_ok = db_devices >= 35
wechat_ok = db_wechat >= 104
emma_ok = db_has_emma
tile_order_ok = tile_order_count >= 35 and tile_order_numbers_count >= 35

passed = devices_ok and wechat_ok and emma_ok and tile_order_ok

report_content = f"""THỜI GIAN BACKUP & VERIFY: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
THƯ MỤC BACKUP: {backup_dir}

KẾT QUẢ PHÂN TÍCH TẬP TIN HOẠT ĐỘNG:
- [settings.json]:
  * Số lượng thiết bị (devices) trong vault: {settings_devices}
  * Tổng số tài khoản WeChat trong vault: {settings_wechat}
  * Có chứa Emma Zhao trong vault: {'CÓ' if settings_has_emma else 'KHÔNG'}
  * Cấu hình tileOrder: {tile_order_count} máy
  * Cấu hình tileOrderNumbers: {tile_order_numbers_count} máy

- [Data.db]:
  * Số lượng thiết bị (devices): {db_devices}
  * Tổng số tài khoản WeChat (accounts): {db_wechat}
  * Có chứa Emma Zhao: {'CÓ' if db_has_emma else 'KHÔNG'}

TRẠNG THÁI VERIFY: {'PASSED - AN TOÀN' if passed else 'FAILED - KHÔNG AN TOÀN'}
"""

report_path = os.path.join(backup_dir, "BACKUP_VERIFY_REPORT.txt")
with open(report_path, "w", encoding="utf-8") as f:
    f.write(report_content)

print(report_content)
if not passed:
    print("CRITICAL: Safety thresholds not met! Exiting with error to STOP coding task.")
    sys.exit(1)
else:
    print("SUCCESS: Pre-flight safety checks passed.")
    sys.exit(0)
