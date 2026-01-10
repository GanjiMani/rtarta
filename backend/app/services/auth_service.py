from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import secrets
import logging

from app.models.user import User, UserRole, UserStatus
from app.models.investor import Investor
from app.services.investor_service import InvestorService
from app.services.email_service import email_service
from app.schemas.investor import InvestorCreate
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings

logger = logging.getLogger(__name__)


class AuthService:
    """Service for user authentication and authorization"""

    def __init__(self, db: Session):
        self.db = db
        self.investor_service = InvestorService(db)
        self._last_otp = {}  # For debugging OTP storage

    def register_investor(self, investor_data: Dict[str, Any], password: str) -> Dict[str, Any]:
        """Register a new investor"""
        try:
            # Check if user already exists
            existing_user = self.db.query(User).filter(User.email == investor_data.get('email')).first()
            if existing_user:
                raise ValueError("User with this email already exists")

            # Convert date_of_birth string to date object if it's a string
            if isinstance(investor_data.get('date_of_birth'), str):
                from datetime import datetime as dt
                investor_data['date_of_birth'] = dt.strptime(investor_data['date_of_birth'], '%Y-%m-%d').date()

            # Create investor using InvestorService
            investor_create = InvestorCreate(**investor_data)
            investor = self.investor_service.create_investor(investor_create)

            # Create user account for investor
            user = self.investor_service.create_user_for_investor(investor, password)

            # Commit the transaction
            self.db.commit()
            self.db.refresh(investor)
            self.db.refresh(user)

            # Generate access token
            access_token = create_access_token(
                data={"sub": user.email, "role": user.role.value}
            )

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role.value,
                    "investor_id": investor.investor_id
                },
                "investor": {
                    "investor_id": investor.investor_id,
                    "full_name": investor.full_name,
                    "email": investor.email,
                    "kyc_status": investor.kyc_status.value if hasattr(investor.kyc_status, 'value') else str(investor.kyc_status)
                }
            }

        except ValueError:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Registration error: {e}", exc_info=True)
            raise ValueError(f"Registration failed: {str(e)}")

    def login_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user and return access token"""
        try:
            user = self.db.query(User).filter(User.email == email).first()
            
            if not user:
                logger.warning(f"Login attempt with non-existent email: {email}")
                return None

            if not user.is_active:
                logger.warning(f"Login attempt for inactive user: {email}")
                return None

            # Check if account is locked
            if user.is_account_locked:
                logger.warning(f"Login attempt for locked account: {email}")
                return None

            # Verify password
            if not user.verify_password(password):
                user.increment_failed_attempts()
                self.db.commit()
                logger.warning(f"Failed login attempt for: {email}")
                return None

            # Reset failed attempts on successful login
            user.reset_failed_attempts()
            user.last_login = datetime.utcnow()
            self.db.commit()

            # Generate access token
            access_token = create_access_token(
                data={"sub": user.email, "role": user.role.value}
            )

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role.value,
                    "investor_id": user.investor_id
                }
            }

        except Exception as e:
            logger.error(f"Login error: {e}", exc_info=True)
            return None

    def initiate_password_reset(self, email: str) -> Optional[str]:
        """Initiate password reset process - generates and sends OTP"""
        try:
            user = self.db.query(User).filter(User.email == email).first()
            if not user:
                # Don't reveal if email exists or not
                return None

            # Generate 6-digit OTP
            otp = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
            user.password_reset_otp = otp
            user.otp_expiry = datetime.utcnow() + timedelta(minutes=10)
            
            # Store OTP for debugging
            self._last_otp[email] = otp
            
            self.db.commit()

            # Send OTP email
            try:
                email_service.send_otp_email(
                    recipient_email=email,
                    otp=otp,
                    recipient_name=user.full_name or "User"
                )
            except Exception as e:
                logger.error(f"Failed to send OTP email: {e}")

            logger.info(f"Password reset OTP generated for: {email}")
            return otp

        except Exception as e:
            logger.error(f"Password reset initiation error: {e}", exc_info=True)
            self.db.rollback()
            return None

    def validate_reset_token(self, token: str) -> bool:
        """Validate password reset token"""
        try:
            user = self.db.query(User).filter(
                User.password_reset_token == token,
                User.password_reset_expiry > datetime.utcnow()
            ).first()

            return user is not None

        except Exception as e:
            logger.error(f"Token validation error: {e}", exc_info=True)
            return False

    def verify_otp(self, email: str, otp: str) -> bool:
        """Verify OTP for password reset"""
        try:
            user = self.db.query(User).filter(User.email == email).first()
            if not user:
                return False

            if not user.password_reset_otp or not user.otp_expiry:
                return False

            if user.otp_expiry < datetime.utcnow():
                logger.warning(f"OTP expired for: {email}")
                return False

            if user.password_reset_otp != otp:
                logger.warning(f"Invalid OTP attempt for: {email}")
                return False

            return True

        except Exception as e:
            logger.error(f"OTP verification error: {e}", exc_info=True)
            return False

    def reset_password(self, email: str, otp: str, new_password: str) -> bool:
        """Reset password using OTP"""
        try:
            # Verify OTP first
            if not self.verify_otp(email, otp):
                raise ValueError("Invalid or expired OTP")

            user = self.db.query(User).filter(User.email == email).first()
            if not user:
                raise ValueError("User not found")

            user.set_password(new_password)
            user.password_reset_otp = None
            user.otp_expiry = None
            user.password_reset_token = None
            user.password_reset_expiry = None
            self.db.commit()

            logger.info(f"Password reset successful for: {email}")
            return True

        except ValueError:
            self.db.rollback()
            raise
        except Exception as e:
            logger.error(f"Password reset error: {e}", exc_info=True)
            self.db.rollback()
            raise ValueError(f"Password reset failed: {str(e)}")

    def get_last_generated_otp_for_email(self, email: str) -> Optional[str]:
        """Get last generated OTP for debugging (only in debug mode)"""
        return self._last_otp.get(email)

    def get_user_profile(self, user: User) -> Dict[str, Any]:
        """Get user profile information"""
        try:
            profile_data = {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role.value,
                "phone_number": user.phone_number,
                "is_active": user.is_active,
                "status": user.status.value if hasattr(user.status, 'value') else str(user.status),
                "investor_id": user.investor_id,
                "amc_id": user.amc_id,
                "distributor_id": user.distributor_id
            }

            # If investor, get investor details
            if user.investor_id:
                investor = self.db.query(Investor).filter(Investor.investor_id == user.investor_id).first()
                if investor:
                    profile_data["investor"] = {
                        "investor_id": investor.investor_id,
                        "pan_number": investor.pan_number,
                        "full_name": investor.full_name,
                        "email": investor.email,
                        "mobile_number": investor.mobile_number,
                        "kyc_status": investor.kyc_status.value if hasattr(investor.kyc_status, 'value') else str(investor.kyc_status)
                    }

            return profile_data

        except Exception as e:
            logger.error(f"Get profile error: {e}", exc_info=True)
            raise ValueError(f"Failed to get profile: {str(e)}")

    def update_user_profile(self, user: User, update_data: Dict[str, Any]) -> User:
        """Update user profile information"""
        try:
            for key, value in update_data.items():
                if hasattr(user, key) and value is not None:
                    setattr(user, key, value)

            self.db.commit()
            self.db.refresh(user)
            return user

        except Exception as e:
            self.db.rollback()
            logger.error(f"Update profile error: {e}", exc_info=True)
            raise ValueError(f"Failed to update profile: {str(e)}")

    def change_password(self, user: User, current_password: str, new_password: str) -> bool:
        """Change user password"""
        try:
            # Verify current password
            if not user.verify_password(current_password):
                raise ValueError("Current password is incorrect")

            # Set new password
            user.set_password(new_password)
            self.db.commit()

            logger.info(f"Password changed successfully for: {user.email}")
            return True

        except ValueError:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Change password error: {e}", exc_info=True)
            raise ValueError(f"Failed to change password: {str(e)}")
