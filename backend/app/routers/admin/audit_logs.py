from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime, timedelta
from typing import Optional
from app.db.session import get_db
from app.models.admin import AuditLog, AuditLogAction
from app.core.jwt import get_current_user
from app.core.permissions import has_permission
from app.core.roles import AdminPermissions
from app.models.user import User

router = APIRouter(prefix="/admin/audit", tags=["admin"])


@router.get("/")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    action: Optional[str] = None,
    user_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission(AdminPermissions.READ_AUDIT))
):
    """Get audit logs with filters"""
    
    query = db.query(AuditLog)
    
    # Apply filters
    if action:
        try:
            log_action = AuditLogAction[action]
            query = query.filter(AuditLog.action == log_action)
        except KeyError:
            pass
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    logs = query.order_by(desc(AuditLog.timestamp)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    log_list = []
    for log in logs:
        log_list.append({
            "log_id": log.log_id,
            "action": log.action.value,
            "user_email": log.user_email,
            "user_role": log.user_role,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "success": log.success,
            "error_message": log.error_message,
            "ip_address": log.ip_address,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "action_details": log.action_details
        })
    
    return {
        "logs": log_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/stats")
async def get_audit_stats(
    days: int = Query(7, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission(AdminPermissions.READ_AUDIT))
):
    """Get audit log statistics"""
    
    start_date = datetime.now() - timedelta(days=days)
    
    # Total logs
    total_logs = db.query(AuditLog).filter(
        AuditLog.timestamp >= start_date
    ).count()
    
    # By action
    from sqlalchemy import func
    action_stats = db.query(
        AuditLog.action,
        func.count(AuditLog.id).label("count")
    ).filter(
        AuditLog.timestamp >= start_date
    ).group_by(AuditLog.action).all()
    
    action_data = {
        action.value: count
        for action, count in action_stats
    }
    
    # Success vs Failure
    success_count = db.query(AuditLog).filter(
        and_(
            AuditLog.timestamp >= start_date,
            AuditLog.success == True
        )
    ).count()
    
    failure_count = total_logs - success_count
    
    return {
        "total_logs": total_logs,
        "success_count": success_count,
        "failure_count": failure_count,
        "action_distribution": action_data,
        "period_days": days
    }


