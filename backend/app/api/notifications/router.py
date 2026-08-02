from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database.connection import get_db
from app.models.user import User
from app.schemas.notification import NotificationResponse, NotificationPaginatedResponse
from app.services.auth_service import get_current_user
from app.services.notification_service import NotificationService

router = APIRouter()

@router.get("", response_model=NotificationPaginatedResponse)
def list_notifications(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    is_read: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List system notifications for current user (paginated)."""
    notification_service = NotificationService(db)
    return notification_service.get_notifications(
        user_id=current_user.user_id,
        page=page,
        size=size,
        is_read=is_read
    )

@router.put("/{id}", response_model=NotificationResponse)
def mark_read(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a specific notification as read."""
    notification_service = NotificationService(db)
    return notification_service.mark_as_read(id, current_user.user_id)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification."""
    notification_service = NotificationService(db)
    notification_service.delete_notification(id, current_user.user_id)
    return None
