# Database Seeding Guide

This guide explains how to populate the EmPay database with sample test data (500-600 employees).

## Quick Start

### Windows
```bash
seed_database.bat
```

### Linux/Mac
```bash
bash seed_database.sh
```

Or manually:
```bash
python -m server.seed_db
```

## What Gets Seeded

The seeding script creates:

### 1. Users & Employees (550 total)
- **1 Admin User**
  - Email: `admin@empay.com`
  - Password: `admin123`
  - Role: Admin

- **549 Employee Users**
  - Email: `emp1@empay.com` to `emp549@empay.com`
  - Password: `password123` (all employees)
  - Role: Employee

### 2. Employee Details
Each employee record includes:
- ✅ Unique employee code (EMP-000001, EMP-000002, etc.)
- ✅ Random department (Engineering, HR, Marketing, Payroll, Sales, Operations, Finance, Design)
- ✅ Random designation (35+ different roles)
- ✅ Realistic salary ranges:
  - Interns: ₹3-6 LPA
  - Junior roles: ₹6-12 LPA
  - Senior/Lead roles: ₹12-24 LPA
- ✅ Bank details:
  - Bank account number
  - IFSC code
  - Bank name (7 major Indian banks)
- ✅ PF Information:
  - 75% opted in for Provident Fund
  - PF account numbers for opted-in employees
- ✅ Tax Information:
  - Professional tax slab (RS_0, RS_175, RS_200)
- ✅ Employment dates:
  - Random joining dates (within 5 years)
  - Monthly wage calculated from CTC

### 3. Leave Balances (550 records)
Each employee gets:
- 12 Annual leave days
- 6 Sick leave days
- 6 Casual leave days

### 4. Attendance Records (3,000 records)
For the first 100 employees:
- 30 days of attendance records
- 85% attendance rate (realistic)
- Random check-in times (8-10 AM)
- Random work duration (7-9 hours)

## Data Characteristics

### Salary Calculation
- **CTC (Cost to Company)**: Annual salary
- **Monthly Wage**: CTC ÷ 12
- **Basic Salary**: 50% of CTC
- **HRA**: 20% of CTC
- **Special Allowance**: 30% of CTC

### Departments
- Engineering
- HR
- Marketing
- Payroll
- Sales
- Operations
- Finance
- Design

### Designations (35+ roles)
- Software Engineer
- Senior Engineer
- Lead Engineer
- Principal Engineer
- Product Manager
- Data Analyst
- DevOps Engineer
- HR Manager
- Payroll Specialist
- And many more...

## Database Schema

The script creates data in these tables:

```
users (551 records)
  ├── id, email, password_hash, full_name, role, is_active
  
employees (550 records)
  ├── user_id, employee_code, designation, department
  ├── phone_number, date_of_joining, ctc, wage
  ├── basic_salary, hra, special_allowance
  ├── pf_optin, pf_account_number, professional_tax_slab
  ├── bank_account_number, ifsc_code, bank_name
  
leave_balances (550 records)
  ├── employee_id, annual_leave, sick_leave, casual_leave, year
  
attendance (3,000 records)
  ├── employee_id, attendance_date, check_in_time, check_out_time
```

## Testing Credentials

### Admin Account
```
Email: admin@empay.com
Password: admin123
```

### Employee Accounts
```
Email: emp1@empay.com to emp549@empay.com
Password: password123
```

### Test Attendance
First 100 employees have 30 days of attendance records:
```
emp1@empay.com to emp100@empay.com
(with attendance data for last 30 days)
```

## Troubleshooting

### Error: "Database already has users"
The script won't overwrite existing data. To reseed:
```bash
# Delete the database file
rm empay.db  # or delete empay.db on Windows

# Run the seed script again
python -m server.seed_db
```

### Error: "Module not found"
Make sure to install dependencies first:
```bash
pip install -r server/requirements.txt
```

### Error: "File not found"
Run the seed script from the project root directory:
```bash
cd /path/to/EmPay--Smart-HR-Management-System
python -m server.seed_db
```

## Verifying the Seed

After seeding completes, you should see:
```
✅ Database seeding completed!
   - Total Users: 551
   - Total Employees: 550
   - Total Leave Balances: 550
   - Total Attendance Records: 3,000
```

Then:
1. Start the backend: `python -m server.main`
2. Start the frontend: `npm run dev` (in client directory)
3. Login with `admin@empay.com` / `admin123`
4. View employees, attendance, and payroll features

## Performance Notes

- Seeding takes ~30-60 seconds (depending on machine)
- Database file size after seeding: ~5-10 MB
- Suitable for development and testing
- Not recommended for production use

## Customization

To modify the seeding script:

1. Edit `server/seed_db.py`
2. Change `total_employees` variable (line ~100)
3. Modify salary ranges, departments, etc.
4. Run the script again (delete empay.db first)

## Data Reset

To start fresh:

**Windows:**
```batch
del empay.db
seed_database.bat
```

**Linux/Mac:**
```bash
rm empay.db
bash seed_database.sh
```

---

**Last Updated**: May 2026
