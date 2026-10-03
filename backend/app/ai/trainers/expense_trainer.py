import os
import joblib
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from decimal import Decimal
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
try:
    from xgboost import XGBRegressor
except ImportError:
    XGBRegressor = None

from app.models.expense import Expense
from app.models.income import Income
from app.models.budget import Budget
from app.models.savings_goal import SavingsGoal

CATEGORIES = ["Food", "Bills", "Transportation", "Entertainment", "Healthcare", "Shopping", "Education", "Insurance", "Investment", "Other"]

from app.config.settings import settings

class ExpenseModelTrainer:
    def __init__(self, db: Session, models_dir: str = None):
        self.db = db
        self.models_dir = os.path.abspath(models_dir) if models_dir else settings.MODELS_DIR
        os.makedirs(self.models_dir, exist_ok=True)

    def _prepare_training_data(self, user_id: int) -> pd.DataFrame:
        """Assembles user historical datasets grouping monthly categorised expenses and budgets."""
        # 1. Fetch expenses
        expenses = self.db.query(
            Expense.category,
            func.year(Expense.expense_date).label('year'),
            func.month(Expense.expense_date).label('month'),
            func.sum(Expense.amount).label('total_amount'),
            func.count(Expense.expense_id).label('tx_count')
        ).filter(Expense.user_id == user_id).group_by(
            Expense.category, 'year', 'month'
        ).all()

        if not expenses:
            return pd.DataFrame()

        records = []
        for exp in expenses:
            cat = exp.category
            yr = exp.year
            mo = exp.month
            tot_exp = float(exp.total_amount)
            cnt = int(exp.tx_count)

            # Get income for this user in that year/month
            inc_sum = self.db.query(func.sum(Income.amount)).filter(
                Income.user_id == user_id,
                func.year(Income.income_date) == yr,
                func.month(Income.income_date) == mo
            ).scalar() or Decimal("0.00")
            avg_income = float(inc_sum)

            # Get budget limit for this category/user in that year/month
            b_row = self.db.query(Budget.amount_limit).filter(
                Budget.user_id == user_id,
                Budget.category == cat,
                Budget.year == yr,
                Budget.month == mo
            ).first()
            b_limit = b_row[0] if b_row else Decimal("0.00")
            budget_lim = float(b_limit)

            # Get total savings up to this year/month
            sav_sum = self.db.query(func.sum(SavingsGoal.saved_amount)).filter(
                SavingsGoal.user_id == user_id
            ).scalar() or Decimal("0.00")
            total_savings = float(sav_sum)

            cat_idx = CATEGORIES.index(cat) if cat in CATEGORIES else len(CATEGORIES) - 1

            records.append({
                "category": cat_idx,
                "month": mo,
                "year": yr,
                "tx_count": cnt,
                "avg_income": avg_income,
                "budget_lim": budget_lim,
                "total_savings": total_savings,
                "target_amount": tot_exp
            })

        return pd.DataFrame(records)

    def train_user_model(self, user_id: int, algorithm: str = "random_forest") -> str:
        """Trains selected algorithm (linear, random_forest, xgboost) and saves to joblib file."""
        df = self._prepare_training_data(user_id)
        model_path = os.path.join(self.models_dir, f"expense_model_user_{user_id}.joblib")

        # Fallback mechanism if insufficient historical records
        if df.empty or len(df) < 5:
            # Fallback metadata mapping average category expenses
            fallback_averages = {}
            if not df.empty:
                for cat_idx in range(len(CATEGORIES)):
                    cat_df = df[df["category"] == cat_idx]
                    if not cat_df.empty:
                        fallback_averages[cat_idx] = float(cat_df["target_amount"].mean())

            fallback_data = {
                "model_type": "fallback",
                "averages": fallback_averages,
                "categories": CATEGORIES
            }
            joblib.dump(fallback_data, model_path)
            return "fallback"

        # Separate targets and features
        feature_cols = ["category", "month", "year", "tx_count", "avg_income", "budget_lim", "total_savings"]
        X = df[feature_cols]
        y = df["target_amount"]

        if algorithm == "xgboost" and XGBRegressor is not None:
            model = XGBRegressor(n_estimators=50, max_depth=3, learning_rate=0.1, random_state=42)
            model_type = "xgboost"
        elif algorithm == "random_forest":
            model = RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42)
            model_type = "random_forest"
        else:
            model = LinearRegression()
            model_type = "linear_regression"

        # Fit model
        model.fit(X, y)

        # Save metadata and model weights
        save_data = {
            "model_type": model_type,
            "model": model,
            "categories": CATEGORIES,
            "features": feature_cols
        }
        joblib.dump(save_data, model_path)
        return model_type
