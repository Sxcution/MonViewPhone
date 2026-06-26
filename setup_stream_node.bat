@echo off
setlocal
cd /d "%~dp0stream-node"

echo [MonViewPhoneV2] Installing stream-node dependencies...
call npm install
if errorlevel 1 goto :error

echo [MonViewPhoneV2] Building stream-node...
call npm run build
if errorlevel 1 goto :error

echo [MonViewPhoneV2] Done.
exit /b 0

:error
echo [MonViewPhoneV2] setup_stream_node failed.
exit /b 1
