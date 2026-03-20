@echo off
title PulseWriteX - Stop All Servers
color 0C

echo ============================================
echo    PulseWriteX - Stopping All Servers
echo ============================================
echo.

echo [1/3] Stopping Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
echo       Node.js stopped.

echo [2/3] Stopping Python processes...
taskkill /F /IM python.exe >nul 2>&1
echo       Python stopped (AI Backend).

echo [3/3] Stopping MySQL...
taskkill /F /IM mysqld.exe >nul 2>&1
echo       MySQL stopped.

echo.
echo ============================================
echo    All Servers Stopped!
echo ============================================
echo.
echo    Press any key to close...
pause > nul
