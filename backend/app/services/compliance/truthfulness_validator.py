"""
Truthfulness Validator
Validates rewritten content against source to prevent hallucination.
"""

import re
import logging
from typing import Dict, Any, List, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)


class TruthfulnessValidator:
    def __init__(self):
        """Initialize truthfulness validator."""
        self.date_pattern = re.compile(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*(\d{4})\b', re.IGNORECASE)
        self.number_pattern = re.compile(r'\b\d+(?:\.\d+)?%?\b')
    
    def validate_experience_entry(
        self,
        original_entry: Dict[str, Any],
        rewritten_entry: Dict[str, Any]
    ) -> Tuple[bool, List[str]]:
        """
        Validate that rewritten experience entry maintains truthfulness.
        
        Args:
            original_entry: Original experience entry
            rewritten_entry: Rewritten experience entry
            
        Returns:
            Tuple of (is_valid, list of violations)
        """
        violations = []
        
        # Check company name unchanged
        if original_entry.get("company") != rewritten_entry.get("company"):
            violations.append(f"Company name changed: '{original_entry.get('company')}' → '{rewritten_entry.get('company')}'")
        
        # Check title unchanged
        if original_entry.get("title") != rewritten_entry.get("title"):
            violations.append(f"Job title changed: '{original_entry.get('title')}' → '{rewritten_entry.get('title')}'")
        
        # Check dates unchanged
        if original_entry.get("start") != rewritten_entry.get("start"):
            violations.append(f"Start date changed: '{original_entry.get('start')}' → '{rewritten_entry.get('start')}'")
        
        if original_entry.get("end") != rewritten_entry.get("end"):
            violations.append(f"End date changed: '{original_entry.get('end')}' → '{rewritten_entry.get('end')}'")
        
        # Check bullet count unchanged
        original_bullets = original_entry.get("bullets", [])
        rewritten_bullets = rewritten_entry.get("bullets", [])
        
        if len(original_bullets) != len(rewritten_bullets):
            violations.append(f"Bullet count changed: {len(original_bullets)} → {len(rewritten_bullets)}")
        
        # Check for invented metrics
        original_numbers = self._extract_numbers(original_bullets)
        rewritten_numbers = self._extract_numbers(rewritten_bullets)
        
        new_numbers = [n for n in rewritten_numbers if n not in original_numbers]
        if new_numbers:
            violations.append(f"New metrics invented: {new_numbers}")
        
        is_valid = len(violations) == 0
        
        if not is_valid:
            logger.warning(f"Truthfulness violations detected: {violations}")
        
        return is_valid, violations
    
    def validate_full_resume(
        self,
        original_schema: Dict[str, Any],
        rewritten_schema: Dict[str, Any]
    ) -> Tuple[bool, Dict[str, List[str]]]:
        """
        Validate entire rewritten resume.
        
        Args:
            original_schema: Original layout schema
            rewritten_schema: Rewritten layout schema
            
        Returns:
            Tuple of (is_valid, violations by section)
        """
        all_violations = {}
        
        # Get sections
        original_sections = {s.get("type"): s for s in original_schema.get("sections", [])}
        rewritten_sections = {s.get("type"): s for s in rewritten_schema.get("sections", [])}
        
        # Validate EXPERIENCE sections
        if "EXPERIENCE" in original_sections and "EXPERIENCE" in rewritten_sections:
            original_entries = original_sections["EXPERIENCE"].get("entries", [])
            rewritten_entries = rewritten_sections["EXPERIENCE"].get("entries", [])
            
            if len(original_entries) != len(rewritten_entries):
                all_violations["EXPERIENCE"] = [f"Entry count changed: {len(original_entries)} → {len(rewritten_entries)}"]
            else:
                for i, (orig, rewr) in enumerate(zip(original_entries, rewritten_entries)):
                    is_valid, violations = self.validate_experience_entry(orig, rewr)
                    if not is_valid:
                        all_violations[f"EXPERIENCE_ENTRY_{i}"] = violations
        
        # Validate EDUCATION sections (should be unchanged)
        if "EDUCATION" in original_sections and "EDUCATION" in rewritten_sections:
            orig_edu = original_sections["EDUCATION"]
            rewr_edu = rewritten_sections["EDUCATION"]
            
            # Education should not be rewritten
            if orig_edu != rewr_edu:
                all_violations["EDUCATION"] = ["Education section was modified (should remain unchanged)"]
        
        # Validate CONTACT sections (should be unchanged)
        if "CONTACT" in original_sections and "CONTACT" in rewritten_sections:
            orig_contact = original_sections["CONTACT"]
            rewr_contact = rewritten_sections["CONTACT"]
            
            # Contact should not be rewritten
            if orig_contact.get("raw") != rewr_contact.get("raw"):
                all_violations["CONTACT"] = ["Contact section was modified (should remain unchanged)"]
        
        is_valid = len(all_violations) == 0
        
        return is_valid, all_violations
    
    def _extract_numbers(self, bullets: List[str]) -> List[str]:
        """
        Extract all numbers/metrics from bullets.
        
        Args:
            bullets: List of bullet points
            
        Returns:
            List of extracted numbers
        """
        numbers = []
        for bullet in bullets:
            matches = self.number_pattern.findall(bullet)
            numbers.extend(matches)
        return numbers
    
    def check_for_hallucination(
        self,
        original_text: str,
        rewritten_text: str,
        suspicious_phrases: List[str] = None
    ) -> Tuple[bool, List[str]]:
        """
        Check for potential hallucinations in rewritten text.
        
        Args:
            original_text: Original text
            rewritten_text: Rewritten text
            suspicious_phrases: Optional list of phrases to flag
            
        Returns:
            Tuple of (has_hallucination, list of suspicious additions)
        """
        if suspicious_phrases is None:
            suspicious_phrases = [
                "led team of",
                "managed team of",
                "increased revenue by",
                "reduced costs by",
                "improved performance by",
                "achieved",
                "awarded",
                "certified in"
            ]
        
        suspicious_additions = []
        
        for phrase in suspicious_phrases:
            # Check if phrase appears in rewritten but not in original
            if phrase.lower() in rewritten_text.lower() and phrase.lower() not in original_text.lower():
                # Extract context around the phrase
                idx = rewritten_text.lower().find(phrase.lower())
                context_start = max(0, idx - 50)
                context_end = min(len(rewritten_text), idx + len(phrase) + 50)
                context = rewritten_text[context_start:context_end]
                
                suspicious_additions.append({
                    "phrase": phrase,
                    "context": context.strip()
                })
        
        has_hallucination = len(suspicious_additions) > 0
        
        if has_hallucination:
            logger.warning(f"Potential hallucinations detected: {len(suspicious_additions)} suspicious phrases")
        
        return has_hallucination, suspicious_additions
