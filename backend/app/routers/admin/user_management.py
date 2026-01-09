from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from datetime import datetime
from typing import Optional
from app.db.session import get_db
from app.models.admin import AdminUser, AdminRole
from app.models.user import User, UserStatus, UserRole
from app.core.jwt import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/admin/users", tags=["admin"])


class AdminUserCreate(BaseModel):
    user_id: int
    employee_id: str
    role: str
    department: Optional[str] = None
    designation: Optional[str] = None
    permissions: Optional[dict] = None
    transaction_limit: Optional[float] = None


class AdminUserUpdate(BaseModel):
    role: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    permissions: Optional[dict] = None
    transaction_limit: Optional[float] = None
    is_active: Optional[bool] = None


@router.get("/")
async def get_admin_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of admin users"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(AdminUser).join(User, AdminUser.user_id == User.id)
    
    if role:
        try:
            admin_role = AdminRole[role]
            query = query.filter(AdminUser.role == admin_role)
        except KeyError:
            pass
    
    if status:
        if status == "active":
            query = query.filter(User.is_active == True)
        elif status == "inactive":
            query = query.filter(User.is_active == False)
    
    total = query.count()
    
    admin_users = query.order_by(desc(AdminUser.created_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    user_list = []
    for admin_user in admin_users:
        user = db.query(User).filter(User.id == admin_user.user_id).first()
        user_list.append({
            "admin_id": admin_user.admin_id,
            "user_id": admin_user.user_id,
            "employee_id": admin_user.employee_id,
            "name": user.full_name if user else None,
            "email": user.email if user else None,
            "role": admin_user.role.value,
            "department": admin_user.department,
            "designation": admin_user.designation,
            "access_level": admin_user.access_level,
            "is_active": admin_user.is_active and (user.is_active if user else False),
            "last_login": admin_user.last_login.isoformat() if admin_user.last_login else None,
            "created_at": admin_user.created_at.isoformat() if admin_user.created_at else None
        })
    
    return {
        "users": user_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/")
async def create_admin_user(
    user_data: AdminUserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new admin user"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Verify user exists
    user = db.query(User).filter(User.id == user_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if admin user already exists
    existing = db.query(AdminUser).filter(
        AdminUser.user_id == user_data.user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Admin user already exists for this user")
    
    # Generate admin ID
    last_admin = db.query(AdminUser).order_by(desc(AdminUser.id)).first()
    admin_id_num = int(last_admin.admin_id.replace("ADM", "")) + 1 if last_admin else 1
    admin_id = f"ADM{admin_id_num:03d}"
    
    try:
        admin_role = AdminRole[user_data.role]
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {user_data.role}")
    
    admin_user = AdminUser(
        admin_id=admin_id,
        user_id=user_data.user_id,
        employee_id=user_data.employee_id,
        role=admin_role,
        department=user_data.department,
        designation=user_data.designation,
        permissions=user_data.permissions or {},
        transaction_limit=user_data.transaction_limit,
        is_active=True
    )
    
    db.add(admin_user)
    db.commit()
    
    return {
        "message": "Admin user created successfully",
        "admin_id": admin_id,
        "user_id": user_data.user_id
    }


@router.put("/{admin_id}")
async def update_admin_user(
    admin_id: str,
    user_data: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an admin user"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    admin_user = db.query(AdminUser).filter(
        AdminUser.admin_id == admin_id
    ).first()
    
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    if user_data.role:
        try:
            admin_user.role = AdminRole[user_data.role]
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {user_data.role}")
    
    if user_data.department is not None:
        admin_user.department = user_data.department
    if user_data.designation is not None:
        admin_user.designation = user_data.designation
    if user_data.permissions is not None:
        admin_user.permissions = user_data.permissions
    if user_data.transaction_limit is not None:
        admin_user.transaction_limit = user_data.transaction_limit
    if user_data.is_active is not None:
        admin_user.is_active = user_data.is_active
    
    db.commit()
    
    return {
        "message": "Admin user updated successfully",
        "admin_id": admin_id
    }


@router.post("/{admin_id}/toggle-status")
async def toggle_user_status(
    admin_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle admin user active status"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    admin_user = db.query(AdminUser).filter(
        AdminUser.admin_id == admin_id
    ).first()
    
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    admin_user.is_active = not admin_user.is_active
    
    # Also update user status
    user = db.query(User).filter(User.id == admin_user.user_id).first()
    if user:
        user.is_active = admin_user.is_active
        user.status = UserStatus.active if admin_user.is_active else UserStatus.inactive
    
    db.commit()
    
    return {
        "message": f"User {'activated' if admin_user.is_active else 'deactivated'} successfully",
        "admin_id": admin_id,
        "is_active": admin_user.is_active
    }


