from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest
from app.repositories.user_repository import UserRepository
from app.utils.security import hash_password, verify_password, create_access_token, decode_access_token
from app.database.connection import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

class AuthService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def register(self, data: RegisterRequest) -> User:
        # Check if email is unique
        existing_user = self.user_repo.get_by_email(data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address already registered"
            )

        # Create new user model
        hashed = hash_password(data.password)
        new_user = User(
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            phone_number=data.phone_number,
            password_hash=hashed
        )
        return self.user_repo.create(new_user)

    def login(self, data: LoginRequest) -> str:
        user = self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Create JWT access token
        token_payload = {"sub": str(user.user_id), "email": user.email}
        return create_access_token(data=token_payload)

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
        
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise credentials_exception

    user_repo = UserRepository(db)
    user = user_repo.get_by_id(user_id)
    if user is None:
        raise credentials_exception
    return user
