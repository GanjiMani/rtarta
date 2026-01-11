from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from app.models.investor import (
    KYCStatus, InvestorType, Gender, MaritalStatus,
    Occupation, IncomeSlab
)


class InvestorBase(BaseModel):
    pan_number: str = Field(..., pattern=r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$')
    full_name: str = Field(..., min_length=2, max_length=255)
    date_of_birth: date
    gender: Gender
    marital_status: Optional[MaritalStatus] = None
    investor_type: InvestorType = InvestorType.individual
    email: EmailStr
    mobile_number: str = Field(..., pattern=r'^\+?[0-9]{10,15}$')
    alternate_mobile: Optional[str] = Field(None, pattern=r'^\+?[0-9]{10,15}$')
    address_line1: str = Field(..., min_length=5, max_length=500)
    address_line2: Optional[str] = Field(None, max_length=500)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., pattern=r'^\d{6}$')
    country: str = "India"
    occupation: Optional[Occupation] = None
    income_slab: Optional[IncomeSlab] = None

    @validator('date_of_birth')
    def validate_age(cls, v):
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError('Investor must be at least 18 years old')
        return v


class InvestorCreate(InvestorBase):
    pass


class InvestorUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    mobile_number: Optional[str] = Field(None, pattern=r'^\+?[0-9]{10,15}$')
    alternate_mobile: Optional[str] = Field(None, pattern=r'^\+?[0-9]{10,15}$')
    address_line1: Optional[str] = Field(None, min_length=5, max_length=500)
    address_line2: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    pincode: Optional[str] = Field(None, pattern=r'^\d{6}$')
    occupation: Optional[Occupation] = None
    income_slab: Optional[IncomeSlab] = None
    marital_status: Optional[MaritalStatus] = None


class InvestorInDB(InvestorBase):
    investor_id: str
    kyc_status: KYCStatus
    kyc_submitted_date: Optional[date]
    kyc_verified_date: Optional[date]
    kyc_expiry_date: Optional[date]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class KYCUpdate(BaseModel):
    pan_number: Optional[str] = Field(None, pattern=r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$')
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    date_of_birth: Optional[date]
    address_line1: Optional[str] = Field(None, min_length=5, max_length=500)
    address_line2: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    pincode: Optional[str] = Field(None, pattern=r'^\d{6}$')

    @validator('date_of_birth')
    def validate_age(cls, v):
        if v is None:
            return v
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError('Investor must be at least 18 years old')
        return v


class BankAccountBase(BaseModel):
    account_number: str = Field(..., min_length=8, max_length=20)
    account_holder_name: str = Field(..., min_length=2, max_length=255)
    bank_name: str = Field(..., min_length=2, max_length=255)
    branch_name: Optional[str] = Field(None, max_length=255)
    ifsc_code: str = Field(..., pattern=r'^[A-Z]{4}0[A-Z0-9]{6}$')
    micr_code: Optional[str] = Field(None, pattern=r'^\d{9}$')
    account_type: str = "savings"
    bank_address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    pincode: Optional[str] = Field(None, pattern=r'^\d{6}$')


class BankAccountCreate(BankAccountBase):
    pass


class BankAccountUpdate(BaseModel):
    account_holder_name: Optional[str] = Field(None, min_length=2, max_length=255)
    branch_name: Optional[str] = Field(None, max_length=255)
    bank_address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    pincode: Optional[str] = Field(None, pattern=r'^\d{6}$')


class BankAccountInDB(BankAccountBase):
    id: int
    investor_id: str
    is_primary: bool
    is_verified: bool
    status: str
    mandate_type: Optional[str]
    mandate_status: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class NomineeBase(BaseModel):
    nominee_name: str = Field(..., min_length=2, max_length=255)
    nominee_pan: Optional[str] = Field(None, pattern=r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$')
    relationship: str = Field(..., min_length=2, max_length=50)
    date_of_birth: date
    gender: Optional[str] = None
    allocation_percentage: Decimal = Field(..., ge=0, le=100)
    mobile_number: Optional[str] = Field(None, pattern=r'^[6-9]\d{9}$')
    email: Optional[EmailStr] = None
    address: Optional[str] = Field(None, max_length=500)

    @validator('date_of_birth')
    def validate_nominee_age(cls, v):
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 1:
            raise ValueError('Nominee must be at least 1 year old')
        return v


class NomineeCreate(NomineeBase):
    guardian_name: Optional[str] = Field(None, min_length=2, max_length=255)
    guardian_pan: Optional[str] = Field(None, pattern=r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$')
    guardian_relation: Optional[str] = Field(None, max_length=50)


class NomineeUpdate(BaseModel):
    nominee_name: Optional[str] = Field(None, min_length=2, max_length=255)
    nominee_pan: Optional[str] = Field(None, pattern=r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$')
    relationship: Optional[str] = Field(None, min_length=2, max_length=50)
    date_of_birth: Optional[date]
    gender: Optional[str] = None
    allocation_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    mobile_number: Optional[str] = Field(None, pattern=r'^[6-9]\d{9}$')
    email: Optional[EmailStr] = None
    address: Optional[str] = Field(None, max_length=500)
    guardian_name: Optional[str] = Field(None, min_length=2, max_length=255)
    guardian_pan: Optional[str] = Field(None, pattern=r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$')
    guardian_relation: Optional[str] = Field(None, max_length=50)


class NomineeInDB(NomineeBase):
    id: int
    investor_id: str
    is_verified: bool
    guardian_name: Optional[str]
    guardian_pan: Optional[str]
    guardian_relation: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class InvestorProfileResponse(BaseModel):
    investor: InvestorInDB
    bank_accounts: List[BankAccountInDB]
    nominees: List[NomineeInDB]
    total_folios: int
    total_investment: Decimal
    current_value: Decimal

    class Config:
        orm_mode = True