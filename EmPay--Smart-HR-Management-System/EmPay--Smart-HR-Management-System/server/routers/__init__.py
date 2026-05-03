"""
Main router module that combines all sub-routers
"""
from fastapi import APIRouter

# Import individual routers
from .employees import router as employees_router
from .attendance import router as attendance_router
from .leave import router as leave_router
from .ai import router as ai_router
from .payroll import router as payroll_router

# Import auth router (defined in this file)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from ..config.database import get_db
from ..models import User, UserRole
from ..schemas import (
    UserLogin,
    UserRegister,
    UserProfile,
    TokenResponse,
    AuthResponse,
    UserProfileUpdate,
    PasswordUpdate,
)
from ..utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from ..dependencies import get_current_user, require_role

auth_router = APIRouter(prefix="/api/auth", tags=["auth"])


@auth_router.post("/register", response_model=TokenResponse)
async def register(
    user_data: UserRegister,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Admin"])),
):
    """
    Register a new user (Admin-only endpoint)

    Only users with Admin role can create new users.

    Args:
        user_data: User registration data (email, full_name, password)
        db: Database session
        current_user: Current authenticated user (must be Admin)

    Returns:
        TokenResponse with access token, user info, and role

    Raises:
        HTTPException 400: If email already exists
        HTTPException 403: If current user is not Admin
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user with default Employee role
    hashed_password = hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        role=UserRole.EMPLOYEE,
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create JWT token
    token_data = {"user_id": new_user.id, "role": new_user.role.value}
    access_token = create_access_token(data=token_data)

    # Build user profile
    user_profile = UserProfile(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role.value,
        is_active=new_user.is_active,
    )

    return TokenResponse(
        token=access_token,
        user=user_profile,
        role=new_user.role.value,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@auth_router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    """
    Login endpoint - returns JWT token

    Args:
        credentials: Login credentials (email, password)
        db: Database session

    Returns:
        TokenResponse with access token, user info, and role

    Raises:
        HTTPException 401: If credentials are invalid
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Create JWT token matching frontend expectations
    token_data = {"user_id": user.id, "role": user.role.value}
    access_token = create_access_token(data=token_data)

    # Build user profile
    user_profile = UserProfile(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        is_active=user.is_active,
    )

    return TokenResponse(
        token=access_token,
        user=user_profile,
        role=user.role.value,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@auth_router.patch("/update-profile", response_model=UserProfile)
async def update_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update own user profile
    """
    if profile_data.full_name:
        current_user.full_name = profile_data.full_name
    if profile_data.email:
        # Check if email is already taken by another user
        existing = db.query(User).filter(User.email == profile_data.email).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use",
            )
        current_user.email = profile_data.email

    db.commit()
    db.refresh(current_user)
    return current_user


@auth_router.post("/change-password", response_model=AuthResponse)
async def change_password(
    password_data: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Change own user password
    """
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect current password",
        )

    current_user.password_hash = hash_password(password_data.new_password)
    db.commit()
    
    return AuthResponse(message="Password updated successfully", success=True)


@auth_router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """
    Get current user's profile based on JWT token

    Args:
        current_user: Current authenticated user from JWT

    Returns:
        UserProfile containing user's information
    """
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        is_active=current_user.is_active,
    )


# Combine all routers
router = APIRouter()
router.include_router(auth_router)
router.include_router(employees_router)
router.include_router(attendance_router)
router.include_router(leave_router)
router.include_router(ai_router)
router.include_router(payroll_router)


