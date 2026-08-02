from sqlalchemy.orm import Session
from typing import Optional
from app.models.user import User
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository):
    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.user_id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User) -> User:
        self.db.commit()
        self.db.refresh(user)
        return user
