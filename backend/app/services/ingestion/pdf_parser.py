import fitz  # PyMuPDF
from pdfminer.high_level import extract_text
from difflib import SequenceMatcher
import io
import logging
from typing import List

logger = logging.getLogger(__name__)

class PDFParser:
    def __init__(self):
        pass

    def parse(self, file_bytes: bytes):
        """
        Parses a PDF file and analyzes it for ATS risks.
        Returns a dictionary with extracted text and risk metrics.
        """
        stream = io.BytesIO(file_bytes)
        
        # 1. Stream Extraction (Simulating dumb ATS)
        try:
            stream_text = extract_text(stream)
        except Exception as e:
            logger.error(f"PDFMiner extraction failed: {e}")
            stream_text = ""

        # Reset stream for next reader
        stream.seek(0)
        
        # 2. Visual Extraction (Simulating human/modern reader)
        doc = fitz.open(stream=stream, filetype="pdf")
        visual_text = ""
        is_image_based = True
        total_text_len = 0
        extracted_urls = self._extract_hyperlinks(doc)
        
        for page in doc:
            # Using 'blocks' maintains layout/reading order better for complex PDFs
            blocks = page.get_text("blocks")
            # Sort blocks by vertical position, then horizontal position
            # (top-to-bottom, left-to-right)
            blocks.sort(key=lambda b: (b[1], b[0]))
            
            page_text = ""
            for block in blocks:
                # block[4] is the actual text
                if block[4]:
                    page_text += block[4] + "\n"
            
            visual_text += page_text
            if len(page_text.strip()) > 50:
                is_image_based = False
            total_text_len += len(page_text)

        # 3. Z-Order Analysis (Optimized similarity check)
        # SequenceMatcher.ratio() is generally faster than Levenshtein for large strings 
        # when used with the quick_ratio/real_quick_ratio heuristics.
        if not stream_text or not visual_text:
            similarity = 0.0
        elif abs(len(stream_text) - len(visual_text)) > (max(len(stream_text), len(visual_text)) * 0.8):
            # Short-circuit if lengths are extremely different (saves compute)
            similarity = 0.2
        else:
            # Limit sample size for extremely large PDFs to prevent CPU hang
            sample_limit = 50000 
            s1 = stream_text[:sample_limit]
            s2 = visual_text[:sample_limit]
            matcher = SequenceMatcher(None, s1, s2, autojunk=False)
            similarity = matcher.quick_ratio()
        
        z_order_diff_score = 1.0 - similarity # Higher is worse (0.0 to 1.0)

        # 4. Image-Based Check
        # If text length is very low but file exists, it's likely an image scan.
        if total_text_len < 100 and len(file_bytes) > 10000:
             is_image_based = True
             # Try OCR extraction
             from .ocr_engine import OCREngine
             ocr = OCREngine()
             ocr_result = ocr.extract_from_image_pdf(file_bytes)
             if ocr_result.get("text"):
                 stream_text = ocr_result["text"]
                 visual_text = ocr_result["text"]
                 logger.info("OCR extraction successful")

        # 5. Table Detection (CRITICAL - Whitepaper §1.3.1)
        has_tables = self._detect_tables(doc)
        table_count = self._count_tables(doc)

        # 6. Multi-Column Detection
        has_columns = self._detect_multi_column(doc)

        return {
            "raw_text": stream_text, # ATS sees this
            "visual_text": visual_text, # Human sees this
            "is_image_based": is_image_based,
            "z_order_diff_score": z_order_diff_score,
            "page_count": len(doc),
            "file_size_bytes": len(file_bytes),
            "has_tables": has_tables,
            "table_count": table_count,
            "has_multi_column": has_columns,
            "extracted_urls": extracted_urls,
        }
    
    def _detect_tables(self, doc):
        """Detect if PDF contains tables using PyMuPDF."""
        for page in doc:
            tables = page.find_tables()
            if tables and len(tables.tables) > 0:
                return True
        return False
    
    def _count_tables(self, doc):
        """Count total tables across all pages."""
        count = 0
        for page in doc:
            tables = page.find_tables()
            if tables:
                count += len(tables.tables)
        return count
    
    def _detect_multi_column(self, doc):
        """
        Heuristic: If text blocks are horizontally separated,
        it might be multi-column.
        """
        for page in doc:
            blocks = page.get_text("dict")["blocks"]
            x_positions = [b["bbox"][0] for b in blocks if "lines" in b]
            
            if len(x_positions) > 1:
                # Check if there are distinct clusters of x-positions
                x_positions.sort()
                gaps = [x_positions[i+1] - x_positions[i] for i in range(len(x_positions)-1)]
                if gaps and max(gaps) > 100:  # Significant horizontal gap
                    return True
        return False

    def _extract_hyperlinks(self, doc) -> List[str]:
        """Extract external hyperlinks embedded in the PDF (e.g., LinkedIn/GitHub URL behind anchor text)."""
        urls: List[str] = []
        seen = set()
        for page in doc:
            try:
                links = page.get_links()
            except Exception:
                continue
            for link in links:
                uri = (link or {}).get("uri")
                if not uri:
                    continue
                cleaned = str(uri).strip().rstrip(".,);")
                if not cleaned:
                    continue
                if not cleaned.startswith(("http://", "https://")) and "." in cleaned:
                    cleaned = f"https://{cleaned}"
                if cleaned in seen:
                    continue
                seen.add(cleaned)
                urls.append(cleaned)
        return urls[:40]
