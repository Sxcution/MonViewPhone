@echo off
title Khoi Dong Go Backend Air + Client
color 0A

cd /d "%~dp0"

where air >nul 2>nul
if errorlevel 1 (
  echo Khong tim thay air.exe.
  echo Chay lenh sau roi mo lai file nay:
  echo go install github.com/air-verse/air@latest
  pause
  exit /b 1
)

echo ==================================================
echo       KHOI DONG GO BACKEND HOT RELOAD + CLIENT
echo ==================================================
echo.

echo [1/2] Dang khoi dong Server Go bang Air tai cong 11000...
start "MonViewPhone Server Go Air" cmd /k "cd /d ""%~dp0"" && title MonViewPhone Server Go Air && color 0B && set "MONVIEWPHONE_GO_PORT=11000" && air"

echo [2/2] Dang khoi dong Client tai cong 5173...
start "MonViewPhone Client" cmd /k "cd /d ""%~dp0..\client"" && title MonViewPhone Client && color 0D && npm run dev"

echo [3/3] Cho 5 giay de he thong on dinh...
timeout /t 5 /nobreak >nul

echo.
echo ==================================================
echo Da xong! Dang mo trinh duyet...
echo ==================================================
start http://localhost:5173/

exit
