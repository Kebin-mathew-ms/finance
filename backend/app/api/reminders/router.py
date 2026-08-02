from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database.connection import get_db
from app.models.user import User
from app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse, ReminderPaginatedResponse
from app.services.auth_service import get_current_user
from app.services.reminder_service import ReminderService

router = APIRouter()

@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    data: ReminderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a bill payment reminder."""
    reminder_service = ReminderService(db)
    return reminder_service.create_reminder(current_user.user_id, data)

@router.get("", response_model=ReminderPaginatedResponse)
def list_reminders(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    is_completed: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List reminders for current user (paginated and filtered)."""
    reminder_service = ReminderService(db)
    return reminder_service.get_reminders(
        user_id=current_user.user_id,
        page=page,
        size=size,
        is_completed=is_completed
    )

@router.get("/{id}", response_model=ReminderResponse)
def get_reminder(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch single reminder details."""
    reminder_service = ReminderService(db)
    return reminder_service.get_reminder_by_id(id, current_user.user_id)

@router.put("/{id}", response_model=ReminderResponse)
def update_reminder(
    id: int,
    data: ReminderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update reminder and recalculate recurring status if toggled paid."""
    reminder_service = ReminderService(db)
    return reminder_service.update_reminder(id, current_user.user_id, data)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a reminder record."""
    reminder_service = ReminderService(db)
    reminder_service.delete_reminder(id, current_user.user_id)
    return None
