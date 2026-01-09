from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from datetime import datetime, date
from typing import Optional
from app.db.session import get_db
from app.models.investor import Investor, KYCStatus
from app.core.jwt import get_current_user
from app.models.user import User
from app.models.admin import AdminUser
from pydantic import BaseModel

router = APIRouter(prefix="/admin/kyc", tags=["admin"])


class KYCVerificationAction(BaseModel):
    action: str  # approve, reject
    comments: Optional[str] = None


@router.get("/")
async def get_kyc_verifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    kyc_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get KYC verification requests"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(Investor)
    
    if kyc_status:
        try:
            status = KYCStatus[kyc_status]
            query = query.filter(Investor.kyc_status == status)
        except KeyError:
            pass
    else:
        # Default to pending verifications
        query = query.filter(
            Investor.kyc_status.in_([
                KYCStatus.pending_verification,
                KYCStatus.in_progress
            ])
        )
    
    total = query.count()
    
    investors = query.order_by(desc(Investor.kyc_submitted_date)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    kyc_list = []
    for investor in investors:
        kyc_list.append({
            "investor_id": investor.investor_id,
            "pan_number": investor.pan_number,
            "full_name": investor.full_name,
            "email": investor.email,
            "mobile_number": investor.mobile_number,
            "kyc_status": investor.kyc_status.value,
            "kyc_submitted_date": investor.kyc_submitted_date.isoformat() if investor.kyc_submitted_date else None,
            "kyc_verified_date": investor.kyc_verified_date.isoformat() if investor.kyc_verified_date else None,
            "kyc_expiry_date": investor.kyc_expiry_date.isoformat() if investor.kyc_expiry_date else None,
            "kyc_documents_path": investor.kyc_documents_path
        })
    
    return {
        "kyc_verifications": kyc_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/{investor_id}/verify")
async def verify_kyc(
    investor_id: str,
    action: KYCVerificationAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve or reject KYC verification"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    investor = db.query(Investor).filter(
        Investor.investor_id == investor_id
    ).first()
    
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")
    
    admin_user = db.query(AdminUser).filter(
        AdminUser.user_id == current_user.id
    ).first()
    
    if action.action == "approve":
        investor.kyc_status = KYCStatus.verified
        investor.kyc_verified_date = date.today()
        # Set expiry date to 10 years from now
        investor.kyc_expiry_date = date.today().replace(year=date.today().year + 10)
    elif action.action == "reject":
        investor.kyc_status = KYCStatus.rejected
        # Store rejection reason in account_locked_reason field temporarily
        if action.comments:
            investor.account_locked_reason = f"KYC Rejected: {action.comments}"
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'reject'")
    
    db.commit()
    
    return {
        "message": f"KYC {action.action}d successfully",
        "investor_id": investor_id,
        "kyc_status": investor.kyc_status.value
    }


@router.get("/stats")
async def get_kyc_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get KYC verification statistics"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from sqlalchemy import func
    
    total_kyc = db.query(func.count(Investor.id)).scalar() or 0
    pending_verification = db.query(func.count(Investor.id)).filter(
        Investor.kyc_status == KYCStatus.pending_verification
    ).scalar() or 0
    verified = db.query(func.count(Investor.id)).filter(
        Investor.kyc_status == KYCStatus.verified
    ).scalar() or 0
    rejected = db.query(func.count(Investor.id)).filter(
        Investor.kyc_status == KYCStatus.rejected
    ).scalar() or 0
    expired = db.query(func.count(Investor.id)).filter(
        and_(
            Investor.kyc_status == KYCStatus.verified,
            Investor.kyc_expiry_date < date.today()
        )
    ).scalar() or 0
    
    return {
        "total_kyc": total_kyc,
        "pending_verification": pending_verification,
        "verified": verified,
        "rejected": rejected,
        "expired": expired
    }


