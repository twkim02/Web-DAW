@echo off
echo ==========================================
echo   Web DAW - No-Docker Dev Mode
echo   [1] Bypass Docker (Using internal database)
echo ==========================================

:: Set Env to use SQLite
set DB_DIALECT=sqlite
set DB_STORAGE=./dev_db.sqlite

echo.
echo ==========================================
echo   [2] Launching App (Hot Reload Active)
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:3001
echo ==========================================
echo.

:: Run Frontend & Backend locally
npm start
pause
