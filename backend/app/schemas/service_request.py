from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.service_request import ServiceRequestType, ServiceRequestStatus, ServiceRequestPriority

class ServiceRequestBase(BaseModel):
    request_type: ServiceRequestType
    description: str = Field(..., min_length=1)
    priority: ServiceRequestPriority = ServiceRequestPriority.medium

class ServiceRequestCreate(ServiceRequestBase):
    pass

class ServiceRequestUpdate(BaseModel):
    status: Optional[ServiceRequestStatus] = None
    priority: Optional[ServiceRequestPriority] = None
    resolution_comments: Optional[str] = None

class ServiceRequestInDB(ServiceRequestBase):
    id: int
    investor_id: str
    status: ServiceRequestStatus
    resolution_comments: Optional[str]
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime]
    assigned_to: Optional[str]

    class Config:
        from_attributes = True

class ServiceRequestListResponse(BaseModel):
    status: str
    message: str
    data: List[ServiceRequestInDB]

class SingleServiceRequestResponse(BaseModel):
    status: str
    message: str
    data: ServiceRequestInDB
