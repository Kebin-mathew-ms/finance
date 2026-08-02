from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional, List
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, NotificationPaginatedResponse
from app.repositories.notification_repository import NotificationRepository

class NotificationService:
    def __init__(self, db: Session):
        self.notification_repo = NotificationRepository(db)

    def create_notification(self, user_id: int, title: str, message: str, notification_type: str) -> Notification:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            is_read=False
        )
        return self.notification_repo.create(notification)

    def get_notification_by_id(self, notification_id: int, user_id: int) -> Notification:
        notification = self.notification_repo.get_by_id(notification_id, user_id)
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        return notification

    def get_notifications(
        self,
        user_id: int,
        page: int = 1,
        size: int = 10,
        is_read: Optional[bool] = None
    ) -> NotificationPaginatedResponse:
        items, total_count, unread_count = self.notification_repo.get_all_paginated(
            user_id, page, size, is_read
        )
        pages = (total_count + size - 1) // size if total_count > 0 else 1

        return NotificationPaginatedResponse(
            items=items,
            total_count=total_count,
            page=page,
            size=size,
            pages=pages,
            unread_count=unread_count
        )

    def mark_as_read(self, notification_id: int, user_id: int) -> Notification:
        notification = self.get_notification_by_id(notification_id, user_id)
        notification.is_read = True
        return self.notification_repo.update(notification)

    def delete_notification(self, notification_id: int, user_id: int) -> None:
        notification = self.get_notification_by_id(notification_id, user_id)
        self.notification_repo.delete(notification)
