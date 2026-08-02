from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional, List
from decimal import Decimal
from app.models.savings_goal import SavingsGoal
from app.schemas.savings_goal import SavingsGoalCreate, SavingsGoalUpdate, SavingsGoalPaginatedResponse
from app.repositories.savings_goal_repository import SavingsGoalRepository
from app.services.notification_service import NotificationService

class SavingsGoalService:
    def __init__(self, db: Session):
        self.db = db
        self.goal_repo = SavingsGoalRepository(db)
        self.notification_service = NotificationService(db)

    def create_goal(self, user_id: int, data: SavingsGoalCreate) -> SavingsGoal:
        status_val = "IN_PROGRESS"
        if data.saved_amount >= data.target_amount:
            status_val = "COMPLETED"

        goal = SavingsGoal(
            user_id=user_id,
            goal_name=data.goal_name,
            goal_type=data.goal_type,
            target_amount=data.target_amount,
            saved_amount=data.saved_amount,
            start_date=data.start_date,
            target_date=data.target_date,
            status=status_val
        )
        saved_goal = self.goal_repo.create(goal)

        # Trigger notification if created as completed
        if status_val == "COMPLETED":
            self.notification_service.create_notification(
                user_id=user_id,
                title="Savings Goal Completed!",
                message=f"Congratulations! You have reached your savings goal target of ${goal.target_amount} for '{goal.goal_name}'.",
                notification_type="SUCCESS"
            )

        return saved_goal

    def get_goal_by_id(self, goal_id: int, user_id: int) -> SavingsGoal:
        goal = self.goal_repo.get_by_id(goal_id, user_id)
        if not goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Savings goal not found"
            )
        return goal

    def get_goals(
        self,
        user_id: int,
        page: int = 1,
        size: int = 10,
        status: Optional[str] = None
    ) -> SavingsGoalPaginatedResponse:
        items, total_count = self.goal_repo.get_all_paginated(user_id, page, size, status)
        pages = (total_count + size - 1) // size if total_count > 0 else 1

        return SavingsGoalPaginatedResponse(
            items=items,
            total_count=total_count,
            page=page,
            size=size,
            pages=pages
        )

    def update_goal(self, goal_id: int, user_id: int, data: SavingsGoalUpdate) -> SavingsGoal:
        goal = self.get_goal_by_id(goal_id, user_id)
        old_status = goal.status

        if data.goal_name is not None:
            goal.goal_name = data.goal_name
        if data.goal_type is not None:
            goal.goal_type = data.goal_type
        if data.target_amount is not None:
            goal.target_amount = data.target_amount
        if data.saved_amount is not None:
            goal.saved_amount = data.saved_amount
        if data.start_date is not None:
            goal.start_date = data.start_date
        if data.target_date is not None:
            goal.target_date = data.target_date
        if data.status is not None:
            goal.status = data.status

        # Auto check completion status
        if goal.saved_amount >= goal.target_amount:
            goal.status = "COMPLETED"
        else:
            # If targets were reduced/saved amount reduced and status was completed, switch back
            if goal.status == "COMPLETED" and goal.saved_amount < goal.target_amount:
                goal.status = "IN_PROGRESS"

        updated_goal = self.goal_repo.update(goal)

        # Trigger completed success message if transition occurred
        if old_status != "COMPLETED" and updated_goal.status == "COMPLETED":
            self.notification_service.create_notification(
                user_id=user_id,
                title="Savings Goal Achieved!",
                message=f"Congratulations! You have reached your savings goal target of ${updated_goal.target_amount} for '{updated_goal.goal_name}'.",
                notification_type="SUCCESS"
            )

        return updated_goal

    def delete_goal(self, goal_id: int, user_id: int) -> None:
        goal = self.get_goal_by_id(goal_id, user_id)
        self.goal_repo.delete(goal)
