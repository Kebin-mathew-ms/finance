from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Recommendation(Base):
    __tablename__ = "recommendations"

    recommendation_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), nullable=False, default="MEDIUM") # HIGH, MEDIUM, LOW
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User")
