# Server Setup Guide - EmPay

## ✅ Task 1 Complete: Server Initialization with SQLAlchemy Models

### 📁 Directory Structure Created
```
server/
├── __init__.py
├── init_db.py                 # Database initialization script
├── requirements.txt           # Python dependencies
├── config/
│   ├── __init__.py
│   └── database.py           # SQLAlchemy configuration & engine
└── models/
    └── __init__.py           # User & Employee models
```

### 📊 Models Created

#### 1. **User Model** (`server/models/__init__.py`)
Role-based user management with the following fields:
- **id** (Primary Key)
- **email** (Unique, indexed)
- **password_hash** (Secure password storage)
- **full_name**
- **role** (Enum: Admin, HR, Payroll Officer, Employee)
- **is_active** (Boolean flag)
- **created_at / updated_at** (Timestamps)
- **Relationship**: One-to-one with Employee

**Roles Supported:**
- `Admin` - Full system access
- `HR` - HR management functions
- `Payroll Officer` - Payroll processing
- `Employee` - Self-service access

#### 2. **Employee Model** (`server/models/__init__.py`)
Comprehensive payroll and HR data capture:

**Personal Information:**
- employee_code (Unique, indexed)
- date_of_birth
- phone_number
- address

**Employment Information:**
- designation
- department
- date_of_joining

**Payroll Data (Per Project Overview):**
- **ctc** (Cost to Company - Annual)
- **wage** (Monthly wage)
- **basic_salary** (50% of CTC)
- **hra** (20% of CTC)
- **special_allowance** (30% of CTC)

**PF & Tax Information:**
- **pf_optin** (Boolean - Provident Fund opt-in status)
- **pf_account_number**
- **professional_tax_slab** (RS_0, RS_175, RS_200 - Maharashtra slabs)

**Bank Details:**
- bank_account_number
- ifsc_code
- bank_name

**Status:**
- is_active
- created_at / updated_at

### 🗄️ Database Configuration

**Database:** SQLite (Local file: `empay.db`)
**ORM:** SQLAlchemy 2.0.23
**Location:** Root of project directory

### 🚀 Getting Started

#### Step 1: Install Dependencies
```bash
cd server
pip install -r requirements.txt
```

#### Step 2: Initialize Database
```bash
python init_db.py
```
This will create:
- `empay.db` SQLite database file
- `users` table
- `employees` table

#### Step 3: Verify Tables
```bash
sqlite3 empay.db ".tables"
```

### 📝 Next Steps
1. Create migration system (Alembic) for schema changes
2. Implement authentication endpoints (login, register)
3. Build CRUD controllers for User and Employee
4. Add validation schemas (Pydantic models)
5. Implement role-based access control (RBAC) middleware
6. Create payroll engine (per Project Overview specifications)

### 🔐 Security Notes
- Password hashing is required before storing (implement bcrypt/passlib)
- JWT tokens should embed role for authorization
- Sensitive data (bank details, PF account) should be handled securely
- Database file should be added to `.gitignore`

### 📚 Technology Stack (Updated)
- **Backend Framework**: FastAPI (Modern, async-capable)
- **Database ORM**: SQLAlchemy 2.0
- **Database**: SQLite (Local development)
- **Authentication**: JWT + passlib
- **Data Validation**: Pydantic v2

---
**Status**: ✅ Server initialization complete and ready for API development
