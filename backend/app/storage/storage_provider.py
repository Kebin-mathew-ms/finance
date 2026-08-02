import os
import shutil
import logging
from abc import ABC, abstractmethod
from typing import Optional
from app.config.config import settings

# Load boto3 only if S3 is requested, but let's import it safely to prevent import errors if not installed yet
try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:
    boto3 = None
    ClientError = None

logger = logging.getLogger("storage")

class StorageProvider(ABC):
    @abstractmethod
    def upload_file(self, file_content: bytes, file_name: str, subfolder: str) -> str:
        """Uploads a file to storage and returns the relative path / identifier."""
        pass

    @abstractmethod
    def delete_file(self, relative_path: str) -> bool:
        """Deletes a file from storage."""
        pass

    @abstractmethod
    def get_file_bytes(self, relative_path: str) -> bytes:
        """Fetches the raw bytes of a file from storage."""
        pass


class LocalStorageProvider(StorageProvider):
    def __init__(self, base_directory: str = settings.UPLOAD_DIRECTORY):
        self.base_dir = os.path.abspath(base_directory)
        os.makedirs(self.base_dir, exist_ok=True)

    def _get_absolute_path(self, relative_path: str) -> str:
        # Prevent directory traversal attacks
        abs_path = os.path.abspath(os.path.join(self.base_dir, relative_path))
        if not abs_path.startswith(self.base_dir):
            raise ValueError("Directory traversal attempt detected.")
        return abs_path

    def upload_file(self, file_content: bytes, file_name: str, subfolder: str) -> str:
        subfolder_path = os.path.join(self.base_dir, subfolder)
        os.makedirs(subfolder_path, exist_ok=True)
        
        target_path = os.path.join(subfolder_path, file_name)
        with open(target_path, "wb") as f:
            f.write(file_content)
            
        # Return path relative to settings.UPLOAD_DIRECTORY
        return os.path.join(subfolder, file_name).replace("\\", "/")

    def delete_file(self, relative_path: str) -> bool:
        try:
            abs_path = self._get_absolute_path(relative_path)
            if os.path.exists(abs_path):
                os.remove(abs_path)
                return True
            return False
        except Exception as e:
            logger.error(f"Local delete failed for {relative_path}: {str(e)}")
            return False

    def get_file_bytes(self, relative_path: str) -> bytes:
        abs_path = self._get_absolute_path(relative_path)
        if not os.path.exists(abs_path):
            raise FileNotFoundError(f"File not found: {relative_path}")
        with open(abs_path, "rb") as f:
            return f.read()


class S3StorageProvider(StorageProvider):
    def __init__(self):
        if not boto3:
            raise ImportError("boto3 package is not installed.")
        
        # Load parameters from environment variables/settings
        self.access_key = os.getenv("AWS_ACCESS_KEY", "")
        self.secret_key = os.getenv("AWS_SECRET_ACCESS_KEY", "")
        self.region = os.getenv("AWS_REGION", "us-east-1")
        self.bucket_name = os.getenv("AWS_BUCKET_NAME", "")

        # Check AWS credentials presence
        if not self.bucket_name:
            raise ValueError("AWS_BUCKET_NAME environment variable is not defined.")

        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region
        )

    def upload_file(self, file_content: bytes, file_name: str, subfolder: str) -> str:
        s3_key = f"{subfolder}/{file_name}".replace("\\", "/")
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content
            )
            return s3_key
        except ClientError as e:
            logger.error(f"S3 upload failed for {s3_key}: {str(e)}")
            raise RuntimeError(f"Cloud upload failed: {str(e)}")

    def delete_file(self, relative_path: str) -> bool:
        s3_key = relative_path.replace("\\", "/")
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError as e:
            logger.error(f"S3 delete failed for {s3_key}: {str(e)}")
            return False

    def get_file_bytes(self, relative_path: str) -> bytes:
        s3_key = relative_path.replace("\\", "/")
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=s3_key)
            return response["Body"].read()
        except ClientError as e:
            logger.error(f"S3 get bytes failed for {s3_key}: {str(e)}")
            raise FileNotFoundError(f"S3 file not found: {s3_key}")


def get_storage_provider() -> StorageProvider:
    """Factory function returning active StorageProvider based on settings."""
    provider_type = os.getenv("STORAGE_PROVIDER", "LOCAL").upper()
    if provider_type == "S3":
        try:
            return S3StorageProvider()
        except Exception as e:
            logger.warning(f"Failed to initialize S3 provider, falling back to LOCAL: {str(e)}")
            return LocalStorageProvider()
    return LocalStorageProvider()
