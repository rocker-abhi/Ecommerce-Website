@echo off
echo ============================================================
echo 🚀 Appolo Storefront - Windows Startup Script
echo ============================================================

:: Verify virtual environment exists
if not exist .venv (
    echo ❌ Error: Virtual environment (.venv) not found. Please run setup.bat first.
    pause
    exit /b 1
)

:: Start backend in a separate terminal window
echo.
echo Starting backend Flask API server...
start "Appolo Backend Server" cmd /k "call .venv\Scripts\activate && python main.py"

:: Start frontend in a separate terminal window
echo Starting frontend Vite storefront...
cd frontend
start "Appolo Frontend Storefront" cmd /k "npm run dev"
cd ..

echo.
echo ============================================================
echo 🎉 Both servers are starting up in separate cmd windows!
echo - Frontend Storefront: http://localhost:5173
echo - Backend API Server:  http://localhost:5000
echo ============================================================
