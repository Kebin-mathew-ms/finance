from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import Optional, List, Tuple
from decimal import Decimal
from datetime import date
from app.models.budget import Budget
from app.models.expense import Expense
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetPaginatedResponse
from app.repositories.budget_repository import BudgetRepository

class BudgetService:
    def __init__(self, db: Session):
        self.db = db
        self.budget_repo = BudgetRepository(db)

    def _calculate_remaining(self, user_id: int, category: str, amount_limit: Decimal, month: int, year: int) -> Tuple[Decimal, str]:
        """Calculates remaining budget by summing expenses in category for the given month/year."""
        # Query total expenses in this category/month/year
        expenses_sum = self.db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.category == category,
            func.extract('year', Expense.expense_date) == year,
            func.extract('month', Expense.expense_date) == month
        ).scalar() or Decimal("0.00")
        
        remaining = amount_limit - Decimal(expenses_sum)
        status_val = "ACTIVE"
        if remaining < 0:
            status_val = "EXCEEDED"
            
        return remaining, status_val

    def create_budget(self, user_id: int, data: BudgetCreate) -> Budget:
        # Check duplicate monthly budgets
        existing = self.budget_repo.get_by_category_period(user_id, data.category, data.month, data.year)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A budget for category '{data.category}' already exists in {data.year}-{data.month:02d}."
            )

        remaining, status_val = self._calculate_remaining(
            user_id, data.category, data.amount_limit, data.month, data.year
        )

        budget = Budget(
            user_id=user_id,
            title=data.title,
            category=data.category,
            amount_limit=data.amount_limit,
            remaining_amount=remaining,
            month=data.month,
            year=data.year,
            status=status_val
        )
        return self.budget_repo.create(budget)

    def get_budget_by_id(self, budget_id: int, user_id: int) -> Budget:
        budget = self.budget_repo.get_by_id(budget_id, user_id)
        if not budget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget record not found"
            )
        return budget

    def get_budgets(
        self,
        user_id: int,
        page: int = 1,
        size: int = 10,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> BudgetPaginatedResponse:
        items, total_count = self.budget_repo.get_all_paginated(user_id, page, size, year, month)
        pages = (total_count + size - 1) // size if total_count > 0 else 1
        
        # Proactively refresh remaining amounts to stay in sync with database expenses
        for budget in items:
            rem, stat = self._calculate_remaining(
                user_id, budget.category, budget.amount_limit, budget.month, budget.year
            )
            budget.remaining_amount = rem
            budget.status = stat
            self.budget_repo.update(budget)

        return BudgetPaginatedResponse(
            items=items,
            total_count=total_count,
            page=page,
            size=size,
            pages=pages
        )

    def update_budget(self, budget_id: int, user_id: int, data: BudgetUpdate) -> Budget:
        budget = self.get_budget_by_id(budget_id, user_id)

        # Check unique constraint if category/period is changing
        new_cat = data.category if data.category is not None else budget.category
        new_month = data.month if data.month is not None else budget.month
        new_year = data.year if data.year is not None else budget.year

        if (new_cat != budget.category or new_month != budget.month or new_year != budget.year):
            existing = self.budget_repo.get_by_category_period(user_id, new_cat, new_month, new_year)
            if existing and existing.budget_id != budget_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A budget for this category and period already exists."
                )

        if data.title is not None:
            budget.title = data.title
        if data.category is not None:
            budget.category = data.category
        if data.amount_limit is not None:
            budget.amount_limit = data.amount_limit
        if data.month is not None:
            budget.month = data.month
        if data.year is not None:
            budget.year = data.year

        # Recalculate remaining limits
        rem, stat = self._calculate_remaining(
            user_id, budget.category, budget.amount_limit, budget.month, budget.year
        )
        budget.remaining_amount = rem
        budget.status = stat

        if data.status is not None:
            budget.status = data.status

        return self.budget_repo.update(budget)

    def delete_budget(self, budget_id: int, user_id: int) -> None:
        budget = self.get_budget_by_id(budget_id, user_id)
        self.budget_repo.delete(budget)
