from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from datetime import datetime, date, timedelta
from typing import Optional
from app.db.session import get_db
from app.models.document import UnclaimedAmount
from app.models.transaction import Transaction
from app.models.investor import Investor
from app.models.folio import Folio
from app.core.jwt import get_current_user
from app.models.user import User

router = APIRouter(prefix="/admin/unclaimed", tags=["admin"])


@router.get("/")
async def get_unclaimed_amounts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    investor_id: Optional[str] = None,
    folio_number: Optional[str] = None,
    claimed: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get unclaimed amounts"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(UnclaimedAmount)
    
    if investor_id:
        query = query.filter(UnclaimedAmount.investor_id == investor_id)
    if folio_number:
        query = query.filter(UnclaimedAmount.folio_number == folio_number)
    if claimed is not None:
        query = query.filter(UnclaimedAmount.claimed == claimed)
    
    total = query.count()
    
    unclaimed = query.order_by(desc(UnclaimedAmount.unclaimed_date)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    unclaimed_list = []
    for item in unclaimed:
        unclaimed_list.append({
            "id": item.id,
            "investor_id": item.investor_id,
            "folio_number": item.folio_number,
            "transaction_id": item.transaction_id,
            "amount": float(item.amount),
            "accumulated_income": float(item.accumulated_income or 0),
            "total_amount": float(item.total_amount),
            "unclaimed_date": item.unclaimed_date.isoformat() if item.unclaimed_date else None,
            "unclaimed_reason": item.unclaimed_reason,
            "days_unclaimed": item.days_unclaimed,
            "aging_category": item.aging_category,
            "claimed": item.claimed,
            "claimed_date": item.claimed_date.isoformat() if item.claimed_date else None
        })
    
    return {
        "unclaimed_amounts": unclaimed_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/stats")
async def get_unclaimed_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get unclaimed amounts statistics"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_unclaimed = db.query(func.sum(UnclaimedAmount.total_amount)).filter(
        UnclaimedAmount.claimed == False
    ).scalar() or 0
    
    pending_claims = db.query(func.count(UnclaimedAmount.id)).filter(
        UnclaimedAmount.claimed == False
    ).scalar() or 0
    
    resolved_count = db.query(func.count(UnclaimedAmount.id)).filter(
        UnclaimedAmount.claimed == True
    ).scalar() or 0
    
    over_one_year = db.query(func.count(UnclaimedAmount.id)).filter(
        and_(
            UnclaimedAmount.claimed == False,
            UnclaimedAmount.days_unclaimed > 365
        )
    ).scalar() or 0
    
    # Aging analysis
    aging_data = []
    categories = [
        ("0-30 days", 0, 30),
        ("31-90 days", 31, 90),
        ("91-365 days", 91, 365),
        ("Over 1 year", 366, 9999)
    ]
    
    for category, min_days, max_days in categories:
        count = db.query(func.count(UnclaimedAmount.id)).filter(
            and_(
                UnclaimedAmount.claimed == False,
                UnclaimedAmount.days_unclaimed >= min_days,
                UnclaimedAmount.days_unclaimed <= max_days
            )
        ).scalar() or 0
        
        amount = db.query(func.sum(UnclaimedAmount.total_amount)).filter(
            and_(
                UnclaimedAmount.claimed == False,
                UnclaimedAmount.days_unclaimed >= min_days,
                UnclaimedAmount.days_unclaimed <= max_days
            )
        ).scalar() or 0
        
        aging_data.append({
            "category": category,
            "count": count,
            "amount": float(amount)
        })
    
    return {
        "total_unclaimed": float(total_unclaimed),
        "pending_claims": pending_claims,
        "resolved_count": resolved_count,
        "over_one_year": over_one_year,
        "aging_analysis": aging_data
    }


@router.post("/{unclaimed_id}/claim")
async def process_claim(
    unclaimed_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Process an unclaimed amount claim"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    unclaimed = db.query(UnclaimedAmount).filter(
        UnclaimedAmount.id == unclaimed_id
    ).first()
    
    if not unclaimed:
        raise HTTPException(status_code=404, detail="Unclaimed amount not found")
    
    if unclaimed.claimed:
        raise HTTPException(status_code=400, detail="Amount already claimed")
    
    # Mark as claimed
    unclaimed.claimed = True
    unclaimed.claimed_date = date.today()
    unclaimed.claimed_amount = unclaimed.total_amount
    unclaimed.processed_by = current_user.email
    
    db.commit()
    
    return {
        "message": "Claim processed successfully",
        "unclaimed_id": unclaimed_id,
        "amount": float(unclaimed.claimed_amount)
    }


