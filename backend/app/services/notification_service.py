from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import List, Optional
from app.models.notification import Notification, NotificationType, NotificationPriority
from app.schemas.notification import NotificationCreate

class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def get_investor_notifications(self, investor_id: str, limit: int = 50) -> List[Notification]:
        """Retrieve notifications for an investor, sorted by newest first"""
        return self.db.query(Notification)\
            .filter(Notification.investor_id == investor_id)\
            .order_by(desc(Notification.created_at))\
            .limit(limit)\
            .all()

    def create_notification(self, investor_id: str, data: NotificationCreate) -> Notification:
        """Create a new notification for an investor"""
        new_notification = Notification(
            investor_id=investor_id,
            title=data.title,
            message=data.message,
            notification_type=data.notification_type,
            priority=data.priority,
            reference_id=data.reference_id
        )
        self.db.add(new_notification)
        self.db.commit()
        self.db.refresh(new_notification)
        return new_notification

    def mark_as_read(self, notification_id: int, investor_id: str) -> Optional[Notification]:
        """Mark a specific notification as read"""
        notification = self.db.query(Notification)\
            .filter(Notification.id == notification_id, Notification.investor_id == investor_id)\
            .first()
        
        if notification and not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(notification)
            
        return notification

    def mark_all_as_read(self, investor_id: str) -> int:
        """Mark all unread notifications for an investor as read"""
        unread = self.db.query(Notification)\
            .filter(Notification.investor_id == investor_id, Notification.is_read == False)\
            .all()
        
        count = 0
        now = datetime.utcnow()
        for note in unread:
            note.is_read = True
            note.read_at = now
            count += 1
            
        if count > 0:
            self.db.commit()
            
        return count

    def clear_all_notifications(self, investor_id: str) -> bool:
        """Delete all notifications for an investor"""
        try:
            self.db.query(Notification)\
                .filter(Notification.investor_id == investor_id)\
                .delete()
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            return False
