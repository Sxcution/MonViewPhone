@echo off
title Start MCP Workspace Server
cls
echo ==================================================
echo   KHOI DONG MCP WORKSPACE SERVER
echo ==================================================
echo.

:: Run MCP Server in a new window
echo [1/2] Dang khoi dong MCP Server tai port 3000...
start "MCP Server" cmd /k "cd mcp-workspace-server && npm run start"

:: Wait for server to initialize
timeout /t 3 /nobreak > nul

echo.
echo [2/2] Chon cong cu expose cong 3000 ra Internet:
echo --------------------------------------------------
echo   [1] Localtunnel (Mac dinh - Khong can dang ky tai khoan)
echo   [2] Ngrok (On dinh hon - Yeu cau da dang nhap ngrok tren may)
echo --------------------------------------------------
set /p choice="Nhap lua chon cua ban (1 hoac 2, mac dinh la 1): "

if "%choice%"=="2" (
    echo.
    echo Dang khoi dong Ngrok...
    start "Ngrok Tunnel" cmd /k "ngrok http 3000"
    echo.
    echo ==================================================
    echo  KHOI DONG THANH CONG VOI NGROK!
    echo.
    echo  - Vui long lay URL HTTPS tai cua so Ngrok Tunnel vua mo.
    echo  - Token xac thuc Bearer cua ban: test-token-123-abc
    echo  - Tai lieu huong dan cau hinh chi tiet tai:
    echo    docs/CHATGPT_SETUP.md
    echo ==================================================
) else (
    echo.
    echo Dang khoi dong Localtunnel...
    start "Localtunnel" cmd /k "npx localtunnel --port 3000"
    echo.
    echo ==================================================
    echo  KHOI DONG THANH CONG VOI LOCALTUNNEL!
    echo.
    echo  - Vui long lay URL HTTPS tai cua so Localtunnel vua mo.
    echo  - Token xac thuc Bearer cua ban: test-token-123-abc
    echo  - Tai lieu huong dan cau hinh chi tiet tai:
    echo    docs/CHATGPT_SETUP.md
    echo ==================================================
)

echo.
pause
