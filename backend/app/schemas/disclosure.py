from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class DisclosureBase(BaseModel):
    title: str
    content: str
    category: str
    reference_number: Optional[str] = None
    is_mandatory: bool = True

class DisclosureInDB(DisclosureBase):
    id: int
    published_date: datetime
    expiry_date: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DisclosureListResponse(BaseModel):
    status: str
    message: str
    data: List[DisclosureInDB]
