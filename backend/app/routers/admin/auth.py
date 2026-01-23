from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.admin_auth import AdminLoginRequest, AdminRegisterRequest, AdminUserResponse, AdminRole
from app.core.security import create_access_token
from app.core.jwt import get_current_user
from datetime import timedelta
from typing import Any
import os

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])

# THIS SHOULD BE IN ENV
ADMIN_REGISTRATION_SECRET = "rta_admin_secret_2024" 

@router.post("/login", response_model=dict)
def login_admin(
    login_data: AdminLoginRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Admin Login
    """
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not user.verify_password(login_data.password):
        user.increment_failed_attempts()
        db.commit()
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    if user.status.value == "locked":
         raise HTTPException(status_code=403, detail="Account is locked due to multiple failed attempts")

    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Access Forbidden: Not an admin user")
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # Reset attempts on success
    user.reset_failed_attempts()
    db.commit()

    access_token_expires = timedelta(minutes=60 * 12) # 12 hours for admin
    access_token = create_access_token(
        data={"sub": user.email, "role": "admin", "sub_role": user.sub_role},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role.value,
            "sub_role": user.sub_role,
            "permissions": user.permissions
        }
    }


@router.post("/register", response_model=AdminUserResponse)
def register_admin(
    reg_data: AdminRegisterRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Register a new Admin User (Protected by Secret Key)
    """
    if reg_data.secret_key != ADMIN_REGISTRATION_SECRET:
        raise HTTPException(status_code=403, detail="Invalid registration secret")

    user = db.query(User).filter(User.email == reg_data.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
        
    # Check Employee ID
    emp = db.query(User).filter(User.admin_employee_id == reg_data.employee_id).first()
    if emp:
        raise HTTPException(status_code=400, detail="Employee ID already registered")

    user = User(
        email=reg_data.email,
        full_name=reg_data.full_name,
        role=UserRole.admin,
        sub_role=reg_data.sub_role.value,
        admin_employee_id=reg_data.employee_id,
        is_active=True,
    )
    user.set_password(reg_data.password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=dict)
def read_users_me(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get current admin user details
    """
    return {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role.value if hasattr(current_user.role, 'value') else current_user.role,
            "sub_role": current_user.sub_role,
            "permissions": current_user.permissions,
            "is_active": current_user.is_active
        }
