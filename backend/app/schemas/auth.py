from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import date


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str
    role: str = "investor"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    profile_picture_url: Optional[str] = None


class PasswordResetRequest(BaseModel):
    email: EmailStr


class OTPVerificationRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class InvestorRegistrationRequest(BaseModel):
    pan_number: str = Field(..., pattern=r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$')
    full_name: str = Field(..., min_length=2, max_length=255)
    date_of_birth: date
    gender: str
    email: EmailStr
    mobile_number: str = Field(..., pattern=r'^[6-9]\d{9}$')
    address_line1: str = Field(..., min_length=5, max_length=500)
    address_line2: Optional[str] = Field(None, max_length=500)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., pattern=r'^\d{6}$')
    password: str = Field(..., min_length=8)

    @validator('date_of_birth')
    def validate_age(cls, v):
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError('Investor must be at least 18 years old')
        return v
