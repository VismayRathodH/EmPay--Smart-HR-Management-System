"""
EmPay Admin Payroll Report Generator
Generates detailed Excel reports for payroll analysis
"""
import pandas as pd
from sqlalchemy.orm import Session
from datetime import datetime
import os
import sys

# Add parent directory to path to import from server
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from server.config.database import SessionLocal
from server.models import Payslip, Employee, User, Payrun

def generate_monthly_report(month: int, year: int, output_path: str = None):
    """
    Generates a detailed Excel report for a specific payroll month
    """
    db = SessionLocal()
    try:
        # Fetch all payslips for the month/year
        payslips = db.query(Payslip).filter(
            Payslip.month == month,
            Payslip.year == year
        ).all()

        if not payslips:
            print(f"No payslips found for {month}/{year}")
            return None

        data = []
        for slip in payslips:
            emp = slip.employee
            user = emp.user
            data.append({
                "Employee Code": emp.employee_code,
                "Name": user.full_name,
                "Department": emp.department,
                "Designation": emp.designation,
                "Month": slip.month,
                "Year": slip.year,
                "Paid Days": slip.paid_days,
                "Gross Salary": slip.gross_salary,
                "Basic": slip.basic_salary,
                "HRA": slip.hra,
                "Special Allowance": slip.special_allowance,
                "PF Deduction": slip.pf_deduction,
                "Professional Tax": slip.professional_tax,
                "Net Pay": slip.net_pay,
                "Bank Name": emp.bank_name,
                "Account Number": emp.bank_account_number,
                "IFSC": emp.ifsc_code
            })

        df = pd.DataFrame(data)
        
        if output_path is None:
            output_path = f"Payroll_Report_{month}_{year}.xlsx"
            
        df.to_excel(output_path, index=False, engine='openpyxl')
        print(f"Report generated successfully: {output_path}")
        return output_path

    finally:
        db.close()

if __name__ == "__main__":
    now = datetime.now()
    # Default to current month or previous month
    m = now.month
    y = now.year
    generate_monthly_report(m, y)
