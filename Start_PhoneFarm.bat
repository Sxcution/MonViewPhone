@echo off
title Khoi Dong Solumate Steam PhoneFarm
color 0A

echo ==================================================
echo       KHOI DONG HE THONG STREAM PHONEFARM
echo ==================================================
echo.

echo [1/3] Dang khoi dong Server (Node Backend) tai cong 11000...
start "Solumate Server (DUNG TAT MAY NAY)" cmd /c "cd server && title Solumate Server && color 0B && echo DANG CHAY SERVER... && npm run start"

echo [2/3] Dang khoi dong Client (Frontend) tai cong 5173...
start "Solumate Client (DUNG TAT MAY NAY)" cmd /c "cd client && title Solumate Client && color 0D && echo DANG CHAY CLIENT DEV... && npm run dev"

echo [3/3] Dang be phong... Cho 5 giay de he thong on dinh...
timeout /t 5 /nobreak >nul

echo.
echo ==================================================
echo Da xong! Dang tien hanh tu dong mo trinh duyet...
echo ==================================================
start http://localhost:5173/

exit
