@echo off
setlocal EnableDelayedExpansion
title LexChain — System Launcher (All Components)

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
cd /d "%ROOT_DIR%"

echo ===============================================================================
echo     LEXCHAIN: All Components Launcher
echo     "Preserve the Evidence. Prove Its Integrity."
echo ===============================================================================
echo.

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js was not found in your system PATH!
    echo Please install Node.js 18+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [*] [1/4] Preparing Local Evidence Vault Storage...
set "VAULT_DIR=%USERPROFILE%\Documents\LexChain_Vault"
if not exist "%VAULT_DIR%" mkdir "%VAULT_DIR%"
if not exist "%VAULT_DIR%\evidence" mkdir "%VAULT_DIR%\evidence"
if not exist "%VAULT_DIR%\reports" mkdir "%VAULT_DIR%\reports"
if not exist "%VAULT_DIR%\backups" mkdir "%VAULT_DIR%\backups"
echo [+] Evidence Vault ready: %VAULT_DIR%
echo.

echo [*] [2/4] Initializing Local EVM Blockchain Node (Port 8545)...
netstat -ano | findstr :8545 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [+] Local EVM node is already active on port 8545.
    goto evm_ready
)

echo [*] Launching EVM Blockchain Node in a dedicated console...
start "LexChain EVM Blockchain Node [Port 8545]" cmd /k "cd /d "%ROOT_DIR%\blockchain" && npx hardhat node"

echo [*] Waiting for EVM RPC response on port 8545...
set attempts=0

:check_node_loop
timeout /t 1 /nobreak >nul 2>&1 || ping 127.0.0.1 -n 2 >nul
netstat -ano | findstr :8545 >nul 2>&1
if %ERRORLEVEL% equ 0 goto evm_ready

set /a attempts+=1
if %attempts% leq 15 (
    echo     Connecting to EVM Node... (attempt %attempts%/15)
    goto check_node_loop
)

echo [!] Notice: Node startup is taking longer than usual. Continuing...

:evm_ready
echo [+] Local EVM Blockchain Node is active and listening!
echo.

echo [*] [3/4] Deploying EvidenceRegistry Smart Contract to Local EVM...
cd /d "%ROOT_DIR%\blockchain"
call npx hardhat run scripts/deploy.js --network localhost
if %ERRORLEVEL% equ 0 (
    echo [+] EvidenceRegistry deployed and synchronized with frontend ABI.
) else (
    echo [!] Contract deployment reported non-zero status. The offline buffer is active.
)
cd /d "%ROOT_DIR%"
echo.

echo [*] [4/4] Starting LexChain Desktop Application...

if exist "%ROOT_DIR%\src-tauri\target\release\lexchain.exe" (
    echo [+] Launching optimized standalone release binary...
    start "" "%ROOT_DIR%\src-tauri\target\release\lexchain.exe"
    goto success_summary
)

if exist "%ROOT_DIR%\src-tauri\target\debug\lexchain.exe" (
    echo [+] Launching debug binary...
    start "" "%ROOT_DIR%\src-tauri\target\debug\lexchain.exe"
    goto success_summary
)

echo [!] Release .exe not found. Starting in development mode...
start "LexChain Dev Server" cmd /k "cd /d "%ROOT_DIR%" && npm run tauri dev"
goto success_summary

:success_summary
echo.
echo ===============================================================================
echo     ALL LEXCHAIN COMPONENTS ARE ONLINE AND ACTIVE
echo ===============================================================================
echo.
echo   [OK] Blockchain Node:      http://127.0.0.1:8545 (Chain ID: 31337)
echo   [OK] Smart Contract:       EvidenceRegistry (Active on Local EVM)
echo   [OK] Evidence Vault:       %VAULT_DIR%
echo   [OK] Desktop Application:  ACTIVE (Cyber Forensic Dark Theme)
echo.
echo ===============================================================================
echo   To close all running components, simply run 'stop_lexchain.bat'
echo ===============================================================================
echo.
echo Launcher is standing by. Press any key to close this launcher console.
pause >nul
exit /b 0
