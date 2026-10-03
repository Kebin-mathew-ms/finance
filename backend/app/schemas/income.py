from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

INCOME_CATEGORIES = {
    "Salary",
    "Business",
    "Freelancing",
    "Investment",
    "Rental income",
    "Other income"
}

class IncomeBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    category: str = Field(...)
    amount: Decimal = Field(..., ge=0, decimal_places=2)
    description: Optional[str] = Field(None, max_length=255)
    income_date: date

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in INCOME_CATEGORIES:
            raise ValueError(f"Category must be one of {list(INCOME_CATEGORIES)}")
        return v

class IncomeCreate(IncomeBase):
    pass

class IncomeUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=150)
    category: Optional[str] = Field(None)
    amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    description: Optional[str] = Field(None, max_length=255)
    income_date: Optional[date] = Field(None)

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in INCOME_CATEGORIES:
            raise ValueError(f"Category must be one of {list(INCOME_CATEGORIES)}")
        return v

class IncomeResponse(IncomeBase):
    income_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class IncomePaginatedResponse(BaseModel):
    items: List[IncomeResponse]
    total_count: int
    page: int
    size: int
    pages: int

class CategoryBreakdownItem(BaseModel):
    category: str
    amount: Decimal
    percentage: float

class IncomeMonthlySummary(BaseModel):
    total_income: Decimal
    breakdown: List[CategoryBreakdownItem]
    month: str # YYYY-MM
