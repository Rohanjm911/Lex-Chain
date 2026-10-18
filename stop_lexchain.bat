@echo off
setlocal EnableDelayedExpansion
title LexChain — System Stopper

echo ===============================================================================
echo     LEXCHAIN: Stopping All Components
echo ===============================================================================
echo.

:: 1. Stop Desktop Application (lexchain.exe)
echo [*] Stopping LexChain Desktop Application...
taskkill /f /im lexchain.exe >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [+] LexChain desktop app stopped.
) else (
    echo [*] LexChain desktop app was not running.
)

:: 2. Stop EVM Node process on port 8545
echo [*] Checking for process listening on port 8545...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8545') do (
    set "PID=%%a"
    if defined PID (
        if not "!PID!"=="0" (
            echo [*] Terminating EVM node process PID: !PID!
            taskkill /f /pid !PID! >nul 2>&1
        )
    )
)

echo.
echo ===============================================================================
echo [+] All LexChain components have been cleanly stopped!
echo ===============================================================================
echo.
pause
exit /b 0
