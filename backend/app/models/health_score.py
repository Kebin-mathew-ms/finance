from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class FinancialHealthScore(Base):
    __tablename__ = "financial_health_scores"

    score_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False) # CRITICAL, POOR, GOOD, EXCELLENT
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User")
