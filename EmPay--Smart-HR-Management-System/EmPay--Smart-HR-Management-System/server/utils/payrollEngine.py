"""
Payroll Calculation Engine for EmPay
Implements exact formulas from EmPay_Hackathon_Plan_Updated.pdf
"""
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Tuple

from ..models import Employee, Attendance, Leave, LeaveStatus, Payslip
from ..config.database import SessionLocal


def get_professional_tax(gross_salary: float) -> float:
    """
    Calculate professional tax based on Maharashtra slabs

    Slabs:
    - ₹0 if Gross <= 7500
    - ₹175 if 7500 < Gross < 10000
    - ₹200 if Gross >= 10000

    Args:
        gross_salary: Monthly gross salary

    Returns:
        Professional tax amount
    """
    if gross_salary <= 7500:
        return 0.0
    elif gross_salary < 10000:
        return 175.0
    else:
        return 200.0


def get_present_days(employee_id: int, month: int, year: int, db: Session) -> float:
    """
    Calculate present days for an employee in a given month

    Args:
        employee_id: Employee ID
        month: Month (1-12)
        year: Year (YYYY)
        db: Database session

    Returns:
        Number of days marked present
    """
    # Query attendance records for the month
    query = db.query(Attendance).filter(
        Attendance.employee_id == employee_id,
        func.extract('month', Attendance.attendance_date) == month,
        func.extract('year', Attendance.attendance_date) == year,
    )

    attendance_records = query.all()
    return float(len(attendance_records))


def get_approved_leave_days(employee_id: int, month: int, year: int, db: Session) -> float:
    """
    Calculate approved leave days for an employee in a given month

    Args:
        employee_id: Employee ID
        month: Month (1-12)
        year: Year (YYYY)
        db: Database session

    Returns:
        Number of approved leave days
    """
    # Query approved leaves for the month
    query = db.query(Leave).filter(
        Leave.employee_id == employee_id,
        Leave.status == LeaveStatus.APPROVED,
        func.extract('month', Leave.start_date) == month,
        func.extract('year', Leave.start_date) == year,
    )

    approved_leaves = query.all()
    total_days = sum(leave.days_requested for leave in approved_leaves)
    return float(total_days)


def calculate_payroll(
    employee_id: int,
    month: int,
    year: int,
    db: Session = None
) -> Dict[str, float]:
    """
    Calculate payroll for a single employee using exact formulas from the hackathon plan

    Formula:
    1. Paid Days = present_days + approved_leave_days
    2. Gross Salary = (wage / 26) * paid_days
    3. Basic = Gross * 0.50
    4. HRA = Gross * 0.20
    5. Special Allowance = Gross * 0.30
    6. PF Deduction = (pf_optin) ? Basic * 0.12 : 0
    7. Professional Tax = getProfTax(Gross) [Maharashtra slabs]
    8. Net Pay = Gross - PF - Prof Tax

    Args:
        employee_id: Employee ID
        month: Month (1-12)
        year: Year (YYYY)
        db: Database session (creates one if not provided)

    Returns:
        Dictionary with all payroll components and amounts

    Raises:
        ValueError: If employee not found or data is invalid
    """
    if db is None:
        db = SessionLocal()

    # Get employee
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise ValueError(f"Employee with ID {employee_id} not found")

    # STEP 1: Calculate paid days
    present_days = get_present_days(employee_id, month, year, db)
    approved_leave_days = get_approved_leave_days(employee_id, month, year, db)
    paid_days = present_days + approved_leave_days

    # STEP 2: Calculate gross salary (pro-rated)
    # Formula: (wage / 26) * paid_days
    # Note: wage is monthly wage, total working days in month = 26
    gross_salary = (employee.wage / 26.0) * paid_days

    # STEP 3: Calculate salary components
    basic_salary = gross_salary * 0.50      # 50%
    hra = gross_salary * 0.20               # 20%
    special_allowance = gross_salary * 0.30 # 30%

    # STEP 4: Calculate deductions
    # PF: 12% of Basic only if opted in
    pf_deduction = (basic_salary * 0.12) if employee.pf_optin else 0.0

    # Professional Tax: Maharashtra slabs
    professional_tax = get_professional_tax(gross_salary)

    # STEP 5: Calculate net pay
    net_pay = gross_salary - pf_deduction - professional_tax

    return {
        "employee_id": employee_id,
        "month": month,
        "year": year,
        "present_days": present_days,
        "approved_leave_days": approved_leave_days,
        "paid_days": paid_days,
        "wage": employee.wage,
        "gross_salary": round(gross_salary, 2),
        "basic_salary": round(basic_salary, 2),
        "hra": round(hra, 2),
        "special_allowance": round(special_allowance, 2),
        "pf_deduction": round(pf_deduction, 2),
        "professional_tax": round(professional_tax, 2),
        "net_pay": round(net_pay, 2),
        "pf_optin": employee.pf_optin,
    }


def calculate_payroll_batch(
    month: int,
    year: int,
    db: Session = None
) -> Tuple[list, Dict[str, float]]:
    """
    Calculate payroll for all active employees

    Args:
        month: Month (1-12)
        year: Year (YYYY)
        db: Database session

    Returns:
        Tuple of (list of payroll data, summary statistics)
    """
    if db is None:
        db = SessionLocal()

    # Get all active employees
    employees = db.query(Employee).filter(Employee.is_active == True).all()

    payroll_list = []
    total_gross = 0.0
    total_pf = 0.0
    total_prof_tax = 0.0
    total_net_pay = 0.0

    for employee in employees:
        try:
            payroll_data = calculate_payroll(employee.id, month, year, db)
            payroll_list.append(payroll_data)

            total_gross += payroll_data["gross_salary"]
            total_pf += payroll_data["pf_deduction"]
            total_prof_tax += payroll_data["professional_tax"]
            total_net_pay += payroll_data["net_pay"]
        except ValueError as e:
            print(f"Error calculating payroll for employee {employee.id}: {e}")
            continue

    summary = {
        "month": month,
        "year": year,
        "total_employees": len(payroll_list),
        "total_gross": round(total_gross, 2),
        "total_deductions": round(total_pf + total_prof_tax, 2),
        "total_pf": round(total_pf, 2),
        "total_prof_tax": round(total_prof_tax, 2),
        "total_net_pay": round(total_net_pay, 2),
    }

    return payroll_list, summary
