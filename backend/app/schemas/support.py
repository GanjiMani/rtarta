from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from app.models.support import TicketStatus, TicketPriority

class SupportTicketBase(BaseModel):
    subject: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    priority: TicketPriority = TicketPriority.medium

class SupportTicketCreate(SupportTicketBase):
    pass

class SupportTicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    resolution_notes: Optional[str] = None

class SupportTicketInDB(SupportTicketBase):
    id: int
    investor_id: str
    status: TicketStatus
    resolution_notes: Optional[str]
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SupportTicketListResponse(BaseModel):
    status: str
    message: str
    data: List[SupportTicketInDB]

class SingleSupportTicketResponse(BaseModel):
    status: str
    message: str
    data: SupportTicketInDB
