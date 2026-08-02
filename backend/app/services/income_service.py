from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional, List, Tuple
from datetime import date
from decimal import Decimal
from app.models.income import Income
from app.models.user import User
from app.schemas.income import IncomeCreate, IncomeUpdate, IncomePaginatedResponse, IncomeMonthlySummary, CategoryBreakdownItem
from app.repositories.income_repository import IncomeRepository

class IncomeService:
    def __init__(self, db: Session):
        self.income_repo = IncomeRepository(db)

    def create_income(self, user_id: int, data: IncomeCreate) -> Income:
        income = Income(
            user_id=user_id,
            title=data.title,
            category=data.category,
            amount=data.amount,
            description=data.description,
            income_date=data.income_date
        )
        return self.income_repo.create(income)

    def get_income_by_id(self, income_id: int, user_id: int) -> Income:
        income = self.income_repo.get_by_id(income_id, user_id)
        if not income:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Income record not found"
            )
        return income

    def get_incomes(
        self,
        user_id: int,
        page: int = 1,
        size: int = 10,
        category: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> IncomePaginatedResponse:
        items, total_count = self.income_repo.get_all_paginated(
            user_id=user_id,
            page=page,
            size=size,
            category=category,
            start_date=start_date,
            end_date=end_date
        )
        
        pages = (total_count + size - 1) // size if total_count > 0 else 1
        
        return IncomePaginatedResponse(
            items=items,
            total_count=total_count,
            page=page,
            size=size,
            pages=pages
        )

    def update_income(self, income_id: int, user_id: int, data: IncomeUpdate) -> Income:
        income = self.get_income_by_id(income_id, user_id)
        
        if data.title is not None:
            income.title = data.title
        if data.category is not None:
            income.category = data.category
        if data.amount is not None:
            income.amount = data.amount
        if data.description is not None:
            income.description = data.description
        if data.income_date is not None:
            income.income_date = data.income_date
            
        return self.income_repo.update(income)

    def delete_income(self, income_id: int, user_id: int) -> None:
        income = self.get_income_by_id(income_id, user_id)
        self.income_repo.delete(income)

    def get_monthly_summary(self, user_id: int, year: int, month: int) -> IncomeMonthlySummary:
        total_income, breakdown_list = self.income_repo.get_monthly_summary(user_id, year, month)
        
        breakdown = []
        for cat, amt in breakdown_list:
            pct = float((amt / total_income) * 100) if total_income > 0 else 0.0
            breakdown.append(
                CategoryBreakdownItem(
                    category=cat,
                    amount=amt,
                    percentage=round(pct, 2)
                )
            )
            
        # Format month as string YYYY-MM
        month_str = f"{year}-{month:02d}"
        
        return IncomeMonthlySummary(
            total_income=total_income,
            breakdown=breakdown,
            month=month_str
        )
