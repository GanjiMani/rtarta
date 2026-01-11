import enum
from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import BaseModel as SQLAlchemyBaseModel

class NotificationType(enum.Enum):
    transaction = "transaction"
    system = "system"
    security = "security"
    alert = "alert"
    service_request = "service_request"

class NotificationPriority(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class Notification(SQLAlchemyBaseModel):
    """Investor notifications tracking"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    investor_id = Column(String(10), ForeignKey("investor_master.investor_id"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(Enum(NotificationType), default=NotificationType.system)
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.low)
    
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    
    # Optional link to a specific entity (e.g., transaction_id, request_id)
    reference_id = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    investor = relationship("Investor", back_populates="notifications")

    def __repr__(self):
        return f"<Notification(id={self.id}, type={self.notification_type.value}, read={self.is_read})>"
