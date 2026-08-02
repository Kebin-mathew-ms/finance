from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional, List
from datetime import date
from decimal import Decimal
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpensePaginatedResponse, ExpenseMonthlySummary, ExpenseCategoryBreakdownItem
from app.repositories.expense_repository import ExpenseRepository
from app.utils.upload import delete_upload

class ExpenseService:
    def __init__(self, db: Session):
        self.expense_repo = ExpenseRepository(db)

    def create_expense(self, user_id: int, data: ExpenseCreate, receipt_path: Optional[str] = None) -> Expense:
        expense = Expense(
            user_id=user_id,
            title=data.title,
            category=data.category,
            amount=data.amount,
            description=data.description,
            expense_date=data.expense_date,
            receipt_path=receipt_path
        )
        return self.expense_repo.create(expense)

    def get_expense_by_id(self, expense_id: int, user_id: int) -> Expense:
        expense = self.expense_repo.get_by_id(expense_id, user_id)
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense record not found"
            )
        return expense

    def get_expenses(
        self,
        user_id: int,
        page: int = 1,
        size: int = 10,
        category: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        search_query: Optional[str] = None
    ) -> ExpensePaginatedResponse:
        items, total_count = self.expense_repo.get_all_paginated(
            user_id=user_id,
            page=page,
            size=size,
            category=category,
            start_date=start_date,
            end_date=end_date,
            search_query=search_query
        )

        pages = (total_count + size - 1) // size if total_count > 0 else 1

        return ExpensePaginatedResponse(
            items=items,
            total_count=total_count,
            page=page,
            size=size,
            pages=pages
        )

    def update_expense(self, expense_id: int, user_id: int, data: ExpenseUpdate, receipt_path: Optional[str] = None) -> Expense:
        expense = self.get_expense_by_id(expense_id, user_id)

        # Update standard fields
        if data.title is not None:
            expense.title = data.title
        if data.category is not None:
            expense.category = data.category
        if data.amount is not None:
            expense.amount = data.amount
        if data.description is not None:
            expense.description = data.description
        if data.expense_date is not None:
            expense.expense_date = data.expense_date

        # If a new receipt path is supplied, delete the old file
        if receipt_path is not None:
            if expense.receipt_path:
                delete_upload(expense.receipt_path)
            expense.receipt_path = receipt_path

        return self.expense_repo.update(expense)

    def delete_expense(self, expense_id: int, user_id: int) -> None:
        expense = self.get_expense_by_id(expense_id, user_id)
        
        # Delete the physical receipt file from disk if it exists
        if expense.receipt_path:
            delete_upload(expense.receipt_path)
            
        self.expense_repo.delete(expense)

    def get_monthly_summary(self, user_id: int, year: int, month: int) -> ExpenseMonthlySummary:
        total_expense, breakdown_list = self.expense_repo.get_monthly_summary(user_id, year, month)

        breakdown = []
        for cat, amt in breakdown_list:
            pct = float((amt / total_expense) * 100) if total_expense > 0 else 0.0
            breakdown.append(
                ExpenseCategoryBreakdownItem(
                    category=cat,
                    amount=amt,
                    percentage=round(pct, 2)
                )
            )

        month_str = f"{year}-{month:02d}"

        return ExpenseMonthlySummary(
            total_expense=total_expense,
            breakdown=breakdown,
            month=month_str
        )
