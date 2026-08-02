from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Anomaly(Base):
    __tablename__ = "anomalies"

    anomaly_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    expense_id = Column(Integer, ForeignKey("expenses.expense_id", ondelete="SET NULL"), nullable=True)
    anomaly_type = Column(String(50), nullable=False) # SUDDEN_SPIKE, REPEATED_TX, LARGE_WITHDRAWAL, UNUSUAL_PATTERN
    severity = Column(String(20), nullable=False, default="MEDIUM") # HIGH, MEDIUM, LOW
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User")
    expense = relationship("Expense")
