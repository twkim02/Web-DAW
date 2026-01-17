@echo off
echo ==========================================
echo   Starting Web Loop Station (DAW)
echo   - Backend: port 3001
echo   - Frontend: port 5173
echo ==========================================
echo.
echo Installing dependencies if missing...
call npm install
echo.
echo Launching...
npm start
pause
