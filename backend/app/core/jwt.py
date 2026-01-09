from datetime import datetime
from typing import Optional
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from .security import verify_token

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise credentials_exception

    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception

    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if user is None:
        raise credentials_exception

    # Check if account is locked
    if user.is_account_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is locked. Please contact support."
        )

    # Update last login (skip if database issues)
    try:
        user.last_login = datetime.utcnow()
        db.commit()
    except Exception as e:
        # Log but don't fail - last login update is not critical
        logger.warning(f"Failed to update last login for {email}: {e}")
        db.rollback()

    return user


async def get_current_investor(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current authenticated investor (ensures user has investor role)"""
    # Handle role checking more robustly
    user_role = str(current_user.role)
    if user_role.endswith('.investor'):
        user_role = 'investor'

    if user_role != "investor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Investor role required."
        )
    return current_user


def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current authenticated admin user"""
    if current_user.role.value not in ["admin", "RTA CEO"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin role required."
        )
    return current_user


def get_current_amc(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current authenticated AMC user"""
    if current_user.role.value != "amc":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. AMC role required."
        )
    return current_user


def get_current_distributor(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current authenticated distributor user"""
    if current_user.role.value != "distributor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Distributor role required."
        )
    return current_user


def get_current_sebi(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current authenticated SEBI user"""
    if current_user.role.value != "sebi":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. SEBI role required."
        )
    return current_user

