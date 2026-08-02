from sqlalchemy import Column, Integer, String, Numeric, Date, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Reminder(Base):
    __tablename__ = "reminders"

    reminder_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(String(255), nullable=True)
    reminder_type = Column(String(50), nullable=False) # Electricity bill, Water bill, Internet bill, Rent payment, Credit card payment, Loan payment, Subscription payment, Insurance payment, Other
    amount = Column(Numeric(15, 2), nullable=False)
    due_date = Column(Date, nullable=False, index=True)
    repeat_interval = Column(String(20), default="NONE") # NONE, DAILY, WEEKLY, MONTHLY, YEARLY
    is_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User")
