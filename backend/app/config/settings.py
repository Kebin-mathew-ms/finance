import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "Finance Management System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    SECRET_KEY: str = "change_me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = "root"
    DB_NAME: str = "finance"
    
    # AWS S3 Cloud Storage
    AWS_ACCESS_KEY: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = ""
    AWS_BUCKET_NAME: str = ""
    
    # ML Models
    WHISPER_MODEL: str = "base"
    TESSERACT_PATH: str = ""

    @property
    def PROJECT_ROOT(self) -> str:
        """Finds absolute path of project root directory."""
        return os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

    @property
    def UPLOAD_DIRECTORY(self) -> str:
        """Uploads folder directly at project root."""
        return os.path.join(self.PROJECT_ROOT, "uploads")

    @property
    def LOGS_DIR(self) -> str:
        """Logs folder directly at project root."""
        return os.path.join(self.PROJECT_ROOT, "logs")

    @property
    def MODELS_DIR(self) -> str:
        """Models checkpoints folder directly at project root."""
        return os.path.join(self.PROJECT_ROOT, "models")

    @property
    def EXPORTS_DIR(self) -> str:
        """Exports folder directly at project root."""
        return os.path.join(self.PROJECT_ROOT, "exports")

    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure directories exist immediately upon settings initialization
os.makedirs(settings.UPLOAD_DIRECTORY, exist_ok=True)
os.makedirs(settings.LOGS_DIR, exist_ok=True)
os.makedirs(settings.MODELS_DIR, exist_ok=True)
os.makedirs(settings.EXPORTS_DIR, exist_ok=True)
for sub in ["profile_images", "receipts", "audio", "exports"]:
    os.makedirs(os.path.join(settings.UPLOAD_DIRECTORY, sub), exist_ok=True)
