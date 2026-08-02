from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Receipt(Base):
    __tablename__ = "receipts"

    receipt_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    expense_id = Column(Integer, ForeignKey("expenses.expense_id", ondelete="SET NULL"), nullable=True)
    merchant_name = Column(String(150), nullable=True)
    transaction_date = Column(Date, nullable=True)
    total_amount = Column(Numeric(15, 2), nullable=True)
    tax_amount = Column(Numeric(15, 2), nullable=True)
    currency = Column(String(10), default="INR")
    confidence_score = Column(Numeric(5, 2), default=0.00)
    image_path = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User")
    expense = relationship("Expense", back_populates="receipts")
