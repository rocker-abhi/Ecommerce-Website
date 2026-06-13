#!/usr/bin/env bash

# Clear screen and show header
clear
echo -e "\033[1;36m============================================================\033[0m"
echo -e "\033[1;35m🚀 Appolo Storefront - Startup Script\033[0m"
echo -e "\033[1;36m============================================================\033[0m"

# Verify virtual environment exists
if [ ! -d ".venv" ]; then
    echo -e "\033[0;31m❌ Error: Virtual environment (.venv) not found. Please run ./setup.sh first.\033[0m"
    exit 1
fi

# Start backend server
echo -e "\n\033[1;34mStarting backend Flask API server...\033[0m"
source .venv/bin/activate
python main.py &
BACKEND_PID=$!
echo -e "\033[0;32m✓ Backend started (PID: $BACKEND_PID).\033[0m"

# Start frontend server
echo -e "\n\033[1;34mStarting frontend Vite storefront...\033[0m"
cd frontend
npm run dev &
FRONTEND_PID=$!
echo -e "\033[0;32m✓ Frontend started (PID: $FRONTEND_PID).\033[0m"
cd ..

# Cleanup function to kill processes on Ctrl+C
cleanup() {
    echo -e "\n\n\033[1;33mStopping backend and frontend servers...\033[0m"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo -e "\033[0;32mBoth servers stopped successfully.\033[0m"
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

echo -e "\n\033[1;36m============================================================\033[0m"
echo -e "\033[1;32m🎉 Both servers are running! Press Ctrl+C to stop them.\033[0m"
echo -e "\033[1;36m- Frontend Storefront: http://localhost:5173\033[0m"
echo -e "\033[1;36m- Backend API Server:  http://localhost:5000\033[0m"
echo -e "\033[1;36m============================================================\033[0m\n"

# Wait for background processes to finish
wait
