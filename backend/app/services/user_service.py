from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional
from app.models.user import User
from app.schemas.user import UserUpdate, PasswordChangeRequest
from app.repositories.user_repository import UserRepository
from app.utils.security import hash_password, verify_password

class UserService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def update_profile(self, user: User, data: UserUpdate, profile_image_path: Optional[str] = None) -> User:
        if data.first_name is not None:
            user.first_name = data.first_name
        if data.last_name is not None:
            user.last_name = data.last_name
        if data.phone_number is not None:
            user.phone_number = data.phone_number
        if profile_image_path is not None:
            user.profile_image = profile_image_path

        return self.user_repo.update(user)

    def change_password(self, user: User, data: PasswordChangeRequest) -> User:
        # Verify old password
        if not verify_password(data.old_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect old password"
            )

        # Confirm new passwords match
        if data.new_password != data.confirm_new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New passwords do not match"
            )

        # Save new password
        user.password_hash = hash_password(data.new_password)
        return self.user_repo.update(user)
