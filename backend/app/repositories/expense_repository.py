from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List, Tuple
from datetime import date, datetime
from decimal import Decimal
from app.models.expense import Expense
from app.repositories.base import BaseRepository

class ExpenseRepository(BaseRepository):
    def get_by_id(self, expense_id: int, user_id: int) -> Optional[Expense]:
        return self.db.query(Expense).filter(
            Expense.expense_id == expense_id,
            Expense.user_id == user_id
        ).first()

    def get_all_paginated(
        self,
        user_id: int,
        page: int = 1,
        size: int = 10,
        category: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        search_query: Optional[str] = None
    ) -> Tuple[List[Expense], int]:
        query = self.db.query(Expense).filter(Expense.user_id == user_id)

        if category:
            query = query.filter(Expense.category == category)
        if start_date:
            query = query.filter(Expense.expense_date >= start_date)
        if end_date:
            query = query.filter(Expense.expense_date <= end_date)
        if search_query:
            search_pattern = f"%{search_query}%"
            query = query.filter(
                or_(
                    Expense.title.like(search_pattern),
                    Expense.description.like(search_pattern)
                )
            )

        total_count = query.count()

        # Order by date descending
        items = query.order_by(Expense.expense_date.desc(), Expense.created_at.desc()) \
                     .offset((page - 1) * size) \
                     .limit(size) \
                     .all()

        return items, total_count

    def create(self, expense: Expense) -> Expense:
        self.db.add(expense)
        self.db.commit()
        self.db.refresh(expense)
        return expense

    def update(self, expense: Expense) -> Expense:
        self.db.commit()
        self.db.refresh(expense)
        return expense

    def delete(self, expense: Expense) -> None:
        self.db.delete(expense)
        self.db.commit()

    def get_monthly_summary(self, user_id: int, year: int, month: int) -> Tuple[Decimal, List[Tuple[str, Decimal]]]:
        """
        Returns the total expense and breakdown list of (category, amount) for a specific month.
        """
        query = self.db.query(
            Expense.category,
            func.sum(Expense.amount).label("category_total")
        ).filter(
            Expense.user_id == user_id,
            func.extract('year', Expense.expense_date) == year,
            func.extract('month', Expense.expense_date) == month
        ).group_by(Expense.category).all()

        breakdown = [(row[0], Decimal(row[1] or 0)) for row in query]
        total_expense = sum(item[1] for item in breakdown)
        return Decimal(total_expense), breakdown
