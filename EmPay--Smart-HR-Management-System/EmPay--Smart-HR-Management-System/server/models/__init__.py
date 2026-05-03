from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum, ForeignKey, Date, Time
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..config.database import Base


class UserRole(str, enum.Enum):
    """Enum for user roles"""
    ADMIN = "Admin"
    HR = "HR"
    PAYROLL_OFFICER = "Payroll Officer"
    EMPLOYEE = "Employee"


class LeaveType(str, enum.Enum):
    """Enum for leave types"""
    ANNUAL = "Annual"
    SICK = "Sick"
    CASUAL = "Casual"


class LeaveStatus(str, enum.Enum):
    """Enum for leave request status"""
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class User(Base):
    """User model with role-based access control"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship to Employee
    employee = relationship("Employee", back_populates="user", uselist=False)

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role.value}')>"


class Employee(Base):
    """Employee model with payroll and HR data"""
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)

    # Personal Info
    employee_code = Column(String(50), unique=True, index=True, nullable=False)
    date_of_birth = Column(DateTime, nullable=True)
    phone_number = Column(String(20), nullable=True)
    address = Column(String(500), nullable=True)

    # Employment Info
    designation = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    date_of_joining = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Payroll Data
    ctc = Column(Float, nullable=False)  # Cost to Company (Annual)
    wage = Column(Float, nullable=False)  # Monthly wage
    basic_salary = Column(Float, nullable=True)  # 50% of CTC
    hra = Column(Float, nullable=True)  # 20% of CTC
    special_allowance = Column(Float, nullable=True)  # 30% of CTC

    # PF and Tax Info
    pf_optin = Column(Boolean, default=True, nullable=False)  # Provident Fund Opt-in
    pf_account_number = Column(String(50), nullable=True)
    professional_tax_slab = Column(String(50), nullable=True)  # RS_0, RS_175, RS_200

    # Bank Details
    bank_account_number = Column(String(20), nullable=True)
    ifsc_code = Column(String(20), nullable=True)
    bank_name = Column(String(100), nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship to User and Attendance
    user = relationship("User", back_populates="employee")
    attendance_records = relationship("Attendance", back_populates="employee")
    leave_requests = relationship("Leave", back_populates="employee")
    leave_balance = relationship("LeaveBalance", back_populates="employee", uselist=False)

    def __repr__(self):
        return f"<Employee(id={self.id}, employee_code='{self.employee_code}', wage={self.wage})>"


class Attendance(Base):
    """Attendance model for tracking check-in and check-out times"""
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    attendance_date = Column(Date, nullable=False, index=True)
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship to Employee
    employee = relationship("Employee", back_populates="attendance_records")

    def __repr__(self):
        return f"<Attendance(id={self.id}, employee_id={self.employee_id}, date={self.attendance_date})>"


class Leave(Base):
    """Leave request model for tracking employee leave applications"""
    __tablename__ = "leaves"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    leave_type = Column(Enum(LeaveType), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(String(500), nullable=False)
    status = Column(Enum(LeaveStatus), default=LeaveStatus.PENDING, nullable=False)
    days_requested = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationship to Employee
    employee = relationship("Employee", back_populates="leave_requests")

    def __repr__(self):
        return f"<Leave(id={self.id}, employee_id={self.employee_id}, type={self.leave_type.value}, status={self.status.value})>"


class LeaveBalance(Base):
    """Leave balance model for tracking available leave days per employee"""
    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), unique=True, nullable=False, index=True)
    annual_leave = Column(Float, default=12.0, nullable=False)  # Annual leave days
    sick_leave = Column(Float, default=6.0, nullable=False)  # Sick leave days
    casual_leave = Column(Float, default=6.0, nullable=False)  # Casual leave days
    year = Column(Integer, nullable=False)  # Year for which balance is tracked
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship to Employee
    employee = relationship("Employee", back_populates="leave_balance")

    def __repr__(self):
        return f"<LeaveBalance(id={self.id}, employee_id={self.employee_id}, annual={self.annual_leave}, sick={self.sick_leave}, casual={self.casual_leave})>"


class Payrun(Base):
    """Payrun model for storing payroll batch processing records"""
    __tablename__ = "payruns"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(Integer, nullable=False)  # 1-12
    year = Column(Integer, nullable=False)  # YYYY
    total_employees = Column(Integer, nullable=False)  # Count of employees processed
    total_gross = Column(Float, nullable=False)  # Sum of gross salaries
    total_deductions = Column(Float, nullable=False)  # Sum of all deductions (PF + Prof Tax)
    total_net_pay = Column(Float, nullable=False)  # Sum of net pay
    status = Column(String(50), default="completed", nullable=False)  # completed, pending, failed
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Payroll Officer who created it
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Payrun(id={self.id}, month={self.month}, year={self.year}, status='{self.status}')>"


class Payslip(Base):
    """Payslip model for storing individual employee payroll slips"""
    __tablename__ = "payslips"

    id = Column(Integer, primary_key=True, index=True)
    payrun_id = Column(Integer, ForeignKey("payruns.id"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)

    # Attendance Data
    present_days = Column(Float, nullable=False)  # Days marked present
    approved_leave_days = Column(Float, nullable=False)  # Approved leave days
    paid_days = Column(Float, nullable=False)  # present_days + approved_leave_days

    # Salary Components
    gross_salary = Column(Float, nullable=False)  # (wage / 26) * paid_days
    basic_salary = Column(Float, nullable=False)  # 50% of gross
    hra = Column(Float, nullable=False)  # 20% of gross
    special_allowance = Column(Float, nullable=False)  # 30% of gross

    # Deductions
    pf_deduction = Column(Float, nullable=False)  # 12% of basic if opted
    professional_tax = Column(Float, nullable=False)  # Maharashtra slab

    # Net Pay
    net_pay = Column(Float, nullable=False)  # Gross - PF - Prof Tax

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    payrun = relationship("Payrun")
    employee = relationship("Employee")

    def __repr__(self):
        return f"<Payslip(id={self.id}, employee_id={self.employee_id}, month={self.month}, net_pay={self.net_pay})>"


