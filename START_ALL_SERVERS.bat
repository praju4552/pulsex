@echo off
title PulseWriteX - Start All Servers
color 0A

echo ============================================
echo    PulseWriteX - Starting All Servers
echo ============================================
echo.

:: ─────────────────────────────────────────────
:: 1. START MySQL Database Server
:: ─────────────────────────────────────────────
echo [1/4] Starting MySQL Database Server (port 3306)...
start "" "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --defaults-file=C:\ProgramData\MySQL\my.ini
timeout /t 5 /nobreak > nul
echo       MySQL started on port 3306
echo.

:: ─────────────────────────────────────────────
:: 2. START Node.js Backend Server
:: ─────────────────────────────────────────────
echo [2/4] Starting Node.js Backend Server (port 3001)...
start "Node Backend" cmd /k "cd /d d:\pulsex(prototyping)\backend-node && npm run dev"
timeout /t 3 /nobreak > nul
echo       Node.js backend started on port 3001
echo.

:: ─────────────────────────────────────────────
:: 3. START Python AI Backend Server
:: ─────────────────────────────────────────────
echo [3/4] Starting Python AI Backend Server (port 8000)...
start "Python Backend" cmd /k "cd /d d:\pulsex(prototyping)\backend && python -m uvicorn api.app:app --host 127.0.0.1 --port 8000"
timeout /t 3 /nobreak > nul
echo       Python AI backend started on port 8000
echo.

:: ─────────────────────────────────────────────
:: 4. START Vite Frontend Dev Server
:: ─────────────────────────────────────────────
echo [4/4] Starting Vite Frontend Dev Server (port 5173)...
start "Frontend" cmd /k "cd /d d:\pulsex(prototyping) && npm run dev"
timeout /t 3 /nobreak > nul
echo       Vite frontend started on port 5173
echo.

echo ============================================
echo    All Servers Started Successfully!
echo ============================================
echo.
echo    MySQL Database    : localhost:3306
echo    Node.js Backend   : http://localhost:3001
echo    Python AI Backend : http://localhost:8000
echo    Frontend (Vite)   : http://localhost:5173
echo.
echo    Press any key to close this launcher...
pause > nul
