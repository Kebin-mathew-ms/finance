from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database.connection import get_db
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetPaginatedResponse
from app.services.auth_service import get_current_user
from app.services.budget_service import BudgetService

router = APIRouter()

@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new monthly budget stream."""
    budget_service = BudgetService(db)
    return budget_service.create_budget(current_user.user_id, data)

@router.get("", response_model=BudgetPaginatedResponse)
def list_budgets(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List budgets for current user (paginated and filtered)."""
    budget_service = BudgetService(db)
    return budget_service.get_budgets(
        user_id=current_user.user_id,
        page=page,
        size=size,
        year=year,
        month=month
    )

@router.get("/{id}", response_model=BudgetResponse)
def get_budget(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch single budget details."""
    budget_service = BudgetService(db)
    return budget_service.get_budget_by_id(id, current_user.user_id)

@router.put("/{id}", response_model=BudgetResponse)
def update_budget(
    id: int,
    data: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update details of a budget stream."""
    budget_service = BudgetService(db)
    return budget_service.update_budget(id, current_user.user_id, data)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a budget stream."""
    budget_service = BudgetService(db)
    budget_service.delete_budget(id, current_user.user_id)
    return None
