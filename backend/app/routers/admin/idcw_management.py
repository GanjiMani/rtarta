from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from datetime import datetime, date
from typing import Optional, List
from app.db.session import get_db
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.models.folio import Folio
from app.models.investor import Investor
from app.models.scheme import Scheme
from app.models.amc import AMC
from app.models.admin import BatchJob, BatchJobType, BatchJobStatus
from app.core.jwt import get_current_user
from app.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/admin/idcw", tags=["admin"])


class IDCWDeclaration(BaseModel):
    scheme_id: str
    amc_id: str
    idcw_rate: float
    idcw_amount_per_unit: float
    declaration_date: date
    record_date: date
    payment_date: date
    description: Optional[str] = None


@router.post("/declare")
async def declare_idcw(
    declaration: IDCWDeclaration,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Declare IDCW (dividend) for a scheme"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Verify scheme exists
    scheme = db.query(Scheme).filter(
        Scheme.scheme_id == declaration.scheme_id
    ).first()
    
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    
    # Get all folios for this scheme
    folios = db.query(Folio).filter(
        and_(
            Folio.scheme_id == declaration.scheme_id,
            Folio.status == "active",
            Folio.total_units > 0
        )
    ).all()
    
    # Create batch job for IDCW processing
    batch_job = BatchJob(
        job_id=f"IDCW{datetime.now().strftime('%Y%m%d%H%M%S')}",
        job_type=BatchJobType.idcw_processing,
        job_name=f"IDCW Declaration - {scheme.scheme_name}",
        scheduled_at=datetime.now(),
        started_at=datetime.now(),
        status=BatchJobStatus.pending,
        parameters={
            "scheme_id": declaration.scheme_id,
            "idcw_rate": declaration.idcw_rate,
            "idcw_amount_per_unit": declaration.idcw_amount_per_unit,
            "declaration_date": declaration.declaration_date.isoformat(),
            "record_date": declaration.record_date.isoformat(),
            "payment_date": declaration.payment_date.isoformat()
        },
        executed_by=current_user.email
    )
    db.add(batch_job)
    db.flush()
    
    # Process IDCW for each folio
    records_processed = 0
    records_successful = 0
    records_failed = 0
    
    for folio in folios:
        try:
            records_processed += 1
            
            # Calculate IDCW amount
            idcw_amount = folio.total_units * declaration.idcw_amount_per_unit
            
            # Determine transaction type based on folio option
            if folio.idcw_option == "reinvestment":
                tx_type = TransactionType.idcw_reinvestment
                # Create reinvestment transaction
                transaction = Transaction(
                    transaction_id=f"IDCW{datetime.now().strftime('%Y%m%d%H%M%S')}{records_processed:04d}",
                    investor_id=folio.investor_id,
                    folio_number=folio.folio_number,
                    scheme_id=folio.scheme_id,
                    amc_id=folio.amc_id,
                    transaction_type=tx_type,
                    transaction_date=declaration.payment_date,
                    amount=idcw_amount,
                    units=idcw_amount / scheme.current_nav,  # Units to be added
                    nav_per_unit=scheme.current_nav,
                    status=TransactionStatus.pending,
                    idcw_rate=declaration.idcw_rate,
                    idcw_amount_per_unit=declaration.idcw_amount_per_unit,
                    remarks=declaration.description or f"IDCW Reinvestment - {declaration.declaration_date}"
                )
                db.add(transaction)
            else:
                tx_type = TransactionType.idcw_payout
                # Create payout transaction
                transaction = Transaction(
                    transaction_id=f"IDCW{datetime.now().strftime('%Y%m%d%H%M%S')}{records_processed:04d}",
                    investor_id=folio.investor_id,
                    folio_number=folio.folio_number,
                    scheme_id=folio.scheme_id,
                    amc_id=folio.amc_id,
                    transaction_type=tx_type,
                    transaction_date=declaration.payment_date,
                    amount=idcw_amount,
                    units=0,  # No units change for payout
                    nav_per_unit=scheme.current_nav,
                    status=TransactionStatus.pending,
                    idcw_rate=declaration.idcw_rate,
                    idcw_amount_per_unit=declaration.idcw_amount_per_unit,
                    remarks=declaration.description or f"IDCW Payout - {declaration.declaration_date}"
                )
                db.add(transaction)
            
            records_successful += 1
        except Exception as e:
            records_failed += 1
            continue
    
    # Update batch job
    batch_job.records_processed = records_processed
    batch_job.records_successful = records_successful
    batch_job.records_failed = records_failed
    batch_job.status = BatchJobStatus.completed if records_failed == 0 else BatchJobStatus.failed
    batch_job.completed_at = datetime.now()
    
    db.commit()
    
    return {
        "message": "IDCW declared successfully",
        "job_id": batch_job.job_id,
        "scheme_id": declaration.scheme_id,
        "scheme_name": scheme.scheme_name,
        "records_processed": records_processed,
        "records_successful": records_successful,
        "records_failed": records_failed,
        "total_amount": sum(f.total_units * declaration.idcw_amount_per_unit for f in folios)
    }


@router.get("/")
async def get_idcw_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    scheme_id: Optional[str] = None,
    amc_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get IDCW transactions"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(Transaction).filter(
        Transaction.transaction_type.in_([
            TransactionType.idcw_payout,
            TransactionType.idcw_reinvestment
        ])
    )
    
    if status:
        try:
            tx_status = TransactionStatus[status]
            query = query.filter(Transaction.status == tx_status)
        except KeyError:
            pass
    
    if scheme_id:
        query = query.filter(Transaction.scheme_id == scheme_id)
    
    if amc_id:
        query = query.filter(Transaction.amc_id == amc_id)
    
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    
    total = query.count()
    
    transactions = query.order_by(desc(Transaction.transaction_date)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    idcw_list = []
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
        folio = db.query(Folio).filter(
            Folio.folio_number == tx.folio_number
        ).first()
        
        idcw_list.append({
            "transaction_id": tx.transaction_id,
            "folio_number": tx.folio_number,
            "investor_id": tx.investor_id,
            "investor_name": investor.full_name if investor else None,
            "pan": investor.pan_number if investor else None,
            "amc_id": tx.amc_id,
            "amc_name": amc.amc_name if amc else None,
            "scheme_id": tx.scheme_id,
            "scheme_name": scheme.scheme_name if scheme else None,
            "transaction_type": tx.transaction_type.value,
            "units": float(folio.total_units) if folio else 0,
            "amount": float(tx.amount),
            "nav_per_unit": float(tx.nav_per_unit),
            "idcw_rate": float(tx.idcw_rate) if tx.idcw_rate else 0,
            "idcw_amount_per_unit": float(tx.idcw_amount_per_unit) if tx.idcw_amount_per_unit else 0,
            "status": tx.status.value,
            "processed_by": tx.processed_by,
            "declaration_date": tx.transaction_date.isoformat() if tx.transaction_date else None,
            "reference_id": tx.transaction_id
        })
    
    return {
        "idcw_transactions": idcw_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/{transaction_id}/process")
async def process_idcw(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Process a pending IDCW transaction"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    transaction = db.query(Transaction).filter(
        Transaction.transaction_id == transaction_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction.transaction_type not in [TransactionType.idcw_payout, TransactionType.idcw_reinvestment]:
        raise HTTPException(status_code=400, detail="Not an IDCW transaction")
    
    if transaction.status != TransactionStatus.pending:
        raise HTTPException(status_code=400, detail="Transaction is not pending")
    
    # Process the transaction
    if transaction.transaction_type == TransactionType.idcw_reinvestment:
        # Update folio with new units
        folio = db.query(Folio).filter(
            Folio.folio_number == transaction.folio_number
        ).first()
        
        if folio:
            folio.total_units += transaction.units
            folio.total_value = folio.total_units * folio.current_nav
            folio.total_investment += transaction.amount
    
    transaction.status = TransactionStatus.completed
    transaction.processed_by = current_user.email
    transaction.completion_date = date.today()
    
    db.commit()
    
    return {
        "message": "IDCW transaction processed successfully",
        "transaction_id": transaction_id,
        "status": "completed"
    }


@router.get("/stats")
async def get_idcw_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get IDCW statistics"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_idcw = db.query(func.count(Transaction.id)).filter(
        Transaction.transaction_type.in_([
            TransactionType.idcw_payout,
            TransactionType.idcw_reinvestment
        ])
    ).scalar() or 0
    
    pending_idcw = db.query(func.count(Transaction.id)).filter(
        and_(
            Transaction.transaction_type.in_([
                TransactionType.idcw_payout,
                TransactionType.idcw_reinvestment
            ]),
            Transaction.status == TransactionStatus.pending
        )
    ).scalar() or 0
    
    total_amount = db.query(func.sum(Transaction.amount)).filter(
        Transaction.transaction_type.in_([
            TransactionType.idcw_payout,
            TransactionType.idcw_reinvestment
        ])
    ).scalar() or 0
    
    payout_count = db.query(func.count(Transaction.id)).filter(
        Transaction.transaction_type == TransactionType.idcw_payout
    ).scalar() or 0
    
    reinvestment_count = db.query(func.count(Transaction.id)).filter(
        Transaction.transaction_type == TransactionType.idcw_reinvestment
    ).scalar() or 0
    
    return {
        "total_idcw_transactions": total_idcw,
        "pending_transactions": pending_idcw,
        "total_amount": float(total_amount),
        "payout_count": payout_count,
        "reinvestment_count": reinvestment_count
    }


