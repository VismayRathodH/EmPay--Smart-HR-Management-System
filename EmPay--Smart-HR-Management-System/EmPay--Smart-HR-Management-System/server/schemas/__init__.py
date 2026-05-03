"""
Pydantic schemas for all endpoints
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


# ============ Auth Schemas ============

class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserRegister(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfile(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Token response matching frontend authStore.js expectations"""
    access_token: str = Field(..., alias="token")
    token_type: str = "bearer"
    user: UserProfile
    role: str
    expires_in: int = 86400  # 24 hours in seconds

    class Config:
        populate_by_name = True


class TokenPayload(BaseModel):
    """JWT token payload"""
    user_id: int
    role: str
    exp: Optional[datetime] = None


class AuthResponse(BaseModel):
    """General auth response"""
    message: str
    success: bool
    data: Optional[dict] = None


class UserProfileUpdate(BaseModel):
    """Schema for updating user profile"""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class PasswordUpdate(BaseModel):
    """Schema for updating user password"""
    current_password: str
    new_password: str = Field(..., min_length=6)


# ============ Employee Schemas ============

class EmployeeBase(BaseModel):
    employee_code: str = Field(..., description="Unique employee code")
    designation: Optional[str] = None
    department: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    ctc: float = Field(..., description="Cost to Company (Annual)")
    wage: float = Field(..., description="Monthly wage")
    basic_salary: Optional[float] = None
    hra: Optional[float] = None
    special_allowance: Optional[float] = None
    pf_optin: bool = True
    pf_account_number: Optional[str] = None
    professional_tax_slab: Optional[str] = None
    bank_account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_name: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    user_id: int = Field(..., description="User ID to link employee to")


class EmployeeUpdate(BaseModel):
    employee_code: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    date_of_joining: Optional[datetime] = None
    ctc: Optional[float] = None
    wage: Optional[float] = None
    basic_salary: Optional[float] = None
    hra: Optional[float] = None
    special_allowance: Optional[float] = None
    pf_optin: Optional[bool] = None
    pf_account_number: Optional[str] = None
    professional_tax_slab: Optional[str] = None
    bank_account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_name: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeePayrollUpdate(BaseModel):
    """Schema for updating payroll-related information"""
    ctc: Optional[float] = None
    wage: Optional[float] = None
    basic_salary: Optional[float] = None
    hra: Optional[float] = None
    special_allowance: Optional[float] = None
    pf_optin: Optional[bool] = None
    pf_account_number: Optional[str] = None
    professional_tax_slab: Optional[str] = None
    bank_account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_name: Optional[str] = None


class EmployeeProfileUpdate(BaseModel):
    """Schema for employee self-service profile updates"""
    phone_number: Optional[str] = None
    address: Optional[str] = None
    bank_account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_name: Optional[str] = None


class EmployeeResponse(EmployeeBase):
    id: int
    user_id: int
    date_of_joining: datetime
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EmployeeWithUserResponse(EmployeeResponse):
    user: UserProfile


# ============ Attendance Schemas ============

class AttendanceMarkRequest(BaseModel):
    action: str = Field(..., description="'check_in' or 'check_out'")
    employee_id: Optional[int] = Field(None, description="Employee ID (required for Admin/HR, optional for own attendance)")
    timestamp: Optional[datetime] = Field(None, description="Override timestamp (for admin only)")

    class Config:
        json_schema_extra = {
            "example": {
                "action": "check_in",
                "employee_id": None,
                "timestamp": None
            }
        }


class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    attendance_date: date
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AttendanceWithEmployeeResponse(AttendanceResponse):
    employee: EmployeeResponse


class AttendanceLogFilter(BaseModel):
    employee_id: Optional[int] = None
    month: Optional[int] = Field(None, ge=1, le=12)
    year: Optional[int] = Field(None, ge=2000)


# ============ Leave Schemas ============

class LeaveRequest(BaseModel):
    leave_type: str = Field(..., description="'Annual', 'Sick', or 'Casual'")
    start_date: date = Field(..., description="Leave start date")
    end_date: date = Field(..., description="Leave end date")
    reason: str = Field(..., description="Reason for leave request")

    class Config:
        json_schema_extra = {
            "example": {
                "leave_type": "Annual",
                "start_date": "2026-05-15",
                "end_date": "2026-05-17",
                "reason": "Vacation"
            }
        }


class LeaveResponse(BaseModel):
    id: int
    employee_id: int
    leave_type: str
    start_date: date
    end_date: date
    days_requested: float
    reason: str
    status: str
    created_at: datetime
    updated_at: datetime
    approved_by_id: Optional[int] = None

    class Config:
        from_attributes = True


class LeaveWithEmployeeResponse(LeaveResponse):
    employee: EmployeeWithUserResponse


class LeaveApprovalRequest(BaseModel):
    action: str = Field(..., description="'approve' or 'reject'")
    remarks: Optional[str] = Field(None, description="Optional remarks for approval/rejection")

    class Config:
        json_schema_extra = {
            "example": {
                "action": "approve",
                "remarks": "Approved - coverage arranged"
            }
        }


class LeaveAllocationRequest(BaseModel):
    annual_leave: Optional[float] = None
    sick_leave: Optional[float] = None
    casual_leave: Optional[float] = None
    year: Optional[int] = Field(None, description="Defaults to current year if not provided")


class LeaveBalanceResponse(BaseModel):
    id: int
    employee_id: int
    annual_leave: float
    sick_leave: float
    casual_leave: float
    year: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ AI Schemas ============

class AIRequest(BaseModel):
    type: str = Field(..., description="'leave', 'summary', or 'insight'")
    data: dict = Field(..., description="Context data for the AI prompt")

    class Config:
        json_schema_extra = {
            "example": {
                "type": "leave",
                "data": {
                    "leave_type": "Annual",
                    "reason": "Family vacation",
                    "start_date": "2026-05-15",
                    "end_date": "2026-05-20"
                }
            }
        }



class AIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
    error: Optional[str] = None


# ============ Payroll Schemas ============

class PayrunRequest(BaseModel):
    month: int = Field(..., ge=1, le=12, description="Month (1-12)")
    year: int = Field(..., ge=2000, description="Year (YYYY)")


class PayslipResponse(BaseModel):
    id: int
    payrun_id: int
    employee_id: int
    month: int
    year: int
    present_days: float
    approved_leave_days: float
    paid_days: float
    gross_salary: float
    basic_salary: float
    hra: float
    special_allowance: float
    pf_deduction: float
    professional_tax: float
    net_pay: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PayrunResponse(BaseModel):
    id: int
    month: int
    year: int
    total_employees: int
    total_gross: float
    total_deductions: float
    total_net_pay: float
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PayslipWithEmployeeResponse(PayslipResponse):
    employee: EmployeeWithUserResponse
    payrun: Optional[PayrunResponse] = None


