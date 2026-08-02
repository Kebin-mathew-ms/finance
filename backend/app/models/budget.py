from sqlalchemy import Column, Integer, String, Numeric, UniqueConstraint, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Budget(Base):
    __tablename__ = "budgets"

    budget_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False) # Food, Transportation, Shopping, Bills, Healthcare, Entertainment, Education, Insurance, Investment, Miscellaneous
    amount_limit = Column(Numeric(15, 2), nullable=False)
    remaining_amount = Column(Numeric(15, 2), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    status = Column(String(20), default="ACTIVE") # ACTIVE, EXCEEDED, COMPLETED
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Establish duplicate checks directly in DB metadata
    __table_args__ = (
        UniqueConstraint('user_id', 'category', 'month', 'year', name='uq_user_category_month_year'),
    )

    user = relationship("User")
