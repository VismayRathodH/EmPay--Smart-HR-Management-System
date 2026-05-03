"""
Payroll Management router for EmPay
Endpoints: POST /api/payroll/payrun, GET /api/payroll/payslip/{id}, GET /api/payroll/payslip/{id}/pdf
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from typing import List, Optional
import httpx
import pandas as pd
import io
from fastapi.responses import StreamingResponse

from ..config.database import get_db
from ..models import User, UserRole, Payrun, Payslip, Employee
from ..schemas import PayrunRequest, PayrunResponse, PayslipResponse, PayslipWithEmployeeResponse
from ..dependencies import get_current_user, require_role
from ..utils.payrollEngine import calculate_payroll_batch

router = APIRouter(prefix="/api/payroll", tags=["payroll"])

# PDF Service configuration
PDF_SERVICE_URL = "http://127.0.0.1:8001"


@router.post("/payrun", response_model=PayrunResponse, status_code=status.HTTP_201_CREATED)
async def create_payrun(
    request: PayrunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Payroll Officer", "Admin"])),
):
    """
    Create a payrun for all active employees (Payroll Officer only)

    Logic:
    - Validates month/year
    - Calculates payroll for all active employees
    - Creates Payrun and Payslip records
    - Idempotent: Updates existing payrun instead of duplicating

    Args:
        request: Payrun request with month and year
        db: Database session
        current_user: Current authenticated user (must be Payroll Officer or Admin)

    Returns:
        Created/updated payrun record with totals

    Raises:
        HTTPException 400: If month/year is invalid
        HTTPException 500: If calculation fails
    """
    # Validate month and year
    if not (1 <= request.month <= 12):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Month must be between 1 and 12",
        )

    if request.year < 2000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Year must be 2000 or later",
        )

    try:
        # Calculate payroll for all employees
        print(f"DEBUG: Starting payroll calculation for month={request.month}, year={request.year}")
        payroll_list, summary = calculate_payroll_batch(request.month, request.year, db)
        print(f"DEBUG: Payroll calculation complete. Employees: {len(payroll_list)}")

        if not payroll_list:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active employees found or no payroll data to process",
            )

        # Check if payrun already exists (idempotent)
        existing_payrun = db.query(Payrun).filter(
            Payrun.month == request.month,
            Payrun.year == request.year,
        ).first()

        if existing_payrun:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payroll for {request.month}/{request.year} has already been generated.",
            )
        else:
            # Create new payrun
            payrun = Payrun(
                month=request.month,
                year=request.year,
                total_employees=summary["total_employees"],
                total_gross=summary["total_gross"],
                total_deductions=summary["total_deductions"],
                total_net_pay=summary["total_net_pay"],
                status="completed",
                created_by_id=current_user.id,
            )
            db.add(payrun)
            db.flush()  # Flush to get the payrun ID

        # Create payslip records for each employee
        for payroll_data in payroll_list:
            payslip = Payslip(
                payrun_id=payrun.id,
                employee_id=payroll_data["employee_id"],
                month=request.month,
                year=request.year,
                present_days=payroll_data["present_days"],
                approved_leave_days=payroll_data["approved_leave_days"],
                paid_days=payroll_data["paid_days"],
                gross_salary=payroll_data["gross_salary"],
                basic_salary=payroll_data["basic_salary"],
                hra=payroll_data["hra"],
                special_allowance=payroll_data["special_allowance"],
                pf_deduction=payroll_data["pf_deduction"],
                professional_tax=payroll_data["professional_tax"],
                net_pay=payroll_data["net_pay"],
            )
            db.add(payslip)

        db.commit()
        db.refresh(payrun)

        return payrun

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payrun: {str(e)}",
        )


@router.get("/payslip/{payslip_id}", response_model=PayslipWithEmployeeResponse)
async def get_payslip(
    payslip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get payslip details by ID

    Access Rules:
    - Employees can view their own payslips
    - Payroll Officer/Admin/HR can view any payslip

    Args:
        payslip_id: Payslip ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Payslip with employee details

    Raises:
        HTTPException 404: If payslip not found
        HTTPException 403: If unauthorized access
    """
    payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()

    if not payslip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payslip not found",
        )

    # Access control
    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee or current_user.employee.id != payslip.employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own payslips",
            )

    return payslip


@router.get("/payslips", response_model=List[PayslipWithEmployeeResponse])
async def list_payslips(
    month: Optional[int] = Query(None, ge=1, le=12, description="Filter by month"),
    year: Optional[int] = Query(None, ge=2000, description="Filter by year"),
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List payslips with optional filters

    Access Rules:
    - Employees see only their own payslips
    - Payroll Officer/Admin/HR see all payslips

    Args:
        month: Filter by month (optional)
        year: Filter by year (optional)
        employee_id: Filter by employee ID (optional)
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of payslips matching filters
    """
    query = db.query(Payslip).options(
        joinedload(Payslip.employee).joinedload(Employee.user),
        joinedload(Payslip.payrun)
    )

    # Role-based access control
    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee:
            return []
        query = query.filter(Payslip.employee_id == current_user.employee.id)
    else:
        # HR and Payroll can see all
        if employee_id:
            query = query.filter(Payslip.employee_id == employee_id)

    # Apply optional filters
    if month:
        query = query.filter(Payslip.month == month)
    if year:
        query = query.filter(Payslip.year == year)

    payslips = query.order_by(Payslip.created_at.desc()).all()

    return payslips


@router.get("/payslip/{payslip_id}/pdf")
async def get_payslip_pdf(
    payslip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get payslip as PDF by calling PDF microservice

    Args:
        payslip_id: Payslip ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        PDF binary content

    Raises:
        HTTPException 404: If payslip not found
        HTTPException 403: If unauthorized access
        HTTPException 503: If PDF service unavailable
    """
    payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()

    if not payslip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payslip not found",
        )

    # Access control
    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee or current_user.employee.id != payslip.employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only download your own payslips",
            )

    # Get employee details for PDF
    employee = db.query(Employee).filter(Employee.id == payslip.employee_id).first()

    # Prepare payslip data for PDF service
    payslip_data = {
        "id": payslip.id,
        "month": payslip.month,
        "year": payslip.year,
        "employee": {
            "id": employee.id,
            "employee_code": employee.employee_code,
            "full_name": employee.user.full_name,
            "email": employee.user.email,
            "designation": employee.designation,
            "department": employee.department,
        },
        "attendance": {
            "present_days": payslip.present_days,
            "approved_leave_days": payslip.approved_leave_days,
            "paid_days": payslip.paid_days,
        },
        "salary_components": {
            "gross_salary": payslip.gross_salary,
            "basic_salary": payslip.basic_salary,
            "hra": payslip.hra,
            "special_allowance": payslip.special_allowance,
        },
        "deductions": {
            "pf_deduction": payslip.pf_deduction,
            "professional_tax": payslip.professional_tax,
        },
        "net_pay": payslip.net_pay,
        "created_at": payslip.created_at.isoformat(),
    }

    try:
        # Call PDF microservice
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{PDF_SERVICE_URL}/generate-payslip",
                json=payslip_data,
            )

            if response.status_code == 200:
                data = response.json()
                pdf_hex = data.get("pdf", "")
                pdf_bytes = bytes.fromhex(pdf_hex)
                
                return Response(
                    content=pdf_bytes,
                    media_type="application/pdf",
                    headers={
                        "Content-Disposition": f"attachment; filename={data.get('filename', 'payslip.pdf')}"
                    }
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"PDF service error: {response.text}",
                )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="PDF service request timed out",
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to connect to PDF service: {str(e)}",
        )


@router.get("/payruns", response_model=List[PayrunResponse])
async def list_payruns(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Payroll Officer", "Admin", "HR"])),
):
    """
    List all payruns (Payroll Officer/Admin/HR only)

    Args:
        month: Filter by month
        year: Filter by year
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of payruns
    """
    query = db.query(Payrun)

    if month:
        query = query.filter(Payrun.month == month)
    if year:
        query = query.filter(Payrun.year == year)

    payruns = query.order_by(Payrun.created_at.desc()).all()

    return payruns


@router.get("/payrun/{payrun_id}/report")
async def download_payrun_report(
    payrun_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Payroll Officer", "Admin"])),
):
    """
    Generate and download an Excel report for a specific payrun
    """
    payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
    if not payrun:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payrun not found",
        )

    payslips = db.query(Payslip).filter(Payslip.payrun_id == payrun_id).all()
    
    if not payslips:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No payslips found for this payrun",
        )

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
    
    # Create an in-memory buffer for the Excel file
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name=f'Payroll_{payrun.month}_{payrun.year}')
    
    output.seek(0)
    
    filename = f"Payroll_Report_{payrun.month}_{payrun.year}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
