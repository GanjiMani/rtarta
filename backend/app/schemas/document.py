from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from app.models.document import DocumentType, DocumentStatus


class DocumentBase(BaseModel):
    document_type: DocumentType
    document_name: str = Field(..., min_length=1, max_length=255)


class DocumentCreate(DocumentBase):
    pass


class DocumentInDB(DocumentBase):
    id: int
    investor_id: str
    file_path: str
    file_size: Optional[int]
    mime_type: Optional[str]
    status: DocumentStatus
    verified_by: Optional[str]
    verified_at: Optional[date]
    rejection_reason: Optional[str]
    expiry_date: Optional[date]
    upload_ip: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    id: int
    investor_id: str
    document_type: str
    document_name: str
    file_size: Optional[int]
    mime_type: Optional[str]
    status: str
    verified_by: Optional[str]
    verified_at: Optional[str]
    rejection_reason: Optional[str]
    expiry_date: Optional[str]
    uploaded_on: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True








