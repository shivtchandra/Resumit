import pytesseract
from PIL import Image
import fitz  # PyMuPDF
import io
import logging

logger = logging.getLogger(__name__)

class OCREngine:
    def __init__(self):
        pass

    def extract_from_image_pdf(self, file_bytes: bytes):
        """
        Extract text from image-based PDF using OCR (Tesseract).
        This handles scanned resumes that have no embedded text.
        """
        try:
            doc = fitz.open(stream=io.BytesIO(file_bytes), filetype="pdf")
            extracted_text = ""
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                # Convert PDF page to image
                pix = page.get_pixmap(dpi=300)  # High DPI for better OCR
                img_data = pix.tobytes("png")
                img = Image.open(io.BytesIO(img_data))
                
                # Run OCR
                page_text = pytesseract.image_to_string(img)
                extracted_text += page_text + "\n"
            
            return {
                "text": extracted_text,
                "page_count": len(doc),
                "ocr_confidence": "medium"  # Tesseract doesn't provide confidence by default
            }
        
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            return {
                "text": "",
                "page_count": 0,
                "ocr_confidence": "failed",
                "error": str(e)
            }
