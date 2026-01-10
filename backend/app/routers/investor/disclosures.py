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
async def get_disclosures(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get regulatory disclosures"""
    try:
        # Placeholder implementation
        disclosures = [
            {
                "id": 1,
                "title": "SEBI Regulations",
                "content": "All mutual fund investments are subject to market risks...",
                "date": "2024-01-01",
                "category": "Regulatory"
            }
        ]
        
        return {
            "message": "Disclosures retrieved successfully",
            "data": disclosures
        }
        
    except Exception as e:
        logger.error(f"Get disclosures error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve disclosures"
        )









