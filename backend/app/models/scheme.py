from sqlalchemy import Column, String, Text, Boolean, Integer, DECIMAL, ForeignKey, Date, Enum
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel


class SchemeType(enum.Enum):
    equity = "equity"
    debt = "debt"
    hybrid = "hybrid"
    money_market = "money_market"


class PlanType(enum.Enum):
    direct = "direct"
    regular = "regular"


class OptionType(enum.Enum):
    growth = "growth"
    idcw_payout = "idcw_payout"
    idcw_reinvestment = "idcw_reinvestment"


class Scheme(BaseModel):
    """Mutual fund scheme master data"""

    __tablename__ = "scheme_master"

    scheme_id = Column(String(10), unique=True, nullable=False, index=True)  # S001, S002, etc.
    scheme_name = Column(String(255), nullable=False)
    scheme_type = Column(Enum(SchemeType), nullable=False)
    plan_type = Column(Enum(PlanType), nullable=False)
    option_type = Column(Enum(OptionType), nullable=False)

    # Foreign Keys
    amc_id = Column(String(10), ForeignKey("amc_master.amc_id"), nullable=False, index=True)

    # NAV and pricing
    current_nav = Column(DECIMAL(10, 4), nullable=False, default=10.0000)
    nav_date = Column(Date, nullable=False)

    # Scheme details
    minimum_investment = Column(DECIMAL(12, 2), nullable=False, default=100.00)
    additional_investment = Column(DECIMAL(12, 2), nullable=False, default=100.00)
    exit_load_percentage = Column(DECIMAL(5, 2), default=0.00)
    exit_load_period_days = Column(Integer, default=0)

    # Status and flags
    is_active = Column(Boolean, default=True, nullable=False)
    is_open_for_investment = Column(Boolean, default=True, nullable=False)
    is_open_for_redemption = Column(Boolean, default=True, nullable=False)

    # SIP details
    sip_minimum_installment = Column(DECIMAL(12, 2), default=100.00)
    sip_maximum_installment = Column(DECIMAL(12, 2), default=50000.00)
    sip_minimum_period_months = Column(Integer, default=6)

    # STP/SWP details
    stp_minimum_amount = Column(DECIMAL(12, 2), default=500.00)
    swp_minimum_amount = Column(DECIMAL(12, 2), default=500.00)

    # Additional metadata
    risk_category = Column(String(50))  # low, moderate, high
    fund_manager = Column(String(255))
    benchmark_index = Column(String(255))

    # Relationships
    amc = relationship("AMC", back_populates="schemes")
    folios = relationship("Folio", back_populates="scheme", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="scheme", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Scheme(id={self.id}, scheme_id={self.scheme_id}, name={self.scheme_name[:30]}...)>"