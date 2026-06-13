@echo off
echo ============================================================
echo 🚀 Appolo Storefront - Windows Automated Setup Script
echo ============================================================

:: 1. System Dependency Checks
echo.
echo [1/4] Checking system requirements...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: Python is not installed or not in PATH.
    pause
    exit /b 1
)
echo ✓ Python is installed.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js is not installed or not in PATH.
    pause
    exit /b 1
)
echo ✓ Node.js is installed.

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: npm is not installed or not in PATH.
    pause
    exit /b 1
)
echo ✓ npm is installed.

:: 2. Setup Python Virtual Environment
echo.
echo [2/4] Setting up Python virtual environment (.venv)...
python -m venv .venv
if %errorlevel% neq 0 (
    echo ❌ Failed to create virtual environment.
    pause
    exit /b 1
)
echo ✓ Virtual environment created.

:: 3. Install Python Dependencies
echo.
echo [3/4] Installing backend dependencies...
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Failed to install Python dependencies.
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed successfully.

:: 4. Run migrations and database seeding
echo.
echo [4/4] Ensuring PostgreSQL database exists and running migrations...
python seed_script.py
if %errorlevel% neq 0 (
    echo ❌ Database setup or seeding failed.
    pause
    exit /b 1
)

:: 5. Install frontend modules
echo.
echo Installing frontend npm packages...
cd frontend
call npm install
cd ..
if %errorlevel% neq 0 (
    echo ❌ Frontend packages installation failed.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo 🎉 Setup completed successfully on Windows!
echo You can now start the servers using: run.bat
echo ============================================================
pause
