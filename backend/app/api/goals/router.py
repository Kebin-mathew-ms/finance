from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database.connection import get_db
from app.models.user import User
from app.schemas.savings_goal import SavingsGoalCreate, SavingsGoalUpdate, SavingsGoalResponse, SavingsGoalPaginatedResponse
from app.services.auth_service import get_current_user
from app.services.savings_goal_service import SavingsGoalService

router = APIRouter()

@router.post("", response_model=SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    data: SavingsGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new savings goal target."""
    goal_service = SavingsGoalService(db)
    return goal_service.create_goal(current_user.user_id, data)

@router.get("", response_model=SavingsGoalPaginatedResponse)
def list_goals(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List goals for current user (paginated and filtered)."""
    goal_service = SavingsGoalService(db)
    return goal_service.get_goals(
        user_id=current_user.user_id,
        page=page,
        size=size,
        status=status
    )

@router.get("/{id}", response_model=SavingsGoalResponse)
def get_goal(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch single goal details."""
    goal_service = SavingsGoalService(db)
    return goal_service.get_goal_by_id(id, current_user.user_id)

@router.put("/{id}", response_model=SavingsGoalResponse)
def update_goal(
    id: int,
    data: SavingsGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update goal settings and modify saved amount totals."""
    goal_service = SavingsGoalService(db)
    return goal_service.update_goal(id, current_user.user_id, data)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a goal target."""
    goal_service = SavingsGoalService(db)
    goal_service.delete_goal(id, current_user.user_id)
    return None
