import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.services.auth_service import get_current_user
from app.voice.voice_service import VoiceService
from app.storage.storage_provider import get_storage_provider
from app.schemas.expense import ExpenseResponse

router = APIRouter()

@router.post("/upload")
async def upload_voice_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Temporary upload endpoint for voice audio clips (WAV/MP3)."""
    from app.api.files.router import upload_file
    return await upload_file(file=file, folder="audio", current_user=current_user)

@router.post("/process", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def process_voice_expense_command(
    audio_path: str = Query(..., description="Relative path of uploaded audio command file"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Converts the uploaded audio clip to text, extracts parameters, and saves the Expense."""
    provider = get_storage_provider()
    
    # Check if local storage path is relative, get absolute path
    # whisper/sr needs a local file path to load audio
    from app.storage.storage_provider import LocalStorageProvider
    active_provider = get_storage_provider()
    
    # Resolve local audio path for the speech transcriber
    if isinstance(active_provider, LocalStorageProvider):
        try:
            absolute_audio_path = active_provider._get_absolute_path(audio_path)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file path."
            )
    else:
        # If cloud storage provider is S3, download the file bytes to a temp file on disk so transcription can access it locally
        import tempfile
        try:
            content = active_provider.get_file_bytes(audio_path)
            _, ext = os.path.splitext(audio_path)
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
                temp_file.write(content)
                absolute_audio_path = temp_file.name
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to load S3 audio content: {str(e)}"
            )

    try:
        voice_service = VoiceService(db)
        expense = voice_service.process_voice_expense(current_user.user_id, absolute_audio_path)
        
        # Clean up temporary temp file if S3 download was used
        if not isinstance(active_provider, LocalStorageProvider):
            try:
                os.remove(absolute_audio_path)
            except Exception:
                pass
                
        return expense
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Speech processing failed: {str(e)}"
        )
