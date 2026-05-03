@echo off
setlocal
echo ========================================================
echo EmPay Smart HR Management System - One-Click Start
echo ========================================================
echo.

echo [1/3] Setting up Backend Virtual Environment...
cd EmPay--Smart-HR-Management-System\EmPay--Smart-HR-Management-System

:: Remove incorrectly placed venv if it exists
if exist server\venv (
    rmdir /s /q server\venv
)

:: Create a fresh venv if it doesn't exist
if not exist venv (
    echo Creating new python virtual environment...
    python -m venv venv
) else (
    echo Virtual environment already exists...
)

echo Activating venv and installing dependencies...
call venv\Scripts\activate.bat
pip install -r server\requirements.txt
pip install -r pdf-service\requirements.txt

:: Initialize database
echo Initializing database...
python -m server.init_db

:: Start Backend and PDF Service
echo Starting FastAPI Backend and PDF Service...
start "EmPay Backend" cmd /k "call venv\Scripts\activate.bat && python -m server.main"
start "EmPay PDF Service" cmd /k "call venv\Scripts\activate.bat && cd pdf-service && python main.py"

echo.
echo [2/3] Setting up Frontend...
cd ..\..\client

:: Install node modules if missing
if not exist node_modules (
    echo Installing npm dependencies...
    call npm install
) else (
    echo npm dependencies found, skipping install...
)

:: Start Frontend in a new window
echo Starting React Frontend...
start "EmPay Frontend" cmd /k "npm run dev"

echo.
echo [3/3] EmPay is now running!
echo Backend API will be available at: http://localhost:5000
echo Frontend will be available at: http://localhost:5173
echo.
echo Note: Two separate command prompt windows have been opened. 
echo To stop EmPay, simply close those two new windows.
echo.
pause
