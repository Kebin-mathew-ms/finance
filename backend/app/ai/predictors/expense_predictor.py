import os
import joblib
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, Any, List
import pandas as pd
from app.ai.trainers.expense_trainer import CATEGORIES
from app.models.income import Income
from app.models.budget import Budget
from app.models.savings_goal import SavingsGoal
from app.models.expense import Expense

from app.config.settings import settings

class ExpensePredictor:
    def __init__(self, db: Session, models_dir: str = None):
        self.db = db
        self.models_dir = os.path.abspath(models_dir) if models_dir else settings.MODELS_DIR

    def _get_predictor_features(self, user_id: int, category: str, target_date: date) -> Dict[str, Any]:
        """Gathers latest statistics to construct feature inputs for tomorrow's forecasts."""
        # 1. Calculate historical transaction count average for this category
        avg_tx = self.db.query(func.count(Expense.expense_id)).filter(
            Expense.user_id == user_id,
            Expense.category == category
        ).scalar() or 0
        # If user has some history, guess next month frequency, else 1
        tx_count = max(1, int(avg_tx / 6)) if avg_tx > 0 else 1

        # 2. Get user average monthly income (past 3 months)
        ninety_days_ago = date.today() - timedelta(days=90)
        inc_sum = self.db.query(func.sum(Income.amount)).filter(
            Income.user_id == user_id,
            Income.income_date >= ninety_days_ago
        ).scalar() or Decimal("0.00")
        avg_income = float(inc_sum) / 3.0

        # 3. Get budget limit set for this category
        b_limit = self.db.query(Budget.amount_limit).filter(
            Budget.user_id == user_id,
            Budget.category == category,
            Budget.year == target_date.year,
            Budget.month == target_date.month
        ).scalar()
        if not b_limit:
            # Fall back to latest month budget limit if not defined yet
            b_limit = self.db.query(Budget.amount_limit).filter(
                Budget.user_id == user_id,
                Budget.category == category
            ).order_by(Budget.year.desc(), Budget.month.desc()).scalar()
        budget_lim = float(b_limit) if b_limit else 0.0

        # 4. Total current savings
        sav_sum = self.db.query(func.sum(SavingsGoal.saved_amount)).filter(
            SavingsGoal.user_id == user_id
        ).scalar() or Decimal("0.00")
        total_savings = float(sav_sum)

        cat_idx = CATEGORIES.index(category) if category in CATEGORIES else len(CATEGORIES) - 1

        return {
            "category": cat_idx,
            "month": target_date.month,
            "year": target_date.year,
            "tx_count": tx_count,
            "avg_income": avg_income,
            "budget_lim": budget_lim,
            "total_savings": total_savings
        }

    def predict_next_month_expense(self, user_id: int, category: str) -> Dict[str, Any]:
        """Predicts the category spending for the next calendar month using trained models."""
        today = date.today()
        # Get start of next month
        if today.month == 12:
            next_month_date = date(today.year + 1, 1, 1)
        else:
            next_month_date = date(today.year, today.month + 1, 1)

        model_path = os.path.join(self.models_dir, f"expense_model_user_{user_id}.joblib")

        # Fallback if no model trained yet
        if not os.path.exists(model_path):
            # Calculate simple average of past expenses as quick fallback
            avg_val = self.db.query(func.avg(Expense.amount)).filter(
                Expense.user_id == user_id,
                Expense.category == category
            ).scalar() or Decimal("0.00")
            
            return {
                "category": category,
                "predicted_amount": float(avg_val) if avg_val else 100.0,
                "confidence_score": 50.0,
                "model_used": "simple_moving_average",
                "prediction_date": next_month_date
            }

        # Load trained model
        meta = joblib.load(model_path)
        model_type = meta["model_type"]

        if model_type == "fallback":
            cat_idx = CATEGORIES.index(category) if category in CATEGORIES else -1
            avg_val = meta["averages"].get(cat_idx, 100.0)
            return {
                "category": category,
                "predicted_amount": avg_val,
                "confidence_score": 50.0,
                "model_used": "fallback_means",
                "prediction_date": next_month_date
            }

        # Generate feature values
        feats = self._get_predictor_features(user_id, category, next_month_date)
        df_feat = pd.DataFrame([feats])

        # Run model prediction
        model = meta["model"]
        pred_val = model.predict(df_feat)[0]
        # Prevent negative predictions
        predicted_amount = max(0.0, float(pred_val))

        # Assign confidence rating based on data size and algorithm accuracy
        base_conf = 85.0 if model_type == "random_forest" else (90.0 if model_type == "xgboost" else 70.0)
        
        # Calculate historical records count to adjust confidence
        records_count = self.db.query(func.count(Expense.expense_id)).filter(
            Expense.user_id == user_id
        ).scalar() or 0
        confidence_score = base_conf * min(1.0, records_count / 15)
        confidence_score = max(30.0, min(95.0, confidence_score))

        return {
            "category": category,
            "predicted_amount": round(predicted_amount, 2),
            "confidence_score": round(confidence_score, 1),
            "model_used": model_type,
            "prediction_date": next_month_date
        }
