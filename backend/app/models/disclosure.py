import enum
from sqlalchemy import Column, String, Text, Integer, DateTime
from datetime import datetime
from app.db.base import BaseModel as SQLAlchemyBaseModel

class DisclosureCategory(enum.Enum):
    regulatory = "regulatory"
    compliance = "compliance"
    risk_notice = "risk_notice"
    market_update = "market_update"
    annual_report = "annual_report"

class Disclosure(SQLAlchemyBaseModel):
    """Regulatory and compliance disclosures"""
    __tablename__ = "regulatory_disclosures"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), default="regulatory") # Can store DisclosureCategory.value
    
    published_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime, nullable=True) # Notices that expire
    
    reference_number = Column(String(50), nullable=True) # e.g. SEBI/CIR/2024
    is_mandatory = Column(Integer, default=1) # 1 for mandatory, 0 for info
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Disclosure(id={self.id}, title={self.title}, category={self.category})>"
