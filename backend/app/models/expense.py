from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Expense(Base):
    __tablename__ = "expenses"

    expense_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False) # Food, Bills, Transportation, Entertainment, Healthcare, Shopping, Education, Insurance, Other
    amount = Column(Numeric(15, 2), nullable=False)
    description = Column(String(255), nullable=True)
    receipt_path = Column(String(255), nullable=True)
    expense_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="expenses")
    receipts = relationship("Receipt", back_populates="expense")
