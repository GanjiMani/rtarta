from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.db.session import get_db
from app.services.auth_service import AuthService
from app.schemas.auth import (
    UserCreate, LoginRequest, Token, UserUpdate,
    PasswordResetRequest, PasswordResetConfirm, ChangePasswordRequest,
    InvestorRegistrationRequest, OTPVerificationRequest
)
from app.core.config import settings
from app.core.jwt import get_current_investor
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()


@router.post("/register", response_model=Dict[str, Any])
async def register_investor(
    registration_data: InvestorRegistrationRequest,
    db: Session = Depends(get_db)
):
    """Register new investor"""
    try:
        auth_service = AuthService(db)

        # Convert to dict and separate password
        investor_data = registration_data.dict(exclude={'password'})
        password = registration_data.password

        result = auth_service.register_investor(investor_data, password)

        return {
            "message": "Investor registered successfully",
            "data": result
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=Dict[str, Any])
async def login_investor(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login investor"""
    try:
        auth_service = AuthService(db)
        result = auth_service.login_user(login_data.email, login_data.password)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        return {
            "message": "Login successful",
            "data": result
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/forgot-password")
async def forgot_password(
    reset_request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """Initiate password reset - sends OTP to email"""
    try:
        auth_service = AuthService(db)
        otp = auth_service.initiate_password_reset(reset_request.email)

        if otp:
            response = {
                "message": "If the email exists, an OTP has been sent to your email address. Please check your inbox."
            }
            
            # Include OTP in response for debugging (only in debug mode)
            if settings.DEBUG_MODE:
                response["otp"] = auth_service.get_last_generated_otp_for_email(reset_request.email)
                response["debug_message"] = "Debug mode: OTP included in response for testing purposes."
            
            return response
        else:
            # Don't reveal if email exists or not
            return {
                "message": "If the email exists, an OTP has been sent to your email address. Please check your inbox."
            }

    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset request failed"
        )


@router.post("/verify-otp")
async def verify_otp(
    otp_data: OTPVerificationRequest,
    db: Session = Depends(get_db)
):
    """Verify OTP for password reset"""
    try:
        auth_service = AuthService(db)
        is_valid = auth_service.verify_otp(otp_data.email, otp_data.otp)

        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP"
            )

        return {
            "message": "OTP verified successfully",
            "verified": True
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OTP verification failed"
        )


@router.post("/reset-password")
async def reset_password(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """Reset password using OTP"""
    try:
        auth_service = AuthService(db)

        auth_service.reset_password(
            reset_data.email,
            reset_data.otp,
            reset_data.new_password
        )

        return {
            "message": "Password reset successfully"
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset password error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed"
        )


@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get current user profile"""
    try:
        auth_service = AuthService(db)
        profile = auth_service.get_user_profile(current_user)

        return {
            "message": "Profile retrieved successfully",
            "data": profile
        }

    except Exception as e:
        logger.error(f"Get profile error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile"
        )


@router.put("/profile")
async def update_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    try:
        auth_service = AuthService(db)
        updated_user = auth_service.update_user_profile(current_user, update_data.dict(exclude_unset=True))

        return {
            "message": "Profile updated successfully",
            "data": {
                "user": {
                    "id": updated_user.id,
                    "email": updated_user.email,
                    "full_name": updated_user.full_name,
                    "phone_number": updated_user.phone_number
                }
            }
        }

    except Exception as e:
        import traceback
        logger.error(f"Update profile error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Change user password"""
    try:
        auth_service = AuthService(db)
        auth_service.change_password(
            current_user,
            password_data.current_password,
            password_data.new_password
        )

        return {
            "message": "Password changed successfully"
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        import traceback
        logger.error(f"Change password error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change password: {str(e)}"
        )


@router.post("/logout")
async def logout_investor(
    current_user: User = Depends(get_current_investor)
):
    """Logout investor (client-side token removal)"""
    return {
        "message": "Logged out successfully"
    }
