@echo off
title Khoi Dong Go Backend + Client
color 0A

:: Chuyển tới thư mục chứa script này (server-go)
cd /d "%~dp0"

echo ==================================================
echo       KHOI DONG GO BACKEND + CLIENT
echo ==================================================
echo.

echo [1/2] Dang khoi dong Server (Go Backend) tai cong 11000...
start "Solumate Server Go" cmd /c "title Solumate Server Go && color 0B && echo DANG CHAY GO SERVER... && server-go.exe"

echo [2/2] Dang khoi dong Client (Frontend) tai cong 5173...
start "Solumate Client" cmd /c "cd /d "%~dp0..\client" && title Solumate Client && color 0D && echo DANG CHAY CLIENT DEV... && npm run dev"

echo [3/3] Cho 5 giay de he thong on dinh...
timeout /t 5 /nobreak >nul

echo.
echo ==================================================
echo Da xong! Dang mo trinh duyet...
echo ==================================================
start http://localhost:5173/

exit
