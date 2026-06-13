#!/usr/bin/env bash

# Exit on error for initial setup steps
set -e

# Clear screen and show header
clear
echo -e "\033[1;36m============================================================\033[0m"
echo -e "\033[1;35m🚀 Appolo Storefront - Automated Setup Script\033[0m"
echo -e "\033[1;36m============================================================\033[0m"

# 1. System Dependency Checks
echo -e "\n\033[1;34m[1/5] Checking system requirements...\033[0m"
if ! command -v python3 &> /dev/null; then
    echo -e "\033[0;31m❌ Error: Python 3 is not installed.\033[0m"
    exit 1
fi
echo -e "\033[0;32m✓ Python 3 is installed: $(python3 --version)\033[0m"

if ! command -v node &> /dev/null; then
    echo -e "\033[0;31m❌ Error: Node.js is not installed.\033[0m"
    exit 1
fi
echo -e "\033[0;32m✓ Node.js is installed: $(node -v)\033[0m"

if ! command -v npm &> /dev/null; then
    echo -e "\033[0;31m❌ Error: npm is not installed.\033[0m"
    exit 1
fi
echo -e "\033[0;32m✓ npm is installed: $(npm -v)\033[0m"

# 2. Setup Python Virtual Environment
echo -e "\n\033[1;34m[2/5] Setting up Python virtual environment (.venv)...\033[0m"
python3 -m venv .venv
source .venv/bin/activate
echo -e "\033[0;32m✓ Virtual environment created and activated.\033[0m"

# 3. Install Python Dependencies
echo -e "\n\033[1;34m[3/5] Installing backend python dependencies...\033[0m"
pip install --upgrade pip
pip install -r requirements.txt
echo -e "\033[0;32m✓ Backend packages installed successfully.\033[0m"

# 4. Ensure Database Exists and Initialize Connection
echo -e "\n\033[1;34m[4/5] Ensuring PostgreSQL database exists...\033[0m"
python3 -c "
import os, sys
from sqlalchemy import create_engine, text
from urllib.parse import urlparse

db_uri = 'postgresql://abhishek:admin%40123@localhost:5432/website_db'
parsed = urlparse(db_uri)
default_uri = f'postgresql://{parsed.username}:{parsed.password}@{parsed.hostname}:{parsed.port}/postgres'

try:
    # Connect to default postgres database to run CREATE DATABASE command if website_db doesn't exist
    engine = create_engine(default_uri, isolation_level='AUTOCOMMIT')
    with engine.connect() as conn:
        res = conn.execute(text(\"SELECT 1 FROM pg_database WHERE datname='website_db'\"))
        if not res.fetchone():
            print('Creating database website_db...')
            conn.execute(text(\"CREATE DATABASE website_db\"))
            print('✓ Database website_db created successfully.')
        else:
            print('✓ Database website_db already exists.')
except Exception as e:
    print(f'⚠️ Warning checking/creating database: {e}')
"

# 5. Run Database Setup and Seeding Script (without seeding products)
echo -e "\n\033[1;34m[5/5] Migrating schema and seeding records...\033[0m"
python seed_script.py
echo -e "\033[0;32m✓ Database seeding and schema migrations finished.\033[0m"

# 6. Install Frontend Dependencies
echo -e "\n\033[1;34mInstalling frontend packages (Vite & React)...\033[0m"
cd frontend
npm install
cd ..
echo -e "\033[0;32m✓ Frontend packages installed successfully.\033[0m"

echo -e "\n\033[1;36m============================================================\033[0m"
echo -e "\033[1;32m🎉 Setup completed successfully!\033[0m"
echo -e "\033[1;36mYou can now run the servers using: ./run.sh\033[0m"
echo -e "\033[1;36m============================================================\033[0m\n"
