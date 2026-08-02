import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from datetime import date
from decimal import Decimal
from typing import Optional
from app.database.connection import get_db
from app.models.user import User
from app.models.receipt import Receipt
from app.models.expense import Expense
from app.services.auth_service import get_current_user
from app.storage.storage_provider import get_storage_provider
from app.ocr.ocr_service import OCRService
from app.schemas.receipt import ReceiptResponse, ReceiptCreate

router = APIRouter()

@router.post("/upload")
async def upload_receipt_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Temporary upload endpoint for receipt images prior to OCR scans."""
    # We can delegate to files uploader directly to prevent duplication
    from app.api.files.router import upload_file
    return await upload_file(file=file, folder="receipts", current_user=current_user)

@router.post("/process", response_model=ReceiptResponse, status_code=status.HTTP_201_CREATED)
async def process_receipt(
    image_path: str = Query(..., description="Relative path of uploaded receipt image"),
    create_expense: bool = Query(False, description="Set true to automatically populate expense transaction"),
    category: str = Query("Other", description="Category for auto-populated expense"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Processes OCR on a saved receipt image, saves the receipt record, and optionally creates an Expense."""
    provider = get_storage_provider()
    try:
        # Load image bytes from storage
        image_bytes = provider.get_file_bytes(image_path)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specified receipt image file not found in storage."
        )

    # Trigger OCR Scanner
    ocr_service = OCRService()
    extracted_text, raw_conf = ocr_service.extract_text(image_bytes)
    parsed = ocr_service.parse_receipt_text(extracted_text, raw_conf)

    # Optional: auto-generate matching expense transaction
    expense_id = None
    if create_expense:
        # Create Expense Record
        title = f"Receipt: {parsed['merchant_name']}"
        expense = Expense(
            user_id=current_user.user_id,
            title=title,
            category=category,
            amount=parsed["total_amount"],
            description=f"OCR Auto-extracted receipt from {parsed['merchant_name']}",
            expense_date=parsed["transaction_date"]
        )
        db.add(expense)
        db.commit()
        db.refresh(expense)
        expense_id = expense.expense_id

    # Create and save Receipt Record
    receipt = Receipt(
        user_id=current_user.user_id,
        expense_id=expense_id,
        merchant_name=parsed["merchant_name"],
        transaction_date=parsed["transaction_date"],
        total_amount=parsed["total_amount"],
        tax_amount=parsed["tax_amount"],
        currency=parsed["currency"],
        confidence_score=parsed["confidence_score"],
        image_path=image_path
    )
    db.add(receipt)
    db.commit()
    db.refresh(receipt)

    return receipt

@router.get("/{id}", response_model=ReceiptResponse)
def get_receipt(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch single receipt details."""
    receipt = db.query(Receipt).filter(Receipt.receipt_id == id, Receipt.user_id == current_user.user_id).first()
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt record not found."
        )
    return receipt

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_receipt(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a receipt and clean up its storage file."""
    receipt = db.query(Receipt).filter(Receipt.receipt_id == id, Receipt.user_id == current_user.user_id).first()
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt record not found."
        )

    # 1. Clean up file in storage
    provider = get_storage_provider()
    provider.delete_file(receipt.image_path)

    # 2. Delete database record
    db.delete(receipt)
    db.commit()
    return None
