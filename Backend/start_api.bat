@echo off
echo Starting VKU Session Capture API Server...
echo.

REM Activate conda environment
call conda activate tauri_env

REM Check if activation was successful
if errorlevel 1 (
    echo Error: Failed to activate conda environment 'tauri_env'
    echo Please run: conda env create -f environment.yml
    pause
    exit /b 1
)

echo Environment activated: tauri_env
echo Starting FastAPI server on http://127.0.0.1:8000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the API server
python api_server.py

pause
