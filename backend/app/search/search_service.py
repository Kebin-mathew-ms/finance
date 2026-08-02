from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from datetime import date
from decimal import Decimal
from typing import Optional, Dict, List, Any
from app.models.income import Income
from app.models.expense import Expense
from app.models.savings_goal import SavingsGoal
from app.models.reminder import Reminder
from app.models.receipt import Receipt

class SearchService:
    def __init__(self, db: Session):
        self.db = db

    def global_search(
        self,
        user_id: int,
        keyword: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        minimum_amount: Optional[Decimal] = None,
        maximum_amount: Optional[Decimal] = None,
        category: Optional[str] = None
    ) -> Dict[str, List[Any]]:
        """Queries multiple database models concurrently matching user-supplied keywords and bounds."""
        results = {
            "incomes": [],
            "expenses": [],
            "savings_goals": [],
            "reminders": [],
            "receipts": []
        }

        # 1. Search Incomes
        inc_q = self.db.query(Income).filter(Income.user_id == user_id)
        if keyword:
            inc_q = inc_q.filter(or_(
                Income.title.ilike(f"%{keyword}%"),
                Income.description.ilike(f"%{keyword}%")
            ))
        if start_date:
            inc_q = inc_q.filter(Income.income_date >= start_date)
        if end_date:
            inc_q = inc_q.filter(Income.income_date <= end_date)
        if minimum_amount is not None:
            inc_q = inc_q.filter(Income.amount >= minimum_amount)
        if maximum_amount is not None:
            inc_q = inc_q.filter(Income.amount <= maximum_amount)
        if category:
            inc_q = inc_q.filter(Income.category.ilike(category))
        results["incomes"] = inc_q.order_by(Income.income_date.desc()).all()

        # 2. Search Expenses
        exp_q = self.db.query(Expense).filter(Expense.user_id == user_id)
        if keyword:
            exp_q = exp_q.filter(or_(
                Expense.title.ilike(f"%{keyword}%"),
                Expense.description.ilike(f"%{keyword}%")
            ))
        if start_date:
            exp_q = exp_q.filter(Expense.expense_date >= start_date)
        if end_date:
            exp_q = exp_q.filter(Expense.expense_date <= end_date)
        if minimum_amount is not None:
            exp_q = exp_q.filter(Expense.amount >= minimum_amount)
        if maximum_amount is not None:
            exp_q = exp_q.filter(Expense.amount <= maximum_amount)
        if category:
            exp_q = exp_q.filter(Expense.category.ilike(category))
        results["expenses"] = exp_q.order_by(Expense.expense_date.desc()).all()

        # 3. Search Savings Goals
        sg_q = self.db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id)
        if keyword:
            sg_q = sg_q.filter(SavingsGoal.goal_name.ilike(f"%{keyword}%"))
        if start_date:
            sg_q = sg_q.filter(SavingsGoal.start_date >= start_date)
        if end_date:
            sg_q = sg_q.filter(SavingsGoal.target_date <= end_date)
        if minimum_amount is not None:
            sg_q = sg_q.filter(SavingsGoal.target_amount >= minimum_amount)
        if maximum_amount is not None:
            sg_q = sg_q.filter(SavingsGoal.target_amount <= maximum_amount)
        if category:
            sg_q = sg_q.filter(SavingsGoal.goal_type.ilike(category))
        results["savings_goals"] = sg_q.order_by(SavingsGoal.target_date.asc()).all()

        # 4. Search Reminders
        rem_q = self.db.query(Reminder).filter(Reminder.user_id == user_id)
        if keyword:
            rem_q = rem_q.filter(or_(
                Reminder.title.ilike(f"%{keyword}%"),
                Reminder.description.ilike(f"%{keyword}%")
            ))
        if start_date:
            rem_q = rem_q.filter(Reminder.due_date >= start_date)
        if end_date:
            rem_q = rem_q.filter(Reminder.due_date <= end_date)
        if minimum_amount is not None:
            rem_q = rem_q.filter(Reminder.amount >= minimum_amount)
        if maximum_amount is not None:
            rem_q = rem_q.filter(Reminder.amount <= maximum_amount)
        if category:
            rem_q = rem_q.filter(Reminder.reminder_type.ilike(category))
        results["reminders"] = rem_q.order_by(Reminder.due_date.asc()).all()

        # 5. Search Receipts
        rc_q = self.db.query(Receipt).filter(Receipt.user_id == user_id)
        if keyword:
            rc_q = rc_q.filter(Receipt.merchant_name.ilike(f"%{keyword}%"))
        if start_date:
            rc_q = rc_q.filter(Receipt.transaction_date >= start_date)
        if end_date:
            rc_q = rc_q.filter(Receipt.transaction_date <= end_date)
        if minimum_amount is not None:
            rc_q = rc_q.filter(Receipt.total_amount >= minimum_amount)
        if maximum_amount is not None:
            rc_q = rc_q.filter(Receipt.total_amount <= maximum_amount)
        if category:
            # Receipts do not have a category column directly, but they belong to an expense category
            rc_q = rc_q.join(Expense, Receipt.expense_id == Expense.expense_id, isouter=True).filter(
                or_(Expense.category.ilike(category), Receipt.expense_id == None)
            )
        results["receipts"] = rc_q.order_by(Receipt.created_at.desc()).all()

        return results
