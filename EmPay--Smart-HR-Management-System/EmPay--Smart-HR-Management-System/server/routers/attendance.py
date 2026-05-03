"""
Attendance router for EmPay
Endpoints: POST /api/attendance/mark, GET /api/attendance/logs
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract
from datetime import datetime, date
from typing import List, Optional

from ..config.database import get_db
from ..models import User, Employee, Attendance, UserRole
from ..schemas import (
    AttendanceMarkRequest,
    AttendanceResponse,
    AttendanceWithEmployeeResponse,
)
from ..dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


@router.get("/today", response_model=Optional[AttendanceResponse])
async def get_today_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get today's attendance record for the current user

    Returns:
        Attendance record for today if it exists, None otherwise
    """
    if not current_user.employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee record not found for current user",
        )

    today = date.today()
    attendance = db.query(Attendance).filter(
        Attendance.employee_id == current_user.employee.id,
        Attendance.attendance_date == today,
    ).first()

    return attendance


@router.post("/mark", response_model=AttendanceResponse)
async def mark_attendance(
    request: AttendanceMarkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark attendance (check-in or check-out) - Idempotent operation

    Rules:
    - Employees can only mark their own attendance unless they have Admin/HR role
    - Uses upsert logic: only one record per employee_id per date
    - Check-in and check-out update the same attendance record

    Args:
        request: AttendanceMarkRequest with action and optional employee_id
        db: Database session
        current_user: Current authenticated user

    Returns:
        Updated attendance record

    Raises:
        HTTPException 403: If user tries to mark attendance for someone else without proper role
        HTTPException 404: If employee not found
    """
    # Determine which employee to mark attendance for
    if request.employee_id:
        # Admin/HR can mark attendance for any employee
        if current_user.role not in [UserRole.ADMIN, UserRole.HR]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Admin/HR can mark attendance for other employees",
            )
        employee_id = request.employee_id
    else:
        # Regular employees mark their own attendance
        if not current_user.employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee record not found for current user",
            )
        employee_id = current_user.employee.id

    # Verify employee exists
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    # Get the current date
    today = date.today()
    current_time = request.timestamp if request.timestamp else datetime.now()

    # Try to get existing attendance record for today
    attendance = db.query(Attendance).filter(
        Attendance.employee_id == employee_id,
        Attendance.attendance_date == today,
    ).first()

    # If no record exists, create a new one
    if not attendance:
        attendance = Attendance(
            employee_id=employee_id,
            attendance_date=today,
        )
        db.add(attendance)

    # Update based on action
    if request.action.lower() == "check_in":
        if attendance.check_in_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Attendance already marked (Checked In)",
            )
        attendance.check_in_time = current_time
    elif request.action.lower() == "check_out":
        attendance.check_out_time = current_time
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action. Must be 'check_in' or 'check_out'",
        )

    db.commit()
    db.refresh(attendance)

    return attendance


@router.get("/logs", response_model=List[AttendanceWithEmployeeResponse])
async def get_attendance_logs(
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    attendance_date: Optional[date] = Query(None, description="Filter by specific date (YYYY-MM-DD)"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Filter by month (1-12)"),
    year: Optional[int] = Query(None, ge=2000, description="Filter by year"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get attendance logs with filtering
    """
    query = db.query(Attendance)

    # Access control:
    # 1. Admin/HR/Payroll can see everything
    # 2. Regular employees can see:
    #    - Their own logs (any date)
    #    - Everyone's logs for TODAY only (to support dashboard stats)
    
    is_privileged = current_user.role in [UserRole.ADMIN, UserRole.HR, UserRole.PAYROLL_OFFICER]
    
    if not is_privileged:
        # If not privileged, they can only see others if it's TODAY's date
        # Otherwise, they are restricted to their own employee_id
        is_requesting_today = attendance_date == date.today()
        
        if not is_requesting_today:
            # Restrict to own logs for any non-today query
            if employee_id and employee_id != current_user.employee.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only view your own historical attendance logs",
                )
            query = query.filter(Attendance.employee_id == current_user.employee.id)
        else:
            # If requesting today, we allow the query to proceed without employee_id filter
            # unless they specifically asked for someone else (which we already blocked or will filter)
            if employee_id and employee_id != current_user.employee.id:
                 # Still restrict specific lookups of others?
                 # Actually, for the dashboard we just need the list.
                 pass

    # Apply filters
    if employee_id:
        query = query.filter(Attendance.employee_id == employee_id)
    
    if attendance_date:
        query = query.filter(Attendance.attendance_date == attendance_date)

    if month and year:
        query = query.filter(
            extract("month", Attendance.attendance_date) == month,
            extract("year", Attendance.attendance_date) == year,
        )
    elif year:
        query = query.filter(
            extract("year", Attendance.attendance_date) == year,
        )

    attendance_records = query.order_by(Attendance.attendance_date.desc()).all()
    return attendance_records
