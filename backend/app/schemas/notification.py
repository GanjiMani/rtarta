from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.notification import NotificationType, NotificationPriority

class NotificationBase(BaseModel):
    title: str
    message: str
    notification_type: NotificationType = NotificationType.system
    priority: NotificationPriority = NotificationPriority.low
    reference_id: Optional[str] = None

class NotificationCreate(NotificationBase):
    investor_id: str

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None

class NotificationInDB(NotificationBase):
    id: int
    investor_id: str
    is_read: bool
    read_at: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationListResponse(BaseModel):
    status: str
    message: str
    data: List[NotificationInDB]

class SingleNotificationResponse(BaseModel):
    status: str
    message: str
    data: NotificationInDB
