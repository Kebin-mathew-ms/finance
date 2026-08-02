import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from decimal import Decimal
from sklearn.ensemble import IsolationForest
from app.models.expense import Expense
from app.models.anomaly import Anomaly

class AnomalyDetector:
    def __init__(self, db: Session):
        self.db = db

    def detect_and_log_anomalies(self, user_id: int):
        """Fits an Isolation Forest outlier model to detect and insert flagged transactions."""
        # 1. Fetch expenses for user (last 6 months or 200 items)
        expenses = self.db.query(Expense).filter(
            Expense.user_id == user_id
        ).order_by(Expense.expense_date.desc()).limit(200).all()

        if len(expenses) < 6:
            # Insufficient baseline to identify outlier deviations
            return

        # Prepare features DataFrame
        data = []
        for exp in expenses:
            data.append({
                "expense_id": exp.expense_id,
                "amount": float(exp.amount),
                "day_of_week": exp.expense_date.weekday(),
                "month": exp.expense_date.month
            })

        df = pd.DataFrame(data)
        
        # 2. Fit Isolation Forest
        X = df[["amount", "day_of_week", "month"]]
        # contamination sets expected percentage of outliers (e.g. 5%)
        clf = IsolationForest(contamination=0.05, random_state=42)
        preds = clf.fit_predict(X)

        mean_amt = df["amount"].mean()
        std_amt = df["amount"].std() or 1.0

        for idx, pred in enumerate(preds):
            if pred == -1: # Outlier detected!
                row = df.iloc[idx]
                exp_id = int(row["expense_id"])
                amt = row["amount"]
                
                # Check if already logged to prevent duplicates
                exists = self.db.query(Anomaly).filter(
                    Anomaly.expense_id == exp_id
                ).first()
                
                if not exists:
                    # Fetch actual expense details for descriptions
                    orig_expense = self.db.query(Expense).filter(Expense.expense_id == exp_id).first()
                    if not orig_expense:
                        continue

                    # Decide Severity
                    deviation = (amt - mean_amt) / std_amt
                    if amt > 2000.0 or deviation > 3.0:
                        severity = "HIGH"
                        anomaly_type = "LARGE_WITHDRAWAL"
                    elif deviation > 1.5:
                        severity = "MEDIUM"
                        anomaly_type = "SUDDEN_SPIKE"
                    else:
                        severity = "LOW"
                        anomaly_type = "UNUSUAL_PATTERN"

                    description = (
                        f"Unusual transaction of {orig_expense.amount} for '{orig_expense.title}' "
                        f"under category '{orig_expense.category}' detected on "
                        f"{orig_expense.expense_date.strftime('%A')}. This exceeds your typical category metrics."
                    )

                    anomaly = Anomaly(
                        user_id=user_id,
                        expense_id=exp_id,
                        anomaly_type=anomaly_type,
                        severity=severity,
                        description=description
                    )
                    self.db.add(anomaly)
                    
        self.db.commit()
