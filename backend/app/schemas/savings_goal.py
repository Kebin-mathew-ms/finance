from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

GOAL_TYPES = {
    "Emergency fund", "Vehicle purchase", "Education", "Vacation",
    "Home purchase", "Retirement", "Investment", "Other"
}

GOAL_STATUSES = {"IN_PROGRESS", "COMPLETED", "EXPIRED"}

class SavingsGoalBase(BaseModel):
    goal_name: str = Field(..., min_length=1, max_length=150)
    goal_type: str = Field(...)
    target_amount: Decimal = Field(..., gt=0, decimal_places=2)
    saved_amount: Decimal = Field(default=0.00, ge=0, decimal_places=2)
    start_date: date
    target_date: date

    @field_validator("goal_type")
    @classmethod
    def validate_goal_type(cls, v: str) -> str:
        if v not in GOAL_TYPES:
            raise ValueError(f"Goal type must be one of {list(GOAL_TYPES)}")
        return v

    @model_validator(mode="after")
    def validate_dates(self) -> "SavingsGoalBase":
        if self.target_date <= self.start_date:
            raise ValueError("Target date must be after the start date")
        # Target date must be in the future (greater than current date)
        if self.target_date <= date.today():
            raise ValueError("Target date must be in the future")
        return self

class SavingsGoalCreate(SavingsGoalBase):
    pass

class SavingsGoalUpdate(BaseModel):
    goal_name: Optional[str] = Field(None, min_length=1, max_length=150)
    goal_type: Optional[str] = Field(None)
    target_amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    saved_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    start_date: Optional[date] = Field(None)
    target_date: Optional[date] = Field(None)
    status: Optional[str] = Field(None)

    @field_validator("goal_type")
    @classmethod
    def validate_goal_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in GOAL_TYPES:
            raise ValueError(f"Goal type must be one of {list(GOAL_TYPES)}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in GOAL_STATUSES:
            raise ValueError(f"Status must be one of {list(GOAL_STATUSES)}")
        return v

    @model_validator(mode="after")
    def validate_dates_update(self) -> "SavingsGoalUpdate":
        if self.start_date and self.target_date and self.target_date <= self.start_date:
            raise ValueError("Target date must be after the start date")
        if self.target_date and self.target_date <= date.today():
            raise ValueError("Target date must be in the future")
        return self

class SavingsGoalResponse(SavingsGoalBase):
    goal_id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SavingsGoalPaginatedResponse(BaseModel):
    items: List[SavingsGoalResponse]
    total_count: int
    page: int
    size: int
    pages: int
