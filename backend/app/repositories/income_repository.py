from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List, Tuple
from datetime import date, datetime
from decimal import Decimal
from app.models.income import Income
from app.repositories.base import BaseRepository

class IncomeRepository(BaseRepository):
    def get_by_id(self, income_id: int, user_id: int) -> Optional[Income]:
        return self.db.query(Income).filter(
            Income.income_id == income_id, 
            Income.user_id == user_id
        ).first()

    def get_all_paginated(
        self,
        user_id: int,
        page: int = 1,
        size: int = 10,
        category: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Tuple[List[Income], int]:
        query = self.db.query(Income).filter(Income.user_id == user_id)
        
        if category:
            query = query.filter(Income.category == category)
        if start_date:
            query = query.filter(Income.income_date >= start_date)
        if end_date:
            query = query.filter(Income.income_date <= end_date)
            
        total_count = query.count()
        
        # Order by date descending
        items = query.order_by(Income.income_date.desc(), Income.created_at.desc()) \
                     .offset((page - 1) * size) \
                     .limit(size) \
                     .all()
                     
        return items, total_count

    def create(self, income: Income) -> Income:
        self.db.add(income)
        self.db.commit()
        self.db.refresh(income)
        return income

    def update(self, income: Income) -> Income:
        self.db.commit()
        self.db.refresh(income)
        return income

    def delete(self, income: Income) -> None:
        self.db.delete(income)
        self.db.commit()

    def get_monthly_summary(self, user_id: int, year: int, month: int) -> Tuple[Decimal, List[Tuple[str, Decimal]]]:
        """
        Returns the total income and breakdown list of (category, amount) for a specific month.
        """
        # MySQL EXTRACT or simple date filtering:
        query = self.db.query(
            Income.category,
            func.sum(Income.amount).label("category_total")
        ).filter(
            Income.user_id == user_id,
            func.extract('year', Income.income_date) == year,
            func.extract('month', Income.income_date) == month
        ).group_by(Income.category).all()

        breakdown = [(row[0], Decimal(row[1] or 0)) for row in query]
        total_income = sum(item[1] for item in breakdown)
        return Decimal(total_income), breakdown
