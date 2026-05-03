"""
Leave Management router for EmPay
Endpoints: POST /api/leave/apply, PATCH /api/leave/approve/{id}, GET /api/leave/list
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract
from datetime import datetime, date, timedelta
from typing import List, Optional

from ..config.database import get_db
from ..models import User, Employee, Leave, LeaveBalance, UserRole, LeaveType, LeaveStatus
from ..schemas import (
    LeaveRequest,
    LeaveResponse,
    LeaveWithEmployeeResponse,
    LeaveApprovalRequest,
    LeaveBalanceResponse,
    LeaveAllocationRequest,
)
from ..dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/leave", tags=["leave"])


def calculate_business_days(start_date: date, end_date: date) -> float:
    """Calculate number of business days between two dates (inclusive)"""
    current = start_date
    business_days = 0
    while current <= end_date:
        # Monday = 0, Sunday = 6
        if current.weekday() < 5:  # Monday to Friday
            business_days += 1
        current += timedelta(days=1)
    return float(business_days)


def get_or_create_leave_balance(employee_id: int, db: Session, year: int = None) -> LeaveBalance:
    """Get or create leave balance for an employee"""
    if year is None:
        year = datetime.now().year

    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee_id,
        LeaveBalance.year == year
    ).first()

    if not balance:
        balance = LeaveBalance(
            employee_id=employee_id,
            year=year,
            annual_leave=12.0,
            sick_leave=6.0,
            casual_leave=6.0,
        )
        db.add(balance)
        db.commit()
        db.refresh(balance)

    return balance


@router.post("/apply", response_model=LeaveResponse, status_code=status.HTTP_201_CREATED)
async def apply_leave(
    request: LeaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Apply for leave - Employees submit leave requests

    Validates:
    - Employee has sufficient leave balance
    - End date is after start date
    - Leave dates are in the future

    Args:
        request: Leave request with type, dates, and reason
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created leave request

    Raises:
        HTTPException 404: If employee not found
        HTTPException 400: If insufficient leave balance or invalid dates
    """
    # Check if user has employee record
    if not current_user.employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee record not found for current user",
        )

    employee = current_user.employee

    # Validate dates
    if request.end_date < request.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date",
        )

    if request.start_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Leave start date cannot be in the past",
        )

    # Calculate business days
    days_requested = calculate_business_days(request.start_date, request.end_date)

    # Get or create leave balance
    balance = get_or_create_leave_balance(employee.id, db)

    # Check balance based on leave type
    leave_type = request.leave_type.lower()
    if leave_type == "annual":
        available = balance.annual_leave
    elif leave_type == "sick":
        available = balance.sick_leave
    elif leave_type == "casual":
        available = balance.casual_leave
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid leave type. Must be 'Annual', 'Sick', or 'Casual'",
        )

    if available < days_requested:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient {leave_type} leave balance. Available: {available}, Requested: {days_requested}",
        )

    # Create leave request
    new_leave = Leave(
        employee_id=employee.id,
        leave_type=LeaveType(request.leave_type),
        start_date=request.start_date,
        end_date=request.end_date,
        days_requested=days_requested,
        reason=request.reason,
        status=LeaveStatus.PENDING,
    )

    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)

    return new_leave


@router.get("/list", response_model=List[LeaveWithEmployeeResponse])
async def get_leave_list(
    status: Optional[str] = Query(None, description="Filter by status: Pending, Approved, Rejected"),
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Filter by month (1-12)"),
    year: Optional[int] = Query(None, ge=2000, description="Filter by year"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get leave requests with role-based filtering

    Rules:
    - Employees see only their own leave requests
    - HR/Admin see all leave requests

    Query Parameters:
        - status: Filter by approval status
        - employee_id: Filter by specific employee
        - month: Filter by month
        - year: Filter by year

    Returns:
        List of leave requests matching filters
    """
    query = db.query(Leave)

    # Role-based access control
    if current_user.role == UserRole.EMPLOYEE:
        # Employees can only see their own leaves
        if not current_user.employee:
            return []
        query = query.filter(Leave.employee_id == current_user.employee.id)
    else:
        # HR and Payroll can see all, optionally filtered by employee_id
        if employee_id:
            query = query.filter(Leave.employee_id == employee_id)

    # Apply optional filters
    if status:
        query = query.filter(Leave.status == LeaveStatus(status))

    if month and year:
        query = query.filter(
            extract("month", Leave.start_date) == month,
            extract("year", Leave.start_date) == year,
        )
    elif year:
        query = query.filter(
            extract("year", Leave.start_date) == year,
        )

    leaves = query.order_by(Leave.created_at.desc()).all()

    return leaves


@router.patch("/approve/{leave_id}", response_model=LeaveResponse)
async def approve_leave(
    leave_id: int,
    request: LeaveApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Payroll Officer", "Admin"])),
):
    """
    Approve or reject leave request - Payroll Officer/Admin/HR only

    Logic:
    - If approved: Deduct days from LeaveBalance
    - Updates leave status and marks who approved it

    Args:
        leave_id: Leave request ID
        request: Approval action (approve/reject)
        db: Database session
        current_user: Current authenticated user (must be Payroll Officer or higher)

    Returns:
        Updated leave request

    Raises:
        HTTPException 404: If leave not found
        HTTPException 400: If invalid action or insufficient balance
    """
    leave = db.query(Leave).filter(Leave.id == leave_id).first()

    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found",
        )

    action = request.action.lower()

    if action == "approve":
        # Get leave balance
        balance = get_or_create_leave_balance(leave.employee_id, db)

        # Deduct days from balance
        leave_type_lower = leave.leave_type.value.lower()
        if leave_type_lower == "annual":
            if balance.annual_leave < leave.days_requested:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insufficient annual leave balance at approval time",
                )
            balance.annual_leave -= leave.days_requested
        elif leave_type_lower == "sick":
            if balance.sick_leave < leave.days_requested:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insufficient sick leave balance at approval time",
                )
            balance.sick_leave -= leave.days_requested
        elif leave_type_lower == "casual":
            if balance.casual_leave < leave.days_requested:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insufficient casual leave balance at approval time",
                )
            balance.casual_leave -= leave.days_requested

        leave.status = LeaveStatus.APPROVED
        db.commit()

    elif action == "reject":
        leave.status = LeaveStatus.REJECTED
        db.commit()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action. Must be 'approve' or 'reject'",
        )

    leave.approved_by_id = current_user.id
    db.commit()
    db.refresh(leave)

    return leave


@router.get("/balance/{employee_id}", response_model=LeaveBalanceResponse)
async def get_leave_balance(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get leave balance for an employee

    Rules:
    - Employees can view their own balance
    - HR/Payroll/Admin can view any employee's balance

    Args:
        employee_id: Employee ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Leave balance details

    Raises:
        HTTPException 403: If unauthorized access
        HTTPException 404: If balance not found
    """
    # Access control
    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee or current_user.employee.id != employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own leave balance",
            )

    balance = get_or_create_leave_balance(employee_id, db)

    return balance


@router.patch("/allocate/{employee_id}", response_model=LeaveBalanceResponse)
async def allocate_leave(
    employee_id: int,
    request: LeaveAllocationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "HR"])),
):
    """
    Allocate leave balance for an employee - Admin/HR only
    """
    balance = get_or_create_leave_balance(employee_id, db, request.year)

    if request.annual_leave is not None:
        balance.annual_leave = request.annual_leave
    if request.sick_leave is not None:
        balance.sick_leave = request.sick_leave
    if request.casual_leave is not None:
        balance.casual_leave = request.casual_leave

    db.commit()
    db.refresh(balance)

    return balance
