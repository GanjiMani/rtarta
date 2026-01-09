from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from datetime import datetime
from typing import Optional, Dict
from app.db.session import get_db
from app.models.admin import SystemSetting
from app.models.admin import AdminUser
from app.core.jwt import get_current_user
from app.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/admin/settings", tags=["admin"])


class SettingUpdate(BaseModel):
    setting_value: str
    description: Optional[str] = None


@router.get("/")
async def get_system_settings(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get system settings"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(SystemSetting)
    
    if category:
        query = query.filter(SystemSetting.category == category)
    
    settings = query.order_by(SystemSetting.category, SystemSetting.setting_key).all()
    
    settings_list = []
    for setting in settings:
        settings_list.append({
            "setting_key": setting.setting_key,
            "setting_value": setting.setting_value,
            "setting_type": setting.setting_type,
            "category": setting.category,
            "description": setting.description,
            "is_readonly": setting.is_readonly,
            "updated_at": setting.updated_at.isoformat() if setting.updated_at else None,
            "updated_by": setting.updated_by
        })
    
    return {"settings": settings_list}


@router.get("/{setting_key}")
async def get_setting(
    setting_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific system setting"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    setting = db.query(SystemSetting).filter(
        SystemSetting.setting_key == setting_key
    ).first()
    
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    return {
        "setting_key": setting.setting_key,
        "setting_value": setting.setting_value,
        "setting_type": setting.setting_type,
        "category": setting.category,
        "description": setting.description,
        "is_readonly": setting.is_readonly,
        "updated_at": setting.updated_at.isoformat() if setting.updated_at else None,
        "updated_by": setting.updated_by
    }


@router.put("/{setting_key}")
async def update_setting(
    setting_key: str,
    setting_data: SettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a system setting"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    setting = db.query(SystemSetting).filter(
        SystemSetting.setting_key == setting_key
    ).first()
    
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    if setting.is_readonly:
        raise HTTPException(status_code=403, detail="Setting is read-only")
    
    # Get admin user
    admin_user = db.query(AdminUser).filter(
        AdminUser.user_id == current_user.id
    ).first()
    
    setting.setting_value = setting_data.setting_value
    if setting_data.description:
        setting.description = setting_data.description
    setting.updated_by = admin_user.admin_id if admin_user else current_user.email
    setting.updated_at = datetime.now()
    
    db.commit()
    
    return {
        "message": "Setting updated successfully",
        "setting_key": setting_key,
        "setting_value": setting.setting_value
    }


@router.post("/bulk-update")
async def bulk_update_settings(
    settings: Dict[str, str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bulk update multiple settings"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    admin_user = db.query(AdminUser).filter(
        AdminUser.user_id == current_user.id
    ).first()
    
    updated = []
    for setting_key, setting_value in settings.items():
        setting = db.query(SystemSetting).filter(
            SystemSetting.setting_key == setting_key
        ).first()
        
        if setting and not setting.is_readonly:
            setting.setting_value = setting_value
            setting.updated_by = admin_user.admin_id if admin_user else current_user.email
            setting.updated_at = datetime.now()
            updated.append(setting_key)
    
    db.commit()
    
    return {
        "message": f"Updated {len(updated)} settings",
        "updated_settings": updated
    }


