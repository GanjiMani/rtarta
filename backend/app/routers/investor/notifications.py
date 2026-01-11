from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.db.session import get_db
from app.core.jwt import get_current_investor
from app.models.user import User
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationListResponse, SingleNotificationResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Notifications"])


@router.get("/", response_model=NotificationListResponse)
async def get_notifications(
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get all notifications for the investor"""
    try:
        service = NotificationService(db)
        notifications = service.get_investor_notifications(current_investor.investor_id)
        
        return {
            "status": "success",
            "message": "Notifications retrieved successfully",
            "data": notifications
        }
    except Exception as e:
        logger.error(f"Get notifications error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notifications"
        )


@router.put("/{notification_id}/read", response_model=SingleNotificationResponse)
async def mark_notification_read(
    notification_id: int,
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Mark a specific notification as read"""
    try:
        service = NotificationService(db)
        notification = service.mark_as_read(notification_id, current_investor.investor_id)
        
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
            
        return {
            "status": "success",
            "message": "Notification marked as read",
            "data": notification
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mark notification read error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notification as read"
        )


@router.post("/read-all", response_model=Dict[str, Any])
async def mark_all_read(
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    try:
        service = NotificationService(db)
        count = service.mark_all_as_read(current_investor.investor_id)
        
        return {
            "status": "success",
            "message": f"{count} notifications marked as read",
            "data": {"count": count}
        }
    except Exception as e:
        logger.error(f"Mark all read error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark all notifications as read"
        )


@router.post("/clear", response_model=Dict[str, Any])
async def clear_all_notifications(
    current_investor: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Clear all notifications for the investor"""
    try:
        service = NotificationService(db)
        success = service.clear_all_notifications(current_investor.investor_id)
        
        if not success:
            raise Exception("Failed to delete notifications")
            
        return {
            "status": "success",
            "message": "All notifications cleared",
            "data": {"success": True}
        }
    except Exception as e:
        logger.error(f"Clear notifications error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear notifications"
        )









