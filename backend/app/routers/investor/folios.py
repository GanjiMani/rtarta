from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.session import get_db
from app.services.investor_service import InvestorService
from app.core.jwt import get_current_investor
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
async def get_folios(
    active_only: bool = False,
    with_units_only: bool = False,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """
    Get all folios for the investor
    
    Query Parameters:
        active_only: If true, only return active folios (default: false)
        with_units_only: If true, only return folios with units > 0 (default: false)
    """
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
            
        investor_service = InvestorService(db)
        folios = investor_service.get_folios(
            investor_id=current_user.investor_id,
            active_only=active_only,
            with_units_only=with_units_only
        )

        return {
            "message": "Folios retrieved successfully",
            "data": folios,
            "count": len(folios)
        }

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Get folios validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Get folios error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve folios"
        )


@router.get("/summary")
async def get_folio_summary(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get folio summary for dashboard"""
    try:
        investor_service = InvestorService(db)
        summary = investor_service.get_folio_summary(current_user.investor_id)

        return {
            "message": "Folio summary retrieved successfully",
            "data": summary
        }

    except Exception as e:
        logger.error(f"Get folio summary error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve folio summary"
        )


@router.get("/{folio_number}")
async def get_folio_details(
    folio_number: str,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get detailed information for a specific folio"""
    try:
        from app.models.folio import Folio
        from app.models.scheme import Scheme
        
        # Query folio directly
        folio = db.query(Folio).filter(
            Folio.folio_number == folio_number,
            Folio.investor_id == current_user.investor_id
        ).first()

        if not folio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folio not found"
            )

        # Get scheme details
        scheme = db.query(Scheme).filter(Scheme.scheme_id == folio.scheme_id).first()
        
        folio_details = {
            "folio_number": folio.folio_number,
            "investor_id": folio.investor_id,
            "scheme_id": folio.scheme_id,
            "scheme_name": scheme.scheme_name if scheme else None,
            "total_units": float(folio.total_units) if folio.total_units else 0.0,
            "total_investment": float(folio.total_investment) if folio.total_investment else 0.0,
            "total_value": float(folio.total_value) if folio.total_value else 0.0,
            "status": folio.status.value if hasattr(folio.status, 'value') else str(folio.status),
            "current_nav": float(scheme.current_nav) if scheme and scheme.current_nav else 0.0
        }

        return {
            "message": "Folio details retrieved successfully",
            "data": folio_details
        }

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Get folio details error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve folio details"
        )


@router.get("/{folio_number}/holdings")
async def get_folio_holdings(
    folio_number: str,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get holdings for a specific folio"""
    try:
        from app.models.folio import Folio
        
        # Query folio to verify it exists and belongs to user
        folio = db.query(Folio).filter(
            Folio.folio_number == folio_number,
            Folio.investor_id == current_user.investor_id
        ).first()

        if not folio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folio not found"
            )

        # For now, return basic folio info as holdings
        # This can be expanded later to include detailed holdings
        holdings = {
            "folio_number": folio.folio_number,
            "total_units": float(folio.total_units) if folio.total_units else 0.0,
            "total_investment": float(folio.total_investment) if folio.total_investment else 0.0,
            "total_value": float(folio.total_value) if folio.total_value else 0.0
        }

        return {
            "message": "Folio holdings retrieved successfully",
            "data": holdings
        }

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Get folio holdings error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve folio holdings"
        )


@router.get("/{folio_number}/transactions")
async def get_folio_transactions(
    folio_number: str,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get transactions for a specific folio"""
    try:
        investor_service = InvestorService(db)
        transactions = investor_service.get_folio_transactions(current_user.investor_id, folio_number)

        return {
            "message": "Folio transactions retrieved successfully",
            "data": transactions
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Get folio transactions error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve folio transactions"
        )