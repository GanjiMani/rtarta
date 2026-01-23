from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict
from enum import Enum


class AdminRole(str, Enum):
    """Refined roles for Admin Panel"""
    RTA_CEO = "rta_ceo"
    RTA_COO = "rta_coo"
    COMPLIANCE_HEAD = "compliance_head"
    OPS_MANAGER = "operations_manager"
    SENIOR_EXECUTIVE = "senior_executive"
    EXECUTIVE = "executive"
    CUSTOMER_SERVICE = "customer_service"


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str
    
class AdminRegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(..., min_length=8)
    sub_role: AdminRole
    employee_id: str
    secret_key: str  # To prevent public registration


class AdminUserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    sub_role: Optional[str] = None
    permissions: Optional[Dict] = {}
    is_active: bool

    class Config:
        from_attributes = True
