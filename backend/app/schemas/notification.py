from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime

NOTIFICATION_TYPES = {"WARNING", "INFORMATION", "SUCCESS", "ERROR"}

class NotificationBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    message: str = Field(..., min_length=1)
    notification_type: str = Field(...)

    @field_validator("notification_type")
    @classmethod
    def validate_notification_type(cls, v: str) -> str:
        if v not in NOTIFICATION_TYPES:
            raise ValueError(f"Notification type must be one of {list(NOTIFICATION_TYPES)}")
        return v

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationResponse(NotificationBase):
    notification_id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationPaginatedResponse(BaseModel):
    items: List[NotificationResponse]
    total_count: int
    page: int
    size: int
    pages: int
    unread_count: int
