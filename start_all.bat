@echo off
echo ========================================
echo VKU Session Capture - Full Stack Start
echo ========================================
echo.

echo Starting Backend API Server...
start "VKU Backend API" cmd /k "cd Backend && conda activate tauri_env && python api_server.py"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Tauri App...
start "VKU Frontend" cmd /k "cd Frontend && pnpm tauri dev"

echo.
echo ========================================
echo Both servers are starting...
echo Backend: http://127.0.0.1:8000
echo Frontend: Will open automatically
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
