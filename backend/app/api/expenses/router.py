from fastapi import APIRouter, Depends, status, Query, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from decimal import Decimal
from app.database.connection import get_db
from app.models.user import User
from app.schemas.expense import ExpenseResponse, ExpensePaginatedResponse, ExpenseMonthlySummary, ExpenseCreate, ExpenseUpdate
from app.services.auth_service import get_current_user
from app.services.expense_service import ExpenseService
from app.utils.upload import save_upload, delete_upload

router = APIRouter()

@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    title: str = Form(...),
    category: str = Form(...),
    amount: Decimal = Form(...),
    expense_date: date = Form(...),
    description: Optional[str] = Form(None),
    receipt: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new expense record with optional receipt file."""
    expense_service = ExpenseService(db)
    
    receipt_path = None
    if receipt:
        receipt_path = save_upload(receipt, folder_type="receipts")

    data = ExpenseCreate(
        title=title,
        category=category,
        amount=amount,
        expense_date=expense_date,
        description=description
    )
    
    return expense_service.create_expense(current_user.user_id, data, receipt_path)

@router.get("", response_model=ExpensePaginatedResponse)
def list_expenses(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    category: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List and search expenses (paginated and filtered)."""
    expense_service = ExpenseService(db)
    return expense_service.get_expenses(
        user_id=current_user.user_id,
        page=page,
        size=size,
        category=category,
        start_date=start_date,
        end_date=end_date,
        search_query=search
    )

@router.get("/summary", response_model=ExpenseMonthlySummary)
def get_expense_summary(
    year: int = Query(...),
    month: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get monthly summary and category breakdown for expenses."""
    expense_service = ExpenseService(db)
    return expense_service.get_monthly_summary(current_user.user_id, year, month)

@router.get("/{id}", response_model=ExpenseResponse)
def get_expense(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch single expense record."""
    expense_service = ExpenseService(db)
    return expense_service.get_expense_by_id(id, current_user.user_id)

@router.put("/{id}", response_model=ExpenseResponse)
def update_expense(
    id: int,
    title: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    amount: Optional[Decimal] = Form(None),
    expense_date: Optional[date] = Form(None),
    description: Optional[str] = Form(None),
    receipt: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing expense record, optionally replacing receipt."""
    expense_service = ExpenseService(db)
    
    receipt_path = None
    if receipt:
        receipt_path = save_upload(receipt, folder_type="receipts")

    data = ExpenseUpdate(
        title=title,
        category=category,
        amount=amount,
        expense_date=expense_date,
        description=description
    )
    
    return expense_service.update_expense(id, current_user.user_id, data, receipt_path)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an expense record and remove its receipt."""
    expense_service = ExpenseService(db)
    expense_service.delete_expense(id, current_user.user_id)
    return None
