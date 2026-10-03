import os
import re
import cv2
import numpy as np
import pytesseract
import logging
from PIL import Image
from io import BytesIO
from datetime import date, datetime
from decimal import Decimal
from typing import Tuple, Optional, Dict, Any

logger = logging.getLogger("ocr")

# Auto-detect Tesseract OCR path on Windows if not already in system PATH
tesseract_windows_paths = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"
]
for tpath in tesseract_windows_paths:
    if os.path.exists(tpath):
        pytesseract.pytesseract.tesseract_cmd = tpath
        break

COMMON_MERCHANTS = [
    "Walmart", "McDonald's", "McDonalds", "Starbucks", "Uber", "Amazon", "Target",
    "Shell", "Chevron", "Netflix", "Spotify", "Dmart", "Reliance", "Zomato",
    "Swiggy", "Decathlon", "App Store", "Google Play", "Apple Store", "Subway"
]

class OCRService:
    def preprocess_image(self, image_bytes: bytes) -> Image.Image:
        """Applies grayscale conversion, thresholding, and noise filtering to clean receipt text."""
        try:
            # Load PIL Image and convert to OpenCV numpy array
            pil_image = Image.open(BytesIO(image_bytes))
            img_np = np.array(pil_image)
            
            # Check color space channels
            if len(img_np.shape) == 3:
                # Convert RGB to BGR for OpenCV
                img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
                gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            else:
                gray = img_np
                
            # Resize image to improve OCR quality on small texts
            gray = cv2.resize(gray, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_CUBIC)
            
            # Apply adaptive thresholding to remove shadows and contrast variations
            thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
            
            # Apply blur to remove pixelated noise
            processed_np = cv2.medianBlur(thresh, 3)
            
            # Convert back to PIL Image
            return Image.fromarray(processed_np)
        except Exception as e:
            logger.error(f"Image preprocessing failed: {str(e)}")
            # Fallback to loading raw image
            return Image.open(BytesIO(image_bytes))

    def extract_text(self, image_bytes: bytes) -> Tuple[str, float]:
        """Runs image preprocessing and pytesseract to extract text and calculate OCR confidence."""
        try:
            cleaned_img = self.preprocess_image(image_bytes)
            
            # Extract plain text
            text = pytesseract.image_to_string(cleaned_img)
            
            # Extract character data to calculate average confidence
            data = pytesseract.image_to_data(cleaned_img, output_type=pytesseract.Output.DICT)
            confidences = [int(c) for c in data["conf"] if int(c) != -1]
            avg_char_conf = sum(confidences) / len(confidences) if confidences else 60.0
            
            return text, avg_char_conf
        except Exception as e:
            logger.error(f"Pytesseract extraction failed: {str(e)}")
            # Fallback to plain text extract directly
            try:
                img = Image.open(BytesIO(image_bytes))
                return pytesseract.image_to_string(img), 50.0
            except Exception as ex:
                logger.error(f"Fallback extraction failed: {str(ex)}")
                return "", 0.0

    def parse_receipt_text(self, text: str, initial_confidence: float) -> Dict[str, Any]:
        """Extracts merchant, transaction date, totals, taxes, currency via regular expressions."""
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        
        # 1. Parse Merchant Name
        merchant = None
        # Try finding common brands in the text lines
        for line in lines[:8]:  # usually at the top
            for m in COMMON_MERCHANTS:
                if re.search(r'\b' + re.escape(m) + r'\b', line, re.IGNORECASE):
                    merchant = m
                    break
            if merchant:
                break
        
        # Fallback to first non-empty line if no brand matches
        if not merchant and lines:
            merchant = lines[0]
            # Strip common trailing details
            merchant = re.sub(r'[^a-zA-Z0-9\s\.\&\-]', '', merchant).strip()
            # Truncate if first line is very long (usually first line is store name, short)
            if len(merchant) > 100:
                merchant = merchant[:100]

        # 2. Parse Transaction Date
        # Regex matching: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YY, "25 Aug 2026", "Aug 25, 2026"
        date_patterns = [
            r'(\d{4})[-/](\d{2})[-/](\d{2})',              # YYYY-MM-DD
            r'(\d{2})[-/](\d{2})[-/](\d{4})',              # DD/MM/YYYY or MM/DD/YYYY
            r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{4})',  # 25 Aug 2026
            r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{1,2})[\s,]+(\d{4})',  # Aug 25, 2026
            r'(\d{2})[-/](\d{2})[-/](\d{2})'              # DD/MM/YY
        ]
        MONTH_MAP = {"jan":1,"feb":2,"mar":3,"apr":4,"may":5,"jun":6,
                     "jul":7,"aug":8,"sep":9,"oct":10,"nov":11,"dec":12}

        tx_date = None
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                g1, g2, g3 = match.group(1), match.group(2), match.group(3)
                try:
                    # Named-month formats
                    if g1.isalpha():
                        # "Aug 25, 2026" format
                        month = MONTH_MAP.get(g1[:3].lower())
                        day = int(g2)
                        year = int(g3)
                    elif g2.isalpha():
                        # "25 Aug 2026" format
                        day = int(g1)
                        month = MONTH_MAP.get(g2[:3].lower())
                        year = int(g3)
                    elif len(g1) == 4:
                        # YYYY-MM-DD
                        year, month, day = int(g1), int(g2), int(g3)
                    elif len(g3) == 4:
                        # DD/MM/YYYY — swap month/day if month > 12
                        day, month, year = int(g1), int(g2), int(g3)
                        if month > 12:
                            day, month = month, day
                    else:
                        # DD/MM/YY — 2-digit year
                        day, month = int(g1), int(g2)
                        year = 2000 + int(g3)
                        if month > 12:
                            day, month = month, day

                    # Sanity check: year must be plausible (2000–2100)
                    if not (2000 <= year <= 2100):
                        continue
                    if not (1 <= month <= 12):
                        continue
                    tx_date = date(year, month, day)
                    break
                except (ValueError, TypeError):
                    continue

        # If no valid date found, fallback to current date
        if not tx_date:
            tx_date = date.today()

        # 3. Parse Currency
        currency = "INR"
        if "$" in text:
            currency = "USD"
        elif "€" in text:
            currency = "EUR"
        elif "£" in text:
            currency = "GBP"

        # 4. Parse Total & Tax Amount
        # Match lines containing total, sum, due, subtotal, balance
        total_patterns = [
            r'(?:total|total\s+due|grand\s+total|amount\s+due|net\s+total)\s*:?\s*(?:rs|usd|inr|eur|[$₹€])?\s*(\d+(?:\.\d{2})?)',
            r'(?:total|due|amount)\s*:?\s*(\d+(?:\.\d{2})?)'
        ]
        
        total_amount = None
        all_amounts = []
        
        # Scan text for all money patterns like \d+\.\d{2} to find max values
        money_matches = re.findall(r'(?:rs|usd|inr|[$₹€])?\s*(\d+\.\d{2})', text, re.IGNORECASE)
        if money_matches:
            all_amounts = [float(val) for val in money_matches]
            
        for pattern in total_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                try:
                    total_amount = Decimal(matches[-1])  # pick the last match which is usually the grand total
                    break
                except Exception:
                    continue
                    
        # Fallback total amount to largest decimal value found if pattern match failed
        if not total_amount and all_amounts:
            total_amount = Decimal(str(max(all_amounts)))
            
        if not total_amount:
            total_amount = Decimal("0.00")

        # Parse Tax Amount
        tax_patterns = [
            r'(?:tax|gst|vat|sales\s+tax)\s*:?\s*(?:rs|usd|inr|[$₹€])?\s*(\d+(?:\.\d{2})?)'
        ]
        tax_amount = None
        for pattern in tax_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    tax_amount = Decimal(match.group(1))
                    break
                except Exception:
                    continue
        if not tax_amount:
            tax_amount = Decimal("0.00")

        # 5. Calculate Confidence Score
        confidence = initial_confidence * 0.40  # 40% from char read accuracy
        if merchant and merchant != lines[0]:
            confidence += 20.0  # +20% for matching known brand
        else:
            confidence += 10.0
            
        if tx_date != date.today():
            confidence += 20.0  # +20% for extracting real date
            
        if total_amount > 0:
            confidence += 20.0  # +20% for extracting amount
            
        confidence = min(100.0, max(10.0, confidence))

        return {
            "merchant_name": merchant or "Unknown Merchant",
            "transaction_date": tx_date,
            "total_amount": total_amount,
            "tax_amount": tax_amount,
            "currency": currency,
            "confidence_score": Decimal(f"{confidence:.2f}")
        }
