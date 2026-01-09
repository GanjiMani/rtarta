from sqlalchemy import Column, String, Text, Boolean, Integer, DECIMAL, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel


class DocumentType(enum.Enum):
    kyc_pan = "kyc_pan"
    kyc_aadhaar = "kyc_aadhaar"
    kyc_passport = "kyc_passport"
    bank_statement = "bank_statement"
    bank_cheque = "bank_cheque"
    address_proof = "address_proof"
    income_proof = "income_proof"
    signature_proof = "signature_proof"
    nominee_photo = "nominee_photo"
    other = "other"


class DocumentStatus(enum.Enum):
    pending = "pending"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"
    expired = "expired"


class Document(BaseModel):
    """Document storage and management for investors"""

    __tablename__ = "documents"

    # Foreign Keys
    investor_id = Column(String(10), ForeignKey("investor_master.investor_id"), nullable=False, index=True)

    # Document Details
    document_type = Column(Enum(DocumentType), nullable=False)
    document_name = Column(String(255), nullable=False)  # Original filename
    file_path = Column(String(500), nullable=False)  # Path in storage
    file_size = Column(Integer)  # File size in bytes
    mime_type = Column(String(100))  # MIME type

    # Status and Verification
    status = Column(Enum(DocumentStatus), default=DocumentStatus.pending, nullable=False)
    verified_by = Column(String(50))  # User who verified
    verified_at = Column(Date)
    rejection_reason = Column(Text)  # If rejected
    expiry_date = Column(Date)  # For documents that expire

    # Metadata
    upload_ip = Column(String(45))  # IPv4/IPv6
    checksum = Column(String(128))  # SHA-256 hash for integrity
    tags = Column(String(500))  # JSON string for additional metadata

    # Relationships
    investor = relationship("Investor", back_populates="documents")

    def __repr__(self):
        return f"<Document(id={self.id}, type={self.document_type.value}, name={self.document_name}, status={self.status.value})>"


class UnclaimedAmount(BaseModel):
    """Tracking of unclaimed redemption and dividend amounts"""

    __tablename__ = "unclaimed_amounts"

    # Foreign Keys
    investor_id = Column(String(10), ForeignKey("investor_master.investor_id"), nullable=False, index=True)
    transaction_id = Column(String(15), ForeignKey("transaction_history.transaction_id"), nullable=False, index=True)
    folio_number = Column(String(15), ForeignKey("folio_holdings.folio_number"), nullable=False, index=True)

    # Amount Details
    amount = Column(DECIMAL(15, 2), nullable=False)
    accumulated_income = Column(DECIMAL(12, 2), default=0.00, nullable=False)  # Interest earned
    total_amount = Column(DECIMAL(15, 2), nullable=False)  # amount + accumulated_income

    # Unclaimed Details
    unclaimed_date = Column(Date, nullable=False)
    unclaimed_reason = Column(String(100))  # redemption, dividend, etc.

    # Transfer to Unpaid Account
    transferred_to_unpaid_account = Column(Boolean, default=False, nullable=False)
    unpaid_account_transfer_date = Column(Date)

    # Claim Process
    claimed = Column(Boolean, default=False, nullable=False)
    claimed_date = Column(Date)
    claimed_amount = Column(DECIMAL(15, 2))  # Amount actually paid to investor
    claim_reference = Column(String(50))  # Bank's payment reference

    # Aging Analysis
    days_unclaimed = Column(Integer, nullable=False)
    aging_category = Column(String(20))  # 0-30 days, 31-90 days, etc.

    # Compliance
    sebi_notified = Column(Boolean, default=False, nullable=False)
    investor_notified = Column(Boolean, default=False, nullable=False)
    last_notification_date = Column(Date)

    # Audit
    processed_by = Column(String(50))

    # Relationships
    investor = relationship("Investor", back_populates="unclaimed_amounts")
    transaction = relationship("Transaction")
    folio = relationship("Folio")

    def __repr__(self):
        return f"<UnclaimedAmount(id={self.id}, investor_id={self.investor_id}, amount={self.amount}, claimed={self.claimed})>"