from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.db.session import get_db
from app.core.jwt import get_current_investor
from app.models.user import User
from app.services.support_service import SupportService
from app.schemas.support import SupportTicketCreate, SupportTicketListResponse, SingleSupportTicketResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Support"])


@router.get("/tickets", response_model=SupportTicketListResponse)
async def get_support_tickets(
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get all support tickets for the investor"""
    try:
        service = SupportService(db)
        tickets = service.get_investor_tickets(current_investor.investor_id)
        
        return {
            "status": "success",
            "message": "Support tickets retrieved successfully",
            "data": tickets
        }
    except Exception as e:
        logger.error(f"Get support tickets error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve support tickets"
        )


@router.post("/tickets", response_model=SingleSupportTicketResponse)
async def create_support_ticket(
    ticket_data: SupportTicketCreate,
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Create a new support ticket"""
    try:
        service = SupportService(db)
        ticket = service.create_support_ticket(current_investor.investor_id, ticket_data)
        
        return {
            "status": "success",
            "message": "Support ticket created successfully",
            "data": ticket
        }
    except Exception as e:
        logger.error(f"Create support ticket error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create support ticket"
        )


@router.get("/tickets/{ticket_id}", response_model=SingleSupportTicketResponse)
async def get_ticket_details(
    ticket_id: int,
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get specific ticket details"""
    try:
        service = SupportService(db)
        ticket = service.get_ticket_details(ticket_id, current_investor.investor_id)
        
        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Support ticket not found"
            )
            
        return {
            "status": "success",
            "message": "Ticket details retrieved successfully",
            "data": ticket
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get support ticket details error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve ticket details"
        )









