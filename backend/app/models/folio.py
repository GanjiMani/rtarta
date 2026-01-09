from sqlalchemy import Column, String, Text, Boolean, Integer, DECIMAL, Date, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel


class FolioStatus(enum.Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"
    closed = "closed"


class Folio(BaseModel):
    """Folio represents investor holdings in a specific scheme
    
    Business Rule: Each folio number is a unique (Investor_ID, AMC_ID, Scheme_ID) pair.
    One folio per investor-scheme-AMC combination.
    """

    __tablename__ = "folio_holdings"
    __table_args__ = (
        UniqueConstraint('investor_id', 'amc_id', 'scheme_id', name='uq_folio_investor_amc_scheme'),
    )

    folio_number = Column(String(15), unique=True, nullable=False, index=True)  # F001, F002, etc.

    # Foreign Keys
    investor_id = Column(String(10), ForeignKey("investor_master.investor_id"), nullable=False, index=True)
    amc_id = Column(String(10), ForeignKey("amc_master.amc_id"), nullable=False, index=True)
    scheme_id = Column(String(10), ForeignKey("scheme_master.scheme_id"), nullable=False, index=True)

    # Holdings Data (calculated fields)
    total_units = Column(DECIMAL(15, 4), default=0.0000, nullable=False)
    current_nav = Column(DECIMAL(10, 4), nullable=False)
    total_value = Column(DECIMAL(15, 2), default=0.00, nullable=False)  # total_units * current_nav

    # Cost Basis (for capital gains calculations)
    total_investment = Column(DECIMAL(15, 2), default=0.00, nullable=False)
    average_cost_per_unit = Column(DECIMAL(10, 4), default=0.0000)

    # Status and Flags
    status = Column(Enum(FolioStatus), default=FolioStatus.active, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)  # For compliance/audit holds

    # IDCW Preferences
    idcw_option = Column(String(20), default="payout")  # payout, reinvestment

    # Transaction Counters (for performance)
    transaction_count = Column(Integer, default=0, nullable=False)
    last_transaction_date = Column(Date)

    # Compliance and Audit
    compliance_status = Column(String(50), default="compliant")
    audit_flag = Column(Boolean, default=False, nullable=False)

    # Relationships
    investor = relationship("Investor", back_populates="folios")
    amc = relationship("AMC", back_populates="folios")
    scheme = relationship("Scheme", back_populates="folios")
    transactions = relationship("Transaction", back_populates="folio", cascade="all, delete-orphan")

    # Computed Properties
    @property
    def unrealized_gain_loss(self):
        """Calculate unrealized gain/loss"""
        if self.average_cost_per_unit and self.average_cost_per_unit > 0:
            return self.total_value - (self.total_units * self.average_cost_per_unit)
        return 0.00

    @property
    def gain_loss_percentage(self):
        """Calculate gain/loss percentage"""
        if self.total_investment and self.total_investment > 0:
            return ((self.total_value - self.total_investment) / self.total_investment) * 100
        return 0.00

    def __repr__(self):
        return f"<Folio(folio_number={self.folio_number}, investor_id={self.investor_id}, scheme_id={self.scheme_id}, units={self.total_units}, value={self.total_value})>"