import os
import re
import logging
from typing import Tuple, Optional, Dict, Any
from decimal import Decimal
from datetime import date
from app.models.expense import Expense
from app.repositories.expense_repository import ExpenseRepository
from sqlalchemy.orm import Session

# Safe imports for SpeechRecognition & Whisper
try:
    import speech_recognition as sr
except ImportError:
    sr = None

try:
    import whisper
except ImportError:
    whisper = None

logger = logging.getLogger("voice")

CATEGORY_KEYWORDS = {
    "Food": ["food", "restaurant", "lunch", "dinner", "breakfast", "groceries", "grocery", "cafe", "eat", "zomato", "swiggy", "dining"],
    "Bills": ["electricity", "water", "gas", "internet", "wifi", "bill", "electricity bill", "power", "utility", "recharge", "postpaid", "phone bill"],
    "Transportation": ["transport", "transportation", "metro", "bus", "cab", "taxi", "uber", "ola", "fuel", "petrol", "diesel", "auto", "train"],
    "Healthcare": ["health", "healthcare", "hospital", "medicine", "medicines", "doctor", "clinic", "pharmacy"],
    "Entertainment": ["movie", "movies", "show", "netflix", "game", "gaming", "entertainment", "concert", "play"],
    "Shopping": ["shop", "shopping", "clothes", "mall", "amazon", "flipkart", "myntra"],
    "Education": ["education", "school", "college", "fees", "book", "books", "tuition"],
    "Insurance": ["insurance", "premium"],
    "Investment": ["invest", "investment", "stock", "stocks", "mutual fund", "shares"]
}

class VoiceService:
    def __init__(self, db: Session):
        self.db = db
        self.expense_repo = ExpenseRepository(db)

    def transcribe_audio(self, audio_file_path: str) -> str:
        """Converts speech audio files to text using Whisper or SpeechRecognition fallback."""
        text = ""
        # 1. Try local Whisper model if installed
        if whisper:
            try:
                logger.info("Transcribing audio using Whisper model...")
                model = whisper.load_model("tiny")  # Load tiny model for speed & low memory footprint
                result = model.transcribe(audio_file_path)
                text = result.get("text", "").strip()
                if text:
                    logger.info(f"Whisper transcribed: '{text}'")
                    return text
            except Exception as e:
                logger.warning(f"Whisper transcription failed, falling back to SpeechRecognition: {str(e)}")

        # 2. Try SpeechRecognition as fallback
        if sr:
            try:
                logger.info("Transcribing audio using SpeechRecognition Google Web API...")
                recognizer = sr.Recognizer()
                with sr.AudioFile(audio_file_path) as source:
                    audio_data = recognizer.record(source)
                # Convert using Google speech converter
                text = recognizer.recognize_google(audio_data)
                logger.info(f"SpeechRecognition transcribed: '{text}'")
                return text
            except Exception as e:
                logger.error(f"SpeechRecognition failed: {str(e)}")
                raise RuntimeError(f"Speech transcription failed: {str(e)}")

        raise ImportError("Neither openai-whisper nor speech_recognition packages are accessible.")

    def parse_expense_command(self, text: str) -> Dict[str, Any]:
        """Extracts amounts, category keyword associations, and descriptions from audio text."""
        # 1. Extract Amount
        # Matches patterns: 300 rupees, 1200 rupees, 500 dollars, rs 500, 300.50
        amount_patterns = [
            r'(?:rs|inr|usd|\$|₹)\s*(\d+(?:\.\d{2})?)',  # rs 500, $300
            r'(\d+(?:\.\d{2})?)\s*(?:rupees|rupee|rs|dollars|dollar|inr|bucks|buck)?' # 300 rupees
        ]
        
        amount = None
        for pattern in amount_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                # Pick the first valid decimal number
                try:
                    amount = Decimal(matches[0])
                    break
                except Exception:
                    continue

        if not amount:
            amount = Decimal("0.00")

        # 2. Extract Category
        category = "Other"
        matched_cat = False
        for cat, keywords in CATEGORY_KEYWORDS.items():
            for kw in keywords:
                if re.search(r'\b' + re.escape(kw) + r'\b', text, re.IGNORECASE):
                    category = cat
                    matched_cat = True
                    break
            if matched_cat:
                break

        # 3. Create Description
        # Clean description by capitalizing and trimming
        description = text.strip()
        if description:
            description = description[0].upper() + description[1:]
        else:
            description = "Voice-created expense"

        return {
            "amount": amount,
            "category": category,
            "description": description
        }

    def process_voice_expense(self, user_id: int, audio_file_path: str) -> Expense:
        """Transcribes, parses, and creates the expense record in the database."""
        # 1. Transcribe audio to text
        text = self.transcribe_audio(audio_file_path)
        if not text:
            raise ValueError("No speech could be transcribed from the audio clip.")

        # 2. Extract parameters
        parsed = self.parse_expense_command(text)
        
        # 3. Create expense model
        title = f"Voice: {parsed['category']} Expense"
        expense = Expense(
            user_id=user_id,
            title=title,
            category=parsed["category"],
            amount=parsed["amount"],
            description=parsed["description"],
            expense_date=date.today()
        )
        
        return self.expense_repo.create(expense)
