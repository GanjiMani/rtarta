import sys
import os
from sqlalchemy.orm import Session
from datetime import datetime

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.db.session import SessionLocal
from app.models.notification import Notification, NotificationType, NotificationPriority
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationCreate

def seed_notifications():
    db = SessionLocal()
    try:
        service = NotificationService(db)
        investor_id = "I001" # Assuming this exists from seeds
        
        # Clear existing
        service.clear_all_notifications(investor_id)
        
        # 1. System Notification
        service.create_notification(investor_id, NotificationCreate(
            investor_id=investor_id,
            title="System Maintenance",
            message="Scheduled maintenance on Sunday, Jan 18th from 02:00 AM to 05:00 AM IST.",
            notification_type=NotificationType.system,
            priority=NotificationPriority.medium
        ))
        
        # 2. Transaction Notification
        service.create_notification(investor_id, NotificationCreate(
            investor_id=investor_id,
            title="SIP Installment Processed",
            message="Your SIP installment of ₹5,000 for HDFC Top 100 Fund has been successfully processed.",
            notification_type=NotificationType.transaction,
            priority=NotificationPriority.low,
            reference_id="T10293"
        ))
        
        # 3. Security Alert (High Priority)
        service.create_notification(investor_id, NotificationCreate(
            investor_id=investor_id,
            title="New Login Detected",
            message="A new login was detected from a Chrome browser on Windows 11 (Mumbai, India).",
            notification_type=NotificationType.security,
            priority=NotificationPriority.high
        ))
        
        # 4. Service Request Update
        service.create_notification(investor_id, NotificationCreate(
            investor_id=investor_id,
            title="Address Change Request Update",
            message="Your request for address change (#SR09283) is now being processed by our team.",
            notification_type=NotificationType.service_request,
            priority=NotificationPriority.medium,
            reference_id="SR09283"
        ))

        print("Notifications seeded successfully for I001!")
        
    except Exception as e:
        print(f"Seeding failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_notifications()
