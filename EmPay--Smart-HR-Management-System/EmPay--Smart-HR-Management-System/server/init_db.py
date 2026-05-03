"""
Database initialization script for EmPay
Creates all tables defined in the models
"""
import sys
from pathlib import Path

# Add parent directory to path so we can import server module
sys.path.insert(0, str(Path(__file__).parent.parent))

from .config.database import engine, Base, get_db
from .models import User, Employee, UserRole, Attendance
from .utils.security import hash_password
from sqlalchemy.orm import Session


def init_db():
    """Initialize the database by creating all tables and test data"""
    Base.metadata.create_all(bind=engine)
    print("[OK] Database initialized successfully!")
    print("[DB] Database file: empay.db")
    print("[TABLES] Tables created: users, employees, attendance")

    # Create test admin user if not exists
    db = next(get_db())
    try:
        admin = db.query(User).filter(User.email == "admin@empay.com").first()
        if not admin:
            admin = User(
                email="admin@empay.com",
                password_hash=hash_password("admin123"),
                full_name="Admin User",
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print("[OK] Test admin user created: admin@empay.com / admin123")
        else:
            print("[INFO] Admin user already exists")

        admin_employee = db.query(Employee).filter(Employee.user_id == admin.id).first()
        if not admin_employee:
            admin_employee = Employee(
                user_id=admin.id,
                employee_code="EMP-ADMIN",
                designation="Administrator",
                department="Administration",
                ctc=1200000,
                wage=100000,
                basic_salary=50000,
                hra=20000,
                special_allowance=30000,
                pf_optin=True,
                professional_tax_slab="RS_200",
            )
            db.add(admin_employee)
            db.commit()
            print("[OK] Admin employee profile created: EMP-ADMIN")
        else:
            print("[INFO] Admin employee profile already exists")

        # Create test HR user if not exists
        hr_user = db.query(User).filter(User.email == "hr@empay.com").first()
        if not hr_user:
            hr_user = User(
                email="hr@empay.com",
                password_hash=hash_password("hr123"),
                full_name="HR User",
                role=UserRole.HR,
                is_active=True,
            )
            db.add(hr_user)
            db.commit()
            print("[OK] Test HR user created: hr@empay.com / hr123")

            hr_employee = Employee(
                user_id=hr_user.id,
                employee_code="EMP-HR001",
                designation="HR Manager",
                department="Human Resources",
                ctc=900000,
                wage=75000,
                basic_salary=40000,
                hra=15000,
                special_allowance=20000,
                pf_optin=True,
                professional_tax_slab="RS_200",
            )
            db.add(hr_employee)
            db.commit()
            print("[OK] HR employee profile created: EMP-HR001")
        else:
            print("[INFO] HR user already exists")

        # Create test Payroll Officer user if not exists
        payroll_user = db.query(User).filter(User.email == "payroll@empay.com").first()
        if not payroll_user:
            payroll_user = User(
                email="payroll@empay.com",
                password_hash=hash_password("payroll123"),
                full_name="Payroll Officer",
                role=UserRole.PAYROLL_OFFICER,
                is_active=True,
            )
            db.add(payroll_user)
            db.commit()
            print("[OK] Test Payroll Officer user created: payroll@empay.com / payroll123")

            payroll_employee = Employee(
                user_id=payroll_user.id,
                employee_code="EMP-PAYROLL001",
                designation="Payroll Officer",
                department="Finance",
                ctc=800000,
                wage=67000,
                basic_salary=35000,
                hra=14000,
                special_allowance=18000,
                pf_optin=True,
                professional_tax_slab="RS_200",
            )
            db.add(payroll_employee)
            db.commit()
            print("[OK] Payroll Officer employee profile created: EMP-PAYROLL001")
        else:
            print("[INFO] Payroll Officer user already exists")

        # Create test Employee user if not exists
        emp_user = db.query(User).filter(User.email == "employee@empay.com").first()
        if not emp_user:
            emp_user = User(
                email="employee@empay.com",
                password_hash=hash_password("employee123"),
                full_name="Regular Employee",
                role=UserRole.EMPLOYEE,
                is_active=True,
            )
            db.add(emp_user)
            db.commit()
            print("[OK] Test Employee user created: employee@empay.com / employee123")

            employee = Employee(
                user_id=emp_user.id,
                employee_code="EMP-001",
                designation="Software Engineer",
                department="Engineering",
                ctc=700000,
                wage=58000,
                basic_salary=30000,
                hra=12000,
                special_allowance=16000,
                pf_optin=True,
                professional_tax_slab="RS_200",
            )
            db.add(employee)
            db.commit()
            print("[OK] Employee profile created: EMP-001")
        else:
            print("[INFO] Employee user already exists")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
