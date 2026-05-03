"""
Dependency functions for authentication and role-based access control
"""
from fastapi import Depends, HTTPException, status
from starlette.authentication import AuthCredentials
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import List, Optional

from .config.database import get_db
from .models import User
from .utils.security import verify_token

security = HTTPBearer()


async def get_current_user(
    credentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token

    Args:
        credentials: HTTP Bearer credentials from request header
        db: Database session

    Returns:
        User object if token is valid

    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


def require_role(allowed_roles: List[str]):
    """
    Create a dependency function that enforces role-based access control

    Args:
        allowed_roles: List of roles that are allowed to access the endpoint
                      (e.g., ["Admin", "HR"])

    Returns:
        Dependency function that can be used with FastAPI route decorators

    Example:
        @router.post("/create-employee")
        async def create_employee(
            data: EmployeeCreate,
            current_user: User = Depends(get_current_user),
            _: None = Depends(require_role(["Admin", "HR"]))
        ):
            # Only Admin and HR users can access this endpoint
            pass
    """
    async def check_role(current_user: User = Depends(get_current_user)):
        if current_user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}",
            )
        return current_user

    return check_role


async def get_current_admin(
    current_user: User = Depends(require_role(["Admin"]))
) -> User:
    """Dependency for admin-only endpoints"""
    return current_user


async def get_current_hr(
    current_user: User = Depends(require_role(["Admin", "HR"]))
) -> User:
    """Dependency for HR/Admin endpoints"""
    return current_user


async def get_current_payroll(
    current_user: User = Depends(require_role(["Admin", "Payroll Officer"]))
) -> User:
    """Dependency for Payroll Officer/Admin endpoints"""
    return current_user
