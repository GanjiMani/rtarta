from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from datetime import datetime
from typing import Optional
from app.db.session import get_db
from app.models.admin import Exception as ExceptionModel
from app.core.jwt import get_current_user
from app.models.user import User
from app.models.admin import AdminUser
from pydantic import BaseModel

router = APIRouter(prefix="/admin/exceptions", tags=["admin"])


class ExceptionResolution(BaseModel):
    resolution_notes: str


@router.get("/")
async def get_exceptions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    exception_type: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get exception records"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(ExceptionModel)
    
    if status:
        query = query.filter(ExceptionModel.status == status)
    if exception_type:
        query = query.filter(ExceptionModel.exception_type == exception_type)
    if priority:
        query = query.filter(ExceptionModel.priority == priority)
    
    total = query.count()
    
    exceptions = query.order_by(desc(ExceptionModel.occurred_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    exception_list = []
    for exc in exceptions:
        exception_list.append({
            "exception_id": exc.exception_id,
            "exception_type": exc.exception_type,
            "transaction_id": exc.transaction_id,
            "investor_id": exc.investor_id,
            "folio_number": exc.folio_number,
            "error_code": exc.error_code,
            "error_message": exc.error_message,
            "status": exc.status,
            "priority": exc.priority,
            "resolved_by": exc.resolved_by,
            "resolved_at": exc.resolved_at.isoformat() if exc.resolved_at else None,
            "resolution_notes": exc.resolution_notes,
            "occurred_at": exc.occurred_at.isoformat() if exc.occurred_at else None
        })
    
    return {
        "exceptions": exception_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/{exception_id}")
async def get_exception_details(
    exception_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get exception details"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    exception = db.query(ExceptionModel).filter(
        ExceptionModel.exception_id == exception_id
    ).first()
    
    if not exception:
        raise HTTPException(status_code=404, detail="Exception not found")
    
    return {
        "exception": {
            "exception_id": exception.exception_id,
            "exception_type": exception.exception_type,
            "transaction_id": exception.transaction_id,
            "investor_id": exception.investor_id,
            "folio_number": exception.folio_number,
            "error_code": exception.error_code,
            "error_message": exception.error_message,
            "exception_data": exception.exception_data,
            "status": exception.status,
            "priority": exception.priority,
            "resolved_by": exception.resolved_by,
            "resolved_at": exception.resolved_at.isoformat() if exception.resolved_at else None,
            "resolution_notes": exception.resolution_notes,
            "occurred_at": exception.occurred_at.isoformat() if exception.occurred_at else None
        }
    }


@router.post("/{exception_id}/resolve")
async def resolve_exception(
    exception_id: str,
    resolution: ExceptionResolution,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Resolve an exception"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    exception = db.query(ExceptionModel).filter(
        ExceptionModel.exception_id == exception_id
    ).first()
    
    if not exception:
        raise HTTPException(status_code=404, detail="Exception not found")
    
    if exception.status == "resolved":
        raise HTTPException(status_code=400, detail="Exception already resolved")
    
    admin_user = db.query(AdminUser).filter(
        AdminUser.user_id == current_user.id
    ).first()
    
    exception.status = "resolved"
    exception.resolved_by = admin_user.admin_id if admin_user else current_user.email
    exception.resolved_at = datetime.now()
    exception.resolution_notes = resolution.resolution_notes
    
    db.commit()
    
    return {
        "message": "Exception resolved successfully",
        "exception_id": exception_id
    }


@router.get("/stats/summary")
async def get_exception_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get exception statistics"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from sqlalchemy import func
    
    total_exceptions = db.query(func.count(ExceptionModel.id)).scalar() or 0
    open_exceptions = db.query(func.count(ExceptionModel.id)).filter(
        ExceptionModel.status == "open"
    ).scalar() or 0
    resolved_exceptions = db.query(func.count(ExceptionModel.id)).filter(
        ExceptionModel.status == "resolved"
    ).scalar() or 0
    
    # By priority
    critical = db.query(func.count(ExceptionModel.id)).filter(
        and_(
            ExceptionModel.priority == "critical",
            ExceptionModel.status != "resolved"
        )
    ).scalar() or 0
    
    high = db.query(func.count(ExceptionModel.id)).filter(
        and_(
            ExceptionModel.priority == "high",
            ExceptionModel.status != "resolved"
        )
    ).scalar() or 0
    
    return {
        "total_exceptions": total_exceptions,
        "open_exceptions": open_exceptions,
        "resolved_exceptions": resolved_exceptions,
        "critical_exceptions": critical,
        "high_priority_exceptions": high
    }


