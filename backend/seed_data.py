"""
Seed Data Script for Finance Management System
Generates 6 months of realistic historical financial data and triggers AI model training & analytics.
Usage:
    python seed_data.py
"""

import sys
import os
import random
from datetime import date, timedelta
from decimal import Decimal

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import SessionLocal
from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.savings_goal import SavingsGoal
from app.models.reminder import Reminder
from app.models.receipt import Receipt
from app.models.notification import Notification
from app.models.anomaly import Anomaly
from app.models.recommendation import Recommendation
from app.models.health_score import FinancialHealthScore
from app.models.prediction import Prediction
from app.services.auth_service import hash_password

def seed_database():
    db = SessionLocal()
    print("============================================================")
    print("  Starting Finance App 6-Month Data Seeding Pipeline")
    print("============================================================")

    try:
        # 1. Get or Create Test User
        user = db.query(User).filter(User.email == "test@finance.com").first()
        if not user:
            user = User(
                first_name="Test",
                last_name="User",
                email="test@finance.com",
                phone_number="1234567890",
                password_hash=hash_password("Test@1234")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"[+] Created User: {user.email} (ID: {user.user_id})")
        else:
            print(f"[*] Found Existing User: {user.email} (ID: {user.user_id})")

        user_id = user.user_id

        # 2. Clear Existing User Data for Clean Re-seed
        print("\n[*] Cleaning old data for user...")
        db.query(Expense).filter(Expense.user_id == user_id).delete()
        db.query(Income).filter(Income.user_id == user_id).delete()
        db.query(Budget).filter(Budget.user_id == user_id).delete()
        db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).delete()
        db.query(Reminder).filter(Reminder.user_id == user_id).delete()
        db.query(Anomaly).filter(Anomaly.user_id == user_id).delete()
        db.query(Recommendation).filter(Recommendation.user_id == user_id).delete()
        db.query(FinancialHealthScore).filter(FinancialHealthScore.user_id == user_id).delete()
        db.query(Prediction).filter(Prediction.user_id == user_id).delete()
        db.commit()

        # 3. Generate 6 Months of Financial Records (May 2026 to Oct 2026 / last 180 days)
        today = date.today()
        print(f"\n[*] Generating 6 months of historical data (Ending: {today})...")

        # Track stats
        total_income_count = 0
        total_expense_count = 0

        # Define monthly baseline patterns
        expense_templates = {
            "Food": [
                ("Weekly Grocery Shopping", 120.00, 180.00),
                ("Supermarket Groceries", 65.00, 110.00),
                ("Restaurant Dinner", 45.00, 95.00),
                ("Zomato Food Delivery", 18.00, 35.00),
                ("Swiggy Order", 22.00, 40.00),
                ("Coffee & Snacks", 8.00, 25.00),
                ("Weekend Lunch", 35.00, 70.00),
            ],
            "Bills": [
                ("Electricity Bill Payment", 110.00, 145.00),
                ("High-Speed Fiber Internet", 59.99, 59.99),
                ("Water Utility Bill", 28.00, 42.00),
                ("Mobile Postpaid Plan", 49.00, 49.00),
            ],
            "Transportation": [
                ("Petrol / Fuel Refill", 40.00, 75.00),
                ("Uber Cab Ride", 15.00, 35.00),
                ("Metro Train Pass", 30.00, 50.00),
                ("Vehicle Maintenance", 80.00, 150.00),
            ],
            "Entertainment": [
                ("Netflix Premium Subscription", 15.99, 15.99),
                ("Spotify Family Plan", 9.99, 9.99),
                ("Cinema Movie Tickets", 25.00, 45.00),
                ("Video Game Purchase", 29.99, 59.99),
            ],
            "Healthcare": [
                ("Doctor Consultation", 60.00, 120.00),
                ("Pharmacy Medicine Purchase", 25.00, 65.00),
                ("Health Checkup Test", 80.00, 150.00),
            ],
            "Shopping": [
                ("Clothing & Apparel", 45.00, 130.00),
                ("Amazon Online Purchase", 25.00, 85.00),
                ("Home Footwear & Goods", 35.00, 90.00),
            ],
            "Education": [
                ("Online Learning Course", 49.99, 99.99),
                ("Technical Books", 25.00, 60.00),
            ],
            "Insurance": [
                ("Health Insurance Monthly Premium", 175.00, 175.00),
            ],
            "Investment": [
                ("Monthly Mutual Fund SIP", 300.00, 300.00),
            ]
        }

        # Loop over past 6 months (5 to 0)
        for month_offset in range(5, -1, -1):
            # Target month calculation
            target_year = today.year
            target_month = today.month - month_offset
            while target_month <= 0:
                target_month += 12
                target_year -= 1

            # A. Add Incomes for Month
            salary = Income(
                user_id=user_id,
                title="Monthly Salary",
                category="Salary",
                amount=Decimal("3500.00"),
                description=f"Primary monthly salary for {target_year}-{target_month:02d}",
                income_date=date(target_year, target_month, 1)
            )
            freelance = Income(
                user_id=user_id,
                title="Freelance Project Payout",
                category="Freelancing",
                amount=Decimal(str(random.randint(650, 950))),
                description="Web design & consulting project payout",
                income_date=date(target_year, target_month, 15)
            )
            db.add_all([salary, freelance])
            total_income_count += 2

            # B. Add Expenses for Month
            for category, templates in expense_templates.items():
                for title, min_amt, max_amt in templates:
                    # Randomize day in month (1 to 28)
                    day = random.randint(2, 28)
                    # Small variation in price
                    amt = round(random.uniform(min_amt, max_amt), 2)
                    exp = Expense(
                        user_id=user_id,
                        title=title,
                        category=category,
                        amount=Decimal(str(amt)),
                        description=f"Regular expense in {category}",
                        expense_date=date(target_year, target_month, day)
                    )
                    db.add(exp)
                    total_expense_count += 1

            # C. Add Outlier Anomaly in Month 3 (for Anomaly Detection test)
            if month_offset == 3:
                anomaly_exp = Expense(
                    user_id=user_id,
                    title="High-End Workstation Laptop",
                    category="Shopping",
                    amount=Decimal("2850.00"),
                    description="Unusual large hardware purchase for workspace setup",
                    expense_date=date(target_year, target_month, 18)
                )
                db.add(anomaly_exp)
                total_expense_count += 1

            # D. Add Budgets for Month
            budget_limits = {
                "Food": 600.00,
                "Bills": 300.00,
                "Transportation": 350.00,
                "Entertainment": 100.00,
                "Shopping": 300.00,
                "Healthcare": 200.00
            }

            for cat, limit in budget_limits.items():
                # Calculate actual spent in this category/month
                cat_spent = sum(
                    float(t[1]) for t in expense_templates.get(cat, [])
                )
                rem = max(0.0, limit - cat_spent)
                b_status = "EXCEEDED" if rem == 0 else "ACTIVE"
                budget = Budget(
                    user_id=user_id,
                    title=f"Monthly {cat} Budget",
                    category=cat,
                    amount_limit=Decimal(str(limit)),
                    remaining_amount=Decimal(str(round(rem, 2))),
                    month=target_month,
                    year=target_year,
                    status=b_status
                )
                db.add(budget)

        # 4. Add Savings Goals
        g1 = SavingsGoal(
            user_id=user_id,
            goal_name="Emergency Reserve Fund",
            goal_type="Emergency fund",
            target_amount=Decimal("10000.00"),
            saved_amount=Decimal("4500.00"),
            start_date=today - timedelta(days=120),
            target_date=today + timedelta(days=240),
            status="IN_PROGRESS"
        )
        g2 = SavingsGoal(
            user_id=user_id,
            goal_name="Vacation Trip to Japan",
            goal_type="Vacation",
            target_amount=Decimal("3500.00"),
            saved_amount=Decimal("2100.00"),
            start_date=today - timedelta(days=90),
            target_date=today + timedelta(days=90),
            status="IN_PROGRESS"
        )
        db.add_all([g1, g2])

        # 5. Add Reminders
        r1 = Reminder(
            user_id=user_id,
            title="Monthly Credit Card Payment",
            description="Clear full statement balance to avoid interest charges",
            reminder_type="Credit card payment",
            amount=Decimal("480.00"),
            due_date=today + timedelta(days=5),
            repeat_interval="MONTHLY",
            is_completed=False
        )
        r2 = Reminder(
            user_id=user_id,
            title="Electricity Utility Bill",
            description="Power bill due for current billing cycle",
            reminder_type="Electricity bill",
            amount=Decimal("125.00"),
            due_date=today + timedelta(days=10),
            repeat_interval="MONTHLY",
            is_completed=False
        )
        r3 = Reminder(
            user_id=user_id,
            title="Car Insurance Renewal (OVERDUE)",
            description="Vehicle insurance premium past due date",
            reminder_type="Insurance payment",
            amount=Decimal("650.00"),
            due_date=today - timedelta(days=4), # Overdue to test debt score impact
            repeat_interval="YEARLY",
            is_completed=False
        )
        db.add_all([r1, r2, r3])

        db.commit()

        print(f"  [+] Inserted {total_income_count} Income records across 6 months")
        print(f"  [+] Inserted {total_expense_count} Expense records across 6 months")
        print("  [+] Created Budgets, Savings Goals, and Reminders")

        # 6. Trigger AI Processing Pipelines
        print("\n[*] Running AI Processing Pipelines...")

        # A. Health Calculator
        from app.ai.utils.health_calculator import FinancialHealthCalculator
        calc = FinancialHealthCalculator(db)
        health_record = calc.update_user_health_score(user_id)
        print(f"  [+] Financial Health Score: {health_record.score}/100 ({health_record.status})")

        # B. Anomaly Detector
        from app.ai.analyzers.anomaly_detector import AnomalyDetector
        detector = AnomalyDetector(db)
        detector.detect_and_log_anomalies(user_id)
        anomalies_found = db.query(Anomaly).filter(Anomaly.user_id == user_id).all()
        print(f"  [+] Flagged {len(anomalies_found)} Outlier Anomaly transactions")

        # C. Recommendation Engine
        from app.ai.recommendations.recommendation_engine import RecommendationEngine
        rec_engine = RecommendationEngine(db)
        rec_engine.generate_user_recommendations(user_id)
        recs_found = db.query(Recommendation).filter(Recommendation.user_id == user_id).all()
        print(f"  [+] Generated {len(recs_found)} AI Financial Recommendations")

        # D. Train ML Models (Random Forest)
        from app.ai.trainers.expense_trainer import ExpenseModelTrainer
        trainer = ExpenseModelTrainer(db)
        trained_type = trainer.train_user_model(user_id, algorithm="random_forest")
        print(f"  [+] Machine Learning Expense Forecasting Model Trained: '{trained_type}'")

        print("\n============================================================")
        print(" SUCCESS: 6-Month Seeding & AI Pipelines Complete!")
        print("   Email:    test@finance.com")
        print("   Password: Test@1234")
        print("============================================================")

    except Exception as e:
        db.rollback()
        print(f"\n[!] Error during seeding: {str(e)}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
