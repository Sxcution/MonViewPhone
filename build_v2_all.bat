@echo off
setlocal
cd /d "%~dp0"

echo =====================================================
echo [MonViewPhoneV2] Building all components...
echo =====================================================

echo.
echo [1/4] Building stream-node...
cd /d "%~dp0stream-node"
call npm install
if errorlevel 1 goto :error
call npm run build
if errorlevel 1 goto :error

echo.
echo [2/4] Building client (frontend)...
cd /d "%~dp0client"
call npm install
if errorlevel 1 goto :error
call npm run build
if errorlevel 1 goto :error

echo.
echo [3/4] Building Monhelper...
cd /d "%~dp0..\Build APK\Monhelper"
powershell -NoProfile -ExecutionPolicy Bypass -File build-helper.ps1
if errorlevel 1 goto :error

echo.
echo [4/4] Building Go backend...
cd /d "%~dp0server-go"
go build -o server-go.exe .
if errorlevel 1 goto :error

echo.
echo =====================================================
echo [MonViewPhoneV2] Build ALL completed successfully!
echo =====================================================
pause
exit /b 0

:error
echo.
echo [MonViewPhoneV2] Build failed at some stage.
pause
exit /b 1
