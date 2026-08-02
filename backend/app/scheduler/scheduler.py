import logging
from apscheduler.schedulers.background import BackgroundScheduler
from app.database.connection import SessionLocal
from app.scheduler.jobs.check_overspending import check_overspending_job
from app.scheduler.jobs.check_reminders import check_reminders_job
from app.scheduler.jobs.check_goals import check_goals_job

# Set up logging for scheduler monitoring
logger = logging.getLogger("apscheduler")
logger.setLevel(logging.INFO)

scheduler = BackgroundScheduler(timezone="UTC")

def run_job_with_db(job_func):
    """Wrapper that executes a job within a scoped DB session context."""
    def wrapper():
        db = SessionLocal()
        try:
            job_func(db)
        except Exception as e:
            logger.error(f"Error executing background job {job_func.__name__}: {str(e)}")
        finally:
            db.close()
    return wrapper

def start_scheduler():
    """Initializes and starts the background task scheduler scheduler jobs."""
    if not scheduler.running:
        # 1. Budget overspending checker job (runs every 1 hour)
        scheduler.add_job(
            run_job_with_db(check_overspending_job),
            "interval",
            hours=1,
            id="check_overspending"
        )
        
        # 2. Bill payment reminders job (runs every 6 hours)
        scheduler.add_job(
            run_job_with_db(check_reminders_job),
            "interval",
            hours=6,
            id="check_reminders"
        )
        
        # 3. Savings goals progress & expiry job (runs every 12 hours)
        scheduler.add_job(
            run_job_with_db(check_goals_job),
            "interval",
            hours=12,
            id="check_goals"
        )
        
        # 4. AI Daily Processing Job (updates health scores, outlier anomalies and recommendations every 24 hours)
        from app.scheduler.jobs.ai_jobs import run_ai_daily_processing_job, run_ai_weekly_training_job
        scheduler.add_job(
            run_job_with_db(run_ai_daily_processing_job),
            "interval",
            hours=24,
            id="ai_daily_processing"
        )

        # 5. ML Weekly Training Job (refits regressor parameters every 7 days)
        scheduler.add_job(
            run_job_with_db(run_ai_weekly_training_job),
            "interval",
            days=7,
            id="ml_weekly_training"
        )
        
        scheduler.start()
        logger.info("Background task scheduler started successfully.")

def shutdown_scheduler():
    """Gracefully shuts down the background task scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Background task scheduler stopped.")
