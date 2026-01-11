from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import logging
from app.models.service_request import ServiceRequest, ServiceRequestType, ServiceRequestStatus, ServiceRequestPriority
from app.schemas.service_request import ServiceRequestCreate, ServiceRequestUpdate

logger = logging.getLogger(__name__)

class ServiceRequestService:
    def __init__(self, db: Session):
        self.db = db

    def create_request(self, investor_id: str, data: ServiceRequestCreate) -> ServiceRequest:
        """Create a new service request for an investor"""
        try:
            new_request = ServiceRequest(
                investor_id=investor_id,
                request_type=data.request_type,
                description=data.description,
                priority=data.priority,
                status=ServiceRequestStatus.pending
            )
            self.db.add(new_request)
            self.db.commit()
            self.db.refresh(new_request)
            logger.info(f"Service request {new_request.id} created for investor {investor_id}")
            return new_request
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating service request: {e}")
            raise

    def get_investor_requests(self, investor_id: str) -> List[ServiceRequest]:
        """Fetch all requests created by a specific investor"""
        return self.db.query(ServiceRequest).filter(
            ServiceRequest.investor_id == investor_id
        ).order_by(ServiceRequest.created_at.desc()).all()

    def get_request_by_id(self, request_id: int, investor_id: str) -> Optional[ServiceRequest]:
        """Fetch a specific request and ensure it belongs to the investor"""
        return self.db.query(ServiceRequest).filter(
            ServiceRequest.id == request_id,
            ServiceRequest.investor_id == investor_id
        ).first()

    def cancel_request(self, request_id: int, investor_id: str) -> Optional[ServiceRequest]:
        """Allow investor to cancel a pending request"""
        request = self.get_request_by_id(request_id, investor_id)
        if not request:
            return None
        
        if request.status != ServiceRequestStatus.pending:
            raise ValueError("Only pending requests can be cancelled")

        request.status = ServiceRequestStatus.cancelled
        request.closed_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(request)
        logger.info(f"Service request {request_id} cancelled by investor {investor_id}")
        return request
