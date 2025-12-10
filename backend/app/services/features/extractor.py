from .text_utils import extract_email, extract_phone, detect_sections
from .ner_extractor import NERExtractor
from .category_predictor import CategoryPredictor
from .timeline_analyzer import TimelineAnalyzer

class FeatureExtractor:
    def __init__(self):
        self.ner = NERExtractor()
        self.category_predictor = CategoryPredictor()
        self.timeline_analyzer = TimelineAnalyzer()

    def extract_features(self, parsing_result: dict) -> dict:
        """
        Extract features from parsing result.
        """
        raw_text = parsing_result.get("raw_text", "")
        
        # Basic Content Features
        email = extract_email(raw_text)
        phone = extract_phone(raw_text)
        sections = detect_sections(raw_text)
        
        # V3 Upgrade: NER & Category & Timeline
        ner_result = self.ner.extract_entities(raw_text)
        category_result = self.category_predictor.predict(raw_text)
        timeline_result = self.timeline_analyzer.analyze(raw_text)
        
        # Structural Features
        z_order_score = parsing_result.get("z_order_diff_score", 0)
        floating_objs = parsing_result.get("floating_object_count", 0)
        is_image = parsing_result.get("is_image_based", False)
        
        # Table Detection (Heuristic)
        # Check for high density of pipes '|' or tabs, which often indicate text-based tables
        has_text_tables = self._detect_text_tables(raw_text)
        
        # Risk Analysis
        risks = []
        if not email: risks.append("MISSING_EMAIL")
        if not phone: risks.append("MISSING_PHONE")
        if z_order_score > 0.5: risks.append("Z_ORDER_FRAGMENTATION")
        if floating_objs > 5: risks.append("FLOATING_OBJECTS")
        if is_image: risks.append("IMAGE_BASED_PDF")
        if len(sections) < 3: risks.append("POOR_SECTION_HEADERS")
        if has_text_tables: risks.append("DETECTED_TEXT_TABLES")
        
        # Timeline Risks
        if timeline_result.get('has_gaps'):
            risks.append("EMPLOYMENT_GAPS")
        if timeline_result.get('total_experience_years', 0) == 0 and len(sections) > 0:
             # Only flag if we found sections but no dates
             risks.append("NO_DATES_FOUND")

        # Vendor Quirks (Heuristic)
        vendor_risks = self._check_vendor_risks(raw_text, parsing_result)
        risks.extend(vendor_risks)

        return {
            "email_found": bool(email),
            "phone_found": bool(phone),
            "section_count": len(sections),
            "detected_sections": sections,
            "z_order_score": z_order_score,
            "floating_objects": floating_objs,
            "is_image_based": is_image,
            "risk_flags": risks,
            "word_count": len(raw_text.split()),
            # V3 Features
            "ner_skills": ner_result['skills'],
            "ner_entities": ner_result,
            "predicted_category": category_result['category'],
            "category_confidence": category_result['confidence'],
            "timeline": timeline_result,
            "raw_text": raw_text
        }

    def _detect_text_tables(self, text: str) -> bool:
        """Detect if text contains table-like structures (pipes, excessive tabs)."""
        lines = text.split('\n')
        pipe_lines = [line for line in lines if line.count('|') > 1]
        if len(pipe_lines) > 3:
            return True
        return False

    def _check_vendor_risks(self, text: str, parsing_result: dict) -> list:
        """Detect specific ATS vendor parsing risks."""
        risks = []
        
        # 1. Taleo Risk: Table Collapse
        # If we detect many "floating objects" or high z-order fragmentation, it might be a table issue.
        # Taleo hates tables.
        if parsing_result.get("floating_object_count", 0) > 5:
            risks.append("TALEO_TABLE_RISK")
            
        # 2. Greenhouse Risk: Header Ignoring
        # Greenhouse often strips headers/footers.
        # If email/phone are NOT in the main text body (we can't easily know this without layout coordinates,
        # but if we found them, we assume they are safe for now. If we DIDN'T find them, it's a MISSING_CONTACT risk).
        # We can flag if the text is very short but has "Page 1" etc, implying header issues?
        # For now, we use a proxy: if "Page" appears frequently but section count is low.
        if "Page" in text and len(parsing_result.get("images", [])) == 0:
             # Heuristic: If text-based but low section count, might be header parsing issue
             pass 

        # 3. iCIMS Risk: Fragmentation
        # iCIMS struggles with complex layouts.
        if parsing_result.get("z_order_diff_score", 0) > 0.5:
            risks.append("ICIMS_FRAGMENTATION_RISK")
            
        # 4. Workday Risk: Title Mapping
        # Workday requires standard job titles.
        # If we don't see standard section headers like "Experience", it fails.
        if "experience" not in text.lower() and "work history" not in text.lower():
            risks.append("WORKDAY_PARSING_RISK")
            
        return risks
