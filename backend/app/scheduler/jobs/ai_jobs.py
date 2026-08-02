from sqlalchemy.orm import Session
from app.models.user import User
from app.ai.utils.health_calculator import FinancialHealthCalculator
from app.ai.analyzers.anomaly_detector import AnomalyDetector
from app.ai.recommendations.recommendation_engine import RecommendationEngine
from app.ai.trainers.expense_trainer import ExpenseModelTrainer

def run_ai_daily_processing_job(db: Session):
    """Refreshes health ratings, outlier alerts, and suggestions for all users."""
    users = db.query(User).all()
    for user in users:
        try:
            # 1. Update Health Score
            calc = FinancialHealthCalculator(db)
            calc.update_user_health_score(user.user_id)

            # 2. Detect Outlier Anomalies
            detector = AnomalyDetector(db)
            detector.detect_and_log_anomalies(user.user_id)

            # 3. Generate Recommendations
            rec_engine = RecommendationEngine(db)
            rec_engine.generate_user_recommendations(user.user_id)
        except Exception as e:
            # Prevent single user failures from halting processing of other profiles
            import logging
            logger = logging.getLogger("apscheduler")
            logger.error(f"Failed AI daily processing for user {user.user_id}: {str(e)}")

def run_ai_weekly_training_job(db: Session):
    """Re-runs XGBoost and Random Forest regressions for all users weekly."""
    users = db.query(User).all()
    for user in users:
        try:
            trainer = ExpenseModelTrainer(db)
            trainer.train_user_model(user.user_id, algorithm="random_forest")
        except Exception as e:
            import logging
            logger = logging.getLogger("apscheduler")
            logger.error(f"Failed model training for user {user.user_id}: {str(e)}")
