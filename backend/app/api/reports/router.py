from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database.connection import get_db
from app.models.user import User
from app.services.auth_service import get_current_user
from app.reports.report_generator import ReportGenerator

router = APIRouter()

def build_report_response(db: Session, user: User, report_type: str, fmt: str):
    """Compiles and renders the selected financial statement report."""
    generator = ReportGenerator(db)
    
    if fmt == "pdf":
        try:
            pdf_bytes = generator.generate_pdf_report(user.user_id, report_type)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to compile PDF: {str(e)}"
            )
        headers = {
            "Content-Disposition": f"attachment; filename={report_type}_financial_report.pdf"
        }
        return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
        
    return generator.generate_report_data(user.user_id, report_type)

@router.get("/daily")
def get_daily_report(
    format: str = Query("json", description="json or pdf"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch daily transaction report (JSON structure or PDF document)."""
    return build_report_response(db, current_user, "daily", format.lower())

@router.get("/weekly")
def get_weekly_report(
    format: str = Query("json", description="json or pdf"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch 7-day weekly transaction report (JSON structure or PDF document)."""
    return build_report_response(db, current_user, "weekly", format.lower())

@router.get("/monthly")
def get_monthly_report(
    format: str = Query("json", description="json or pdf"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch monthly invoice ledger report (JSON structure or PDF document)."""
    return build_report_response(db, current_user, "monthly", format.lower())

@router.get("/yearly")
def get_yearly_report(
    format: str = Query("json", description="json or pdf"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch annual aggregate ledger report (JSON structure or PDF document)."""
    return build_report_response(db, current_user, "yearly", format.lower())
