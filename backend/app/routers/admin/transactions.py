from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, date
from typing import Optional, List
from app.db.session import get_db
from app.models.transaction import Transaction, TransactionStatus, TransactionType
from app.models.folio import Folio
from app.models.investor import Investor
from app.models.scheme import Scheme
from app.models.amc import AMC
from app.core.jwt import get_current_user
from app.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/admin/transactions", tags=["admin"])


class TransactionFilter(BaseModel):
    status: Optional[str] = None
    transaction_type: Optional[str] = None
    investor_id: Optional[str] = None
    folio_number: Optional[str] = None
    scheme_id: Optional[str] = None
    amc_id: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None


@router.get("/")
async def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    transaction_type: Optional[str] = None,
    investor_id: Optional[str] = None,
    folio_number: Optional[str] = None,
    scheme_id: Optional[str] = None,
    amc_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get paginated list of transactions with filters"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(Transaction)
    
    # Apply filters
    if status:
        try:
            tx_status = TransactionStatus[status]
            query = query.filter(Transaction.status == tx_status)
        except KeyError:
            pass
    
    if transaction_type:
        try:
            tx_type = TransactionType[transaction_type]
            query = query.filter(Transaction.transaction_type == tx_type)
        except KeyError:
            pass
    
    if investor_id:
        query = query.filter(Transaction.investor_id == investor_id)
    
    if folio_number:
        query = query.filter(Transaction.folio_number == folio_number)
    
    if scheme_id:
        query = query.filter(Transaction.scheme_id == scheme_id)
    
    if amc_id:
        query = query.filter(Transaction.amc_id == amc_id)
    
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    transactions = query.order_by(desc(Transaction.transaction_date)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    # Format response
    transaction_list = []
    for tx in transactions:
        transaction_list.append({
            "transaction_id": tx.transaction_id,
            "investor_id": tx.investor_id,
            "folio_number": tx.folio_number,
            "transaction_type": tx.transaction_type.value,
            "transaction_date": tx.transaction_date.isoformat() if tx.transaction_date else None,
            "amount": float(tx.amount),
            "units": float(tx.units) if tx.units else 0,
            "nav_per_unit": float(tx.nav_per_unit),
            "status": tx.status.value,
            "scheme_id": tx.scheme_id,
            "amc_id": tx.amc_id,
            "created_at": tx.created_at.isoformat() if tx.created_at else None
        })
    
    return {
        "transactions": transaction_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/{transaction_id}")
async def get_transaction_details(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific transaction"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    transaction = db.query(Transaction).filter(
        Transaction.transaction_id == transaction_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Get related data
    investor = db.query(Investor).filter(
        Investor.investor_id == transaction.investor_id
    ).first()
    
    scheme = db.query(Scheme).filter(
        Scheme.scheme_id == transaction.scheme_id
    ).first()
    
    amc = db.query(AMC).filter(
        AMC.amc_id == transaction.amc_id
    ).first()
    
    return {
        "transaction": {
            "transaction_id": transaction.transaction_id,
            "investor_id": transaction.investor_id,
            "investor_name": investor.full_name if investor else None,
            "folio_number": transaction.folio_number,
            "scheme_id": transaction.scheme_id,
            "scheme_name": scheme.scheme_name if scheme else None,
            "amc_id": transaction.amc_id,
            "amc_name": amc.amc_name if amc else None,
            "transaction_type": transaction.transaction_type.value,
            "transaction_date": transaction.transaction_date.isoformat() if transaction.transaction_date else None,
            "amount": float(transaction.amount),
            "units": float(transaction.units) if transaction.units else 0,
            "nav_per_unit": float(transaction.nav_per_unit),
            "status": transaction.status.value,
            "payment_mode": transaction.payment_mode.value if transaction.payment_mode else None,
            "payment_reference": transaction.payment_reference,
            "stamp_duty": float(transaction.stamp_duty) if transaction.stamp_duty else 0,
            "transaction_charges": float(transaction.transaction_charges) if transaction.transaction_charges else 0,
            "exit_load_amount": float(transaction.exit_load_amount) if transaction.exit_load_amount else 0,
            "gst_amount": float(transaction.gst_amount) if transaction.gst_amount else 0,
            "net_amount": float(transaction.net_amount),
            "processed_by": transaction.processed_by,
            "approved_by": transaction.approved_by,
            "remarks": transaction.remarks,
            "error_message": transaction.error_message,
            "created_at": transaction.created_at.isoformat() if transaction.created_at else None,
            "completion_date": transaction.completion_date.isoformat() if transaction.completion_date else None
        }
    }


@router.get("/stats/summary")
async def get_transaction_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get transaction statistics summary"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(Transaction)
    
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    
    # Status distribution
    status_stats = db.query(
        Transaction.status,
        func.count(Transaction.id).label("count"),
        func.sum(Transaction.amount).label("total_amount")
    ).filter(
        and_(
            (Transaction.transaction_date >= start_date) if start_date else True,
            (Transaction.transaction_date <= end_date) if end_date else True
        )
    ).group_by(Transaction.status).all()
    
    status_data = {
        status.value: {
            "count": count,
            "total_amount": float(total_amount or 0)
        }
        for status, count, total_amount in status_stats
    }
    
    # Type distribution
    type_stats = db.query(
        Transaction.transaction_type,
        func.count(Transaction.id).label("count"),
        func.sum(Transaction.amount).label("total_amount")
    ).filter(
        and_(
            (Transaction.transaction_date >= start_date) if start_date else True,
            (Transaction.transaction_date <= end_date) if end_date else True
        )
    ).group_by(Transaction.transaction_type).all()
    
    type_data = {
        tx_type.value: {
            "count": count,
            "total_amount": float(total_amount or 0)
        }
        for tx_type, count, total_amount in type_stats
    }
    
    # Total metrics
    total_count = query.count()
    total_amount = query.with_entities(func.sum(Transaction.amount)).scalar() or 0
    pending_count = query.filter(Transaction.status == TransactionStatus.pending).count()
    
    return {
        "total_transactions": total_count,
        "total_amount": float(total_amount),
        "pending_transactions": pending_count,
        "status_distribution": status_data,
        "type_distribution": type_data
    }


@router.post("/{transaction_id}/retry")
async def retry_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retry a failed transaction"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    transaction = db.query(Transaction).filter(
        Transaction.transaction_id == transaction_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction.status != TransactionStatus.failed:
        raise HTTPException(
            status_code=400,
            detail="Only failed transactions can be retried"
        )
    
    # Reset transaction for retry
    transaction.status = TransactionStatus.pending
    transaction.retry_count = (transaction.retry_count or 0) + 1
    transaction.error_message = None
    transaction.error_code = None
    
    db.commit()
    
    return {
        "message": "Transaction queued for retry",
        "transaction_id": transaction_id,
        "retry_count": transaction.retry_count
    }


