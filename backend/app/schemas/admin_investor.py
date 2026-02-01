from datetime import date
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

class InvestorSchema(BaseModel):
    investor_id: str
    pan_number: str
    full_name: str
    email: EmailStr
    mobile_number: str
    kyc_status: str
    date_of_birth: Optional[date] = None
    city: Optional[str] = None
    state: Optional[str] = None
    is_active: bool
    total_investment: Optional[float] = 0.0

    class Config:
        from_attributes = True

class InvestorDetailSchema(InvestorSchema):
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    pincode: Optional[str] = None
    country: Optional[str] = "India"
    occupation: Optional[str] = None
    income_slab: Optional[str] = None
    nominees_count: int = 0
    folios_count: int = 0

class InvestorUpdate(BaseModel):
    mobile_number: Optional[str] = None
    email: Optional[EmailStr] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    is_active: Optional[bool] = None

class FolioSchema(BaseModel):
    folio_number: str
    scheme_name: str
    amc_name: str
    total_units: float
    current_nav: float
    total_value: float
    status: str
    
    class Config:
        from_attributes = True
