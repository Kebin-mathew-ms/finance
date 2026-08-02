from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, Any, List
import pandas as pd
import numpy as np

from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.savings_goal import SavingsGoal
from app.models.reminder import Reminder
from app.models.health_score import FinancialHealthScore

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_summary(self, user_id: int) -> Dict[str, Any]:
        """Calculates consolidated stats counters for home dashboard widgets."""
        today = date.today()
        start_of_month = today.replace(day=1)
        thirty_days_ago = today - timedelta(days=30)

        # 1. Total income (current month)
        m_income = self.db.query(func.sum(Income.amount)).filter(
            Income.user_id == user_id,
            Income.income_date >= start_of_month
        ).scalar() or Decimal("0.00")

        # 2. Total expenses (current month)
        m_expenses = self.db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= start_of_month
        ).scalar() or Decimal("0.00")

        # 3. Monthly savings (income - expenses)
        m_savings = max(Decimal("0.00"), m_income - m_expenses)

        # 4. Budget utilization percentage
        budgets = self.db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.year == today.year,
            Budget.month == today.month
        ).all()
        
        tot_limit = sum(float(b.amount_limit) for b in budgets)
        tot_rem = sum(float(b.remaining_amount) for b in budgets)
        tot_spent = tot_limit - tot_rem
        bud_util = (tot_spent / tot_limit * 100) if tot_limit > 0 else 0.0

        # 5. Goal completion rate (average progress percentage across active goals)
        goals = self.db.query(SavingsGoal).filter(
            SavingsGoal.user_id == user_id,
            SavingsGoal.status == "ACTIVE"
        ).all()
        completion_rates = []
        for g in goals:
            target = float(g.target_amount)
            saved = float(g.saved_amount)
            rate = (saved / target * 100) if target > 0 else 100.0
            completion_rates.append(rate)
        avg_completion = np.mean(completion_rates) if completion_rates else 0.0

        # 6. Active unpaid reminders count
        reminders_count = self.db.query(func.count(Reminder.reminder_id)).filter(
            Reminder.user_id == user_id,
            Reminder.is_completed == False,
            Reminder.due_date >= today
        ).scalar() or 0

        # 7. Predicted monthly expenditure (for next month, sum of category predictions)
        # Import predictor on the fly to avoid circular issues
        from app.ai.predictors.expense_predictor import ExpensePredictor
        from app.ai.trainers.expense_trainer import CATEGORIES
        predictor = ExpensePredictor(self.db)
        predicted_exp = 0.0
        for cat in CATEGORIES:
            res = predictor.predict_next_month_expense(user_id, cat)
            predicted_exp += res["predicted_amount"]

        # 8. Financial Health Score
        health_record = self.db.query(FinancialHealthScore).filter(
            FinancialHealthScore.user_id == user_id
        ).first()
        health_score = health_record.score if health_record else 70 # Default clean score

        return {
            "total_income": float(m_income),
            "total_expenses": float(m_expenses),
            "monthly_savings": float(m_savings),
            "budget_utilization": round(bud_util, 1),
            "goal_completion_rate": round(avg_completion, 1),
            "active_reminders": reminders_count,
            "predicted_monthly_expenditure": round(predicted_exp, 2),
            "financial_health_score": health_score
        }

    def get_trends(self, user_id: int) -> List[Dict[str, Any]]:
        """Assembles historical cashflow trend points over past 6 months."""
        today = date.today()
        trends = []
        for i in range(5, -1, -1):
            d = today - timedelta(days=i*30)
            m_start = d.replace(day=1)
            next_m_start = (m_start + timedelta(days=32)).replace(day=1)

            inc_sum = self.db.query(func.sum(Income.amount)).filter(
                Income.user_id == user_id,
                Income.income_date >= m_start,
                Income.income_date < next_m_start
            ).scalar() or Decimal("0.00")

            exp_sum = self.db.query(func.sum(Expense.amount)).filter(
                Expense.user_id == user_id,
                Expense.expense_date >= m_start,
                Expense.expense_date < next_m_start
            ).scalar() or Decimal("0.00")

            trends.append({
                "period": m_start.strftime("%b %Y"),
                "income": float(inc_sum),
                "expenses": float(exp_sum),
                "savings": float(max(Decimal("0.00"), inc_sum - exp_sum))
            })
        return trends

    def get_categories_breakdown(self, user_id: int) -> List[Dict[str, Any]]:
        """Computes categories aggregate distribution percentages for the current month."""
        today = date.today()
        start_of_month = today.replace(day=1)

        breakdown = self.db.query(
            Expense.category,
            func.sum(Expense.amount).label('total')
        ).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= start_of_month
        ).group_by(Expense.category).all()

        total_sum = sum(float(b.total) for b in breakdown)
        
        results = []
        for b in breakdown:
            val = float(b.total)
            results.append({
                "category": b.category,
                "amount": val,
                "percentage": round((val / total_sum * 100), 1) if total_sum > 0 else 0.0
            })
        return results

    def get_metrics(self, user_id: int) -> Dict[str, Any]:
        """Calculates advanced analytical financial metrics."""
        today = date.today()
        start_of_month = today.replace(day=1)
        thirty_days_ago = today - timedelta(days=30)

        # Average monthly spending (last 3 months)
        monthly_exp = []
        for i in range(3):
            d = today - timedelta(days=i*30)
            m_start = d.replace(day=1)
            next_m_start = (m_start + timedelta(days=32)).replace(day=1)
            sum_val = self.db.query(func.sum(Expense.amount)).filter(
                Expense.user_id == user_id,
                Expense.expense_date >= m_start,
                Expense.expense_date < next_m_start
            ).scalar() or Decimal("0.00")
            monthly_exp.append(float(sum_val))
        avg_monthly_spending = np.mean(monthly_exp) if monthly_exp else 0.0

        # Average savings rate
        inc_sum = self.db.query(func.sum(Income.amount)).filter(
            Income.user_id == user_id,
            Income.income_date >= thirty_days_ago
        ).scalar() or Decimal("0.00")
        exp_sum = self.db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= thirty_days_ago
        ).scalar() or Decimal("0.00")
        
        avg_savings_rate = float((inc_sum - exp_sum) / inc_sum * 100) if inc_sum > 0 else 0.0

        # Average daily expense (last 30 days)
        avg_daily = float(exp_sum) / 30.0

        # Most expensive category
        most_exp = self.db.query(
            Expense.category,
            func.sum(Expense.amount).label('total')
        ).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= start_of_month
        ).group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).first()

        most_expensive_cat = most_exp[0] if most_exp else "None"

        # Highest monthly expense / income
        highest_exp = self.db.query(func.max(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= start_of_month
        ).scalar() or Decimal("0.00")

        highest_inc = self.db.query(func.max(Income.amount)).filter(
            Income.user_id == user_id,
            Income.income_date >= start_of_month
        ).scalar() or Decimal("0.00")

        return {
            "average_monthly_spending": round(avg_monthly_spending, 2),
            "average_savings_rate": round(avg_savings_rate, 1),
            "average_daily_expense": round(avg_daily, 2),
            "most_expensive_category": most_expensive_cat,
            "highest_monthly_expense": float(highest_exp),
            "highest_monthly_income": float(highest_inc)
        }
