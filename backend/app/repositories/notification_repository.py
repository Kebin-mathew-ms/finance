from sqlalchemy.orm import Session
from typing import Optional, List, Tuple
from app.models.notification import Notification
from app.repositories.base import BaseRepository

class NotificationRepository(BaseRepository):
    def get_by_id(self, notification_id: int, user_id: int) -> Optional[Notification]:
        return self.db.query(Notification).filter(
            Notification.notification_id == notification_id,
            Notification.user_id == user_id
        ).first()

    def get_all_paginated(
        self,
        user_id: int,
        page: int = 1,
        size: int = 10,
        is_read: Optional[bool] = None
    ) -> Tuple[List[Notification], int, int]:
        """Returns items, total_count, and unread_count."""
        base_query = self.db.query(Notification).filter(Notification.user_id == user_id)
        
        # Calculate total unread count for user session
        unread_count = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()

        query = base_query
        if is_read is not None:
            query = query.filter(Notification.is_read == is_read)
            
        total_count = query.count()
        items = query.order_by(Notification.created_at.desc()) \
                     .offset((page - 1) * size) \
                     .limit(size) \
                     .all()
                     
        return items, total_count, unread_count

    def create(self, notification: Notification) -> Notification:
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def update(self, notification: Notification) -> Notification:
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def delete(self, notification: Notification) -> None:
        self.db.delete(notification)
        self.db.commit()
