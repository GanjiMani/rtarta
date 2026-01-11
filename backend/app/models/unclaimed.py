from sqlalchemy import Column, String, DECIMAL, Date, ForeignKey, Integer, Boolean
from sqlalchemy.orm import relationship
from app.db.base import BaseModel

class UnclaimedAmount(BaseModel):
    """Model for tracking unclaimed redemption and dividend amounts"""
    
    __tablename__ = "unclaimed_amounts"
    __table_args__ = {'extend_existing': True}
    
    # Foreign Keys
    investor_id = Column(String(10), ForeignKey("investor_master.investor_id"), nullable=False, index=True)
    transaction_id = Column(String(15), ForeignKey("transaction_history.transaction_id"))
    folio_number = Column(String(15), ForeignKey("folio_holdings.folio_number"), nullable=False, index=True)
    
    # Amount Details
    amount = Column(DECIMAL(15, 2), nullable=False)
    accumulated_income = Column(DECIMAL(12, 2), default=0.00)
    total_amount = Column(DECIMAL(15, 2), nullable=False)
    
    # Details
    unclaimed_date = Column(Date, nullable=False)
    unclaimed_reason = Column(String(100))
    
    # Transfer to Unpaid Account
    transferred_to_unpaid_account = Column(Boolean, default=False)
    unpaid_account_transfer_date = Column(Date)
    
    # Claim Details
    claimed = Column(Boolean, default=False)
    claimed_date = Column(Date)
    claimed_amount = Column(DECIMAL(15, 2))
    claim_reference = Column(String(50))
    
    # Compliance & Aging
    days_unclaimed = Column(Integer, default=0)
    aging_category = Column(String(20))
    sebi_notified = Column(Boolean, default=False)
    investor_notified = Column(Boolean, default=False)
    last_notification_date = Column(Date)
    
    # Processing
    processed_by = Column(String(50))
    
    # Relationships
    investor = relationship("Investor", back_populates="unclaimed_amounts")
    folio = relationship("Folio")
    transaction = relationship("Transaction", foreign_keys=[transaction_id])
    
    def __repr__(self):
        return f"<UnclaimedAmount(id={self.id}, amount={self.amount}, claimed={self.claimed})>"
