@echo off
cd /d "%~dp0"
echo Checking for Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Install from https://nodejs.org then run this again.
    echo See SETUP-WINDOWS.md for details.
    pause
    exit /b 1
)
if not exist node_modules (
    echo Installing dependencies (first run)...
    call npm install
    if errorlevel 1 ( pause & exit /b 1 )
)
echo.
echo Starting dev server at http://localhost:3000
echo Press Ctrl+C to stop.
echo.
call npm run dev
pause
