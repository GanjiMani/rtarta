from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from app.db.session import get_db
from app.services.investor_service import InvestorService
from app.core.jwt import get_current_investor
from app.models.user import User
from app.models.folio import Folio, FolioStatus
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class IDCWPreferenceRequest(BaseModel):
    scheme_id: str = Field(..., min_length=1, max_length=10)
    preference: str = Field(..., pattern=r'^(Payout|Reinvest|payout|reinvestment)$')


class IDCWPreferencesRequest(BaseModel):
    preferences: List[IDCWPreferenceRequest]


@router.get("/preferences")
async def get_idcw_preferences(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get IDCW preferences for all investor folios"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
            
        # Get all folios for investor
        folios = db.query(Folio).filter(
            Folio.investor_id == current_user.investor_id,
            Folio.status != FolioStatus.closed
        ).all()
        
        preferences_list = []
        for folio in folios:
            # Get scheme details
            from app.models.scheme import Scheme
            scheme = db.query(Scheme).filter(Scheme.scheme_id == folio.scheme_id).first()
            
            if scheme:
                idcw_option = folio.idcw_option if hasattr(folio, 'idcw_option') else "payout"
                # Normalize to match frontend expectations
                preference = "Payout" if idcw_option.lower() in ["payout", "payout"] else "Reinvest"
                
                preferences_list.append({
                    "folio_number": folio.folio_number,
                    "scheme_id": folio.scheme_id,
                    "scheme_name": scheme.scheme_name,
                    "idcw_option": idcw_option,
                    "preference": preference
                })
        
        return {
            "message": "IDCW preferences retrieved successfully",
            "data": preferences_list
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get IDCW preferences error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve IDCW preferences"
        )


@router.post("/preferences")
async def update_idcw_preferences(
    preferences_data: List[IDCWPreferenceRequest],
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Update IDCW preferences for multiple schemes"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
        
        updated_count = 0
        for pref_data in preferences_data:
            # Find folio for this scheme
            folio = db.query(Folio).filter(
                Folio.investor_id == current_user.investor_id,
                Folio.scheme_id == pref_data.scheme_id,
                Folio.status != FolioStatus.closed
            ).first()
            
            if folio:
                # Normalize preference value
                idcw_option = "payout" if pref_data.preference.lower() in ["payout", "payout"] else "reinvestment"
                folio.idcw_option = idcw_option
                updated_count += 1
        
        if updated_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No matching folios found for the provided schemes"
            )
        
        db.commit()
        
        return {
            "message": f"IDCW preferences updated successfully for {updated_count} folio(s)",
            "data": {
                "updated_count": updated_count
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update IDCW preferences error: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update IDCW preferences"
        )


