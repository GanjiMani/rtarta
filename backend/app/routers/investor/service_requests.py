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


class ServiceRequestCreate(BaseModel):
    request_type: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1)


@router.get("/")
async def get_service_requests(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get all service requests for the investor"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
        
        # Placeholder implementation - can be extended with actual service request model
        requests = []
        
        return {
            "message": "Service requests retrieved successfully",
            "data": requests
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get service requests error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve service requests"
        )


@router.post("/")
async def create_service_request(
    request_data: ServiceRequestCreate,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Create a new service request"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
        
        # Placeholder implementation - can be extended with actual service request model
        service_request = {
            "id": 1,
            "request_type": request_data.request_type,
            "description": request_data.description,
            "status": "Pending",
            "created_at": datetime.now().isoformat(),
            "investor_id": current_user.investor_id
        }
        
        return {
            "message": "Service request created successfully",
            "data": service_request
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create service request error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create service request"
        )









