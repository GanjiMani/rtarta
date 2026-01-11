import enum
from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import BaseModel as SQLAlchemyBaseModel

class TicketStatus(enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"

class TicketPriority(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class SupportTicket(SQLAlchemyBaseModel):
    """Investor support tickets tracking"""
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    investor_id = Column(String(10), ForeignKey("investor_master.investor_id"), nullable=False, index=True)
    
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.open)
    priority = Column(Enum(TicketPriority), default=TicketPriority.medium)
    
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    assigned_to = Column(String(50), nullable=True) # Could be admin_user_id
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    investor = relationship("Investor", back_populates="support_tickets")

    def __repr__(self):
        return f"<SupportTicket(id={self.id}, subject={self.subject}, status={self.status.value})>"
