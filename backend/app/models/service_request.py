from sqlalchemy import Column, String, Text, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import BaseModel as SQLAlchemyBaseModel

class ServiceRequestType(enum.Enum):
    address_change = "address_change"
    mobile_change = "mobile_change"
    bank_update = "bank_update"
    kyc_update = "kyc_update"
    statement_request = "statement_request"
    nominee_update = "nominee_update"
    other = "other"

class ServiceRequestStatus(enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    resolved = "resolved"
    rejected = "rejected"
    cancelled = "cancelled"

class ServiceRequestPriority(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class ServiceRequest(SQLAlchemyBaseModel):
    """Investor service requests tracking"""
    __tablename__ = "service_requests"

    investor_id = Column(String(10), ForeignKey("investor_master.investor_id"), nullable=False, index=True)
    request_type = Column(Enum(ServiceRequestType), nullable=False)
    status = Column(Enum(ServiceRequestStatus), default=ServiceRequestStatus.pending, nullable=False)
    priority = Column(Enum(ServiceRequestPriority), default=ServiceRequestPriority.medium, nullable=False)
    
    description = Column(Text, nullable=False)
    resolution_comments = Column(Text)
    
    # Tracking
    closed_at = Column(DateTime)
    assigned_to = Column(String(50)) # Admin user ID

    # Relationships
    investor = relationship("Investor", back_populates="service_requests")

    def __repr__(self):
        return f"<ServiceRequest(id={self.id}, type={self.request_type.value}, status={self.status.value})>"
