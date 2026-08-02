from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.services.auth_service import get_current_user
from app.analytics.analytics_service import AnalyticsService

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch consolidated analytics stats for home dashboard widgets."""
    service = AnalyticsService(db)
    return service.get_dashboard_summary(current_user.user_id)

@router.get("/trends")
def get_cashflow_trends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve 6-month historical monthly trends (income, expenses, savings)."""
    service = AnalyticsService(db)
    return service.get_trends(current_user.user_id)

@router.get("/categories")
def get_categories_breakdown(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch percentage-wise category distribution breakdown for the current month."""
    service = AnalyticsService(db)
    return service.get_categories_breakdown(current_user.user_id)

@router.get("/cashflow")
def get_cashflow_details(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get relative metrics comparison of income vs expenses (reuses trends structure)."""
    service = AnalyticsService(db)
    return service.get_trends(current_user.user_id)

@router.get("/health-score")
def get_health_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Queries user financial health ratings and status parameters."""
    from app.ai.utils.health_calculator import FinancialHealthCalculator
    calc = FinancialHealthCalculator(db)
    score, status = calc.calculate_score(current_user.user_id)
    return {
        "score": score,
        "status": status
    }
