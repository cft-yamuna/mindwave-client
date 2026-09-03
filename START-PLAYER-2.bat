@echo off
REM Double-click this file to join a match as Player 2.
cd /d "%~dp0"

if not exist node_modules (
    echo First run - installing dependencies, please wait...
    call npm install
    echo.
)

node app.js
echo.
echo ============================================
echo  Stopped. Press any key to close this window.
echo ============================================
pause >nul
