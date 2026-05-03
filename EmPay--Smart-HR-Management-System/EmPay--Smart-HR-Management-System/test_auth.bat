@echo off
REM EmPay Backend - Security Testing Script for Windows
REM Run this script to test the authentication endpoints

echo.
echo ==========================================
echo EmPay Authentication Testing
echo ==========================================
echo.

set API_BASE=http://localhost:5000

echo [INFO] Make sure the server is running on %API_BASE%
echo.

REM Test 1: Health Check
echo [TEST 1] Health Check
echo GET %API_BASE%/health
curl -X GET "%API_BASE%/health"
echo.
echo.

REM Test 2: Login
echo [TEST 2] Login
echo POST %API_BASE%/api/auth/login
echo Testing with sample credentials...
echo.

curl -X POST "%API_BASE%/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"admin@empay.com\", \"password\": \"admin123\"}"

echo.
echo.

REM Test 3: Instructions
echo [TEST 3] To test protected endpoint (/api/auth/me):
echo Copy the token from the login response above, then run:
echo.
echo curl -X GET "%API_BASE%/api/auth/me" ^
echo   -H "Authorization: Bearer PASTE_TOKEN_HERE"
echo.
echo.

REM Test 4: Registration
echo [TEST 4] To test registration (requires admin token):
echo.
echo curl -X POST "%API_BASE%/api/auth/register" ^
echo   -H "Content-Type: application/json" ^
echo   -H "Authorization: Bearer PASTE_ADMIN_TOKEN_HERE" ^
echo   -d "{\"email\": \"newuser@empay.com\", \"full_name\": \"New User\", \"password\": \"password123\"}"
echo.

echo.
echo ==========================================
echo Testing Complete
echo ==========================================
echo.
pause
