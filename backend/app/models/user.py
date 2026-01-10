from sqlalchemy import Column, String, Text, Boolean, Integer, DECIMAL, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel
from passlib.context import CryptContext


class UserRole(enum.Enum):
    investor = "investor"
    admin = "admin"
    amc = "amc"
    distributor = "distributor"
    sebi = "sebi"


class UserStatus(enum.Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"
    locked = "locked"


class User(BaseModel):
    """User authentication and profile data"""

    __tablename__ = "users"

    # Authentication
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)

    # User Details
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, index=True)

    # Role-specific IDs
    investor_id = Column(String(10), ForeignKey("investor_master.investor_id"), unique=True)
    amc_id = Column(String(10), ForeignKey("amc_master.amc_id"))
    distributor_id = Column(String(10))  # Will be linked to distributor table later

    # Account Status
    is_active = Column(Boolean, default=True, nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.active, nullable=False)

    # Security
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    last_login = Column(DateTime)
    account_locked_until = Column(DateTime)
    password_reset_token = Column(String(255))
    password_reset_expiry = Column(DateTime)
    password_reset_otp = Column(String(6))  # 6-digit OTP
    otp_expiry = Column(DateTime)  # OTP expiry timestamp

    # Profile
    phone_number = Column(String(15))
    profile_picture_url = Column(String(500))

    # Audit
    created_by = Column(String(50))
    deactivated_by = Column(String(50))
    deactivation_reason = Column(Text)

    # Relationships
    investor = relationship("Investor", back_populates="user", uselist=False)
    amc = relationship("AMC", back_populates="users")

    # Password context for hashing
    _pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def verify_password(self, plain_password: str) -> bool:
        """Verify a password against the hashed password"""
        return self._pwd_context.verify(plain_password, self.hashed_password)

    def set_password(self, plain_password: str):
        """Hash and set a new password"""
        self.hashed_password = self._pwd_context.hash(plain_password)

    @property
    def is_account_locked(self) -> bool:
        """Check if account is currently locked"""
        if self.status == UserStatus.locked:
            return True
        if self.account_locked_until and self.account_locked_until > DateTime.utcnow():
            return True
        return False

    def increment_failed_attempts(self):
        """Increment failed login attempts"""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:  # Lock after 5 failed attempts
            self.status = UserStatus.locked

    def reset_failed_attempts(self):
        """Reset failed login attempts after successful login"""
        self.failed_login_attempts = 0

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role.value}, status={self.status.value})>"


# Create additional indexes for performance
from sqlalchemy import Index
Index('idx_user_role_active', User.role, User.is_active)
Index('idx_user_email_active', User.email, User.is_active)
