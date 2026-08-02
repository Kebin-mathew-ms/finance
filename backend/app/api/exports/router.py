from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional
from app.database.connection import get_db
from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.savings_goal import SavingsGoal
from app.models.reminder import Reminder
from app.services.auth_service import get_current_user
from app.exports.export_service import ExportService

router = APIRouter()

def fetch_module_data(db: Session, user_id: int, module_name: str, start_date: Optional[date], end_date: Optional[date]):
    """Fetches user records for the selected module and applies date boundaries."""
    if module_name == "income":
        query = db.query(Income).filter(Income.user_id == user_id)
        if start_date:
            query = query.filter(Income.income_date >= start_date)
        if end_date:
            query = query.filter(Income.income_date <= end_date)
        return query.order_by(Income.income_date.desc()).all()

    elif module_name == "expense":
        query = db.query(Expense).filter(Expense.user_id == user_id)
        if start_date:
            query = query.filter(Expense.expense_date >= start_date)
        if end_date:
            query = query.filter(Expense.expense_date <= end_date)
        return query.order_by(Expense.expense_date.desc()).all()

    elif module_name == "budget":
        # Budgets are month/year based, we filter by created_at date range
        query = db.query(Budget).filter(Budget.user_id == user_id)
        if start_date:
            query = query.filter(Budget.created_at >= str(start_date))
        if end_date:
            query = query.filter(Budget.created_at <= str(end_date))
        return query.order_by(Budget.year.desc(), Budget.month.desc()).all()

    elif module_name == "goal":
        query = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id)
        if start_date:
            query = query.filter(SavingsGoal.start_date >= start_date)
        if end_date:
            query = query.filter(SavingsGoal.target_date <= end_date)
        return query.order_by(SavingsGoal.target_date.asc()).all()

    elif module_name == "reminder":
        query = db.query(Reminder).filter(Reminder.user_id == user_id)
        if start_date:
            query = query.filter(Reminder.due_date >= start_date)
        if end_date:
            query = query.filter(Reminder.due_date <= end_date)
        return query.order_by(Reminder.due_date.asc()).all()

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid export module selected: {module_name}."
        )

@router.get("/csv")
def export_csv(
    module: str = Query(..., description="Target module: income, expense, budget, goal, reminder"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates a downloadable CSV of selected user financial modules."""
    data = fetch_module_data(db, current_user.user_id, module, start_date, end_date)
    
    exporter = ExportService()
    file_bytes = exporter.generate_csv(module, data)
    
    headers = {
        "Content-Disposition": f"attachment; filename={module}_export.csv"
    }
    return Response(content=file_bytes, media_type="text/csv", headers=headers)

@router.get("/xlsx")
def export_xlsx(
    module: str = Query(..., description="Target module: income, expense, budget, goal, reminder"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates a downloadable XLSX workbook sheet of user ledger profiles."""
    data = fetch_module_data(db, current_user.user_id, module, start_date, end_date)
    
    exporter = ExportService()
    file_bytes = exporter.generate_xlsx(module, data)
    
    headers = {
        "Content-Disposition": f"attachment; filename={module}_export.xlsx"
    }
    return Response(
        content=file_bytes, 
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
        headers=headers
    )

@router.get("/pdf")
def export_pdf(
    module: str = Query(..., description="Target module: income, expense, budget, goal, reminder"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates a styled, styled grid layout PDF of selected user modules."""
    data = fetch_module_data(db, current_user.user_id, module, start_date, end_date)
    
    exporter = ExportService()
    try:
        file_bytes = exporter.generate_pdf(module, data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF generation error: {str(e)}"
        )
        
    headers = {
        "Content-Disposition": f"attachment; filename={module}_export.pdf"
    }
    return Response(content=file_bytes, media_type="application/pdf", headers=headers)
