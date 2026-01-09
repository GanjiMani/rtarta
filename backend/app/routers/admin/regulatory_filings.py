from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from datetime import datetime, date
from typing import Optional
from app.db.session import get_db
from app.models.admin import RegulatoryFiling
from app.models.admin import AdminUser
from app.core.jwt import get_current_user
from app.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/admin/regulatory-filings", tags=["admin"])


class FilingCreate(BaseModel):
    filing_type: str
    filing_period: str
    filing_date: date
    due_date: date
    document_path: Optional[str] = None
    filing_data: Optional[dict] = None


@router.get("/")
async def get_regulatory_filings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    filing_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get regulatory filings"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(RegulatoryFiling)
    
    if filing_type:
        query = query.filter(RegulatoryFiling.filing_type == filing_type)
    
    if status:
        query = query.filter(RegulatoryFiling.status == status)
    
    total = query.count()
    
    filings = query.order_by(desc(RegulatoryFiling.filing_date)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    filing_list = []
    for filing in filings:
        filing_list.append({
            "filing_id": filing.filing_id,
            "filing_type": filing.filing_type,
            "filing_period": filing.filing_period,
            "filing_date": filing.filing_date.isoformat() if filing.filing_date else None,
            "due_date": filing.due_date.isoformat() if filing.due_date else None,
            "status": filing.status,
            "submission_date": filing.submission_date.isoformat() if filing.submission_date else None,
            "document_path": filing.document_path,
            "filed_by": filing.filed_by,
            "approved_by": filing.approved_by
        })
    
    return {
        "filings": filing_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/")
async def create_regulatory_filing(
    filing: FilingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new regulatory filing"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    admin_user = db.query(AdminUser).filter(
        AdminUser.user_id == current_user.id
    ).first()
    
    filing_id = f"FIL{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    regulatory_filing = RegulatoryFiling(
        filing_id=filing_id,
        filing_type=filing.filing_type,
        filing_period=filing.filing_period,
        filing_date=filing.filing_date,
        due_date=filing.due_date,
        document_path=filing.document_path,
        filing_data=filing.filing_data or {},
        status="pending",
        filed_by=admin_user.admin_id if admin_user else current_user.email
    )
    
    db.add(regulatory_filing)
    db.commit()
    
    return {
        "message": "Regulatory filing created successfully",
        "filing_id": filing_id
    }


@router.post("/{filing_id}/submit")
async def submit_filing(
    filing_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit a regulatory filing"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    filing = db.query(RegulatoryFiling).filter(
        RegulatoryFiling.filing_id == filing_id
    ).first()
    
    if not filing:
        raise HTTPException(status_code=404, detail="Filing not found")
    
    if filing.status != "pending":
        raise HTTPException(status_code=400, detail="Filing is not in pending status")
    
    filing.status = "submitted"
    filing.submission_date = date.today()
    
    db.commit()
    
    return {
        "message": "Filing submitted successfully",
        "filing_id": filing_id
    }


