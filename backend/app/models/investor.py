from sqlalchemy import Column, String, Text, Boolean, Integer, DECIMAL, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel


class KYCStatus(enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    pending_verification = "pending_verification"
    verified = "verified"
    rejected = "rejected"
    expired = "expired"


class InvestorType(enum.Enum):
    individual = "individual"
    huf = "huf"
    nri = "nri"
    minor = "minor"


class Gender(enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class MaritalStatus(enum.Enum):
    single = "single"
    married = "married"
    divorced = "divorced"
    widowed = "widowed"


class Occupation(enum.Enum):
    salaried = "salaried"
    self_employed = "self_employed"
    businessman = "businessman"
    professional = "professional"
    retired = "retired"
    student = "student"
    housewife = "housewife"
    others = "others"


class IncomeSlab(enum.Enum):
    below_1_lakhs = "below_1_lakhs"
    one_to_five_lakhs = "one_to_five_lakhs"
    five_to_ten_lakhs = "five_to_ten_lakhs"
    ten_to_twenty_five_lakhs = "ten_to_twenty_five_lakhs"
    twenty_five_to_one_crore = "twenty_five_to_one_crore"
    above_one_crore = "above_one_crore"


class Investor(BaseModel):
    """Investor master data with KYC and personal information"""

    __tablename__ = "investor_master"

    investor_id = Column(String(10), unique=True, nullable=False, index=True)  # I001, I002, etc.

    # Personal Information
    pan_number = Column(String(10), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    marital_status = Column(Enum(MaritalStatus))
    investor_type = Column(Enum(InvestorType), default=InvestorType.individual)

    # Contact Information
    email = Column(String(255), nullable=False, unique=True, index=True)
    mobile_number = Column(String(15), nullable=False)
    alternate_mobile = Column(String(15))

    # Address Information
    address_line1 = Column(Text, nullable=False)
    address_line2 = Column(Text)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)
    country = Column(String(50), default="India")

    # Professional Information
    occupation = Column(Enum(Occupation))
    income_slab = Column(Enum(IncomeSlab))

    # KYC Information
    kyc_status = Column(Enum(KYCStatus), default=KYCStatus.not_started, nullable=False)
    kyc_submitted_date = Column(Date)
    kyc_verified_date = Column(Date)
    kyc_expiry_date = Column(Date)
    kyc_documents_path = Column(String(500))  # Path to uploaded KYC documents

    # Account Status
    is_active = Column(Boolean, default=True, nullable=False)
    account_locked = Column(Boolean, default=False, nullable=False)
    account_locked_reason = Column(Text)

    # Guardian Information (for minor accounts)
    guardian_name = Column(String(255))
    guardian_pan = Column(String(10))
    guardian_relation = Column(String(50))

    # Audit Fields
    created_by = Column(String(50))  # User/system that created the record
    last_login = Column(Date)
    password_reset_token = Column(String(255))
    password_reset_expiry = Column(Date)

    # Relationships
    folios = relationship("Folio", back_populates="investor", cascade="all, delete-orphan")
    bank_accounts = relationship("BankAccount", back_populates="investor", cascade="all, delete-orphan")
    nominees = relationship("Nominee", back_populates="investor_rel", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="investor", cascade="all, delete-orphan")
    sip_registrations = relationship("SIPRegistration", back_populates="investor", cascade="all, delete-orphan")
    swp_registrations = relationship("SWPRegistration", back_populates="investor", cascade="all, delete-orphan")
    stp_registrations = relationship("STPRegistration", back_populates="investor", cascade="all, delete-orphan")
    user = relationship("User", back_populates="investor")
    documents = relationship("Document", back_populates="investor", cascade="all, delete-orphan")
    unclaimed_amounts = relationship("UnclaimedAmount", back_populates="investor", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Investor(id={self.id}, investor_id={self.investor_id}, name={self.full_name}, kyc_status={self.kyc_status.value})>"