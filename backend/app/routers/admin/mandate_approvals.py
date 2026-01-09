from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from datetime import datetime
from typing import Optional
from app.db.session import get_db
from app.models.mandate import BankAccount, BankAccountStatus
from app.models.investor import Investor
from app.models.admin import Approval, ApprovalType, ApprovalStatus
from app.core.jwt import get_current_user
from app.models.user import User
from app.models.admin import AdminUser
from pydantic import BaseModel

router = APIRouter(prefix="/admin/mandate-approvals", tags=["admin"])


class MandateAction(BaseModel):
    action: str  # approve, reject
    comments: Optional[str] = None


@router.get("/")
async def get_mandate_approvals(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get bank mandate approval requests"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(BankAccount).filter(
        BankAccount.status == BankAccountStatus.pending_verification
    )
    
    total = query.count()
    
    mandates = query.order_by(desc(BankAccount.created_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    mandate_list = []
    for mandate in mandates:
        investor = db.query(Investor).filter(
            Investor.investor_id == mandate.investor_id
        ).first()
        
        mandate_list.append({
            "account_id": mandate.id,
            "investor_id": mandate.investor_id,
            "investor_name": investor.full_name if investor else None,
            "pan": investor.pan_number if investor else None,
            "bank_name": mandate.bank_name,
            "account_number": mandate.account_number[-4:] if mandate.account_number else None,  # Last 4 digits
            "ifsc_code": mandate.ifsc_code,
            "account_type": mandate.account_type.value if mandate.account_type else None,
            "status": mandate.status.value,
            "is_default": mandate.is_default,
            "created_at": mandate.created_at.isoformat() if mandate.created_at else None
        })
    
    return {
        "mandates": mandate_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/{account_id}/action")
async def process_mandate_approval(
    account_id: int,
    action: MandateAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve or reject bank mandate"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    mandate = db.query(BankAccount).filter(
        BankAccount.id == account_id
    ).first()
    
    if not mandate:
        raise HTTPException(status_code=404, detail="Bank mandate not found")
    
    admin_user = db.query(AdminUser).filter(
        AdminUser.user_id == current_user.id
    ).first()
    
    if action.action == "approve":
        mandate.status = BankAccountStatus.verified
        mandate.verified_at = datetime.now()
        mandate.verified_by = admin_user.admin_id if admin_user else current_user.email
    elif action.action == "reject":
        mandate.status = BankAccountStatus.rejected
        if action.comments:
            # Store rejection reason
            mandate.remarks = f"Rejected: {action.comments}"
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'reject'")
    
    db.commit()
    
    return {
        "message": f"Mandate {action.action}d successfully",
        "account_id": account_id,
        "status": mandate.status.value
    }


