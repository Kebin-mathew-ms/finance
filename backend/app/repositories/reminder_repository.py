from sqlalchemy.orm import Session
from typing import Optional, List, Tuple
from datetime import date
from app.models.reminder import Reminder
from app.repositories.base import BaseRepository

class ReminderRepository(BaseRepository):
    def get_by_id(self, reminder_id: int, user_id: int) -> Optional[Reminder]:
        return self.db.query(Reminder).filter(
            Reminder.reminder_id == reminder_id,
            Reminder.user_id == user_id
        ).first()

    def get_all_paginated(
        self,
        user_id: int,
        page: int = 1,
        size: int = 10,
        is_completed: Optional[bool] = None
    ) -> Tuple[List[Reminder], int]:
        query = self.db.query(Reminder).filter(Reminder.user_id == user_id)
        
        if is_completed is not None:
            query = query.filter(Reminder.is_completed == is_completed)
            
        total_count = query.count()
        items = query.order_by(Reminder.due_date.asc()) \
                     .offset((page - 1) * size) \
                     .limit(size) \
                     .all()
                     
        return items, total_count

    def get_upcoming_by_days(self, user_id: int, days: int) -> List[Reminder]:
        """Fetch incomplete reminders due in the next N days for a user."""
        today = date.today()
        # Due in future up to today + days
        from datetime import timedelta
        target_date = today + timedelta(days=days)
        return self.db.query(Reminder).filter(
            Reminder.user_id == user_id,
            Reminder.is_completed == False,
            Reminder.due_date >= today,
            Reminder.due_date <= target_date
        ).all()

    def get_all_incomplete_reminders(self) -> List[Reminder]:
        """Fetch all incomplete reminders across all users (for background jobs)."""
        return self.db.query(Reminder).filter(Reminder.is_completed == False).all()

    def create(self, reminder: Reminder) -> Reminder:
        self.db.add(reminder)
        self.db.commit()
        self.db.refresh(reminder)
        return reminder

    def update(self, reminder: Reminder) -> Reminder:
        self.db.commit()
        self.db.refresh(reminder)
        return reminder

    def delete(self, reminder: Reminder) -> None:
        self.db.delete(reminder)
        self.db.commit()
