from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from datetime import datetime, timedelta
from typing import Optional
from app.db.session import get_db
from app.models.admin import UserSession
from app.models.user import User
from app.core.jwt import get_current_user

router = APIRouter(prefix="/admin/user-sessions", tags=["admin"])


@router.get("/")
async def get_user_sessions(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    user_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user session logs"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(UserSession)
    
    if user_id:
        query = query.filter(UserSession.user_id == user_id)
    
    if is_active is not None:
        query = query.filter(UserSession.is_active == is_active)
    
    total = query.count()
    
    sessions = query.order_by(desc(UserSession.login_time)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    session_list = []
    for session in sessions:
        user = db.query(User).filter(User.id == session.user_id).first()
        session_list.append({
            "session_id": session.session_id,
            "user_id": session.user_id,
            "user_email": user.email if user else None,
            "user_role": user.role.value if user else None,
            "ip_address": session.ip_address,
            "user_agent": session.user_agent,
            "device_type": session.device_type,
            "browser": session.browser,
            "os": session.os,
            "location": session.location,
            "is_active": session.is_active,
            "is_suspicious": session.is_suspicious,
            "login_time": session.login_time.isoformat() if session.login_time else None,
            "last_activity": session.last_activity.isoformat() if session.last_activity else None,
            "logout_time": session.logout_time.isoformat() if session.logout_time else None
        })
    
    return {
        "sessions": session_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/{session_id}/terminate")
async def terminate_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Terminate a user session"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    session = db.query(UserSession).filter(
        UserSession.session_id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.is_active = False
    session.logout_time = datetime.now()
    
    db.commit()
    
    return {
        "message": "Session terminated successfully",
        "session_id": session_id
    }


@router.get("/stats")
async def get_session_stats(
    days: int = Query(7, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get session statistics"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from sqlalchemy import func
    
    start_date = datetime.now() - timedelta(days=days)
    
    total_sessions = db.query(func.count(UserSession.id)).filter(
        UserSession.login_time >= start_date
    ).scalar() or 0
    
    active_sessions = db.query(func.count(UserSession.id)).filter(
        and_(
            UserSession.is_active == True,
            UserSession.login_time >= start_date
        )
    ).scalar() or 0
    
    suspicious_sessions = db.query(func.count(UserSession.id)).filter(
        and_(
            UserSession.is_suspicious == True,
            UserSession.login_time >= start_date
        )
    ).scalar() or 0
    
    return {
        "total_sessions": total_sessions,
        "active_sessions": active_sessions,
        "suspicious_sessions": suspicious_sessions,
        "period_days": days
    }


