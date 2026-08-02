from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account."""
    auth_service = AuthService(db)
    return auth_service.register(data)

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate credentials and generate a JWT token."""
    auth_service = AuthService(db)
    access_token = auth_service.login(data)
    return TokenResponse(access_token=access_token, token_type="bearer")

@router.post("/logout")
def logout():
    """Sign out the current user session (handled client-side; API returns confirmation)."""
    return {"detail": "Logged out successfully"}
