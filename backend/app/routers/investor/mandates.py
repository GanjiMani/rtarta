from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.session import get_db
from app.core.jwt import get_current_investor
from app.services.mandate_service import MandateService
from app.schemas.investor import MandateRegistration, MandateUpdate
from app.models.user import User
import logging

router = APIRouter(tags=["Mandates"])
logger = logging.getLogger(__name__)

@router.get("/bank")
def get_bank_mandates(
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """List all bank mandates (alias for compatibility)"""
    from app.models.mandate import BankAccount
    banks = db.query(BankAccount).filter(
        BankAccount.investor_id == current_investor.investor_id,
        BankAccount.mandate_type.isnot(None)  # Only return bank accounts with mandates
    ).all()
    
    return {
        "status": "success",
        "data": [
            {
                "id": b.id,
                "bank_name": b.bank_name,
                "account_number": b.account_number,
                "mandate_type": b.mandate_type.value if b.mandate_type else "N/A",
                "mandate_status": b.mandate_status.value if b.mandate_status else "inactive",
                "mandate_umrn": b.mandate_umrn,
                "mandate_limit": float(b.mandate_amount_limit) if b.mandate_amount_limit else 0,
                "created_at": b.created_at
            }
            for b in banks
        ]
    }


@router.post("/bank")
def register_bank_mandate_alias(
    registration: MandateRegistration,
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Alias for registering a bank mandate via /bank"""
    from app.models.mandate import BankAccount
    
    # If bank_account_id is not provided, try to find primary bank account
    if not registration.bank_account_id:
        primary_bank = db.query(BankAccount).filter(
            BankAccount.investor_id == current_investor.investor_id,
            BankAccount.is_primary == True
        ).first()
        
        if not primary_bank:
            raise HTTPException(
                status_code=400,
                detail="No bank account found. Please add a bank account first or provide bank_account_id"
            )
        
        # Create a new registration object with the bank_account_id
        registration = registration.model_copy(update={"bank_account_id": primary_bank.id})
    
    return register_mandate(registration, current_investor, db)


@router.delete("/bank/{bank_account_id}")
def delete_bank_mandate_alias(
    bank_account_id: int,
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Alias for deleting a bank mandate via /bank"""
    from app.models.mandate import BankAccount
    bank_account = db.query(BankAccount).filter(
        BankAccount.id == bank_account_id,
        BankAccount.investor_id == current_investor.investor_id
    ).first()

    if not bank_account:
        raise HTTPException(status_code=404, detail="Mandate not found")

    # Clear mandate fields
    bank_account.mandate_type = None
    bank_account.mandate_status = None
    bank_account.mandate_umrn = None
    bank_account.mandate_amount_limit = None
    
    db.commit()
    return {"message": "Mandate revoked successfully"}


@router.post("/register")
def register_mandate(
    registration: MandateRegistration,
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Register a new bank mandate"""
    service = MandateService(db)
    try:
        bank_account = service.register_mandate(current_investor.investor_id, registration)
        db.commit()
        db.refresh(bank_account)
        return {
            "message": "Mandate registration initiated",
            "bank_account_id": bank_account.id,
            "umrn": bank_account.mandate_umrn,
            "status": bank_account.mandate_status.value
        }
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        logger.error(f"Error registering mandate: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/status/{bank_account_id}")
def get_mandate_status(
    bank_account_id: int,
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get status of a mandate"""
    service = MandateService(db)
    try:
        return service.get_mandate_status(current_investor.investor_id, bank_account_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/verify/{bank_account_id}")
def verify_mandate(
    bank_account_id: int,
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Verify/Activate a mandate (Mock simulation)"""
    service = MandateService(db)
    try:
        bank_account = service.verify_mandate(current_investor.investor_id, bank_account_id)
        db.commit()
        db.refresh(bank_account)
        return {
            "message": "Mandate verified and activated",
            "status": bank_account.mandate_status.value,
            "mandate_id": bank_account.mandate_id
        }
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/active-eligible")
def get_active_eligible_banks(
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """List bank accounts with active mandates eligible for SIP setup"""
    from app.models.mandate import BankAccount, MandateStatus
    
    banks = db.query(BankAccount).filter(
        BankAccount.investor_id == current_investor.investor_id,
        BankAccount.mandate_status == MandateStatus.active
    ).all()
    
    return [
        {
            "id": b.id,
            "bank_name": b.bank_name,
            "account_number": f"****{b.account_number[-4:]}",
            "mandate_id": b.mandate_id,
            "limit": float(b.mandate_amount_limit) if b.mandate_amount_limit else 0
        }
        for b in banks
    ]