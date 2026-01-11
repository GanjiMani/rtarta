from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.session import get_db
from app.core.jwt import get_current_investor
from app.models.user import User
from app.services.service_request_service import ServiceRequestService
from app.schemas.service_request import ServiceRequestCreate, ServiceRequestInDB, ServiceRequestListResponse, SingleServiceRequestResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Service Requests"])


@router.get("/", response_model=ServiceRequestListResponse)
async def get_service_requests(
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get all service requests for the investor"""
    try:
        service = ServiceRequestService(db)
        requests = service.get_investor_requests(current_investor.investor_id)
        
        return {
            "status": "success",
            "message": "Service requests retrieved successfully",
            "data": requests
        }
    except Exception as e:
        logger.error(f"Get service requests error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve service requests"
        )


@router.post("/", response_model=SingleServiceRequestResponse)
async def create_service_request(
    request_data: ServiceRequestCreate,
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Create a new service request"""
    try:
        service = ServiceRequestService(db)
        request = service.create_request(current_investor.investor_id, request_data)
        
        return {
            "status": "success",
            "message": "Service request created successfully",
            "data": request
        }
    except Exception as e:
        logger.error(f"Create service request error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create service request"
        )


@router.delete("/{request_id}", response_model=SingleServiceRequestResponse)
async def cancel_service_request(
    request_id: int,
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Cancel a pending service request"""
    try:
        service = ServiceRequestService(db)
        request = service.cancel_request(request_id, current_investor.investor_id)
        
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service request not found"
            )
            
        return {
            "status": "success",
            "message": "Service request cancelled successfully",
            "data": request
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Cancel service request error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel service request"
        )
