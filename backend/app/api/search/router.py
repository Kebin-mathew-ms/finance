from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from decimal import Decimal
from typing import Optional, Dict, List, Any
from app.database.connection import get_db
from app.models.user import User
from app.services.auth_service import get_current_user
from app.search.search_service import SearchService

router = APIRouter()

@router.get("")
def global_search(
    keyword: Optional[str] = Query(None, description="Keywords to match titles or descriptions"),
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    minimum_amount: Optional[Decimal] = Query(None, description="Minimum amount limit"),
    maximum_amount: Optional[Decimal] = Query(None, description="Maximum amount limit"),
    category: Optional[str] = Query(None, description="Module specific category to filter"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Global search across incomes, expenses, savings targets, reminders, and receipts."""
    search_service = SearchService(db)
    raw_results = search_service.global_search(
        user_id=current_user.user_id,
        keyword=keyword,
        start_date=start_date,
        end_date=end_date,
        minimum_amount=minimum_amount,
        maximum_amount=maximum_amount,
        category=category
    )
    
    # Format and serialize SQLAlchemy models to dictionary objects to prevent circular JSON references
    return {
        "incomes": [
            {
                "income_id": inc.income_id,
                "title": inc.title,
                "category": inc.category,
                "amount": float(inc.amount),
                "income_date": inc.income_date,
                "description": inc.description
            } for inc in raw_results["incomes"]
        ],
        "expenses": [
            {
                "expense_id": exp.expense_id,
                "title": exp.title,
                "category": exp.category,
                "amount": float(exp.amount),
                "expense_date": exp.expense_date,
                "description": exp.description
            } for exp in raw_results["expenses"]
        ],
        "savings_goals": [
            {
                "goal_id": sg.goal_id,
                "goal_name": sg.goal_name,
                "goal_type": sg.goal_type,
                "target_amount": float(sg.target_amount),
                "saved_amount": float(sg.saved_amount),
                "target_date": sg.target_date,
                "status": sg.status
            } for sg in raw_results["savings_goals"]
        ],
        "reminders": [
            {
                "reminder_id": rem.reminder_id,
                "title": rem.title,
                "reminder_type": rem.reminder_type,
                "amount": float(rem.amount),
                "due_date": rem.due_date,
                "repeat_interval": rem.repeat_interval,
                "is_completed": rem.is_completed
            } for rem in raw_results["reminders"]
        ],
        "receipts": [
            {
                "receipt_id": rc.receipt_id,
                "merchant_name": rc.merchant_name,
                "transaction_date": rc.transaction_date,
                "total_amount": float(rc.total_amount) if rc.total_amount else 0.0,
                "confidence_score": float(rc.confidence_score),
                "image_path": rc.image_path
            } for rc in raw_results["receipts"]
        ]
    }
