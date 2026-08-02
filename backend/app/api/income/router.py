from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.database.connection import get_db
from app.models.user import User
from app.schemas.income import IncomeCreate, IncomeUpdate, IncomeResponse, IncomePaginatedResponse, IncomeMonthlySummary
from app.services.auth_service import get_current_user
from app.services.income_service import IncomeService

router = APIRouter()

@router.post("", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
def create_income(
    data: IncomeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new income record."""
    income_service = IncomeService(db)
    return income_service.create_income(current_user.user_id, data)

@router.get("", response_model=IncomePaginatedResponse)
def list_incomes(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    category: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List incomes for current user (paginated and filtered)."""
    income_service = IncomeService(db)
    return income_service.get_incomes(
        user_id=current_user.user_id,
        page=page,
        size=size,
        category=category,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/summary", response_model=IncomeMonthlySummary)
def get_income_summary(
    year: int = Query(...),
    month: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get monthly total and category breakdown summary for income."""
    income_service = IncomeService(db)
    return income_service.get_monthly_summary(current_user.user_id, year, month)

@router.get("/{id}", response_model=IncomeResponse)
def get_income(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch single income record."""
    income_service = IncomeService(db)
    return income_service.get_income_by_id(id, current_user.user_id)

@router.put("/{id}", response_model=IncomeResponse)
def update_income(
    id: int,
    data: IncomeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing income record."""
    income_service = IncomeService(db)
    return income_service.update_income(id, current_user.user_id, data)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an income record."""
    income_service = IncomeService(db)
    income_service.delete_income(id, current_user.user_id)
    return None
