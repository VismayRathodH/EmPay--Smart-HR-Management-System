# EmPay Authentication & Security Documentation

## Overview

The EmPay backend implements a complete JWT-based authentication system with role-based access control (RBAC) using FastAPI, SQLAlchemy, and python-jose.

## Architecture

### Security Stack
- **JWT Library**: python-jose with cryptography
- **Password Hashing**: passlib with bcrypt
- **Web Framework**: FastAPI
- **ORM**: SQLAlchemy 2.0
- **Token Strategy**: HS256 (HMAC with SHA-256)

### Key Components

#### 1. **Security Utilities** (`server/utils/security.py`)
- `hash_password()` - Bcrypt password hashing
- `verify_password()` - Verify plain password against hash
- `create_access_token()` - Generate JWT tokens
- `verify_token()` - Validate and decode JWT tokens

#### 2. **Authentication Schemas** (`server/schemas/__init__.py`)
Pydantic models for request/response validation:
- `UserLogin` - Login request schema
- `UserRegister` - User registration schema
- `UserProfile` - User profile response
- `TokenResponse` - Token response (matches frontend expectations)
- `TokenPayload` - JWT payload structure

#### 3. **Dependencies** (`server/dependencies.py`)
FastAPI dependency functions for RBAC:
- `get_current_user()` - Get authenticated user from JWT
- `require_role()` - Generic role checker (returns middleware)
- `get_current_admin()` - Admin-only dependency
- `get_current_hr()` - HR/Admin dependency
- `get_current_payroll()` - Payroll Officer/Admin dependency

#### 4. **Auth Router** (`server/routers/__init__.py`)
Three API endpoints:
- `POST /api/auth/register` - Create new user (Admin-only)
- `POST /api/auth/login` - Login and get JWT
- `GET /api/auth/me` - Get current user profile

## API Endpoints

### 1. Register User
**Endpoint**: `POST /api/auth/register`
**Auth Required**: Yes (Admin only)
**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "password": "secure_password123"
}
```

**Success Response** (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "Employee",
    "is_active": true
  },
  "role": "Employee",
  "expires_in": 86400
}
```

**Error Response** (400/403):
```json
{
  "detail": "Email already registered" | "Access denied. Required roles: Admin"
}
```

### 2. Login
**Endpoint**: `POST /api/auth/login`
**Auth Required**: No

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "secure_password123"
}
```

**Success Response** (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "Admin",
    "is_active": true
  },
  "role": "Admin",
  "expires_in": 86400
}
```

**Error Response** (401):
```json
{
  "detail": "Invalid email or password" | "User account is inactive"
}
```

### 3. Get Current User
**Endpoint**: `GET /api/auth/me`
**Auth Required**: Yes (Any authenticated user)
**Headers**: `Authorization: Bearer <token>`

**Success Response** (200):
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "Admin",
  "is_active": true
}
```

**Error Response** (401):
```json
{
  "detail": "Invalid or expired token" | "User not found"
}
```

## JWT Token Structure

### Token Payload
```json
{
  "user_id": 1,
  "role": "Admin",
  "exp": 1682083200
}
```

### Token Configuration
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Secret**: Stored in `SECRET_KEY` environment variable
- **Expiration**: 24 hours (86400 seconds)
- **Header**: `Authorization: Bearer <token>`

## Role-Based Access Control (RBAC)

### Available Roles
- `Admin` - Full system access, can create users
- `HR` - HR management functions
- `Payroll Officer` - Payroll processing
- `Employee` - Self-service access only

### Using RBAC in Routes

#### Option 1: Use Pre-built Dependencies
```python
from fastapi import Depends
from server.dependencies import get_current_admin

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_admin)  # Admin only
):
    # Only Admin can access this
    pass
```

#### Option 2: Use require_role() Middleware
```python
from server.dependencies import get_current_user, require_role

@router.post("/create-employee")
async def create_employee(
    data: EmployeeCreate,
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_role(["Admin", "HR"]))  # Admin or HR
):
    # Only Admin and HR can access this
    pass
```

#### Option 3: Custom Role Checks
```python
from server.dependencies import get_current_user

@router.get("/dashboard")
async def dashboard(current_user: User = Depends(get_current_user)):
    if current_user.role.value != "Admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    # Admin-only logic
    pass
```

## Frontend Integration

The token response matches the frontend's `authStore.js` expectations:

```javascript
// Frontend authStore.js expected format
{
  token: "jwt_token_here",
  user: {
    id: 1,
    email: "user@email.com",
    full_name: "User Name",
    role: "Admin"
  },
  role: "Admin"
}
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd server
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and set SECRET_KEY to a secure value
```

### 3. Initialize Database
```bash
python init_db.py
```

### 4. Run Server
```bash
python -m uvicorn server.main:app --reload --host 0.0.0.0 --port 5000
```

### 5. Test API
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empay.com",
    "password": "admin123"
  }'

# Get user profile
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token_from_login>"
```

## Security Best Practices

### ✅ What We Do
- **Bcrypt Hashing**: Passwords are hashed with bcrypt (not stored plain)
- **JWT Tokens**: Stateless authentication with JWT
- **Token Expiration**: 24-hour expiration (configurable)
- **CORS Protection**: Configured CORS with allowed origins
- **Role-Based Access**: Endpoint protection via roles
- **HTTP Bearer**: Standard HTTP authentication scheme

### ⚠️ Important Notes

1. **SECRET_KEY**: 
   - MUST be changed in production
   - Use a long, random, cryptographically secure string
   - Example: `openssl rand -hex 32`

2. **Password Requirements**:
   - Minimum 6 characters (adjust in schema if needed)
   - Bcrypt automatically handles salting and hashing

3. **Token Storage** (Frontend):
   - Store token in secure HTTP-only cookie, not localStorage
   - Or use secure session storage

4. **HTTPS**: Always use HTTPS in production

5. **Database**:
   - Never expose DATABASE_URL publicly
   - Use environment variables for all sensitive configs

## Testing

### Test Admin Registration (Requires Admin Token)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "email": "newuser@empay.com",
    "full_name": "New User",
    "password": "password123"
  }'
```

### Test Protected Route
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: No module named 'server'` | Run from project root: `python -m uvicorn server.main:app --reload` |
| `Invalid token` | Check SECRET_KEY matches in `.env` |
| `User not found` | Verify user exists in database |
| `Access denied` | Check user role has required permission |
| `UnicodeEncodeError` | Windows terminal encoding issue (use UTF-8 encoding) |

## File Structure
```
server/
├── main.py                 # FastAPI app entry point
├── init_db.py              # Database initialization
├── requirements.txt        # Python dependencies
├── config/
│   ├── __init__.py
│   └── database.py         # SQLAlchemy config
├── models/
│   └── __init__.py         # User & Employee models
├── schemas/
│   └── __init__.py         # Pydantic schemas
├── utils/
│   ├── __init__.py
│   └── security.py         # Password & JWT utilities
├── routers/
│   └── __init__.py         # Auth router
└── dependencies.py         # FastAPI dependencies
```

---
**Status**: ✅ Security layer complete and ready for testing
