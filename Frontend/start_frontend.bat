@echo off
echo Starting VKU Tauri Frontend...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call pnpm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        echo Please make sure pnpm is installed: npm install -g pnpm
        pause
        exit /b 1
    )
)

echo Starting Tauri development server...
echo.
echo The application will open automatically
echo Press Ctrl+C to stop the server
echo.

call pnpm tauri dev

pause
