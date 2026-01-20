@echo off
setlocal

echo ===================================================
echo   Web DAW - Rapid Development Launcher
echo   (MySQL in Docker + Local Node.js App)
echo ===================================================
echo.

:: 1. Check Server Environment File
if not exist "server\.env" (
    echo [!] 'server\.env' not found. Creating from example...
    copy "server\.env.example" "server\.env" >nul
    echo [!] Please edit 'server\.env' to add your AWS_KEYS and GOOGLE_AUTH details if needed.
    echo.
) else (
    echo [OK] 'server\.env' found.
)

:: 2. Start MySQL via Docker
echo.
echo [1/3] Starting MySQL Database (Docker)...
docker compose up -d mysql
if %ERRORLEVEL% NEQ 0 (
    echo [!] Docker command failed or not found.
    echo [!] Assuming you have a LOCAL MySQL server running...
    echo [!] Continuing with local configuration...
) else (
    :: 3. Wait for Database (only if Docker started)
    echo.
    echo [2/3] Waiting for Database to Initialize...
    echo (Waiting 10 seconds...)
    timeout /t 10 /nobreak >nul
)


:: 4. Start Application
echo.
echo [3/3] Launching App (Client + Server)...
echo.
call npm start

endlocal
