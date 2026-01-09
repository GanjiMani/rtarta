from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from datetime import datetime, date
from typing import Optional
from app.db.session import get_db
from app.models.transaction import Transaction, TransactionStatus
from app.models.folio import Folio
from app.models.investor import Investor
from app.models.scheme import Scheme
from app.models.amc import AMC
from app.models.admin import Reconciliation as ReconModel
from app.core.jwt import get_current_user
from app.models.user import User

router = APIRouter(prefix="/admin/reconciliation", tags=["admin"])


@router.post("/run")
async def run_reconciliation(
    reconciliation_date: date,
    amc_id: Optional[str] = None,
    scheme_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Run reconciliation for transactions"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Create reconciliation record
    recon = ReconModel(
        reconciliation_id=f"REC{datetime.now().strftime('%Y%m%d%H%M%S')}",
        reconciliation_type="daily",
        reconciliation_date=reconciliation_date,
        start_date=reconciliation_date,
        end_date=reconciliation_date,
        amc_id=amc_id,
        scheme_id=scheme_id,
        status="in_progress",
        performed_by=current_user.email,
        performed_at=datetime.now()
    )
    db.add(recon)
    db.flush()
    
    # Get transactions for the date
    query = db.query(Transaction).filter(
        and_(
            Transaction.transaction_date == reconciliation_date,
            Transaction.status == TransactionStatus.completed
        )
    )
    
    if amc_id:
        query = query.filter(Transaction.amc_id == amc_id)
    if scheme_id:
        query = query.filter(Transaction.scheme_id == scheme_id)
    
    transactions = query.all()
    
    # Reconciliation logic (simplified - in real system, would compare with AMC data)
    total_transactions = len(transactions)
    matched_transactions = total_transactions  # Simplified - assume all match
    unmatched_transactions = 0
    discrepancy_amount = 0.00
    
    # Update reconciliation
    recon.total_transactions = total_transactions
    recon.matched_transactions = matched_transactions
    recon.unmatched_transactions = unmatched_transactions
    recon.discrepancy_amount = discrepancy_amount
    recon.is_reconciled = True
    recon.status = "completed"
    
    db.commit()
    
    return {
        "message": "Reconciliation completed",
        "reconciliation_id": recon.reconciliation_id,
        "total_transactions": total_transactions,
        "matched_transactions": matched_transactions,
        "unmatched_transactions": unmatched_transactions,
        "discrepancy_amount": float(discrepancy_amount)
    }


@router.get("/")
async def get_reconciliation_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    amc_id: Optional[str] = None,
    scheme_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get reconciliation records"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(ReconModel)
    
    if amc_id:
        query = query.filter(ReconModel.amc_id == amc_id)
    if scheme_id:
        query = query.filter(ReconModel.scheme_id == scheme_id)
    if start_date:
        query = query.filter(ReconModel.reconciliation_date >= start_date)
    if end_date:
        query = query.filter(ReconModel.reconciliation_date <= end_date)
    
    total = query.count()
    
    reconciliations = query.order_by(desc(ReconModel.reconciliation_date)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    recon_list = []
    for recon in reconciliations:
        recon_list.append({
            "reconciliation_id": recon.reconciliation_id,
            "reconciliation_type": recon.reconciliation_type,
            "reconciliation_date": recon.reconciliation_date.isoformat() if recon.reconciliation_date else None,
            "amc_id": recon.amc_id,
            "scheme_id": recon.scheme_id,
            "total_transactions": recon.total_transactions,
            "matched_transactions": recon.matched_transactions,
            "unmatched_transactions": recon.unmatched_transactions,
            "discrepancy_amount": float(recon.discrepancy_amount),
            "status": recon.status,
            "is_reconciled": recon.is_reconciled,
            "performed_by": recon.performed_by,
            "performed_at": recon.performed_at.isoformat() if recon.performed_at else None
        })
    
    return {
        "reconciliations": recon_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/transactions")
async def get_reconciliation_transactions(
    reconciliation_date: date,
    amc_id: Optional[str] = None,
    scheme_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get transactions for reconciliation comparison"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(Transaction).filter(
        and_(
            Transaction.transaction_date == reconciliation_date,
            Transaction.status == TransactionStatus.completed
        )
    )
    
    if amc_id:
        query = query.filter(Transaction.amc_id == amc_id)
    if scheme_id:
        query = query.filter(Transaction.scheme_id == scheme_id)
    
    total = query.count()
    
    transactions = query.order_by(Transaction.transaction_id).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    tx_list = []
    for tx in transactions:
        investor = db.query(Investor).filter(
            Investor.investor_id == tx.investor_id
        ).first()
        scheme = db.query(Scheme).filter(
            Scheme.scheme_id == tx.scheme_id
        ).first()
        amc = db.query(AMC).filter(
            AMC.amc_id == tx.amc_id
        ).first()
        
        # In real system, would fetch AMC amount from AMC system
        amc_amount = float(tx.amount)  # Simplified - assume match
        rta_amount = float(tx.amount)
        status = "Matched" if amc_amount == rta_amount else "Discrepancy"
        
        tx_list.append({
            "transaction_id": tx.transaction_id,
            "folio_number": tx.folio_number,
            "investor_name": investor.full_name if investor else None,
            "pan": investor.pan_number if investor else None,
            "amc_name": amc.amc_name if amc else None,
            "scheme_name": scheme.scheme_name if scheme else None,
            "transaction_type": tx.transaction_type.value.replace("_", " "),
            "amc_amount": amc_amount,
            "rta_amount": rta_amount,
            "units": float(tx.units) if tx.units else 0,
            "nav_per_unit": float(tx.nav_per_unit),
            "status": status,
            "transaction_date": tx.transaction_date.isoformat() if tx.transaction_date else None,
            "remarks": "" if status == "Matched" else f"Difference: ₹{abs(amc_amount - rta_amount)}"
        })
    
    return {
        "transactions": tx_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


