from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Income(Base):
    __tablename__ = "incomes"

    income_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False) # Salary, Business, Freelancing, Investment, Rental income, Other income
    amount = Column(Numeric(15, 2), nullable=False)
    description = Column(String(255), nullable=True)
    income_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="incomes")
