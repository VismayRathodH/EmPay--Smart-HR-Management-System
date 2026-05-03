"""
Seed database with 500-600 employee records for testing and demonstration
"""
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from config.database import SessionLocal, engine
from models import Base, User, UserRole, Employee, Attendance, LeaveBalance
from utils.security import hash_password

# Sample data
DEPARTMENTS = ['Engineering', 'HR', 'Marketing', 'Payroll', 'Sales', 'Operations', 'Finance', 'Design']
DESIGNATIONS = [
    'Software Engineer', 'Senior Engineer', 'Lead Engineer', 'Principal Engineer',
    'Product Manager', 'Designer', 'Data Analyst', 'DevOps Engineer',
    'HR Manager', 'Payroll Specialist', 'Marketing Manager', 'Sales Executive',
    'Business Analyst', 'QA Engineer', 'Intern', 'Executive'
]
BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Yes Bank', 'IndusInd Bank']
PROFESSIONAL_TAX_SLABS = ['RS_0', 'RS_175', 'RS_200']

def generate_employee_code(index):
    """Generate unique employee code"""
    return f"EMP-{index:06d}"

def generate_phone():
    """Generate random Indian phone number"""
    return f"+91 {random.randint(9000000000, 9999999999)}"

def generate_ifsc():
    """Generate random IFSC code"""
    bank_codes = {
        'State Bank of India': 'SBIN',
        'HDFC Bank': 'HDFC',
        'ICICI Bank': 'ICIC',
        'Axis Bank': 'UTIB',
        'Kotak Bank': 'KKBK',
        'Yes Bank': 'YESB',
        'IndusInd Bank': 'INDB'
    }
    bank = random.choice(list(bank_codes.keys()))
    code = bank_codes[bank]
    branch = random.randint(1000, 9999)
    return f"{code}0{branch}"

def generate_bank_account():
    """Generate random bank account number"""
    return str(random.randint(10000000000000000, 99999999999999999))

def seed_database():
    """Populate database with sample employees"""
    db = SessionLocal()

    try:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)

        # Count existing users to avoid duplicates
        existing_count = db.query(User).count()

        if existing_count > 0:
            print(f"Database already has {existing_count} users. Skipping seed.")
            return

        print("Starting database seed with 550 employees...")

        # Create a default admin user
        admin_user = User(
            email="admin@empay.com",
            password_hash=hash_password("admin123"),
            full_name="System Administrator",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print("✓ Created admin user")

        # Create employees
        total_employees = 550
        batch_size = 50

        for batch_num in range(0, total_employees, batch_size):
            batch_employees = []
            current_batch_size = min(batch_size, total_employees - batch_num)

            for i in range(current_batch_size):
                emp_index = batch_num + i + 1

                # Create user
                email = f"emp{emp_index}@empay.com"
                user = User(
                    email=email,
                    password_hash=hash_password("password123"),
                    full_name=f"Employee {emp_index}",
                    role=UserRole.EMPLOYEE,
                    is_active=True
                )
                db.add(user)
                db.flush()

                # Determine salary range based on designation
                designation = random.choice(DESIGNATIONS)
                if 'Senior' in designation or 'Lead' in designation or 'Principal' in designation or 'Manager' in designation:
                    ctc = random.randint(1200000, 2400000)  # 12-24 LPA
                elif 'Intern' in designation:
                    ctc = random.randint(300000, 600000)  # 3-6 LPA
                else:
                    ctc = random.randint(600000, 1200000)  # 6-12 LPA

                wage = ctc / 12  # Monthly wage

                # Create employee
                employee = Employee(
                    user_id=user.id,
                    employee_code=generate_employee_code(emp_index),
                    designation=designation,
                    department=random.choice(DEPARTMENTS),
                    phone_number=generate_phone(),
                    date_of_joining=datetime.utcnow() - timedelta(days=random.randint(30, 1825)),
                    ctc=ctc,
                    wage=wage,
                    basic_salary=ctc * 0.5,
                    hra=ctc * 0.2,
                    special_allowance=ctc * 0.3,
                    pf_optin=random.choice([True, True, True, False]),  # 75% opt-in
                    pf_account_number=f"MH/{random.randint(10000, 99999)}/{random.randint(1000000, 9999999)}" if random.random() > 0.25 else None,
                    professional_tax_slab=random.choice(PROFESSIONAL_TAX_SLABS),
                    bank_account_number=generate_bank_account(),
                    ifsc_code=generate_ifsc(),
                    bank_name=random.choice(BANKS),
                    is_active=True
                )
                db.add(employee)
                batch_employees.append(employee)

            db.commit()
            print(f"✓ Created employees {batch_num + 1} to {batch_num + current_batch_size}")

        # Create leave balances for all employees
        print("\nCreating leave balances...")
        employees = db.query(Employee).all()
        current_year = datetime.utcnow().year

        for emp in employees:
            leave_balance = LeaveBalance(
                employee_id=emp.id,
                annual_leave=12.0,
                sick_leave=6.0,
                casual_leave=6.0,
                year=current_year
            )
            db.add(leave_balance)

        db.commit()
        print(f"✓ Created leave balances for {len(employees)} employees")

        # Create sample attendance records
        print("\nCreating sample attendance records...")
        attendance_count = 0

        for emp in employees[:100]:  # Create attendance for first 100 employees
            for days_ago in range(30):  # Last 30 days
                if random.random() > 0.15:  # 85% attendance rate
                    attendance_date = datetime.utcnow().date() - timedelta(days=days_ago)
                    check_in = datetime.utcnow().replace(
                        hour=random.randint(8, 10),
                        minute=random.randint(0, 59),
                        second=0
                    ) - timedelta(days=days_ago)

                    check_out = check_in + timedelta(hours=random.randint(7, 9))

                    attendance = Attendance(
                        employee_id=emp.id,
                        attendance_date=attendance_date,
                        check_in_time=check_in,
                        check_out_time=check_out
                    )
                    db.add(attendance)
                    attendance_count += 1

        db.commit()
        print(f"✓ Created {attendance_count} attendance records")

        print(f"\n✅ Database seeding completed!")
        print(f"   - Total Users: {db.query(User).count()}")
        print(f"   - Total Employees: {db.query(Employee).count()}")
        print(f"   - Total Leave Balances: {db.query(LeaveBalance).count()}")
        print(f"   - Total Attendance Records: {db.query(Attendance).count()}")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
