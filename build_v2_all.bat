@echo off
setlocal
cd /d "%~dp0"

echo =====================================================
echo [MonViewPhoneV2] Building all components...
echo =====================================================

echo.
echo [1/3] Building stream-node...
cd /d "%~dp0stream-node"
call npm install
if errorlevel 1 goto :error
call npm run build
if errorlevel 1 goto :error

echo.
echo [2/3] Building client (frontend)...
cd /d "%~dp0client"
call npm install
if errorlevel 1 goto :error
call npm run build
if errorlevel 1 goto :error

echo.
echo [3/3] Building Go backend...
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
