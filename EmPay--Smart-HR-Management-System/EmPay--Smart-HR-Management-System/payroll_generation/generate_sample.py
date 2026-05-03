"""
EmPay Sample Data Generator
Populates the database with sample employees, attendance, and leaves for testing
"""
import os
import sys
from datetime import date, timedelta, datetime
import random

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from server.config.database import SessionLocal, engine
from server.models import Base, User, Employee, UserRole, Attendance, Leave, LeaveType, LeaveStatus
from server.utils.security import hash_password

def seed_data():
    db = SessionLocal()
    try:
        # Create roles if they don't exist (though they are Enums)
        
        # 1. Create a Payroll Officer if not exists
        payroll_officer = db.query(User).filter(User.email == "payroll@empay.com").first()
        if not payroll_officer:
            payroll_officer = User(
                email="payroll@empay.com",
                password_hash=hash_password("payroll123"),
                full_name="Prashant Payroll",
                role=UserRole.PAYROLL_OFFICER,
                is_active=True
            )
            db.add(payroll_officer)
            db.commit()
            print("Added Payroll Officer")

        # 2. Add some sample employees
        designations = ["Software Engineer", "Senior Dev", "QA Lead", "UX Designer", "Product Manager"]
        departments = ["Engineering", "Design", "Product"]
        
        for i in range(1, 6):
            email = f"emp{i}@empay.com"
            if not db.query(User).filter(User.email == email).first():
                user = User(
                    email=email,
                    password_hash=hash_password(f"emp{i}123"),
                    full_name=f"Employee {i}",
                    role=UserRole.EMPLOYEE,
                    is_active=True
                )
                db.add(user)
                db.flush()
                
                emp = Employee(
                    user_id=user.id,
                    employee_code=f"EMP00{i}",
                    designation=random.choice(designations),
                    department=random.choice(departments),
                    date_of_joining=datetime(2023, 1, 1),
                    ctc=(50000 + (i * 5000)) * 12,
                    wage=50000 + (i * 5000),
                    bank_name="HDFC Bank",
                    bank_account_number=f"50100234567{i}",
                    ifsc_code="HDFC0001234"
                )
                db.add(emp)
                print(f"Added Employee {i}")

        db.commit()

        # 3. Add some attendance for the current month
        employees = db.query(Employee).all()
        today = date.today()
        start_of_month = date(today.year, today.month, 1)
        
        for emp in employees:
            # Add attendance for the last 15 days
            for d in range((today - start_of_month).days + 1):
                curr_date = start_of_month + timedelta(days=d)
                # Skip Sundays
                if curr_date.weekday() == 6:
                    continue
                
                # Randomly skip some days to simulate absence
                if random.random() < 0.1:
                    continue
                    
                existing = db.query(Attendance).filter(
                    Attendance.employee_id == emp.id,
                    Attendance.attendance_date == curr_date
                ).first()
                
                if not existing:
                    check_in = datetime.combine(curr_date, datetime.min.time()).replace(hour=9, minute=random.randint(0, 30))
                    check_out = datetime.combine(curr_date, datetime.min.time()).replace(hour=18, minute=random.randint(0, 30))
                    
                    att = Attendance(
                        employee_id=emp.id,
                        attendance_date=curr_date,
                        check_in_time=check_in,
                        check_out_time=check_out
                    )
                    db.add(att)
        
        db.commit()
        print("Generated sample attendance")

    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
