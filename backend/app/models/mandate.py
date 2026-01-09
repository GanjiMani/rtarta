from sqlalchemy import Column, String, Text, Boolean, Integer, DECIMAL, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel as SQLAlchemyBaseModel


class BankAccountType(enum.Enum):
    savings = "savings"
    current = "current"
    nri_nro = "nri_nro"
    nri_nre = "nri_nre"


class BankAccountStatus(enum.Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"
    closed = "closed"


class MandateStatus(enum.Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"
    cancelled = "cancelled"


class MandateType(enum.Enum):
    upi = "upi"
    ecs = "ecs"
    net_banking = "net_banking"
    debit_mandate = "debit_mandate"


class SIPFrequency(enum.Enum):
    monthly = "monthly"
    quarterly = "quarterly"
    weekly = "weekly"
    daily = "daily"


class SIPStatus(enum.Enum):
    active = "active"
    paused = "paused"
    cancelled = "cancelled"
    completed = "completed"


class BankAccount(SQLAlchemyBaseModel):
    """Bank account details for investors"""

    __tablename__ = "bank_accounts"

    # Foreign Keys
    investor_id = Column(String(10), ForeignKey("investor_master.investor_id"), nullable=False, index=True)

    # Bank Details
    account_number = Column(String(20), nullable=False)
    account_holder_name = Column(String(255), nullable=False)
    bank_name = Column(String(255), nullable=False)
    branch_name = Column(String(255))
    ifsc_code = Column(String(11), nullable=False)
    micr_code = Column(String(9))
    account_type = Column(Enum(BankAccountType), default=BankAccountType.savings)

    # Address
    bank_address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))

    # Status and Flags
    is_primary = Column(Boolean, default=False, nullable=False)  # Only one primary account per investor
    is_verified = Column(Boolean, default=False, nullable=False)
    status = Column(Enum(BankAccountStatus), default=BankAccountStatus.active, nullable=False)

    # Mandate Information
    mandate_type = Column(Enum(MandateType))
    mandate_status = Column(Enum(MandateStatus), default=MandateStatus.inactive)
    mandate_id = Column(String(50))  # Bank's mandate reference number
    mandate_amount_limit = Column(DECIMAL(12, 2))  # Maximum amount per transaction
    mandate_registration_date = Column(Date)
    mandate_expiry_date = Column(Date)
    mandate_umrn = Column(String(50))  # Unique Mandate Reference Number

    # UPI Details (if applicable)
    upi_id = Column(String(255))
    upi_app = Column(String(50))  # PhonePe, Google Pay, etc.

    # Verification
    verification_documents_path = Column(String(500))  # Path to bank statement/cheque
    verified_by = Column(String(50))  # User who verified
    verified_at = Column(Date)

    # Relationships
    investor = relationship("Investor", back_populates="bank_accounts")

    def __repr__(self):
        return f"<BankAccount(id={self.id}, account_number=****{self.account_number[-4:]}, bank={self.bank_name}, primary={self.is_primary})>"


class Nominee(SQLAlchemyBaseModel):
    """Nominee details for investor accounts"""

    __tablename__ = "nominees"

    # Foreign Keys
    investor_id = Column(String(10), ForeignKey("investor_master.investor_id"), nullable=False, index=True)

    # Nominee Details
    nominee_name = Column(String(255), nullable=False)
    nominee_pan = Column(String(10))
    nominee_relationship = Column(String(50), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(10))
    allocation_percentage = Column(DECIMAL(5, 2), default=100.00, nullable=False)

    # Contact Information
    mobile_number = Column(String(15))
    email = Column(String(255))
    address = Column(Text)

    # Guardian (if nominee is minor)
    guardian_name = Column(String(255))
    guardian_pan = Column(String(10))
    guardian_relation = Column(String(50))

    # Status
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_documents_path = Column(String(500))

    # Relationships
    investor_rel = relationship("Investor", back_populates="nominees")

    def __repr__(self):
        return f"<Nominee(id={self.id}, name={self.nominee_name}, relationship={self.nominee_relationship}, allocation={self.allocation_percentage}%)>"


class SIPRegistration(SQLAlchemyBaseModel):
    """SIP registration details"""

    __tablename__ = "sip_registrations"

    # Foreign Keys
    investor_id = Column(String(10), ForeignKey("investor_master.investor_id"), nullable=False, index=True)
    folio_number = Column(String(15), ForeignKey("folio_holdings.folio_number"), nullable=False, index=True)
    scheme_id = Column(String(10), ForeignKey("scheme_master.scheme_id"), nullable=False, index=True)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=False)

    # SIP Details
    registration_id = Column(String(15), unique=True, nullable=False, index=True)  # SIP001, SIP002, etc.
    amount = Column(DECIMAL(12, 2), nullable=False)
    frequency = Column(Enum(SIPFrequency), default=SIPFrequency.monthly, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)  # Optional for indefinite SIPs
    number_of_installments = Column(Integer)  # Optional if end_date is provided

    # Status and Tracking
    status = Column(Enum(SIPStatus), default=SIPStatus.active, nullable=False)
    next_installment_date = Column(Date, nullable=False)
    total_installments_completed = Column(Integer, default=0, nullable=False)
    total_amount_invested = Column(DECIMAL(15, 2), default=0.00, nullable=False)

    # Mandate Details
    mandate_type = Column(Enum(MandateType), nullable=False)
    mandate_id = Column(String(50))

    # Processing
    last_processed_date = Column(Date)
    last_transaction_id = Column(String(15))
    is_paused = Column(Boolean, default=False, nullable=False)

    # Relationships
    investor = relationship("Investor", back_populates="sip_registrations")
    bank_account = relationship("BankAccount")

    def __repr__(self):
        return f"<SIPRegistration(id={self.registration_id}, investor_id={self.investor_id}, amount={self.amount}, status={self.status.value})>"


class SWPRegistration(SQLAlchemyBaseModel):
    """SWP (Systematic Withdrawal Plan) registration details"""

    __tablename__ = "swp_registrations"

    # Foreign Keys
    investor_id = Column(String(10), ForeignKey("investor_master.investor_id"), nullable=False, index=True)
    folio_number = Column(String(15), ForeignKey("folio_holdings.folio_number"), nullable=False, index=True)
    scheme_id = Column(String(10), ForeignKey("scheme_master.scheme_id"), nullable=False, index=True)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=False)

    # SWP Details
    registration_id = Column(String(15), unique=True, nullable=False, index=True)  # SWP001, SWP002, etc.
    amount = Column(DECIMAL(12, 2), nullable=False)
    frequency = Column(Enum(SIPFrequency), default=SIPFrequency.monthly, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)  # Optional for indefinite SWPs
    number_of_installments = Column(Integer)  # Optional if end_date is provided

    # Status and Tracking
    status = Column(Enum(SIPStatus), default=SIPStatus.active, nullable=False)
    next_installment_date = Column(Date, nullable=False)
    total_installments_completed = Column(Integer, default=0, nullable=False)
    total_amount_withdrawn = Column(DECIMAL(15, 2), default=0.00, nullable=False)

    # Processing
    last_processed_date = Column(Date)
    last_transaction_id = Column(String(15))
    is_paused = Column(Boolean, default=False, nullable=False)

    # Relationships
    investor = relationship("Investor", back_populates="swp_registrations")
    bank_account = relationship("BankAccount")

    def __repr__(self):
        return f"<SWPRegistration(id={self.registration_id}, investor_id={self.investor_id}, amount={self.amount}, status={self.status.value})>"


class STPRegistration(SQLAlchemyBaseModel):
    """STP (Systematic Transfer Plan) registration details"""

    __tablename__ = "stp_registrations"

    # Foreign Keys
    investor_id = Column(String(10), ForeignKey("investor_master.investor_id"), nullable=False, index=True)
    source_folio_number = Column(String(15), ForeignKey("folio_holdings.folio_number"), nullable=False, index=True)
    target_folio_number = Column(String(15), ForeignKey("folio_holdings.folio_number"), nullable=False, index=True)
    source_scheme_id = Column(String(10), ForeignKey("scheme_master.scheme_id"), nullable=False, index=True)
    target_scheme_id = Column(String(10), ForeignKey("scheme_master.scheme_id"), nullable=False, index=True)

    # STP Details
    registration_id = Column(String(15), unique=True, nullable=False, index=True)  # STP001, STP002, etc.
    amount = Column(DECIMAL(12, 2), nullable=False)
    frequency = Column(Enum(SIPFrequency), default=SIPFrequency.monthly, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)  # Optional for indefinite STPs
    number_of_installments = Column(Integer)  # Optional if end_date is provided

    # Status and Tracking
    status = Column(Enum(SIPStatus), default=SIPStatus.active, nullable=False)
    next_installment_date = Column(Date, nullable=False)
    total_installments_completed = Column(Integer, default=0, nullable=False)
    total_amount_transferred = Column(DECIMAL(15, 2), default=0.00, nullable=False)

    # Processing
    last_processed_date = Column(Date)
    last_transaction_id = Column(String(15))
    is_paused = Column(Boolean, default=False, nullable=False)

    # Relationships
    investor = relationship("Investor", back_populates="stp_registrations")

    def __repr__(self):
        return f"<STPRegistration(id={self.registration_id}, investor_id={self.investor_id}, amount={self.amount}, status={self.status.value})>"