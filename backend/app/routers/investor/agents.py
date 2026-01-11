from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.jwt import get_current_investor
from app.models.user import User
from app.services.distributor_service import DistributorService
from app.schemas.distributor import DistributorListResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Agents"])


@router.get("/", response_model=DistributorListResponse)
async def get_investor_agents(
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get all registered distributors/agents for the investor"""
    try:
        service = DistributorService(db)
        agents = service.get_investor_agents(current_investor.investor_id)
        
        return {
            "status": "success",
            "message": "Agents retrieved successfully",
            "data": agents
        }
        
    except Exception as e:
        logger.error(f"Get agents error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve agents"
        )
