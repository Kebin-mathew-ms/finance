from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

REMINDER_TYPES = {
    "Electricity bill", "Water bill", "Internet bill", "Rent payment",
    "Credit card payment", "Loan payment", "Subscription payment",
    "Insurance payment", "Other"
}

REPEAT_INTERVALS = {"NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"}

class ReminderBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=255)
    reminder_type: str = Field(...)
    amount: Decimal = Field(..., ge=0, decimal_places=2)
    due_date: date
    repeat_interval: str = Field(default="NONE")

    @field_validator("reminder_type")
    @classmethod
    def validate_reminder_type(cls, v: str) -> str:
        if v not in REMINDER_TYPES:
            raise ValueError(f"Reminder type must be one of {list(REMINDER_TYPES)}")
        return v

    @field_validator("repeat_interval")
    @classmethod
    def validate_repeat_interval(cls, v: str) -> str:
        if v not in REPEAT_INTERVALS:
            raise ValueError(f"Repeat interval must be one of {list(REPEAT_INTERVALS)}")
        return v

class ReminderCreate(ReminderBase):
    pass

class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=255)
    reminder_type: Optional[str] = Field(None)
    amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    due_date: Optional[date] = Field(None)
    repeat_interval: Optional[str] = Field(None)
    is_completed: Optional[bool] = Field(None)

    @field_validator("reminder_type")
    @classmethod
    def validate_reminder_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in REMINDER_TYPES:
            raise ValueError(f"Reminder type must be one of {list(REMINDER_TYPES)}")
        return v

    @field_validator("repeat_interval")
    @classmethod
    def validate_repeat_interval(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in REPEAT_INTERVALS:
            raise ValueError(f"Repeat interval must be one of {list(REPEAT_INTERVALS)}")
        return v

class ReminderResponse(ReminderBase):
    reminder_id: int
    user_id: int
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReminderPaginatedResponse(BaseModel):
    items: List[ReminderResponse]
    total_count: int
    page: int
    size: int
    pages: int
