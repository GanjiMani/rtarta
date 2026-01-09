from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from datetime import datetime
from typing import Optional
from app.db.session import get_db
from app.models.admin import Approval, ApprovalStatus, ApprovalType, AdminUser
from app.models.transaction import Transaction
from app.core.jwt import get_current_user
from app.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/admin/approvals", tags=["admin"])


class ApprovalAction(BaseModel):
    action: str  # approve, reject
    comments: Optional[str] = None


@router.get("/")
async def get_approvals(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    approval_type: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of pending and processed approvals"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(Approval)
    
    # Apply filters
    if status:
        try:
            approval_status = ApprovalStatus[status]
            query = query.filter(Approval.status == approval_status)
        except KeyError:
            pass
    
    if approval_type:
        try:
            app_type = ApprovalType[approval_type]
            query = query.filter(Approval.approval_type == app_type)
        except KeyError:
            pass
    
    if priority:
        query = query.filter(Approval.priority == priority)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    approvals = query.order_by(desc(Approval.created_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    approval_list = []
    for approval in approvals:
        approver = db.query(AdminUser).filter(
            AdminUser.admin_id == approval.approver_id
        ).first()
        
        approval_list.append({
            "approval_id": approval.approval_id,
            "approval_type": approval.approval_type.value,
            "request_id": approval.request_id,
            "status": approval.status.value,
            "priority": approval.priority,
            "current_level": approval.current_level,
            "total_levels": approval.total_levels,
            "approver_name": approver.user.full_name if approver and approver.user else None,
            "created_at": approval.created_at.isoformat() if approval.created_at else None,
            "approval_date": approval.approval_date.isoformat() if approval.approval_date else None,
            "rejection_reason": approval.rejection_reason,
            "sla_deadline": approval.sla_deadline.isoformat() if approval.sla_deadline else None
        })
    
    return {
        "approvals": approval_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/{approval_id}")
async def get_approval_details(
    approval_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific approval"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    approval = db.query(Approval).filter(
        Approval.approval_id == approval_id
    ).first()
    
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    
    approver = db.query(AdminUser).filter(
        AdminUser.admin_id == approval.approver_id
    ).first()
    
    return {
        "approval": {
            "approval_id": approval.approval_id,
            "approval_type": approval.approval_type.value,
            "request_id": approval.request_id,
            "request_data": approval.request_data,
            "status": approval.status.value,
            "priority": approval.priority,
            "current_level": approval.current_level,
            "total_levels": approval.total_levels,
            "approver_id": approval.approver_id,
            "approver_name": approver.user.full_name if approver and approver.user else None,
            "approval_date": approval.approval_date.isoformat() if approval.approval_date else None,
            "rejection_reason": approval.rejection_reason,
            "sla_deadline": approval.sla_deadline.isoformat() if approval.sla_deadline else None,
            "created_at": approval.created_at.isoformat() if approval.created_at else None
        }
    }


@router.post("/{approval_id}/action")
async def process_approval(
    approval_id: str,
    action_data: ApprovalAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve or reject an approval request"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    approval = db.query(Approval).filter(
        Approval.approval_id == approval_id
    ).first()
    
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    
    if approval.status != ApprovalStatus.pending:
        raise HTTPException(
            status_code=400,
            detail="Approval is not in pending status"
        )
    
    # Get current admin user
    admin_user = db.query(AdminUser).filter(
        AdminUser.user_id == current_user.id
    ).first()
    
    if not admin_user:
        raise HTTPException(status_code=403, detail="Admin user not found")
    
    if action_data.action == "approve":
        if approval.current_level >= approval.total_levels:
            # Final approval
            approval.status = ApprovalStatus.approved
            approval.approval_date = datetime.now()
            
            # Process the underlying request based on type
            if approval.approval_type == ApprovalType.transaction:
                transaction = db.query(Transaction).filter(
                    Transaction.transaction_id == approval.request_id
                ).first()
                if transaction:
                    transaction.status = "completed"
                    transaction.approved_by = admin_user.admin_id
        else:
            # Move to next level
            approval.current_level += 1
            # Update approver for next level (would need approval chain logic)
            
    elif action_data.action == "reject":
        approval.status = ApprovalStatus.rejected
        approval.rejection_reason = action_data.comments
        approval.approval_date = datetime.now()
        
        # Reject the underlying request
        if approval.approval_type == ApprovalType.transaction:
            transaction = db.query(Transaction).filter(
                Transaction.transaction_id == approval.request_id
            ).first()
            if transaction:
                transaction.status = "rejected"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    db.commit()
    
    return {
        "message": f"Approval {action_data.action}d successfully",
        "approval_id": approval_id,
        "status": approval.status.value
    }


@router.get("/stats/summary")
async def get_approval_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get approval statistics"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_approvals = db.query(Approval).count()
    pending_approvals = db.query(Approval).filter(
        Approval.status == ApprovalStatus.pending
    ).count()
    approved_count = db.query(Approval).filter(
        Approval.status == ApprovalStatus.approved
    ).count()
    rejected_count = db.query(Approval).filter(
        Approval.status == ApprovalStatus.rejected
    ).count()
    
    # Pending by type
    pending_by_type = {}
    for app_type in ApprovalType:
        count = db.query(Approval).filter(
            and_(
                Approval.approval_type == app_type,
                Approval.status == ApprovalStatus.pending
            )
        ).count()
        pending_by_type[app_type.value] = count
    
    return {
        "total_approvals": total_approvals,
        "pending_approvals": pending_approvals,
        "approved_count": approved_count,
        "rejected_count": rejected_count,
        "pending_by_type": pending_by_type
    }


