from fastapi import APIRouter
from app.api.auth.router import router as auth_router
from app.api.users.router import router as users_router
from app.api.income.router import router as income_router
from app.api.expenses.router import router as expense_router
from app.api.budgets.router import router as budgets_router
from app.api.goals.router import router as goals_router
from app.api.reminders.router import router as reminders_router
from app.api.notifications.router import router as notifications_router
from app.api.files.router import router as files_router
from app.api.ocr.router import router as ocr_router
from app.api.voice.router import router as voice_router
from app.api.search.router import router as search_router
from app.api.exports.router import router as export_router
from app.api.analytics.router import router as analytics_router
from app.api.ai.router import router as ai_router
from app.api.reports.router import router as reports_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(income_router, prefix="/income", tags=["Incomes"])
api_router.include_router(expense_router, prefix="/expense", tags=["Expenses"])
api_router.include_router(budgets_router, prefix="/budgets", tags=["Budgets"])
api_router.include_router(goals_router, prefix="/goals", tags=["Savings Goals"])
api_router.include_router(reminders_router, prefix="/reminders", tags=["Reminders"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(files_router, prefix="/files", tags=["Files"])
api_router.include_router(ocr_router, prefix="/ocr", tags=["OCR receipt scanning"])
api_router.include_router(voice_router, prefix="/voice", tags=["Voice expense entry"])
api_router.include_router(search_router, prefix="/search", tags=["Global Search"])
api_router.include_router(export_router, prefix="/export", tags=["Data Export"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(ai_router, prefix="/ai", tags=["Artificial Intelligence"])
api_router.include_router(reports_router, prefix="/reports", tags=["Report Generation"])

