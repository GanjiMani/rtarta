from sqlalchemy import Column, String, DECIMAL, Date, ForeignKey, Enum, Integer, Boolean
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel

class UnclaimedStatus(enum.Enum):
    pending = "pending"
    claimed = "claimed"
    processed = "processed"

class UnclaimedAmount(BaseModel):
    """Model for tracking unclaimed redemption and dividend amounts
    
    Consolidates logic from previous document.py and new requirements.
    """
    
    __tablename__ = "unclaimed_amounts"
    __table_args__ = {'extend_existing': True}
    
    unclaimed_id = Column(String(20), unique=True, nullable=False, index=True)  # UNC001
    
    # Foreign Keys
    investor_id = Column(String(10), ForeignKey("investor_master.investor_id"), nullable=False, index=True)
    folio_number = Column(String(15), ForeignKey("folio_holdings.folio_number"), nullable=False, index=True)
    scheme_id = Column(String(10), ForeignKey("scheme_master.scheme_id"), nullable=False)
    original_transaction_id = Column(String(15), ForeignKey("transaction_history.transaction_id"))
    
    # Amount Details
    amount = Column(DECIMAL(15, 2), nullable=False)
    accumulated_income = Column(DECIMAL(15, 2), default=0.00)  # Interest earned while unclaimed
    total_amount = Column(DECIMAL(15, 2), nullable=False) # Computed or stored: amount + accumulated_income
    
    # Details
    unclaimed_date = Column(Date, nullable=False)
    unclaimed_reason = Column(String(255))  # e.g., "Bank account closed", "Address invalid"
    
    # Status
    status = Column(Enum(UnclaimedStatus), default=UnclaimedStatus.pending, nullable=False, index=True)
    claimed = Column(Boolean, default=False) # Backend compatibility if needed, but status is preferred
    
    # Claim Details
    claimed_date = Column(Date)
    settlement_transaction_id = Column(String(15), ForeignKey("transaction_history.transaction_id"))
    
    # Compliance & Aging (from old model)
    days_unclaimed = Column(Integer, default=0)
    aging_category = Column(String(50))
    sebi_notified = Column(Boolean, default=False)
    
    # Relationships
    investor = relationship("Investor", back_populates="unclaimed_amounts")
    folio = relationship("Folio")
    scheme = relationship("Scheme")
    original_transaction = relationship("Transaction", foreign_keys=[original_transaction_id])
    settlement_transaction = relationship("Transaction", foreign_keys=[settlement_transaction_id])
    
    def __repr__(self):
        return f"<UnclaimedAmount(id={self.unclaimed_id}, amount={self.amount}, status={self.status.value})>"
