from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.jwt import get_current_investor
from app.models.user import User
from app.services.disclosure_service import DisclosureService
from app.schemas.disclosure import DisclosureListResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Disclosures"])


@router.get("/", response_model=DisclosureListResponse)
async def get_disclosures(
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get active regulatory disclosures"""
    try:
        service = DisclosureService(db)
        disclosures = service.get_active_disclosures()
        
        return {
            "status": "success",
            "message": "Disclosures retrieved successfully",
            "data": disclosures
        }
        
    except Exception as e:
        logger.error(f"Get disclosures error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve disclosures"
        )









