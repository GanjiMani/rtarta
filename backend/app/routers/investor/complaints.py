from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.db.session import get_db
from app.core.jwt import get_current_investor
from app.models.user import User
from app.services.complaint_service import ComplaintService
from app.schemas.complaint import ComplaintCreate, ComplaintListResponse, SingleComplaintResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Complaints"])


@router.get("/", response_model=ComplaintListResponse)
async def get_complaints(
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get all complaints for the investor"""
    try:
        service = ComplaintService(db)
        complaints = service.get_investor_complaints(current_investor.investor_id)
        
        return {
            "status": "success",
            "message": "Complaints retrieved successfully",
            "data": complaints
        }
    except Exception as e:
        logger.error(f"Get complaints error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve complaints"
        )


@router.post("/", response_model=SingleComplaintResponse)
async def create_complaint(
    complaint_data: ComplaintCreate,
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Create a new complaint"""
    try:
        service = ComplaintService(db)
        complaint = service.create_complaint(current_investor.investor_id, complaint_data)
        
        return {
            "status": "success",
            "message": "Complaint submitted successfully",
            "data": complaint
        }
    except Exception as e:
        logger.error(f"Create complaint error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit complaint"
        )


@router.get("/{complaint_id}", response_model=SingleComplaintResponse)
async def get_complaint_details(
    complaint_id: int,
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get specific complaint details"""
    try:
        service = ComplaintService(db)
        complaint = service.get_complaint_details(complaint_id, current_investor.investor_id)
        
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found"
            )
            
        return {
            "status": "success",
            "message": "Complaint details retrieved successfully",
            "data": complaint
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get complaint details error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve complaint details"
        )









