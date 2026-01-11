from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from app.models.complaint import ComplaintStatus, ComplaintCategory

class ComplaintBase(BaseModel):
    subject: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    category: ComplaintCategory = ComplaintCategory.other
    reference_id: Optional[str] = None

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    resolution_comments: Optional[str] = None

class ComplaintInDB(ComplaintBase):
    id: int
    investor_id: str
    status: ComplaintStatus
    resolution_comments: Optional[str]
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ComplaintListResponse(BaseModel):
    status: str
    message: str
    data: List[ComplaintInDB]

class SingleComplaintResponse(BaseModel):
    status: str
    message: str
    data: ComplaintInDB
