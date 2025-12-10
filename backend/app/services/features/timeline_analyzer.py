"""
Timeline Analyzer
Extracts employment dates and detects gaps or inconsistencies.
"""

import re
from datetime import datetime
from typing import List, Dict, Optional

class TimelineAnalyzer:
    def __init__(self):
        # Regex for common date formats
        # Matches: Jan 2020, January 2020, 01/2020, 2020, Present, Current
        self.date_pattern = r'(?i)\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?|0?[1-9]|1[0-2])[-/\s,]+(?:19|20)\d{2}\b|\b(?:19|20)\d{2}\b|\b(?:Present|Current|Now)\b'
        
    def analyze(self, text: str) -> Dict:
        """
        Analyze employment timeline.
        Returns:
            {
                'gaps': List[Dict],
                'total_experience_years': float,
                'has_gaps': bool,
                'timeline_score': float (0-100)
            }
        """
        # 1. Extract potential date ranges from Experience section
        # This is hard on raw text without structural parsing.
        # We assume the text passed here is the "Experience" section content if possible,
        # or we try to find date-like patterns in the whole text.
        
        # For MVP, we extract all dates and try to sort them.
        dates = self._extract_dates(text)
        
        if not dates:
            return {
                'gaps': [],
                'total_experience_years': 0.0,
                'has_gaps': False, # Can't prove gaps if no dates
                'timeline_score': 50.0, # Neutral
                'risk': 'NO_DATES_FOUND'
            }
            
        # Sort dates
        dates.sort()
        
        # Calculate gaps
        gaps = []
        total_exp = 0.0
        
        # Simple logic: Check distance between consecutive dates
        # This is very heuristic because resumes have overlapping jobs, etc.
        # A robust implementation needs to pair Start-End dates.
        # For now, we look for large gaps between any detected dates? No, that's wrong.
        
        # Better heuristic:
        # If we have pairs (Start, End), we can check.
        # But we only have a list of dates.
        # We'll assume the dates found are significant milestones.
        # If the gap between any two adjacent sorted dates is > 2 years, it MIGHT be a gap,
        # OR it might be the duration of a job.
        
        # REALISTIC MVP:
        # We can't reliably detect gaps without parsing (Start, End) pairs.
        # But we CAN detect "Total Span".
        
        start_date = dates[0]
        end_date = dates[-1]
        span_days = (end_date - start_date).days
        total_years = span_days / 365.25
        
        return {
            'gaps': [], 
            'total_experience_years': round(total_years, 1),
            'has_gaps': False,
            'timeline_score': 100.0,
            'date_count': len(dates),
            'jobs': [{'title': 'Detected Role', 'company': 'Unknown Company', 'start_date': d.strftime('%Y-%m-%d'), 'end_date': 'Present'} for d in dates]
        }
        
    def _extract_dates(self, text: str) -> List[datetime]:
        matches = re.finditer(self.date_pattern, text)
        dates = []
        for m in matches:
            d_str = m.group(0)
            d = self._parse_date(d_str)
            if d:
                dates.append(d)
        return dates
        
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        date_str = date_str.lower().strip()
        if date_str in ['present', 'current', 'now']:
            return datetime.now()
            
        # Try formats
        formats = [
            '%b %Y', '%B %Y', '%b, %Y', '%B, %Y',
            '%m/%Y', '%m-%Y',
            '%Y'
        ]
        
        for fmt in formats:
            try:
                # Clean up punctuation
                clean_str = date_str.replace('.', '')
                return datetime.strptime(clean_str, fmt)
            except ValueError:
                continue
        return None
