# EmPay Security Layer - Architecture Overview

## Complete Directory Structure

```
EmPay/
├── empay.db                           # SQLite database (created by init_db.py)
├── .env.example                       # Environment variables template
├── .env                               # Environment variables (create from .example)
│
├── Documentation Files
├── Project_overview.md                # Project architecture & business rules
├── SERVER_SETUP.md                    # Task 1: Database & models setup
├── SECURITY.md                        # Comprehensive security documentation
├── AUTH_IMPLEMENTATION.md             # Task 2: Auth implementation summary
├── TASK2_SECURITY_COMPLETE.md         # Task 2 completion summary
│
├── Test Scripts
├── test_auth.sh                       # Unix/Linux testing script
├── test_auth.bat                      # Windows testing script
│
└── server/                            # Backend application
    ├── __init__.py                    # Package marker
    ├── main.py                        # FastAPI app entry point
    ├── dependencies.py                # RBAC & auth dependencies
    ├── init_db.py                     # Database initialization
    ├── requirements.txt               # Python dependencies
    │
    ├── config/
    │   ├── __init__.py
    │   └── database.py                # SQLAlchemy engine & session
    │
    ├── models/                        # Database models
    │   └── __init__.py
    │       ├── User                   # User with roles (Admin, HR, Payroll Officer, Employee)
    │       └── Employee               # Employee with payroll fields (wage, pf_optin, etc)
    │
    ├── schemas/                       # Pydantic validation models
    │   └── __init__.py
    │       ├── UserLogin              # Login request
    │       ├── UserRegister           # Registration request
    │       ├── UserProfile            # User response
    │       ├── TokenResponse          # JWT response (frontend-compatible)
    │       ├── TokenPayload           # JWT payload structure
    │       └── AuthResponse           # Generic response wrapper
    │
    ├── routers/                       # API routers
    │   └── __init__.py
    │       ├── POST /api/auth/register      # Create user (Admin only)
    │       ├── POST /api/auth/login         # Authenticate & get token
    │       └── GET /api/auth/me             # Get current user profile
    │
    └── utils/                         # Utility functions
        ├── __init__.py
        └── security.py
            ├── hash_password()        # Bcrypt hashing
            ├── verify_password()      # Password verification
            ├── create_access_token()  # JWT generation
            └── verify_token()         # JWT validation
```

## Component Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Application                     │
│                      (server/main.py)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────┐    ┌──────────┐    ┌───────────┐
    │  CORS  │    │ Database │    │   Auth    │
    │Middleware   │ Tables   │    │  Router   │
    └────────┘    └──────────┘    └───────────┘
                       │                │
                   ┌───┴────┐       ┌────┴─────┐
                   │        │       │          │
                   ▼        ▼       ▼          ▼
              ┌───────┐ ┌────────┐ ┌──────┐ ┌──────────┐
              │ Users │ │Employees │Register│  Login  │
              │ Table │ │ Table    │Endpoint│Endpoint │
              └───────┘ └────────┘ └──────┘ └──────────┘
                                       │
                                       ▼
                                  ┌─────────┐
                                  │ JWT     │
                                  │ Token   │
                                  └─────────┘
                                       │
                  ┌────────────────────┼────────────────────┐
                  │                    │                    │
                  ▼                    ▼                    ▼
             ┌─────────┐         ┌──────────┐         ┌─────────┐
             │ Get ME  │         │RBAC Check│         │Password │
             │Endpoint │         │Dependency│         │Validation
             └─────────┘         └──────────┘         └─────────┘
```

## Data Flow for Authentication

### 1. Registration Flow (Admin Only)
```
Admin User
    │
    ├─ Token (Bearer)
    │
    ▼
POST /api/auth/register
    │
    ├─ Check: Is user Admin? (via require_role dependency)
    ├─ Check: Email doesn't exist
    ├─ Hash password with bcrypt
    │
    ▼
Create User in Database
    │
    ├─ Store hashed password (never store plain text)
    ├─ Set role to "Employee"
    │
    ▼
Generate JWT Token
    │
    ├─ Payload: {user_id, role, exp}
    ├─ Sign with HS256
    │
    ▼
Return TokenResponse
    {
      token: "jwt_string",
      user: {id, email, full_name, role, is_active},
      role: "Employee"
    }
```

### 2. Login Flow
```
User (any role)
    │
    ├─ Email & Password (plain text)
    │
    ▼
POST /api/auth/login
    │
    ├─ Find user by email
    ├─ Verify password with bcrypt
    ├─ Check if user is active
    │
    ▼
Generate JWT Token
    │
    ├─ Payload: {user_id, role, exp}
    ├─ Sign with HS256
    │
    ▼
Return TokenResponse
    {
      token: "jwt_string",
      user: {id, email, full_name, role, is_active},
      role: "Admin|HR|Payroll Officer|Employee"
    }

Frontend stores token → Can use for protected requests
```

### 3. Protected Request Flow
```
Frontend
    │
    ├─ Token from localStorage/sessionStorage
    │
    ▼
GET /api/auth/me
    │
    ├─ Header: Authorization: Bearer <token>
    │
    ▼
get_current_user() dependency
    │
    ├─ Extract token from header
    ├─ Verify token signature (HS256)
    ├─ Check expiration
    ├─ Get user_id from payload
    ├─ Look up user in database
    ├─ Check if user is active
    │
    ▼
Return UserProfile
    {
      id, email, full_name, role, is_active
    }

OR

Return 401/403 Error if:
    - Token invalid/expired
    - User not found
    - User inactive
```

### 4. RBAC Protected Route
```
Authenticated User
    │
    ├─ Token in header
    │
    ▼
Protected Route (e.g., create employee)
    │
    ├─ get_current_user() - Validates token
    │
    ▼
require_role(["Admin", "HR"]) - Checks role
    │
    ├─ If user.role in allowed_roles → Continue
    │
    ▼
Handler function executes
    (Only Admin & HR can reach here)

OR

Return 403 Forbidden if role not in allowed list
```

## Security Layer Features

### ✅ What's Implemented
```
Authentication
├─ JWT generation with 24-hour expiration
├─ Bcrypt password hashing (automatic salting)
├─ Password verification
└─ Token validation with signature check

Authorization (RBAC)
├─ Four user roles (Admin, HR, Payroll Officer, Employee)
├─ get_current_user() - Gets authenticated user
├─ require_role() - Validates user role
├─ Pre-built role dependencies
└─ Flexible role-based endpoint protection

API Endpoints
├─ POST /api/auth/register (Admin only)
├─ POST /api/auth/login (Public)
└─ GET /api/auth/me (Authenticated)

Additional Security
├─ CORS protection (configurable origins)
├─ HTTP Bearer authentication scheme
├─ Stateless JWT tokens
├─ Active user status checking
└─ Comprehensive error handling
```

## How to Extend with New Protected Routes

### Example 1: Admin-Only Route
```python
from server.dependencies import get_current_admin

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_admin)
):
    # Only Admin can access
    db.query(User).filter(User.id == user_id).delete()
    return {"message": "User deleted"}
```

### Example 2: Multiple Roles Allowed
```python
from server.dependencies import get_current_user, require_role

@router.post("/employees")
async def create_employee(
    employee_data: EmployeeCreate,
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_role(["Admin", "HR"]))
):
    # Admin and HR can create employees
    return create_new_employee(employee_data)
```

### Example 3: Custom Role Check
```python
from server.dependencies import get_current_user

@router.get("/payroll")
async def view_payroll(current_user: User = Depends(get_current_user)):
    if current_user.role.value not in ["Admin", "Payroll Officer"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Payroll-related logic
    return get_payroll_data()
```

## Token Payload Explanation

### What's Inside the JWT:
```json
{
  "user_id": 1,              // Database user ID
  "role": "Admin",           // User's role (Admin|HR|Payroll Officer|Employee)
  "exp": 1682083200          // Expiration timestamp (24 hours from creation)
}
```

### Why This Design:
- **user_id**: To identify the user without DB lookup
- **role**: Embedded for quick RBAC checks without DB query
- **exp**: Automatic token expiration for security
- **No password or sensitive data**: Only ID and role in token

## Environment Variables

```env
SECRET_KEY=<secure_random_string>      # Used to sign JWT tokens
CORS_ORIGINS=<comma_separated_urls>    # Frontend origins to allow
DATABASE_URL=sqlite:///./empay.db      # Database connection
SERVER_HOST=0.0.0.0                    # Server bind address
SERVER_PORT=5000                       # Server port
ENVIRONMENT=development                # dev|staging|production
```

---

## Summary

✅ **Complete security implementation** with:
- JWT authentication with 24-hour expiration
- Bcrypt password hashing with automatic salting
- Role-based access control (RBAC)
- Four user roles with flexible endpoint protection
- CORS protection
- Comprehensive documentation
- Test scripts for Windows & Unix

**Status**: Ready for Employee CRUD endpoints and Payroll processing! 🚀
