from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

EXPENSE_CATEGORIES = {
    "Food",
    "Bills",
    "Transportation",
    "Entertainment",
    "Healthcare",
    "Shopping",
    "Education",
    "Insurance",
    "Investment",
    "Other"
}

class ExpenseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    category: str = Field(...)
    amount: Decimal = Field(..., ge=0, decimal_places=2)
    description: Optional[str] = Field(None, max_length=255)
    expense_date: date

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in EXPENSE_CATEGORIES:
            raise ValueError(f"Category must be one of {list(EXPENSE_CATEGORIES)}")
        return v

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=150)
    category: Optional[str] = Field(None)
    amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    description: Optional[str] = Field(None, max_length=255)
    expense_date: Optional[date] = Field(None)

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in EXPENSE_CATEGORIES:
            raise ValueError(f"Category must be one of {list(EXPENSE_CATEGORIES)}")
        return v

class ExpenseResponse(ExpenseBase):
    expense_id: int
    user_id: int
    receipt_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ExpensePaginatedResponse(BaseModel):
    items: List[ExpenseResponse]
    total_count: int
    page: int
    size: int
    pages: int

class ExpenseCategoryBreakdownItem(BaseModel):
    category: str
    amount: Decimal
    percentage: float

class ExpenseMonthlySummary(BaseModel):
    total_expense: Decimal
    breakdown: List[ExpenseCategoryBreakdownItem]
    month: str # YYYY-MM
