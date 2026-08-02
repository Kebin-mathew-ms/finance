from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.database.connection import get_db
from app.models.user import User
from app.models.recommendation import Recommendation
from app.models.anomaly import Anomaly
from app.services.auth_service import get_current_user
from app.ai.trainers.expense_trainer import ExpenseModelTrainer, CATEGORIES
from app.ai.predictors.expense_predictor import ExpensePredictor
from app.ai.analyzers.anomaly_detector import AnomalyDetector
from app.ai.recommendations.recommendation_engine import RecommendationEngine

router = APIRouter()

@router.get("/recommendations")
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve active AI financial recommendation suggestions."""
    # Ensure fresh daily recommendations are computed
    engine = RecommendationEngine(db)
    engine.generate_user_recommendations(current_user.user_id)

    recs = db.query(Recommendation).filter(
        Recommendation.user_id == current_user.user_id
    ).order_by(Recommendation.created_at.desc()).all()
    
    return [
        {
            "recommendation_id": r.recommendation_id,
            "title": r.title,
            "description": r.description,
            "priority": r.priority,
            "created_at": r.created_at
        } for r in recs
    ]

@router.post("/predict")
def predict_expense(
    category: Optional[str] = Query(None, description="Target category. If omitted, returns all categories"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Predicts next month's spending estimation and returns confidence metrics."""
    predictor = ExpensePredictor(db)
    
    if category:
        if category not in CATEGORIES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid category select: {category}."
            )
        return predictor.predict_next_month_expense(current_user.user_id, category)
    
    # Predict all categories
    predictions = []
    for cat in CATEGORIES:
        predictions.append(predictor.predict_next_month_expense(current_user.user_id, cat))
    return predictions

@router.get("/anomalies")
def get_anomalies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve anomalous outlying transactions flagged by Isolation Forest models."""
    # Trigger refresh scan
    detector = AnomalyDetector(db)
    detector.detect_and_log_anomalies(current_user.user_id)

    anom_list = db.query(Anomaly).filter(
        Anomaly.user_id == current_user.user_id
    ).order_by(Anomaly.created_at.desc()).all()

    return [
        {
            "anomaly_id": a.anomaly_id,
            "expense_id": a.expense_id,
            "anomaly_type": a.anomaly_type,
            "severity": a.severity,
            "description": a.description,
            "created_at": a.created_at,
            "expense_details": {
                "title": a.expense.title,
                "amount": float(a.expense.amount),
                "category": a.expense.category,
                "expense_date": a.expense.expense_date
            } if a.expense else None
        } for a in anom_list
    ]

@router.post("/train")
def train_model(
    algorithm: str = Query("random_forest", description="linear, random_forest, xgboost"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Triggers expense model retraining pipelines."""
    if algorithm not in ["linear", "random_forest", "xgboost"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported regression algorithm select."
        )

    trainer = ExpenseModelTrainer(db)
    trained_type = trainer.train_user_model(current_user.user_id, algorithm)
    return {
        "status": "success",
        "message": f"Successfully completed training pipeline for user {current_user.user_id}.",
        "model_type_generated": trained_type
    }
