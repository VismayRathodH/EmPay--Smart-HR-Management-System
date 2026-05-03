"""
Employee router for EmPay
Endpoints: GET /api/employees, POST /api/employees, PATCH /api/employees/{id}
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from ..config.database import get_db
from ..models import User, Employee, UserRole
from ..schemas import (
    EmployeeCreate,
    EmployeeResponse,
    EmployeeUpdate,
    EmployeeWithUserResponse,
    EmployeeProfileUpdate,
    EmployeePayrollUpdate,
)
from ..dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("", response_model=List[EmployeeWithUserResponse])
async def get_employees(
    department: str = Query(None, description="Filter by department"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get list of employees - Accessible by all authenticated users

    Query Parameters:
        - department: Optional filter by department

    Returns:
        List of employees with their user information
    """
    query = db.query(Employee)

    if department:
        query = query.filter(Employee.department == department)

    employees = query.filter(Employee.is_active == True).all()

    return employees


@router.post("", response_model=EmployeeWithUserResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    employee_data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "HR"])),
):
    """
    Create new employee - Admin/HR only

    Args:
        employee_data: Employee information including user_id
        db: Database session
        current_user: Current authenticated user (must be Admin or HR)

    Returns:
        Created employee with user information

    Raises:
        HTTPException 400: If employee code already exists or user not found
        HTTPException 403: If current user is not Admin or HR
    """
    # Check if employee code already exists
    existing_employee = db.query(Employee).filter(
        Employee.employee_code == employee_data.employee_code
    ).first()
    if existing_employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee code already exists",
        )

    # Check if user exists
    user = db.query(User).filter(User.id == employee_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found",
        )

    # Check if user already has an employee record
    existing_user_employee = db.query(Employee).filter(
        Employee.user_id == employee_data.user_id
    ).first()
    if existing_user_employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has an employee record",
        )

    # Create new employee
    new_employee = Employee(
        user_id=employee_data.user_id,
        employee_code=employee_data.employee_code,
        designation=employee_data.designation,
        department=employee_data.department,
        phone_number=employee_data.phone_number,
        address=employee_data.address,
        date_of_birth=employee_data.date_of_birth,
        ctc=employee_data.ctc,
        wage=employee_data.wage,
        basic_salary=employee_data.basic_salary,
        hra=employee_data.hra,
        special_allowance=employee_data.special_allowance,
        pf_optin=employee_data.pf_optin,
        pf_account_number=employee_data.pf_account_number,
        professional_tax_slab=employee_data.professional_tax_slab,
        bank_account_number=employee_data.bank_account_number,
        ifsc_code=employee_data.ifsc_code,
        bank_name=employee_data.bank_name,
    )

    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    # Load user relationship
    db.refresh(new_employee, ["user"])

    return new_employee


@router.patch("/me", response_model=EmployeeWithUserResponse)
async def update_my_profile(
    profile_data: EmployeeProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update own profile - Accessible by the employee
    Allows updating non-sensitive information like contact details.
    """
    if not current_user.employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee record not found for current user",
        )
        
    employee = current_user.employee

    # Update only provided fields
    update_data = profile_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)

    db.commit()
    db.refresh(employee)
    db.refresh(employee, ["user"])

    return employee


@router.get("/{employee_id}", response_model=EmployeeWithUserResponse)
async def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific employee - Accessible by all authenticated users

    Args:
        employee_id: Employee ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Employee with user information

    Raises:
        HTTPException 404: If employee not found
    """
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.is_active == True
    ).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    return employee


@router.patch("/{employee_id}", response_model=EmployeeWithUserResponse)
async def update_employee(
    employee_id: int,
    employee_data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "HR"])),
):
    """
    Update employee information - Admin/HR only

    Args:
        employee_id: Employee ID to update
        employee_data: Fields to update
        db: Database session
        current_user: Current authenticated user (must be Admin or HR)

    Returns:
        Updated employee with user information

    Raises:
        HTTPException 404: If employee not found
        HTTPException 403: If current user is not Admin or HR
    """
    employee = db.query(Employee).filter(Employee.id == employee_id).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    # Restrict HR: Can only edit 'Employee' role profiles
    if current_user.role == UserRole.HR and employee.user and employee.user.role != UserRole.EMPLOYEE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR can only update profiles with the 'Employee' role",
        )

    # Update only provided fields
    update_data = employee_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)

    db.commit()
    db.refresh(employee)
    db.refresh(employee, ["user"])

    return employee


@router.patch("/{employee_id}/payroll", response_model=EmployeeWithUserResponse)
async def update_employee_payroll(
    employee_id: int,
    payroll_data: EmployeePayrollUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "Payroll Officer"])),
):
    """
    Update employee payroll information - Admin/Payroll Officer only
    """
    employee = db.query(Employee).filter(Employee.id == employee_id).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    # Update only provided fields
    update_data = payroll_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)

    db.commit()
    db.refresh(employee)
    db.refresh(employee, ["user"])

    return employee


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin", "HR"])),
):
    """
    Delete an employee (Soft delete) - Admin/HR only
    """
    employee = db.query(Employee).filter(Employee.id == employee_id).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    # Restrict HR: Can only delete 'Employee' role profiles
    if current_user.role == UserRole.HR and employee.user and employee.user.role != UserRole.EMPLOYEE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR can only delete profiles with the 'Employee' role",
        )

    employee.is_active = False
    if employee.user:
        employee.user.is_active = False

    db.commit()
    return

