import enum
from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import BaseModel as SQLAlchemyBaseModel

class ComplaintStatus(enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"

class ComplaintCategory(enum.Enum):
    transaction = "transaction"
    service = "service"
    account = "account"
    technical = "technical"
    other = "other"

class Complaint(SQLAlchemyBaseModel):
    """Investor formal complaints tracking"""
    __tablename__ = "investor_complaints"

    id = Column(Integer, primary_key=True, index=True)
    investor_id = Column(String(10), ForeignKey("investor_master.investor_id"), nullable=False, index=True)
    
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Enum(ComplaintCategory), default=ComplaintCategory.other)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.open)
    
    resolution_comments = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Optional link to a specific entity
    reference_id = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    investor = relationship("Investor", back_populates="complaints")

    def __repr__(self):
        return f"<Complaint(id={self.id}, subject={self.subject}, status={self.status.value})>"
