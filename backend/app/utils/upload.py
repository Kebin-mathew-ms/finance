import os
import uuid
import shutil
from typing import Optional
from fastapi import UploadFile
from app.config.config import settings

def save_upload(file: UploadFile, folder_type: str = "receipts") -> str:
    """
    Saves an uploaded file to the upload directory under a subfolder.
    Returns the relative path to the saved file.
    """
    # Create absolute base directory
    base_dir = os.path.abspath(settings.UPLOAD_DIRECTORY)
    target_dir = os.path.join(base_dir, folder_type)
    
    os.makedirs(target_dir, exist_ok=True)
    
    # Generate unique filename to avoid collision
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(target_dir, unique_filename)
    
    # Write file content
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Return relative path for database storage
    return f"{folder_type}/{unique_filename}"

def delete_upload(relative_path: Optional[str]) -> bool:
    """
    Deletes a file from the upload directory using its relative path.
    """
    if not relative_path:
        return False
        
    base_dir = os.path.abspath(settings.UPLOAD_DIRECTORY)
    file_path = os.path.join(base_dir, relative_path)
    
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            return True
        except OSError:
            return False
    return False
