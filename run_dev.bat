@echo off
TITLE ScriptFlow Enterprise - Dev Server
echo ===================================================
echo   Starting SCRIPTFLOW ENTERPRISE (Tauri + React)
echo ===================================================
echo.

:: Switch to the directory where this batch file is located
cd /d "%~dp0apps\desktop"

:: Use CALL when running npm.cmd to prevent premature batch exit
call npm run tauri dev

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to start Tauri dev environment with npm.
    echo Trying fallback via npx tauri dev...
    call npx tauri dev
)

pause
