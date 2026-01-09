from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.session import get_db
from app.services.investor_service import InvestorService
from app.schemas.investor import (
    BankAccountCreate, BankAccountUpdate, NomineeCreate, NomineeUpdate
)
from app.core.jwt import get_current_investor
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/bank-accounts")
async def get_bank_accounts(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get all bank accounts for the investor"""
    try:
        investor_service = InvestorService(db)
        bank_accounts = investor_service.get_bank_accounts(current_user.investor_id)

        return {
            "message": "Bank accounts retrieved successfully",
            "data": bank_accounts
        }

    except Exception as e:
        logger.error(f"Get bank accounts error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve bank accounts"
        )


@router.delete("/bank-accounts/{account_id}")
async def delete_bank_account(
    account_id: int,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Delete a bank account"""
    try:
        investor_service = InvestorService(db)
        investor_service.delete_bank_account(current_user.investor_id, account_id)

        return {
            "message": "Bank account deleted successfully"
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Delete bank account error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete bank account"
        )


@router.get("/nominees")
async def get_nominees(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get all nominees for the investor"""
    try:
        investor_service = InvestorService(db)
        nominees = investor_service.get_nominees(current_user.investor_id)

        return {
            "message": "Nominees retrieved successfully",
            "data": nominees
        }

    except Exception as e:
        logger.error(f"Get nominees error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve nominees"
        )


@router.post("/mandates/bank")
async def create_bank_mandate(
    bank_data: BankAccountCreate,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Create a new bank mandate"""
    try:
        investor_service = InvestorService(db)
        mandate = investor_service.create_bank_mandate(current_user.investor_id, bank_data)

        return {
            "message": "Bank mandate created successfully",
            "data": {
                "mandate": mandate
            }
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Create bank mandate error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create bank mandate"
        )


@router.put("/mandates/bank/{mandate_id}")
async def update_bank_mandate(
    mandate_id: int,
    update_data: BankAccountUpdate,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Update bank mandate"""
    try:
        investor_service = InvestorService(db)
        updated_mandate = investor_service.update_bank_mandate(
            current_user.investor_id,
            mandate_id,
            update_data.dict(exclude_unset=True)
        )

        return {
            "message": "Bank mandate updated successfully",
            "data": {
                "mandate": updated_mandate
            }
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Update bank mandate error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update bank mandate"
        )


@router.delete("/mandates/bank/{mandate_id}")
async def delete_bank_mandate(
    mandate_id: int,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Delete bank mandate"""
    try:
        investor_service = InvestorService(db)
        investor_service.delete_bank_mandate(current_user.investor_id, mandate_id)

        return {
            "message": "Bank mandate deleted successfully"
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Delete bank mandate error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete bank mandate"
        )