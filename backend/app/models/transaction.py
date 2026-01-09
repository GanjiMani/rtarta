from sqlalchemy import Column, String, Text, Boolean, Integer, DECIMAL, Date, DateTime, ForeignKey, Enum, Index
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel


class TransactionType(enum.Enum):
    # Financial Transactions
    fresh_purchase = "fresh_purchase"
    additional_purchase = "additional_purchase"
    sip = "sip"
    redemption = "redemption"
    swp = "swp"
    stp_redemption = "stp_redemption"
    stp_purchase = "stp_purchase"
    switch_redemption = "switch_redemption"
    switch_purchase = "switch_purchase"
    idcw_payout = "idcw_payout"
    idcw_reinvestment = "idcw_reinvestment"

    # Non-Financial Transactions
    kyc_update = "kyc_update"
    bank_mandate = "bank_mandate"
    nominee_registration = "nominee_registration"
    address_update = "address_update"
    contact_update = "contact_update"


class TransactionStatus(enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"
    rejected = "rejected"


class PaymentMode(enum.Enum):
    net_banking = "net_banking"
    upi = "upi"
    debit_mandate = "debit_mandate"
    neft = "neft"
    rtgs = "rtgs"
    cheque = "cheque"


class Transaction(BaseModel):
    """Complete transaction audit trail for all investor activities"""

    __tablename__ = "transaction_history"

    transaction_id = Column(String(15), unique=True, nullable=False, index=True)  # T001, T002, etc.

    # Foreign Keys
    investor_id = Column(String(10), ForeignKey("investor_master.investor_id"), nullable=False, index=True)
    folio_number = Column(String(15), ForeignKey("folio_holdings.folio_number"), index=True)
    scheme_id = Column(String(10), ForeignKey("scheme_master.scheme_id"), nullable=False, index=True)
    amc_id = Column(String(10), ForeignKey("amc_master.amc_id"), nullable=False, index=True)

    # Transaction Details
    transaction_type = Column(Enum(TransactionType), nullable=False)
    transaction_date = Column(Date, nullable=False, index=True)
    amount = Column(DECIMAL(15, 2), nullable=False)

    # Unit Calculations
    nav_per_unit = Column(DECIMAL(10, 4), nullable=False)
    units = Column(DECIMAL(15, 4), default=0.0000)  # Can be negative for redemptions

    # Status and Processing
    status = Column(Enum(TransactionStatus), default=TransactionStatus.pending, nullable=False, index=True)
    processing_date = Column(Date)
    completion_date = Column(Date)

    # Payment Information
    payment_mode = Column(Enum(PaymentMode))
    payment_reference = Column(String(100))  # Bank's reference number
    bank_account_used = Column(String(20))  # Last 4 digits of account

    # Fees and Charges
    stamp_duty = Column(DECIMAL(8, 2), default=0.00)
    transaction_charges = Column(DECIMAL(8, 2), default=0.00)
    exit_load_amount = Column(DECIMAL(8, 2), default=0.00)
    gst_amount = Column(DECIMAL(8, 2), default=0.00)

    # STP/Switch Related Fields
    parent_transaction_id = Column(String(15))  # References transaction_history.transaction_id (no FK constraint for self-reference)
    linked_transaction_id = Column(String(15))  # For STP/Switch pairs
    transfer_request_id = Column(String(20))  # STP001, SWI001, etc.

    # IDCW Related Fields
    idcw_rate = Column(DECIMAL(5, 2))  # IDCW percentage
    idcw_amount_per_unit = Column(DECIMAL(8, 4))

    # Processing Information
    processed_by = Column(String(50))  # User/system that processed
    approved_by = Column(String(50))  # For high-value transactions
    approval_date = Column(Date)

    # Error Handling
    error_code = Column(String(10))
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)

    # Audit Trail
    source_ip = Column(String(45))  # IPv4/IPv6
    user_agent = Column(String(500))
    api_endpoint = Column(String(100))

    # Additional Metadata
    remarks = Column(Text)
    compliance_flags = Column(String(255))  # JSON string for multiple flags
    regulatory_reporting_status = Column(String(20), default="pending")

    # Relationships
    investor = relationship("Investor", back_populates="transactions")
    folio = relationship("Folio", back_populates="transactions")
    scheme = relationship("Scheme", back_populates="transactions")
    # Note: parent_transaction relationship removed due to self-reference complexity
    # Can be handled at application level using parent_transaction_id field

    # Computed Properties
    @property
    def net_amount(self):
        """Calculate net amount after fees"""
        return self.amount - self.stamp_duty - self.transaction_charges - self.exit_load_amount - self.gst_amount

    @property
    def is_financial_transaction(self):
        """Check if this is a financial transaction that affects holdings"""
        return self.transaction_type.value not in [
            'kyc_update', 'bank_mandate', 'nominee_registration',
            'address_update', 'contact_update'
        ]

    @property
    def is_debit_transaction(self):
        """Check if this transaction debits money from investor"""
        debit_types = ['fresh_purchase', 'additional_purchase', 'sip']
        return self.transaction_type.value in debit_types

    @property
    def is_credit_transaction(self):
        """Check if this transaction credits money to investor"""
        credit_types = ['redemption', 'swp', 'idcw_payout']
        return self.transaction_type.value in credit_types

    def __repr__(self):
        return f"<Transaction(id={self.transaction_id}, type={self.transaction_type.value}, amount={self.amount}, status={self.status.value})>"


# Create indexes for performance
Index('idx_transaction_investor_date', Transaction.investor_id, Transaction.transaction_date)
Index('idx_transaction_folio_date', Transaction.folio_number, Transaction.transaction_date)
Index('idx_transaction_scheme_date', Transaction.scheme_id, Transaction.transaction_date)
Index('idx_transaction_status_date', Transaction.status, Transaction.transaction_date)
Index('idx_transaction_type_date', Transaction.transaction_type, Transaction.transaction_date)