from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    goal_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    goal_name = Column(String(150), nullable=False)
    goal_type = Column(String(50), nullable=False) # Emergency fund, Vehicle purchase, Education, Vacation, Home purchase, Retirement, Investment, Other
    target_amount = Column(Numeric(15, 2), nullable=False)
    saved_amount = Column(Numeric(15, 2), default=0.00, nullable=False)
    start_date = Column(Date, nullable=False)
    target_date = Column(Date, nullable=False)
    status = Column(String(20), default="IN_PROGRESS") # IN_PROGRESS, COMPLETED, EXPIRED
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User")
