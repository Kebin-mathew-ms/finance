import os
import uuid
import mimetypes
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import Response, StreamingResponse
from app.services.auth_service import get_current_user
from app.models.user import User
from app.storage.storage_provider import get_storage_provider

router = APIRouter()

# Validation parameters
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf", ".wav", ".mp3"}
ALLOWED_MIMETYPES = {"image/jpeg", "image/png", "application/pdf", "audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3"}

SIZE_LIMITS = {
    "image": 5 * 1024 * 1024,  # 5 MB
    "pdf": 10 * 1024 * 1024,   # 10 MB
    "audio": 20 * 1024 * 1024  # 20 MB
}

def get_file_category(extension: str) -> str:
    if extension in {".jpg", ".jpeg", ".png"}:
        return "image"
    elif extension == ".pdf":
        return "pdf"
    elif extension in {".wav", ".mp3"}:
        return "audio"
    return "other"

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Query("receipts", description="Target folder: profile_images, receipts, audio, exports"),
    current_user: User = Depends(get_current_user)
):
    """Uploads a file to local or cloud storage after strict size and type validation."""
    if folder not in {"profile_images", "receipts", "audio", "exports"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid target folder selection."
        )

    # 1. Validate file extension
    filename = file.filename
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension: {ext}. Allowed: {list(ALLOWED_EXTENSIONS)}"
        )

    # 2. Read content to validate size and mime type
    content = await file.read()
    file_size = len(content)

    # Validate Mime Type
    mime_type = file.content_type
    if not mime_type or mime_type not in ALLOWED_MIMETYPES:
        # Fallback to guessing if content_type header is missing
        guessed_type, _ = mimetypes.guess_type(filename)
        if not guessed_type or guessed_type not in ALLOWED_MIMETYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {mime_type or 'unknown'}"
            )
        mime_type = guessed_type

    # Validate size limits
    category = get_file_category(ext)
    limit = SIZE_LIMITS.get(category, 2 * 1024 * 1024)  # fallback 2MB
    if file_size > limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds limit of {limit // (1024*1024)}MB for category {category}."
        )

    # 3. Generate unique filename (Prevent filename overrides/collisions)
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    
    # 4. Upload via Storage Provider
    provider = get_storage_provider()
    relative_path = provider.upload_file(content, unique_filename, folder)
    
    return {
        "original_name": filename,
        "saved_path": relative_path,
        "file_size": file_size,
        "mime_type": mime_type
    }

@router.get("/{path:path}")
async def download_file(
    path: str,
    current_user: User = Depends(get_current_user)
):
    """Downloads/streams file contents from local or S3 storage."""
    provider = get_storage_provider()
    try:
        content = provider.get_file_bytes(path)
        # Guess mime type based on extension
        mime_type, _ = mimetypes.guess_type(path)
        if not mime_type:
            mime_type = "application/octet-stream"
            
        return Response(content=content, media_type=mime_type)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requested file does not exist in storage."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch file: {str(e)}"
        )

@router.delete("/{path:path}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    path: str,
    current_user: User = Depends(get_current_user)
):
    """Deletes a file from local or cloud storage."""
    provider = get_storage_provider()
    success = provider.delete_file(path)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File deletion failed or file does not exist."
        )
    return None
