from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class DistributorBase(BaseModel):
    distributor_id: str
    name: str
    firm_name: Optional[str] = None
    arn_number: str
    email: str
    phone: str
    city: Optional[str] = None
    is_active: bool = True
    experience_years: int = 0
    rating: Decimal = Field(default=Decimal('5.0'), max_digits=2, decimal_places=1)

class DistributorInDB(DistributorBase):
    id: int
    total_aum: Decimal
    commission_earned_ytd: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DistributorListResponse(BaseModel):
    status: str
    message: str
    data: List[DistributorInDB]
