# EmPay Backend Workflow Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Database Structure](#database-structure)
4. [Authentication & Authorization](#authentication--authorization)
5. [API Routes & Endpoints](#api-routes--endpoints)
6. [Key Modules & Components](#key-modules--components)
7. [Data Flow](#data-flow)
8. [Security Implementation](#security-implementation)
9. [Running the Backend](#running-the-backend)

---

## Architecture Overview

EmPay backend is built on **FastAPI**, a modern Python web framework. The application follows a modular architecture with clear separation of concerns:

```
server/
├── main.py              # FastAPI application entry point
├── config/              # Configuration modules
│   └── database.py      # Database setup and session management
├── models/              # SQLAlchemy ORM models
├── schemas/             # Pydantic validation schemas
├── routers/             # API route handlers
├── utils/               # Utility functions (security, payroll engine)
├── dependencies.py      # FastAPI dependency injection
└── init_db.py          # Database initialization script
```

### Key Architecture Patterns
- **MVC-like Structure**: Models, Schemas (Views), and Routers (Controllers)
- **Dependency Injection**: FastAPI dependencies for authentication and DB sessions
- **Role-Based Access Control (RBAC)**: Fine-grained permissions based on user roles
- **SQLAlchemy ORM**: Type-safe database operations

---

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | FastAPI | 0.109.0 |
| **ASGI Server** | Uvicorn | 0.24.0 |
| **ORM** | SQLAlchemy | 2.0.31 |
| **Database** | SQLite | - |
| **Authentication** | JWT (PyJWT) | 2.12.1 |
| **Password Hashing** | bcrypt | 5.0.0 |
| **Data Validation** | Pydantic | 2.12.1 |
| **Database Migration** | Alembic | 1.12.1 |

---

## Database Structure

### Users & Authentication

#### **User Table**
```python
Users
├── id (Primary Key)
├── email (unique, indexed)
├── password_hash (bcrypt hashed)
├── full_name
├── role (Enum: Admin, HR, Payroll Officer, Employee)
├── is_active (Boolean)
├── created_at (DateTime)
└── updated_at (DateTime)
```

**User Roles & Permissions:**
- **Admin**: Full system access, user management, can approve any action
- **HR**: Employee management, leave approval, attendance oversight
- **Payroll Officer**: Payroll processing, payslip generation
- **Employee**: View own data, request leave, view payslips

---

### Employee Data

#### **Employee Table**
```python
Employees
├── id (Primary Key)
├── user_id (Foreign Key → Users)
├── employee_code (unique)
├── date_of_birth
├── phone_number
├── address
├── designation
├── department
├── date_of_joining
├── ctc (Cost to Company - Annual)
├── wage (Monthly wage)
├── basic_salary (50% of CTC)
├── hra (20% of CTC)
├── special_allowance (30% of CTC)
├── pf_optin (Boolean - Provident Fund)
├── pf_account_number
├── professional_tax_slab
├── bank_account_number
├── ifsc_code
├── bank_name
├── is_active
└── timestamps
```

---

### Attendance & Leave Management

#### **Attendance Table**
```python
Attendance
├── id (Primary Key)
├── employee_id (Foreign Key)
├── attendance_date (indexed)
├── check_in_time (DateTime)
├── check_out_time (DateTime)
└── timestamps
```

#### **Leave Table**
```python
Leaves
├── id (Primary Key)
├── employee_id (Foreign Key)
├── leave_type (Enum: Annual, Sick, Casual)
├── start_date
├── end_date
├── reason (String)
├── status (Enum: Pending, Approved, Rejected)
├── days_requested
├── approved_by_id (Foreign Key)
└── timestamps
```

#### **LeaveBalance Table**
```python
LeaveBalances
├── id (Primary Key)
├── employee_id (Foreign Key, unique)
├── annual_leave (default: 12.0)
├── sick_leave (default: 6.0)
├── casual_leave (default: 6.0)
├── year (Integer)
└── timestamps
```

---

### Payroll System

#### **Payrun Table** (Batch Processing)
```python
Payruns
├── id (Primary Key)
├── month (1-12)
├── year (YYYY)
├── total_employees (Count)
├── total_gross (Sum)
├── total_deductions (Sum)
├── total_net_pay (Sum)
├── status (completed, pending, failed)
├── created_by_id (Foreign Key → Users)
└── timestamps
```

#### **Payslip Table** (Individual Payroll)
```python
Payslips
├── id (Primary Key)
├── payrun_id (Foreign Key)
├── employee_id (Foreign Key)
├── month (1-12)
├── year (YYYY)
├── present_days
├── approved_leave_days
├── paid_days (present_days + approved_leave_days)
├── gross_salary
├── basic_salary (50% of gross)
├── hra (20% of gross)
├── special_allowance (30% of gross)
├── pf_deduction (12% of basic if opted)
├── professional_tax (Maharashtra slab)
├── net_pay (Gross - PF - Prof Tax)
└── timestamps
```

---

## Authentication & Authorization

### JWT Token Flow

```
1. User Login (POST /api/auth/login)
   ↓
2. Verify credentials (email + password)
   ↓
3. Generate JWT Token with payload:
   {
     "user_id": 1,
     "role": "Admin",
     "exp": 1234567890
   }
   ↓
4. Return Token + User Profile
   ↓
5. Client stores token in localStorage
   ↓
6. Client sends token in Authorization header (Authorization: Bearer <token>)
   ↓
7. Backend verifies token on each request
```

### Token Configuration
- **Algorithm**: HS256 (HMAC SHA-256)
- **Expiration**: 24 hours (1440 minutes)
- **Secret Key**: Stored in `.env` file as `SECRET_KEY`

### Password Security
- **Hashing Algorithm**: bcrypt with salt
- **Cost Factor**: Default bcrypt cost
- **Verification**: Secure comparison using bcrypt

### Dependency Injection Pattern

```python
# Example: Protected endpoint requiring authentication
@router.get("/api/profile")
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return current_user

# Example: Role-based access control
@router.post("/api/employees")
async def create_employee(
    data: EmployeeCreate,
    current_user: User = Depends(require_role(["Admin", "HR"])),
    db: Session = Depends(get_db)
):
    # Only Admin and HR can access
    pass
```

---

## API Routes & Endpoints

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Admin | Create new user (Admin-only) |
| POST | `/api/auth/login` | Public | Login and get JWT token |
| GET | `/api/auth/me` | Any | Get current user profile |
| PATCH | `/api/auth/update-profile` | Any | Update own profile |
| POST | `/api/auth/change-password` | Any | Change own password |

### Employee Management (`/api/employees`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/employees` | Any | List all employees (with optional department filter) |
| POST | `/api/employees` | Admin/HR | Create new employee |
| GET | `/api/employees/{id}` | Any | Get employee details |
| PATCH | `/api/employees/{id}` | Admin/HR | Update employee info |
| PATCH | `/api/employees/{id}/profile` | Any | Update own profile (employee) |
| PATCH | `/api/employees/{id}/payroll` | Admin/Payroll | Update payroll details |

### Attendance Endpoints (`/api/attendance`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/attendance` | Any | Get attendance records (with filters) |
| POST | `/api/attendance` | Any | Record check-in/check-out |
| GET | `/api/attendance/{id}` | Any | Get attendance by ID |
| GET | `/api/attendance/employee/{empId}` | Any | Get employee attendance history |
| GET | `/api/attendance/summary` | Admin/HR | Get attendance summary by date range |

### Leave Management (`/api/leave`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/leave` | Any | List leaves (with filters) |
| POST | `/api/leave` | Any | Request leave |
| GET | `/api/leave/{id}` | Any | Get leave request details |
| PATCH | `/api/leave/{id}` | Admin/HR | Approve/Reject leave |
| GET | `/api/leave/balance/{empId}` | Any | Get leave balance |
| GET | `/api/leave/summary` | Admin/HR | Get leave summary report |

### Payroll Endpoints (`/api/payroll`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/payroll/payslips` | Any | Get payslips (user can see own) |
| GET | `/api/payroll/payslips/{id}` | Any | Get payslip details |
| GET | `/api/payroll/payruns` | Admin/Payroll | List payroll batches |
| POST | `/api/payroll/payruns` | Admin/Payroll | Create payrun |
| GET | `/api/payroll/summary` | Admin/Payroll | Get payroll summary |

### AI Insights Endpoints (`/api/ai`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/ai/insights` | Admin/HR | Get AI-powered insights |
| POST | `/api/ai/analyze` | Admin/HR | Generate analysis report |

---

## Key Modules & Components

### 1. **Security Module** (`utils/security.py`)

Handles all cryptographic operations:

```python
# Password hashing
def hash_password(password: str) -> str
    # Returns bcrypt hashed password

# Password verification
def verify_password(plain: str, hashed: str) -> bool
    # Secure comparison

# JWT Token creation
def create_access_token(data: Dict, expires_delta: Optional[timedelta]) -> str
    # Creates JWT token with 24-hour expiration

# JWT Token verification
def verify_token(token: str) -> Optional[Dict]
    # Decodes and validates JWT token
```

### 2. **Payroll Engine** (`utils/payrollEngine.py`)

Core payroll calculation logic:

```python
# Monthly salary calculation
def calculate_gross_salary(wage, present_days, approved_leave_days)
    # Gross = (wage / 26) * paid_days

# Salary component breakdown
def calculate_components(gross_salary)
    # Basic (50%), HRA (20%), Special Allowance (30%)

# Deduction calculation
def calculate_deductions(basic_salary, pf_optin, professional_tax_slab)
    # PF: 12% of basic (if opted)
    # Prof Tax: Maharashtra slab

# Net pay calculation
def calculate_net_pay(gross, pf_deduction, prof_tax)
    # Net = Gross - PF - Prof Tax
```

### 3. **Dependency Injection** (`dependencies.py`)

Provides reusable dependency functions:

```python
# Get current authenticated user
async def get_current_user(credentials, db) -> User
    # Extracts and validates JWT token

# Role-based access control
def require_role(allowed_roles: List[str])
    # Returns dependency that checks user role

# Pre-configured role checkers
async def get_current_admin(current_user) -> User
async def get_current_hr(current_user) -> User
async def get_current_payroll(current_user) -> User
```

### 4. **Database Configuration** (`config/database.py`)

```python
# SQLite database (empay.db in project root)
DATABASE_URL = f"sqlite:///{PROJECT_ROOT}/empay.db"

# SQLAlchemy engine with session factory
engine = create_engine(DATABASE_URL, ...)
SessionLocal = sessionmaker(bind=engine)

# Dependency for DB session in routes
def get_db() -> Session
    # Provides and cleans up DB session
```

---

## Data Flow

### Authentication Flow

```
Frontend (React)
    ↓
[POST /api/auth/login] {email, password}
    ↓
Backend - security.verify_password()
    ↓
[if valid] security.create_access_token()
    ↓
[Response] {token, user, role, expires_in}
    ↓
Frontend stores token in localStorage
    ↓
[All future requests] Authorization: Bearer {token}
    ↓
Backend - dependencies.get_current_user()
    ↓
[Verify token] security.verify_token()
    ↓
[Get user from DB]
    ↓
Route handler receives User object
```

### Employee Creation Flow (Admin/HR)

```
Admin/HR Portal
    ↓
[POST /api/employees] {employee_data}
    ↓
Backend - require_role(["Admin", "HR"])
    ↓
[Check] Employee code already exists?
    ↓
[Check] User ID exists?
    ↓
[Create] Employee record in database
    ↓
[Link] Employee → User relationship
    ↓
[Response] {employee_with_user_details}
    ↓
Frontend shows confirmation
```

### Leave Request Flow

```
Employee Portal
    ↓
[POST /api/leave] {leave_type, dates, reason}
    ↓
Backend - Check leave balance
    ↓
[Create] Leave record with status=Pending
    ↓
[Notify] HR receives notification
    ↓
HR Portal
    ↓
[PATCH /api/leave/{id}] {status: Approved/Rejected}
    ↓
Backend - require_role(["Admin", "HR"])
    ↓
[Update] Leave status
    ↓
[If Approved] Update LeaveBalance
    ↓
[Notify] Employee receives notification
```

### Payroll Generation Flow

```
Payroll Officer
    ↓
[POST /api/payroll/payruns] {month, year}
    ↓
Backend - require_role(["Admin", "Payroll Officer"])
    ↓
[Query] All active employees
    ↓
[For each employee]:
    ├─ Get attendance for month
    ├─ Get approved leave days
    ├─ Calculate gross salary
    ├─ Calculate deductions (PF, Prof Tax)
    ├─ Calculate net pay
    └─ Create Payslip record
    ↓
[Create] Payrun record with totals
    ↓
[Store] All payslips in database
    ↓
[Response] Payrun summary
    ↓
Employee Portal
    ↓
[GET /api/payroll/payslips] 
    ↓
[Can only see own payslips]
    ↓
[Display] Payslip with all details
```

---

## Security Implementation

### 1. **Password Security**
- Passwords hashed using bcrypt with automatic salt generation
- Never stored in plain text
- Verification uses constant-time comparison to prevent timing attacks

### 2. **JWT Token Security**
- Tokens signed with SECRET_KEY (stored in .env)
- Tokens expire after 24 hours
- Token validation on every protected endpoint
- User status checked (must be `is_active=True`)

### 3. **Role-Based Access Control (RBAC)**
- Every endpoint specifies required roles
- Dependency injection automatically validates permissions
- Returns 403 Forbidden if user lacks required role

### 4. **CORS Configuration**
- Whitelisted origins (default: http://localhost:3000)
- Credentials allowed for cross-origin requests
- All HTTP methods and headers allowed (configurable)

### 5. **Database Security**
- SQLite with file-based storage
- Foreign key constraints enabled
- Unique constraints on sensitive fields (email, employee_code)
- Indexed fields for efficient queries

### 6. **Environment Variables**
- Sensitive data stored in .env file
- Never committed to repository
- Configuration: SECRET_KEY, CORS_ORIGINS, DATABASE_URL

---

## Running the Backend

### Prerequisites
```bash
# Python 3.8+
python --version

# Create virtual environment
python -m venv venv
```

### Installation
```bash
# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r server/requirements.txt
```

### Database Initialization
```bash
# Initialize database and seed with sample data
python -m server.init_db
```

### Start Server
```bash
# Development mode with auto-reload
python -m server.main

# Or using uvicorn directly
uvicorn server.main:app --host 0.0.0.0 --port 5000 --reload
```

### API Documentation
Once running, access:
- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc
- **Health Check**: http://localhost:5000/health

### Environment Configuration (.env)
```
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
DATABASE_URL=sqlite:///empay.db
```

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET request |
| 201 | Created | Employee successfully created |
| 400 | Bad Request | Invalid input data (e.g., email already exists) |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User lacks required role |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected backend error |

### Error Response Format
```json
{
  "detail": "Error message explaining what went wrong"
}
```

---

## Database Relationships

```
User (1) ──────────── (1) Employee
  │
  ├─── Attendance (many)
  │
  ├─── Leave (many)
  │
  └─── LeaveBalance (1)
  
Payrun (1) ──────────── (many) Payslip
Employee (1) ──────────── (many) Payslip
```

---

## Performance Considerations

1. **Indexed Columns**: email, employee_code, attendance_date, leave status
2. **Database Pagination**: Implement for large datasets
3. **Caching**: Consider for frequently accessed data (employee list, payroll summaries)
4. **Batch Operations**: Payrun processes all employees in one batch
5. **Query Optimization**: Use SQLAlchemy joins to minimize N+1 queries

---

## Future Enhancements

1. **WebSocket Notifications**: Real-time leave approvals and notifications
2. **File Upload**: Resume, documents, and ID proofs
3. **Advanced Reporting**: Custom reports and analytics
4. **API Rate Limiting**: Prevent abuse and DDoS attacks
5. **Audit Logging**: Track all sensitive operations
6. **Two-Factor Authentication**: Enhanced security
7. **Integration APIs**: Third-party payroll and accounting software

---

## Troubleshooting

### Common Issues

**1. Database Lock Error**
```
Error: database is locked
```
- SQLite allows only one writer at a time
- Ensure only one uvicorn process is running
- Check for long-running transactions

**2. Token Expiration Error**
```
Invalid or expired token
```
- Token expires after 24 hours
- User needs to login again
- Frontend should handle token refresh

**3. CORS Errors**
```
Access to XMLHttpRequest blocked by CORS policy
```
- Check CORS_ORIGINS in .env file
- Ensure frontend URL matches whitelisted origins

---

**Last Updated**: May 2026  
**Version**: 1.0.0
