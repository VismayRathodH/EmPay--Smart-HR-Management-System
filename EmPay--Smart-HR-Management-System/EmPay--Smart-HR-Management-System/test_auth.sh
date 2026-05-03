#!/bin/bash
# EmPay Backend - Security Testing Script
# Run these commands to test the authentication endpoints

echo "=========================================="
echo "EmPay Authentication Testing"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE="http://localhost:5000"

echo -e "${BLUE}[INFO]${NC} Make sure the server is running on http://localhost:5000"
echo ""

# Test 1: Health Check
echo -e "${BLUE}TEST 1: Health Check${NC}"
echo "GET $API_BASE/health"
curl -X GET "$API_BASE/health" | python -m json.tool
echo ""
echo ""

# Test 2: Login (assuming default user exists)
echo -e "${BLUE}TEST 2: Login${NC}"
echo "POST $API_BASE/api/auth/login"
echo "Testing with sample credentials..."
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empay.com",
    "password": "admin123"
  }')

echo "$LOGIN_RESPONSE" | python -m json.tool

# Extract token from response
TOKEN=$(echo "$LOGIN_RESPONSE" | python -c "import sys, json; data=json.load(sys.stdin); print(data.get('token', ''))" 2>/dev/null || echo "")

if [ -z "$TOKEN" ] || [ "$TOKEN" == "None" ]; then
  echo -e "${YELLOW}[WARNING]${NC} Could not extract token. Try different credentials."
  echo ""
  echo "To create a test admin user, you need to:"
  echo "1. Add a user directly to the database"
  echo "2. Or create a seed script"
  echo ""
else
  echo ""
  echo -e "${GREEN}[SUCCESS]${NC} Got token!"
  echo -e "Token: ${TOKEN:0:50}..."
  echo ""

  # Test 3: Get Current User Profile
  echo -e "${BLUE}TEST 3: Get Current User Profile${NC}"
  echo "GET $API_BASE/api/auth/me"
  echo "Headers: Authorization: Bearer <token>"
  echo ""

  curl -X GET "$API_BASE/api/auth/me" \
    -H "Authorization: Bearer $TOKEN" | python -m json.tool

  echo ""
  echo ""

  # Test 4: Try Invalid Token
  echo -e "${BLUE}TEST 4: Test Invalid Token (Should Fail)${NC}"
  echo "GET $API_BASE/api/auth/me"
  echo "Headers: Authorization: Bearer invalid_token"
  echo ""

  curl -X GET "$API_BASE/api/auth/me" \
    -H "Authorization: Bearer invalid_token" | python -m json.tool

  echo ""
fi

echo ""
echo "=========================================="
echo "Testing Complete"
echo "=========================================="
echo ""
echo "To test registration (requires admin token):"
echo ""
echo 'curl -X POST http://localhost:5000/api/auth/register \'
echo '  -H "Content-Type: application/json" \'
echo '  -H "Authorization: Bearer <ADMIN_TOKEN>" \'
echo '  -d '"'"'{
echo '    "email": "newuser@empay.com",
echo '    "full_name": "New User",
echo '    "password": "password123"
echo '  }'"'"
echo ""
