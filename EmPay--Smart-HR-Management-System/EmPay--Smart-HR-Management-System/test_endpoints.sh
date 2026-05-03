#!/bin/bash

# EmPay API Test Script - Employee and Attendance Endpoints
# This script tests the new employee and attendance functionality

BASE_URL="http://localhost:5000"
ADMIN_TOKEN=""
EMPLOYEE_USER_ID=""
EMPLOYEE_ID=""

echo "=========================================="
echo "EmPay Employee & Attendance API Testing"
echo "=========================================="

# Test 1: Health Check
echo ""
echo "[TEST 1] Health Check"
HEALTH=$(curl -s "$BASE_URL/health")
echo "Response: $HEALTH"

# Test 2: Create Admin User (if not exists)
echo ""
echo "[TEST 2] Register Admin User"
REGISTER=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"email": "admin@empay.com", "full_name": "Admin User", "password": "admin123"}' 2>/dev/null || echo '{"detail":"error"}')
echo "Response: $REGISTER"

# Test 3: Login as Admin
echo ""
echo "[TEST 3] Login as Admin"
LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@empay.com", "password": "admin123"}')
echo "Response: $LOGIN"

# Extract token from login response
ADMIN_TOKEN=$(echo $LOGIN | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$' || echo "")
echo "Token: $ADMIN_TOKEN"

# Test 4: Create Employee User
echo ""
echo "[TEST 4] Register Employee User"
EMP_REGISTER=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"email": "emp1@empay.com", "full_name": "John Doe", "password": "emp123"}')
echo "Response: $EMP_REGISTER"

# Extract employee user ID
EMPLOYEE_USER_ID=$(echo $EMP_REGISTER | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*$' || echo "")
echo "Employee User ID: $EMPLOYEE_USER_ID"

# Test 5: Create Employee Record
echo ""
echo "[TEST 5] Create Employee Record (Admin/HR only)"
if [ ! -z "$ADMIN_TOKEN" ] && [ ! -z "$EMPLOYEE_USER_ID" ]; then
  EMP_CREATE=$(curl -s -X POST "$BASE_URL/api/employees" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
      \"user_id\": $EMPLOYEE_USER_ID,
      \"employee_code\": \"EMP001\",
      \"designation\": \"Software Engineer\",
      \"department\": \"Engineering\",
      \"phone_number\": \"9876543210\",
      \"ctc\": 800000,
      \"wage\": 66666.67
    }")
  echo "Response: $EMP_CREATE"

  # Extract employee ID
  EMPLOYEE_ID=$(echo $EMP_CREATE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*$' || echo "")
  echo "Employee ID: $EMPLOYEE_ID"
fi

# Test 6: Get All Employees
echo ""
echo "[TEST 6] Get All Employees (Authenticated users)"
GET_EMPLOYEES=$(curl -s "$BASE_URL/api/employees" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "Response: $GET_EMPLOYEES"

# Test 7: Get Employees by Department
echo ""
echo "[TEST 7] Get Employees by Department Filter"
GET_DEPT=$(curl -s "$BASE_URL/api/employees?department=Engineering" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "Response: $GET_DEPT"

# Test 8: Mark Check-In
echo ""
echo "[TEST 8] Mark Check-In"
if [ ! -z "$ADMIN_TOKEN" ] && [ ! -z "$EMPLOYEE_ID" ]; then
  CHECKIN=$(curl -s -X POST "$BASE_URL/api/attendance/mark" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
      \"action\": \"check_in\",
      \"employee_id\": $EMPLOYEE_ID
    }")
  echo "Response: $CHECKIN"
fi

# Test 9: Mark Check-Out
echo ""
echo "[TEST 9] Mark Check-Out"
if [ ! -z "$ADMIN_TOKEN" ] && [ ! -z "$EMPLOYEE_ID" ]; then
  CHECKOUT=$(curl -s -X POST "$BASE_URL/api/attendance/mark" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
      \"action\": \"check_out\",
      \"employee_id\": $EMPLOYEE_ID
    }")
  echo "Response: $CHECKOUT"
fi

# Test 10: Get Attendance Logs
echo ""
echo "[TEST 10] Get Attendance Logs"
if [ ! -z "$ADMIN_TOKEN" ] && [ ! -z "$EMPLOYEE_ID" ]; then
  LOGS=$(curl -s "$BASE_URL/api/attendance/logs?employee_id=$EMPLOYEE_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  echo "Response: $LOGS"
fi

# Test 11: Get Attendance Logs with Month/Year Filter
echo ""
echo "[TEST 11] Get Attendance Logs with Month/Year Filter"
CURRENT_MONTH=$(date +%m)
CURRENT_YEAR=$(date +%Y)
if [ ! -z "$ADMIN_TOKEN" ]; then
  LOGS_FILTERED=$(curl -s "$BASE_URL/api/attendance/logs?month=$CURRENT_MONTH&year=$CURRENT_YEAR" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  echo "Response: $LOGS_FILTERED"
fi

# Test 12: Update Employee
echo ""
echo "[TEST 12] Update Employee (Admin/HR only)"
if [ ! -z "$ADMIN_TOKEN" ] && [ ! -z "$EMPLOYEE_ID" ]; then
  UPDATE=$(curl -s -X PATCH "$BASE_URL/api/employees/$EMPLOYEE_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
      "designation": "Senior Software Engineer",
      "wage": 75000
    }')
  echo "Response: $UPDATE"
fi

echo ""
echo "=========================================="
echo "Testing Complete"
echo "=========================================="
