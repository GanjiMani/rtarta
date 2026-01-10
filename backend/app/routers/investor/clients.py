from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.session import get_db
from app.core.jwt import get_current_investor
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
async def get_clients(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get client list (distributors/advisors) for the investor"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
        
        # Placeholder implementation - can be extended with actual distributor/advisor model
        clients = []
        
        return {
            "message": "Clients retrieved successfully",
            "data": clients
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get clients error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve clients"
        )









