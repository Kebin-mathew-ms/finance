from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, List, Tuple
from app.models.budget import Budget
from app.repositories.base import BaseRepository

class BudgetRepository(BaseRepository):
    def get_by_id(self, budget_id: int, user_id: int) -> Optional[Budget]:
        return self.db.query(Budget).filter(
            Budget.budget_id == budget_id,
            Budget.user_id == user_id
        ).first()

    def get_by_category_period(self, user_id: int, category: str, month: int, year: int) -> Optional[Budget]:
        return self.db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.category == category,
            Budget.month == month,
            Budget.year == year
        ).first()

    def get_all_paginated(
        self,
        user_id: int,
        page: int = 1,
        size: int = 10,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> Tuple[List[Budget], int]:
        query = self.db.query(Budget).filter(Budget.user_id == user_id)
        
        if year:
            query = query.filter(Budget.year == year)
        if month:
            query = query.filter(Budget.month == month)
            
        total_count = query.count()
        items = query.order_by(Budget.year.desc(), Budget.month.desc()) \
                     .offset((page - 1) * size) \
                     .limit(size) \
                     .all()
                     
        return items, total_count

    def get_all_active_by_period(self, user_id: int, month: int, year: int) -> List[Budget]:
        return self.db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.month == month,
            Budget.year == year
        ).all()

    def create(self, budget: Budget) -> Budget:
        self.db.add(budget)
        self.db.commit()
        self.db.refresh(budget)
        return budget

    def update(self, budget: Budget) -> Budget:
        self.db.commit()
        self.db.refresh(budget)
        return budget

    def delete(self, budget: Budget) -> None:
        self.db.delete(budget)
        self.db.commit()
