from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone_number = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    profile_image = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    incomes = relationship("Income", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", cascade="all, delete-orphan", overlaps="user")
    savings_goals = relationship("SavingsGoal", cascade="all, delete-orphan", overlaps="user")
    reminders = relationship("Reminder", cascade="all, delete-orphan", overlaps="user")
    notifications = relationship("Notification", cascade="all, delete-orphan", overlaps="user")
    predictions = relationship("Prediction", cascade="all, delete-orphan", overlaps="user")
    recommendations = relationship("Recommendation", cascade="all, delete-orphan", overlaps="user")
    anomalies = relationship("Anomaly", cascade="all, delete-orphan", overlaps="user")
