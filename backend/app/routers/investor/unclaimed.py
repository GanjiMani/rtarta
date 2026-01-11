from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.db.session import get_db
from app.core.jwt import get_current_investor
from app.models.user import User
from app.models.unclaimed import UnclaimedAmount
from app.models.transaction import Transaction
from app.models.scheme import Scheme
from datetime import date
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
async def get_unclaimed_amounts(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get all unclaimed amounts for the investor"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
            
        # Query unclaimed amounts for this investor
        unclaimed_amounts = db.query(UnclaimedAmount).filter(
            UnclaimedAmount.investor_id == current_user.investor_id
        ).all()
        
        unclaimed_list = []
        for unclaimed in unclaimed_amounts:
            # Get transaction details if available
            transaction = None
            scheme = None
            scheme_id = None
            
            if unclaimed.transaction_id:
                transaction = db.query(Transaction).filter(
                    Transaction.transaction_id == unclaimed.transaction_id
                ).first()
                
                if transaction:
                    scheme_id = transaction.scheme_id
                    scheme = db.query(Scheme).filter(
                        Scheme.scheme_id == transaction.scheme_id
                    ).first()
            
            # Determine transaction type
            transaction_type = None
            if transaction:
                transaction_type = transaction.transaction_type.value if hasattr(transaction.transaction_type, 'value') else str(transaction.transaction_type)
            elif unclaimed.unclaimed_reason:
                transaction_type = unclaimed.unclaimed_reason
            else:
                transaction_type = "Unclaimed Amount"
            
            # Calculate days unclaimed if not already stored
            days_unclaimed = unclaimed.days_unclaimed or 0
            if unclaimed.unclaimed_date and days_unclaimed == 0:
                days_unclaimed = (date.today() - unclaimed.unclaimed_date).days
            
            unclaimed_list.append({
                "id": unclaimed.id,
                "unclaimed_id": f"UCA{unclaimed.id:05d}",  # Generate display ID
                "folio_number": unclaimed.folio_number,
                "transaction_id": unclaimed.transaction_id,
                "scheme_id": scheme_id,
                "scheme_name": scheme.scheme_name if scheme else (scheme_id or "N/A"),
                "amount": float(unclaimed.amount) if unclaimed.amount else 0.0,
                "accumulated_income": float(unclaimed.accumulated_income) if unclaimed.accumulated_income else 0.0,
                "total_amount": float(unclaimed.total_amount) if unclaimed.total_amount else float(unclaimed.amount or 0),
                "transaction_type": transaction_type,
                "unclaimed_date": unclaimed.unclaimed_date.isoformat() if unclaimed.unclaimed_date else None,
                "days_unclaimed": days_unclaimed,
                "aging_category": unclaimed.aging_category,
                "unclaimed_reason": unclaimed.unclaimed_reason,
                "claimed": unclaimed.claimed,
                "status": "Pending" if not unclaimed.claimed else "Claimed",
                "claimed_date": unclaimed.claimed_date.isoformat() if unclaimed.claimed_date else None
            })
        
        return {
            "message": "Unclaimed amounts retrieved successfully",
            "data": unclaimed_list
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get unclaimed amounts error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve unclaimed amounts: {str(e)}"
        )


@router.post("/claim")
async def claim_unclaimed_amount(
    claim_data: Dict[str, Any],
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Submit claim request for unclaimed amount"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
            
        unclaimed_id = claim_data.get("unclaimed_id") or claim_data.get("id")
        if not unclaimed_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="unclaimed_id is required"
            )
        
        # Extract numeric ID from UCA00001 format or use directly
        try:
            if isinstance(unclaimed_id, str) and unclaimed_id.startswith("UCA"):
                numeric_id = int(unclaimed_id[3:])
            else:
                numeric_id = int(unclaimed_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid unclaimed_id format"
            )
        
        # Get unclaimed amount by id
        unclaimed = db.query(UnclaimedAmount).filter(
            UnclaimedAmount.id == numeric_id,
            UnclaimedAmount.investor_id == current_user.investor_id
        ).first()
        
        if not unclaimed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Unclaimed amount not found"
            )
        
        if unclaimed.claimed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unclaimed amount has already been claimed"
            )
        
        # Update status to claimed
        unclaimed.claimed = True
        unclaimed.claimed_date = date.today()
        unclaimed.claimed_amount = unclaimed.total_amount
        unclaimed.claim_reference = f"CLM{numeric_id:05d}"
        
        db.commit()
        
        return {
            "message": "Claim request submitted successfully. The amount will be processed and credited to your registered bank account.",
            "data": {
                "unclaimed_id": f"UCA{unclaimed.id:05d}",
                "claim_reference": unclaimed.claim_reference,
                "status": "claimed",
                "amount": float(unclaimed.total_amount)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Claim unclaimed amount error: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process claim request: {str(e)}"
        )
