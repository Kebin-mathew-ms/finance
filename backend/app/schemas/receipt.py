from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

class ReceiptBase(BaseModel):
    merchant_name: Optional[str] = Field(None, max_length=150)
    transaction_date: Optional[date] = None
    total_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    tax_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    currency: str = Field(default="INR")
    confidence_score: Decimal = Field(default=0.00, ge=0, le=100, decimal_places=2)
    image_path: str = Field(..., max_length=255)

class ReceiptCreate(ReceiptBase):
    user_id: int
    expense_id: Optional[int] = None

class ReceiptResponse(ReceiptBase):
    receipt_id: int
    user_id: int
    expense_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReceiptPaginatedResponse(BaseModel):
    items: List[ReceiptResponse]
    total_count: int
    page: int
    size: int
    pages: int
