from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from datetime import datetime
from typing import Optional
from app.db.session import get_db
from app.models.admin import SystemAlert, SystemAlertType
from app.models.admin import AdminUser
from app.core.jwt import get_current_user
from app.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/admin/alerts", tags=["admin"])


@router.get("/")
async def get_system_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    alert_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get system alerts"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(SystemAlert)
    
    if alert_type:
        try:
            alert_t = SystemAlertType[alert_type]
            query = query.filter(SystemAlert.alert_type == alert_t)
        except KeyError:
            pass
    
    if is_active is not None:
        query = query.filter(SystemAlert.is_active == is_active)
    
    if priority:
        query = query.filter(SystemAlert.priority == priority)
    
    total = query.count()
    
    alerts = query.order_by(desc(SystemAlert.created_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    alert_list = []
    for alert in alerts:
        alert_list.append({
            "alert_id": alert.alert_id,
            "alert_type": alert.alert_type.value,
            "title": alert.title,
            "message": alert.message,
            "source": alert.source,
            "is_active": alert.is_active,
            "is_acknowledged": alert.is_acknowledged,
            "priority": alert.priority,
            "created_at": alert.created_at.isoformat() if alert.created_at else None,
            "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None
        })
    
    return {
        "alerts": alert_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Acknowledge a system alert"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    alert = db.query(SystemAlert).filter(
        SystemAlert.alert_id == alert_id
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    admin_user = db.query(AdminUser).filter(
        AdminUser.user_id == current_user.id
    ).first()
    
    alert.is_acknowledged = True
    alert.acknowledged_by = admin_user.admin_id if admin_user else current_user.email
    alert.acknowledged_at = datetime.now()
    
    db.commit()
    
    return {
        "message": "Alert acknowledged",
        "alert_id": alert_id
    }


@router.post("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Resolve a system alert"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    alert = db.query(SystemAlert).filter(
        SystemAlert.alert_id == alert_id
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_active = False
    alert.resolved_at = datetime.now()
    
    db.commit()
    
    return {
        "message": "Alert resolved",
        "alert_id": alert_id
    }


