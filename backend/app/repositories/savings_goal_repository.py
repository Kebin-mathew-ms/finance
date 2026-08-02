from sqlalchemy.orm import Session
from typing import Optional, List, Tuple
from app.models.savings_goal import SavingsGoal
from app.repositories.base import BaseRepository

class SavingsGoalRepository(BaseRepository):
    def get_by_id(self, goal_id: int, user_id: int) -> Optional[SavingsGoal]:
        return self.db.query(SavingsGoal).filter(
            SavingsGoal.goal_id == goal_id,
            SavingsGoal.user_id == user_id
        ).first()

    def get_all_paginated(
        self,
        user_id: int,
        page: int = 1,
        size: int = 10,
        status: Optional[str] = None
    ) -> Tuple[List[SavingsGoal], int]:
        query = self.db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id)
        
        if status:
            query = query.filter(SavingsGoal.status == status)
            
        total_count = query.count()
        items = query.order_by(SavingsGoal.target_date.asc()) \
                     .offset((page - 1) * size) \
                     .limit(size) \
                     .all()
                     
        return items, total_count

    def get_all_active(self, user_id: int) -> List[SavingsGoal]:
        return self.db.query(SavingsGoal).filter(
            SavingsGoal.user_id == user_id,
            SavingsGoal.status == "IN_PROGRESS"
        ).all()

    def get_all_by_status(self, status: str) -> List[SavingsGoal]:
        """Gets all savings goals across ALL users with a specific status (used by background jobs)."""
        return self.db.query(SavingsGoal).filter(SavingsGoal.status == status).all()

    def create(self, goal: SavingsGoal) -> SavingsGoal:
        self.db.add(goal)
        self.db.commit()
        self.db.refresh(goal)
        return goal

    def update(self, goal: SavingsGoal) -> SavingsGoal:
        self.db.commit()
        self.db.refresh(goal)
        return goal

    def delete(self, goal: SavingsGoal) -> None:
        self.db.delete(goal)
        self.db.commit()
