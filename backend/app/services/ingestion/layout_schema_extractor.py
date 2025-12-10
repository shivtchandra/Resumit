"""
Layout Schema Extractor
Converts parsed resume data into structured schema for rewriting and reconstruction.
"""

from typing import Dict, Any, List
import re
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class LayoutSchemaExtractor:
    def __init__(self):
        self.section_patterns = {
            "CONTACT": r"(email|phone|linkedin|github|address)",
            "SUMMARY": r"(summary|profile|objective|about)",
            "EXPERIENCE": r"(experience|employment|work history|professional experience)",
            "EDUCATION": r"(education|academic|degree)",
            "SKILLS": r"(skills|technical skills|competencies|technologies)",
            "PROJECTS": r"(projects|portfolio)",
            "CERTIFICATIONS": r"(certifications|certificates|licenses)"
        }
    
    def extract_from_parsed_data(self, parsing_result: Dict[str, Any], filename: str) -> Dict[str, Any]:
        """
        Extract layout schema from parsed PDF/DOCX data.
        
        Args:
            parsing_result: Result from PDFParser or DOCXParser
            filename: Original filename
            
        Returns:
            Layout schema dictionary
        """
        text = parsing_result.get("raw_text", "")
        
        # Split into sections
        sections = self._identify_sections(text)
        
        # Build schema
        schema = {
            "filename": filename,
            "sections": sections,
            "visual_layout": {
                "font_sizes": {},
                "column_count": 2 if parsing_result.get("has_multi_column", False) else 1,
                "has_tables": parsing_result.get("has_tables", False)
            },
            "metadata": {
                "page_count": parsing_result.get("page_count", 1),
                "file_size_bytes": parsing_result.get("file_size_bytes", 0),
                "is_image_based": parsing_result.get("is_image_based", False)
            }
        }
        
        return schema
    
    def _identify_sections(self, text: str) -> List[Dict[str, Any]]:
        """
        Identify and parse sections from resume text.
        """
        sections = []
        lines = text.split('\n')
        current_section = None
        current_content = []
        pos = 0
        
        for line in lines:
            line_stripped = line.strip()
            if not line_stripped:
                continue
            
            # Check if this line is a section header
            section_type = self._detect_section_type(line_stripped)
            
            if section_type:
                # Save previous section
                if current_section:
                    sections.append(self._build_section(current_section, '\n'.join(current_content), pos))
                    pos += 1
                
                # Start new section
                current_section = section_type
                current_content = []
            else:
                current_content.append(line)
        
        # Add last section
        if current_section:
            sections.append(self._build_section(current_section, '\n'.join(current_content), pos))
        
        return sections
    
    def _detect_section_type(self, line: str) -> str:
        """
        Detect if a line is a section header.
        """
        line_lower = line.lower()
        
        for section_type, pattern in self.section_patterns.items():
            if re.search(pattern, line_lower, re.IGNORECASE):
                # Check if it's likely a header (short, possibly all caps)
                if len(line) < 50 and (line.isupper() or line.istitle()):
                    return section_type
        
        return None
    
    def _build_section(self, section_type: str, content: str, pos: int) -> Dict[str, Any]:
        """
        Build section dictionary based on type.
        """
        section = {
            "type": section_type,
            "pos": pos
        }
        
        if section_type == "EXPERIENCE":
            section["entries"] = self._parse_experience_entries(content)
        elif section_type == "EDUCATION":
            section["entries"] = self._parse_education_entries(content)
        elif section_type == "CONTACT":
            section["raw"] = content.strip()
            section["parsed"] = self._parse_contact_info(content)
        else:
            section["raw"] = content.strip()
        
        return section
    
    def _parse_experience_entries(self, content: str) -> List[Dict[str, Any]]:
        """
        Parse experience section into individual job entries.
        Enhanced to detect bullets by indentation and numbered lists.
        """
        entries = []
        lines = content.split('\n')
        current_entry = None
        
        for i, line in enumerate(lines):
            line_stripped = line.strip()
            if not line_stripped:
                continue
            
            # Check if this is a new job entry (contains company or title)
            if self._looks_like_job_header(line_stripped):
                if current_entry:
                    entries.append(current_entry)
                
                # Parse header
                parsed = self._parse_job_header(line_stripped)
                current_entry = {
                    "company": parsed.get("company", "Unknown Company"),
                    "title": parsed.get("title", "Unknown Title"),
                    "start": parsed.get("start", ""),
                    "end": parsed.get("end", "Present"),
                    "bullets": [],
                    "meta": {}
                }
            elif current_entry:
                # Check if this is a bullet point (multiple detection methods)
                is_bullet = False
                bullet_text = line_stripped
                
                # Method 1: Explicit markers (•, -, *, ○, ▪)
                if line_stripped.startswith(('•', '-', '*', '○', '▪', '►', '–', '—')):
                    is_bullet = True
                    bullet_text = line_stripped.lstrip('•-*○▪►–— ').strip()
                
                # Method 2: Numbered lists (1., 2., etc.)
                elif re.match(r'^\d+\.\s+', line_stripped):
                    is_bullet = True
                    bullet_text = re.sub(r'^\d+\.\s+', '', line_stripped)
                
                # Method 3: Indentation-based detection
                elif self._detect_bullet_by_indentation(line, lines, i):
                    is_bullet = True
                    bullet_text = line_stripped
                
                # Method 4: ULTRA-AGGRESSIVE - Any line that's not a header is a bullet
                # This catches content even when formatting is completely lost
                elif len(line_stripped) > 15 and not self._looks_like_job_header(line_stripped):
                    is_bullet = True
                    bullet_text = line_stripped
                
                if is_bullet:
                    current_entry["bullets"].append(bullet_text)
                elif current_entry["bullets"]:
                    # Continuation of previous bullet
                    current_entry["bullets"][-1] += " " + line_stripped
        
        if current_entry:
            entries.append(current_entry)
        
        # ULTRA-AGGRESSIVE FALLBACK: If entries have no bullets, split content by sentences
        for entry in entries:
            if not entry["bullets"]:
                # Try to extract from the raw content between this entry and the next
                logger.warning(f"No bullets found for {entry.get('company')}, using aggressive fallback")
                # Split the remaining content into sentences and treat as bullets
                content_lines = [l.strip() for l in content.split('\n') if l.strip() and len(l.strip()) > 20]
                if content_lines:
                    entry["bullets"] = content_lines[:5]  # Take up to 5 lines as bullets
        
        return entries
    
    def _looks_like_job_header(self, line: str) -> bool:
        """
        Check if line looks like a job header.
        Enhanced with more patterns and company name detection.
        """
        # Contains date pattern (more flexible)
        date_pattern = r'\b(\d{4}|\d{1,2}/\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|Current)\b'
        if re.search(date_pattern, line, re.IGNORECASE):
            return True
        
        # Contains common title words
        title_words = [
            'engineer', 'developer', 'manager', 'analyst', 'consultant', 'designer', 'director',
            'intern', 'associate', 'specialist', 'coordinator', 'lead', 'senior', 'junior',
            'architect', 'scientist', 'researcher', 'administrator', 'officer', 'assistant',
            'volunteer', 'founder', 'ceo', 'cto', 'vp'
        ]
        if any(word in line.lower() for word in title_words):
            return True
        
        # Contains company suffixes
        company_patterns = r'\b(Inc\.|LLC|Corp\.|Ltd\.|Co\.|Company|Corporation|Technologies|Solutions|Systems)\b'
        if re.search(company_patterns, line, re.IGNORECASE):
            return True
        
        return False
    
    def _parse_job_header(self, line: str) -> Dict[str, str]:
        """
        Parse job header line to extract company, title, dates.
        """
        result = {}
        
        # Extract dates (various formats)
        date_pattern = r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*(\d{4})\s*[-–—to]*\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December|Present|Current)?\s*(\d{4})?'
        date_match = re.search(date_pattern, line, re.IGNORECASE)
        
        if date_match:
            start_month = date_match.group(1) or ""
            start_year = date_match.group(2)
            end_month = date_match.group(3) or "Present"
            end_year = date_match.group(4) or ""
            
            result["start"] = f"{start_month} {start_year}".strip() if start_month else start_year
            result["end"] = f"{end_month} {end_year}".strip() if end_year else end_month
            
            # Remove dates from line for further parsing
            line = line[:date_match.start()] + line[date_match.end():]
        
        # Split remaining by common separators
        parts = re.split(r'[|,—–-]', line)
        parts = [p.strip() for p in parts if p.strip()]
        
        if len(parts) >= 2:
            result["title"] = parts[0]
            result["company"] = parts[1]
        elif len(parts) == 1:
            result["title"] = parts[0]
            result["company"] = "Unknown Company"
        
        return result
    
    def _parse_education_entries(self, content: str) -> List[Dict[str, Any]]:
        """
        Parse education section into individual entries.
        """
        entries = []
        lines = content.split('\n')
        current_entry = None
        
        for line in lines:
            line_stripped = line.strip()
            if not line_stripped:
                continue
            
            # Check for degree keywords
            if any(keyword in line_stripped.lower() for keyword in ['bachelor', 'master', 'phd', 'b.s.', 'm.s.', 'b.a.', 'm.a.']):
                if current_entry:
                    entries.append(current_entry)
                
                current_entry = {
                    "degree": line_stripped,
                    "institution": "",
                    "year": "",
                    "details": []
                }
            elif current_entry:
                # Try to extract year
                year_match = re.search(r'\b(19|20)\d{2}\b', line_stripped)
                if year_match:
                    current_entry["year"] = year_match.group(0)
                
                # Assume institution if not set
                if not current_entry["institution"] and not year_match:
                    current_entry["institution"] = line_stripped
                else:
                    current_entry["details"].append(line_stripped)
        
        if current_entry:
            entries.append(current_entry)
        
        return entries
    
    def _parse_contact_info(self, content: str) -> Dict[str, str]:
        """
        Extract contact information.
        """
        contact = {}
        
        # Email
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', content)
        if email_match:
            contact["email"] = email_match.group(0)
        
        # Phone
        phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', content)
        if phone_match:
            contact["phone"] = phone_match.group(0)
        
        # LinkedIn
        linkedin_match = re.search(r'linkedin\.com/in/[\w-]+', content, re.IGNORECASE)
        if linkedin_match:
            contact["linkedin"] = linkedin_match.group(0)
        
        # GitHub
        github_match = re.search(r'github\.com/[\w-]+', content, re.IGNORECASE)
        if github_match:
            contact["github"] = github_match.group(0)
        
        return contact
    
    def _detect_bullet_by_indentation(self, line: str, all_lines: List[str], current_index: int) -> bool:
        """
        Detect if a line is a bullet point based on indentation.
        Uses aggressive detection strategy.
        """
        # Skip if line is too short (likely not a bullet)
        if len(line.strip()) < 10:
            return False
        
        # Check if line starts with significant indentation (2+ spaces or tab)
        if line.startswith('  ') or line.startswith('\t'):
            # Additional check: line should not be too long (likely a paragraph)
            if len(line.strip()) < 200:
                return True
        
        # Check if previous line was a header and this line is indented
        if current_index > 0:
            prev_line = all_lines[current_index - 1].strip()
            if self._looks_like_job_header(prev_line) and line.startswith(' '):
                return True
        
        return False
