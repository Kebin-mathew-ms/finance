from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

BUDGET_CATEGORIES = {
    "Food", "Transportation", "Shopping", "Bills", "Healthcare",
    "Entertainment", "Education", "Insurance", "Investment", "Miscellaneous"
}

BUDGET_STATUSES = {"ACTIVE", "EXCEEDED", "COMPLETED"}

class BudgetBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    category: str = Field(...)
    amount_limit: Decimal = Field(..., ge=0, decimal_places=2)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2026, le=2100)

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in BUDGET_CATEGORIES:
            raise ValueError(f"Category must be one of {list(BUDGET_CATEGORIES)}")
        return v

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=150)
    category: Optional[str] = Field(None)
    amount_limit: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    month: Optional[int] = Field(None, ge=1, le=12)
    year: Optional[int] = Field(None, ge=2026, le=2100)
    status: Optional[str] = Field(None)

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in BUDGET_CATEGORIES:
            raise ValueError(f"Category must be one of {list(BUDGET_CATEGORIES)}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in BUDGET_STATUSES:
            raise ValueError(f"Status must be one of {list(BUDGET_STATUSES)}")
        return v

class BudgetResponse(BudgetBase):
    budget_id: int
    user_id: int
    remaining_amount: Decimal
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BudgetPaginatedResponse(BaseModel):
    items: List[BudgetResponse]
    total_count: int
    page: int
    size: int
    pages: int
