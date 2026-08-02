import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config.config import settings
from app.api.router import api_router
from app.database.connection import engine, Base
from app.scheduler.scheduler import start_scheduler, shutdown_scheduler

# Import all SQLAlchemy models to register them on the metadata before create_all
from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.savings_goal import SavingsGoal
from app.models.reminder import Reminder
from app.models.notification import Notification
from app.models.receipt import Receipt
from app.models.prediction import Prediction
from app.models.recommendation import Recommendation
from app.models.anomaly import Anomaly
from app.models.health_score import FinancialHealthScore

# Create database tables directly on app initialization
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background scheduler
    start_scheduler()
    yield
    # Shutdown background scheduler
    shutdown_scheduler()

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend services for the AI-Powered Smart Personal Finance Management System.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware configuration to communicate with the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure all project directories exist
os.makedirs(settings.UPLOAD_DIRECTORY, exist_ok=True)
os.makedirs(settings.LOGS_DIR, exist_ok=True)
os.makedirs(settings.MODELS_DIR, exist_ok=True)
os.makedirs(settings.EXPORTS_DIR, exist_ok=True)
for sub in ["profile_images", "receipts", "audio", "exports"]:
    os.makedirs(os.path.join(settings.UPLOAD_DIRECTORY, sub), exist_ok=True)

# Mount the uploads directory to serve receipt and profile images statically
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIRECTORY), name="uploads")

# Set up logging and handlers
from app.config import logging as app_logging
from app.config.exceptions import register_exception_handlers

# Include the master API router with version prefix
api_app = FastAPI(
    title="Finance Management System API",
    routes=api_router.routes
)
register_exception_handlers(app)
register_exception_handlers(api_app)

app.mount("/api/v1", api_app)

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.APP_NAME} API. Access docs at /docs or /api/v1/docs"}
