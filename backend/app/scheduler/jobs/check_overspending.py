from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from datetime import date
from app.models.budget import Budget
from app.models.expense import Expense
from app.services.notification_service import NotificationService

def check_overspending_job(db: Session) -> None:
    """Checks all active budgets and marks them as EXCEEDED if actual spending exceeds limits."""
    notification_service = NotificationService(db)
    
    # Get all active budgets
    active_budgets = db.query(Budget).filter(Budget.status == "ACTIVE").all()
    
    for budget in active_budgets:
        # Sum actual expenses for user/category/month/year
        expenses_sum = db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == budget.user_id,
            Expense.category == budget.category,
            func.extract('year', Expense.expense_date) == budget.year,
            func.extract('month', Expense.expense_date) == budget.month
        ).scalar() or Decimal("0.00")
        
        remaining = budget.amount_limit - Decimal(expenses_sum)
        budget.remaining_amount = remaining
        
        if remaining < 0:
            budget.status = "EXCEEDED"
            db.commit()
            
            # Send Warning Notification
            notification_service.create_notification(
                user_id=budget.user_id,
                title="Budget Limit Exceeded!",
                message=f"Warning: Your spending on category '{budget.category}' (${expenses_sum}) has exceeded your budget limit of ${budget.amount_limit}.",
                notification_type="WARNING"
            )
        else:
            db.commit()
