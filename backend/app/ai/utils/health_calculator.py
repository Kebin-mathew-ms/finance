from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from decimal import Decimal
import numpy as np
from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.reminder import Reminder
from app.models.health_score import FinancialHealthScore

class FinancialHealthCalculator:
    def __init__(self, db: Session):
        self.db = db

    def calculate_score(self, user_id: int) -> tuple[int, str]:
        """Calculates a user's Financial Health Score (0-100) based on multiple metrics."""
        today = date.today()
        start_of_month = today.replace(day=1)
        thirty_days_ago = today - timedelta(days=30)

        # 1. Calculate Savings Score (0-30 pts)
        # Get total income in the last 30 days
        total_income = self.db.query(func.sum(Income.amount)).filter(
            Income.user_id == user_id,
            Income.income_date >= thirty_days_ago
        ).scalar() or Decimal("0.00")

        # Get total expense in the last 30 days
        total_expense = self.db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= thirty_days_ago
        ).scalar() or Decimal("0.00")

        if total_income > 0:
            savings_rate = float((total_income - total_expense) / total_income)
            savings_score = max(0, min(30, int(savings_rate * 30)))
        else:
            savings_score = 0 if total_expense > 0 else 15  # default if no transactions

        # 2. Calculate Budget Score (0-30 pts)
        budgets = self.db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.year == today.year,
            Budget.month == today.month
        ).all()

        if not budgets:
            budget_score = 15  # Neutral default
        else:
            budget_scores = []
            for b in budgets:
                limit = float(b.amount_limit)
                remaining = float(b.remaining_amount)
                spent = limit - remaining
                if limit > 0:
                    util_rate = spent / limit
                    if util_rate <= 0.8:
                        # Optimal savings range
                        score = 30
                    elif util_rate <= 1.0:
                        # Good, within limits
                        score = 20
                    else:
                        # Overspent
                        score = max(0, int(30 - (util_rate - 1.0) * 30))
                else:
                    score = 0
                budget_scores.append(score)
            budget_score = int(np.mean(budget_scores))

        # 3. Calculate Debt / Overdue Reminder Score (0-20 pts)
        # Find active, unpaid reminders that are past their due date
        overdue_reminders_count = self.db.query(func.count(Reminder.reminder_id)).filter(
            Reminder.user_id == user_id,
            Reminder.is_completed == False,
            Reminder.due_date < today
        ).scalar() or 0

        debt_score = max(0, 20 - (overdue_reminders_count * 5))

        # 4. Calculate Expense Stability Score (0-20 pts)
        # Query monthly expense sum over the last 3 months
        monthly_exp_sums = []
        for i in range(3):
            d = today - timedelta(days=i*30)
            m_start = d.replace(day=1)
            next_m_start = (m_start + timedelta(days=32)).replace(day=1)
            sum_val = self.db.query(func.sum(Expense.amount)).filter(
                Expense.user_id == user_id,
                Expense.expense_date >= m_start,
                Expense.expense_date < next_m_start
            ).scalar() or Decimal("0.00")
            monthly_exp_sums.append(float(sum_val))

        if len(monthly_exp_sums) < 2 or np.mean(monthly_exp_sums) == 0:
            stability_score = 15
        else:
            std_dev = np.std(monthly_exp_sums)
            mean_val = np.mean(monthly_exp_sums)
            coefficient_of_variation = std_dev / mean_val
            stability_score = max(0, min(20, int(20 - (coefficient_of_variation * 20))))

        # Total Health Score
        health_score = savings_score + budget_score + debt_score + stability_score
        health_score = max(0, min(100, health_score))

        # Status Mapping
        if health_score <= 25:
            status = "CRITICAL"
        elif health_score <= 50:
            status = "POOR"
        elif health_score <= 75:
            status = "GOOD"
        else:
            status = "EXCELLENT"

        return health_score, status

    def update_user_health_score(self, user_id: int) -> FinancialHealthScore:
        """Saves or updates calculated financial health parameters to database."""
        score, status = self.calculate_score(user_id)
        
        record = self.db.query(FinancialHealthScore).filter(
            FinancialHealthScore.user_id == user_id
        ).first()

        if record:
            record.score = score
            record.status = status
        else:
            record = FinancialHealthScore(
                user_id=user_id,
                score=score,
                status=status
            )
            self.db.add(record)
            
        self.db.commit()
        self.db.refresh(record)
        return record
