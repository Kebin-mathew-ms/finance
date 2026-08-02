from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional, List
from datetime import date, timedelta
from decimal import Decimal
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderPaginatedResponse
from app.repositories.reminder_repository import ReminderRepository
from app.services.notification_service import NotificationService

class ReminderService:
    def __init__(self, db: Session):
        self.db = db
        self.reminder_repo = ReminderRepository(db)
        self.notification_service = NotificationService(db)

    def _get_next_due_date(self, current_date: date, interval: str) -> date:
        """Helper to calculate next recurring date without external dependencies."""
        if interval == "DAILY":
            return current_date + timedelta(days=1)
        elif interval == "WEEKLY":
            return current_date + timedelta(days=7)
        elif interval == "MONTHLY":
            # Safely roll over month/year
            if current_date.month == 12:
                try:
                    return current_date.replace(year=current_date.year + 1, month=1)
                except ValueError:
                    # Handle feb 29 or month end exceptions safely
                    return current_date + timedelta(days=31)
            else:
                try:
                    return current_date.replace(month=current_date.month + 1)
                except ValueError:
                    # If target month has fewer days (e.g. Jan 31 -> Feb 28), shift safely
                    next_month_start = (current_date.replace(day=28) + timedelta(days=4)).replace(day=1)
                    return next_month_start
        elif interval == "YEARLY":
            try:
                return current_date.replace(year=current_date.year + 1)
            except ValueError:
                # Feb 29 leap year shift to Feb 28
                return current_date.replace(year=current_date.year + 1, day=28)
        return current_date

    def create_reminder(self, user_id: int, data: ReminderCreate) -> Reminder:
        reminder = Reminder(
            user_id=user_id,
            title=data.title,
            description=data.description,
            reminder_type=data.reminder_type,
            amount=data.amount,
            due_date=data.due_date,
            repeat_interval=data.repeat_interval,
            is_completed=False
        )
        return self.reminder_repo.create(reminder)

    def get_reminder_by_id(self, reminder_id: int, user_id: int) -> Reminder:
        reminder = self.reminder_repo.get_by_id(reminder_id, user_id)
        if not reminder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reminder record not found"
            )
        return reminder

    def get_reminders(
        self,
        user_id: int,
        page: int = 1,
        size: int = 10,
        is_completed: Optional[bool] = None
    ) -> ReminderPaginatedResponse:
        items, total_count = self.reminder_repo.get_all_paginated(user_id, page, size, is_completed)
        pages = (total_count + size - 1) // size if total_count > 0 else 1

        return ReminderPaginatedResponse(
            items=items,
            total_count=total_count,
            page=page,
            size=size,
            pages=pages
        )

    def update_reminder(self, reminder_id: int, user_id: int, data: ReminderUpdate) -> Reminder:
        reminder = self.get_reminder_by_id(reminder_id, user_id)
        old_completed = reminder.is_completed

        if data.title is not None:
            reminder.title = data.title
        if data.description is not None:
            reminder.description = data.description
        if data.reminder_type is not None:
            reminder.reminder_type = data.reminder_type
        if data.amount is not None:
            reminder.amount = data.amount
        if data.due_date is not None:
            reminder.due_date = data.due_date
        if data.repeat_interval is not None:
            reminder.repeat_interval = data.repeat_interval
        if data.is_completed is not None:
            reminder.is_completed = data.is_completed

        updated = self.reminder_repo.update(reminder)

        # Triggers recurring recreation logic if marked as completed
        if not old_completed and updated.is_completed and updated.repeat_interval != "NONE":
            next_date = self._get_next_due_date(updated.due_date, updated.repeat_interval)
            
            # Create next cycle's reminder in DB
            next_reminder = Reminder(
                user_id=user_id,
                title=updated.title,
                description=updated.description,
                reminder_type=updated.reminder_type,
                amount=updated.amount,
                due_date=next_date,
                repeat_interval=updated.repeat_interval,
                is_completed=False
            )
            self.reminder_repo.create(next_reminder)

            # Trigger a system notification indicating payment logged & next due created
            self.notification_service.create_notification(
                user_id=user_id,
                title="Bill Paid & Scheduled",
                message=f"Bill '{updated.title}' was marked as paid. Next due date is scheduled for {next_date}.",
                notification_type="SUCCESS"
            )

        return updated

    def delete_reminder(self, reminder_id: int, user_id: int) -> None:
        reminder = self.get_reminder_by_id(reminder_id, user_id)
        self.reminder_repo.delete(reminder)
