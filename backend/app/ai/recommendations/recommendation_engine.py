from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from decimal import Decimal
from typing import List
from app.models.expense import Expense
from app.models.income import Income
from app.models.budget import Budget
from app.models.recommendation import Recommendation

SUBSCRIPTION_KEYWORDS = ["netflix", "spotify", "youtube", "premium", "gym", "membership", "subscribe", "renew", "apple", "cloud", "aws", "github"]

class RecommendationEngine:
    def __init__(self, db: Session):
        self.db = db

    def generate_user_recommendations(self, user_id: int):
        """Analyzes spending trends and outputs prioritized financial optimization items."""
        today = date.today()
        thirty_days_ago = today - timedelta(days=30)
        sixty_days_ago = today - timedelta(days=60)

        # Helper to check and insert unique recommendations to prevent spamming
        def save_recommendation(title: str, desc: str, priority: str):
            exists = self.db.query(Recommendation).filter(
                Recommendation.user_id == user_id,
                Recommendation.title == title
            ).first()
            if not exists:
                rec = Recommendation(
                    user_id=user_id,
                    title=title,
                    description=desc,
                    priority=priority
                )
                self.db.add(rec)

        # 1. Savings Rate Analysis
        total_inc = self.db.query(func.sum(Income.amount)).filter(
            Income.user_id == user_id,
            Income.income_date >= thirty_days_ago
        ).scalar() or Decimal("0.00")

        total_exp = self.db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= thirty_days_ago
        ).scalar() or Decimal("0.00")

        if total_inc > 0:
            savings_rate = float((total_inc - total_exp) / total_inc)
            if savings_rate < 0.10:
                save_recommendation(
                    "Low Savings Rate Alert",
                    f"Your current savings rate is {(savings_rate * 100):.1f}%, which is below the recommended 15% threshold. Consider cutting secondary category expenses.",
                    "HIGH"
                )
            elif savings_rate > 0.30:
                save_recommendation(
                    "High Cash Surplus Allocation",
                    "You saved over 30% of your income this month! Consider putting your idle surplus cash to work in index funds or high-yield savings plans.",
                    "MEDIUM"
                )

        # 2. Subscription & Recurring Payment Detection
        expenses = self.db.query(Expense).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= thirty_days_ago
        ).all()

        for exp in expenses:
            desc_lower = (exp.title or "").lower()
            # Sniff description tags
            is_sub = any(kw in desc_lower for kw in SUBSCRIPTION_KEYWORDS)
            
            # Or identify exact recurring descriptions
            recurring_count = self.db.query(func.count(Expense.expense_id)).filter(
                Expense.user_id == user_id,
                Expense.title == exp.title,
                Expense.amount == exp.amount
            ).scalar() or 0

            if is_sub or recurring_count >= 2:
                save_recommendation(
                    f"Recurring Payment: {exp.title}",
                    f"We identified a recurring membership charge of {exp.amount} for '{exp.title}'. Verify if this subscription is still active and necessary.",
                    "LOW"
                )

        # 3. Category Spending Spike Analysis (Current Month vs Previous Month)
        categories = self.db.query(Expense.category).filter(
            Expense.user_id == user_id
        ).distinct().all()

        for (cat,) in categories:
            # Month 1 Sum
            curr_sum = self.db.query(func.sum(Expense.amount)).filter(
                Expense.user_id == user_id,
                Expense.category == cat,
                Expense.expense_date >= thirty_days_ago
            ).scalar() or Decimal("0.00")

            # Month 2 Sum
            prev_sum = self.db.query(func.sum(Expense.amount)).filter(
                Expense.user_id == user_id,
                Expense.category == cat,
                Expense.expense_date >= sixty_days_ago,
                Expense.expense_date < thirty_days_ago
            ).scalar() or Decimal("0.00")

            if prev_sum > 0 and curr_sum > 0:
                increase_rate = float((curr_sum - prev_sum) / prev_sum)
                if increase_rate >= 0.15:
                    prio = "HIGH" if increase_rate >= 0.35 else "MEDIUM"
                    save_recommendation(
                        f"Spending Spike in {cat}",
                        f"Your category expenses for '{cat}' rose by {(increase_rate*100):.1f}% compared to last month. Review your receipts to identify leakages.",
                        prio
                    )

        # 4. Budget Utilization Recommendation
        budgets = self.db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.year == today.year,
            Budget.month == today.month
        ).all()

        for b in budgets:
            limit = float(b.amount_limit)
            rem = float(b.remaining_amount)
            spent = limit - rem
            if limit > 0:
                util = spent / limit
                if util >= 0.90 and util <= 1.0:
                    save_recommendation(
                        f"Budget Cap Warning: {b.category}",
                        f"You have consumed {(util*100):.0f}% of your '{b.category}' budget. Avoid extra transactions in this category until next month.",
                        "HIGH"
                    )
                elif util > 1.0:
                    save_recommendation(
                        f"Overspent Budget: {b.category}",
                        f"You exceeded your '{b.category}' budget by {(spent - limit):.2f}. Consider moving surplus allowances or raising next month's cap.",
                        "HIGH"
                    )

        self.db.commit()
