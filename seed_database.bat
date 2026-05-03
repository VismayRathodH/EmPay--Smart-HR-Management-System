@echo off
REM Script to seed the database with sample data on Windows

echo ================================
echo EmPay Database Seeding Script
echo ================================
echo.

REM Check if running from correct directory
if not exist "server\seed_db.py" (
    echo Error: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install requirements if needed
pip install -q -r server\requirements.txt

REM Run the seed script
echo.
echo Seeding database with sample data...
python -m server.seed_db

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Database seeding completed successfully!
    echo.
    echo You can now login with:
    echo   Email: admin@empay.com
    echo   Password: admin123
    echo.
    echo Or test with any employee:
    echo   Email: emp1@empay.com
    echo   Password: password123
    echo.
    pause
) else (
    echo.
    echo Database seeding failed!
    pause
    exit /b 1
)
