from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from app.db.session import get_db
from app.core.jwt import get_current_investor
from app.models.user import User
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter()


class SupportTicketCreate(BaseModel):
    subject: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)


@router.get("/tickets")
async def get_support_tickets(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get all support tickets for the investor"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
        
        # Placeholder implementation - can be extended with actual ticket model
        tickets = []
        
        return {
            "message": "Support tickets retrieved successfully",
            "data": tickets
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get support tickets error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve support tickets"
        )


@router.post("/tickets")
async def create_support_ticket(
    ticket_data: SupportTicketCreate,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Create a new support ticket"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
        
        # Placeholder implementation - can be extended with actual ticket model
        ticket = {
            "id": 1,
            "subject": ticket_data.subject,
            "message": ticket_data.message,
            "status": "Open",
            "created_at": datetime.now().isoformat(),
            "investor_id": current_user.investor_id
        }
        
        return {
            "message": "Support ticket created successfully",
            "data": ticket
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create support ticket error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create support ticket"
        )








