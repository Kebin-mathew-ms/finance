from fastapi import APIRouter, Depends, Form, File, UploadFile, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database.connection import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, PasswordChangeRequest
from app.services.auth_service import get_current_user
from app.services.user_service import UserService
from app.utils.upload import save_upload, delete_upload

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Fetch current user's profile info."""
    return current_user

@router.put("/me", response_model=UserResponse)
def update_profile(
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    phone_number: Optional[str] = Form(None),
    profile_image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update profile details and upload optional profile image."""
    user_service = UserService(db)
    
    profile_image_path = None
    if profile_image:
        # Delete old profile image if it exists
        if current_user.profile_image:
            delete_upload(current_user.profile_image)
        profile_image_path = save_upload(profile_image, folder_type="profiles")

    data = UserUpdate(
        first_name=first_name,
        last_name=last_name,
        phone_number=phone_number
    )
    
    return user_service.update_profile(current_user, data, profile_image_path)

@router.put("/change-password", response_model=UserResponse)
def change_password(
    data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change account password."""
    user_service = UserService(db)
    return user_service.change_password(current_user, data)
