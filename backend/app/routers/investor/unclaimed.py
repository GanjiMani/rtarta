from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.session import get_db
from app.services.investor_service import InvestorService
from app.core.jwt import get_current_investor
from app.models.user import User
from app.models.document import UnclaimedAmount
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
        from app.models.transaction import Transaction
        from app.models.scheme import Scheme
        
        unclaimed_amounts = db.query(UnclaimedAmount).filter(
            UnclaimedAmount.investor_id == current_user.investor_id,
            UnclaimedAmount.claimed == False
        ).all()
        
        unclaimed_list = []
        for unclaimed in unclaimed_amounts:
            # Get transaction details
            transaction = db.query(Transaction).filter(
                Transaction.transaction_id == unclaimed.transaction_id
            ).first()
            
            # Get scheme details
            scheme = None
            if transaction:
                scheme = db.query(Scheme).filter(
                    Scheme.scheme_id == transaction.scheme_id
                ).first()
            
            # Determine transaction type from transaction or unclaimed_reason
            transaction_type = None
            if transaction:
                transaction_type = transaction.transaction_type.value if hasattr(transaction.transaction_type, 'value') else str(transaction.transaction_type)
            elif unclaimed.unclaimed_reason:
                transaction_type = unclaimed.unclaimed_reason

            unclaimed_list.append({
                "id": unclaimed.id,
                "unclaimed_id": f"UCA{unclaimed.id:03d}",
                "folio_number": unclaimed.folio_number,
                "transaction_id": unclaimed.transaction_id,
                "scheme_id": transaction.scheme_id if transaction else None,
                "scheme_name": scheme.scheme_name if scheme else None,
                "amount": float(unclaimed.amount) if unclaimed.amount else 0.0,
                "accumulated_income": float(unclaimed.accumulated_income) if unclaimed.accumulated_income else 0.0,
                "total_amount": float(unclaimed.total_amount) if unclaimed.total_amount else 0.0,
                "transaction_type": transaction_type,
                "unclaimed_date": unclaimed.unclaimed_date.isoformat() if unclaimed.unclaimed_date else None,
                "days_unclaimed": unclaimed.days_unclaimed if unclaimed.days_unclaimed else 0,
                "aging_category": unclaimed.aging_category if unclaimed.aging_category else None,
                "unclaimed_reason": unclaimed.unclaimed_reason if unclaimed.unclaimed_reason else None,
                "claimed": unclaimed.claimed,
                "status": "Pending" if not unclaimed.claimed else "Claimed",
                "created_at": unclaimed.created_at.isoformat() if unclaimed.created_at else None
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
            detail="Failed to retrieve unclaimed amounts"
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
        
        # Extract numeric ID if format is UCA001
        try:
            if isinstance(unclaimed_id, str) and unclaimed_id.startswith("UCA"):
                unclaimed_id = int(unclaimed_id[3:])
            elif isinstance(unclaimed_id, str):
                # Try to convert string number to int
                unclaimed_id = int(unclaimed_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid unclaimed_id format"
            )
        
        # Get unclaimed amount
        unclaimed = db.query(UnclaimedAmount).filter(
            UnclaimedAmount.id == unclaimed_id,
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
        
        # Update status to claimed (processing)
        from datetime import date
        unclaimed.claimed = True
        unclaimed.claimed_date = date.today()
        unclaimed.claimed_amount = unclaimed.total_amount
        db.commit()
        
        return {
            "message": "Claim request submitted successfully",
            "data": {
                "unclaimed_id": f"UCA{unclaimed.id:03d}",
                "status": "claimed"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Claim unclaimed amount error: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process claim request"
        )


