from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from datetime import datetime, date, timedelta
from typing import Optional
from app.db.session import get_db
from app.models.transaction import Transaction, TransactionStatus, TransactionType
from app.models.folio import Folio
from app.models.investor import Investor
from app.models.scheme import Scheme
from app.models.amc import AMC
from app.core.jwt import get_current_user
from app.models.user import User

router = APIRouter(prefix="/admin/reports", tags=["admin"])


@router.get("/transaction-summary")
async def get_transaction_summary(
    start_date: date,
    end_date: date,
    amc_id: Optional[str] = None,
    scheme_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate transaction summary report"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(Transaction).filter(
        and_(
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date,
            Transaction.status == TransactionStatus.completed
        )
    )
    
    if amc_id:
        query = query.filter(Transaction.amc_id == amc_id)
    if scheme_id:
        query = query.filter(Transaction.scheme_id == scheme_id)
    
    transactions = query.all()
    
    # Summary by type
    summary_by_type = {}
    for tx in transactions:
        tx_type = tx.transaction_type.value
        if tx_type not in summary_by_type:
            summary_by_type[tx_type] = {
                "count": 0,
                "total_amount": 0.0
            }
        summary_by_type[tx_type]["count"] += 1
        summary_by_type[tx_type]["total_amount"] += float(tx.amount)
    
    # Summary by AMC
    summary_by_amc = {}
    for tx in transactions:
        amc = db.query(AMC).filter(AMC.amc_id == tx.amc_id).first()
        amc_name = amc.amc_name if amc else tx.amc_id
        if amc_name not in summary_by_amc:
            summary_by_amc[amc_name] = {
                "count": 0,
                "total_amount": 0.0
            }
        summary_by_amc[amc_name]["count"] += 1
        summary_by_amc[amc_name]["total_amount"] += float(tx.amount)
    
    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "total_transactions": len(transactions),
        "total_amount": sum(float(tx.amount) for tx in transactions),
        "summary_by_type": summary_by_type,
        "summary_by_amc": summary_by_amc
    }


@router.get("/investor-activity")
async def get_investor_activity_report(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate investor activity report"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get active investors
    active_investors = db.query(func.count(Investor.id)).filter(
        Investor.is_active == True
    ).scalar() or 0
    
    # Get new investors in period
    new_investors = db.query(func.count(Investor.id)).filter(
        and_(
            func.date(Investor.created_at) >= start_date,
            func.date(Investor.created_at) <= end_date
        )
    ).scalar() or 0
    
    # Get investors with transactions
    investors_with_tx = db.query(func.count(func.distinct(Transaction.investor_id))).filter(
        and_(
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date
        )
    ).scalar() or 0
    
    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "active_investors": active_investors,
        "new_investors": new_investors,
        "investors_with_transactions": investors_with_tx
    }


@router.get("/aum-report")
async def get_aum_report(
    as_on_date: date,
    amc_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate Assets Under Management (AUM) report"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(Folio).filter(
        and_(
            Folio.status == "active",
            Folio.total_units > 0
        )
    )
    
    if amc_id:
        query = query.filter(Folio.amc_id == amc_id)
    
    folios = query.all()
    
    # AUM by AMC
    aum_by_amc = {}
    total_aum = 0.0
    
    for folio in folios:
        amc = db.query(AMC).filter(AMC.amc_id == folio.amc_id).first()
        amc_name = amc.amc_name if amc else folio.amc_id
        
        if amc_name not in aum_by_amc:
            aum_by_amc[amc_name] = {
                "folio_count": 0,
                "total_aum": 0.0
            }
        
        aum_by_amc[amc_name]["folio_count"] += 1
        aum_by_amc[amc_name]["total_aum"] += float(folio.total_value)
        total_aum += float(folio.total_value)
    
    return {
        "as_on_date": as_on_date.isoformat(),
        "total_aum": total_aum,
        "total_folios": len(folios),
        "aum_by_amc": aum_by_amc
    }


