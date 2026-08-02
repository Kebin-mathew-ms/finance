from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Prediction(Base):
    __tablename__ = "predictions"

    prediction_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    prediction_type = Column(String(50), nullable=False) # e.g., monthly_expenditure
    predicted_amount = Column(Numeric(15, 2), nullable=False)
    confidence_score = Column(Numeric(5, 2), nullable=False)
    prediction_date = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User")
