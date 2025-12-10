"""
Enhanced Resume Rewriter
Orchestrates full resume rewrites using AI (Gemini or OpenAI) with layout schema.
"""

import os
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)


class ResumeRewriter:
    def __init__(self):
        """Initialize rewriter with AI client (Gemini or OpenAI)."""
        # Ensure environment variables are loaded
        from dotenv import load_dotenv
        from pathlib import Path
        env_path = Path(__file__).parent.parent.parent.parent / '.env'
        load_dotenv(dotenv_path=env_path)
        
        ai_provider = os.getenv("AI_PROVIDER", "gemini").lower()
        
        logger.info(f"Initializing ResumeRewriter with AI_PROVIDER={ai_provider}")
        
        try:
            if ai_provider == "openai":
                from .openai_client import OpenAIClient
                self.ai_client = OpenAIClient()
                logger.info("ResumeRewriter initialized with OpenAI")
            else:
                from .gemini_client import GeminiClient
                self.ai_client = GeminiClient()
                logger.info("ResumeRewriter initialized with Gemini")
            
            self.has_gemini = True  # Keep for compatibility
        except Exception as e:
            logger.error(f"Failed to initialize AI client: {e}", exc_info=True)
            self.ai_client = None
            self.has_gemini = False
            raise RuntimeError(f"AI client initialization failed: {e}")
    
    def rewrite_full_resume(
        self,
        layout_schema: Dict[str, Any],
        job_description: str,
        target_keywords: List[str]
    ) -> Dict[str, Any]:
        """
        Rewrite entire resume using layout schema.
        
        Args:
            layout_schema: Structured resume schema
            job_description: Target job description
            target_keywords: Keywords to integrate
            
        Returns:
            Rewritten schema and delta report
        """
        if not self.has_gemini:
            raise RuntimeError("Gemini client not available")
        
        rewritten_schema = layout_schema.copy()
        rewritten_schema["sections"] = []
        explanations = []
        changes = []
        
        # Process each section
        for idx, section in enumerate(layout_schema.get("sections", [])):
            section_type = section.get("type")
            
            logger.info(f"Processing section {idx}: {section_type}")
            
            if section_type == "EXPERIENCE":
                # Rewrite each experience entry
                rewritten_entries = []
                for entry_idx, entry in enumerate(section.get("entries", [])):
                    try:
                        result = self.ai_client.rewrite_experience_entry(
                            entry,
                            job_description,
                            target_keywords
                        )
                        
                        # Create rewritten entry
                        rewritten_entry = entry.copy()
                        original_bullets = entry.get("bullets", [])
                        rewritten_entry["bullets"] = result.get("bullets", original_bullets)
                        
                        rewritten_entries.append(rewritten_entry)
                        explanations.append(f"Experience {entry_idx + 1} ({entry.get('company', 'Unknown')}): {result.get('explanation', 'Rewritten')}")
                        
                        # Track changes
                        for i, (orig, new) in enumerate(zip(original_bullets, rewritten_entry["bullets"])):
                            if orig != new:
                                changes.append({
                                    "section": f"Experience - {entry.get('company', 'Unknown')}",
                                    "bullet_index": i,
                                    "original": orig,
                                    "rewritten": new
                                })
                    except Exception as e:
                        logger.error(f"Failed to rewrite experience entry {entry_idx}: {e}")
                        rewritten_entries.append(entry)
                        explanations.append(f"Experience {entry_idx + 1}: Failed to rewrite - {str(e)}")
                
                rewritten_section = section.copy()
                rewritten_section["entries"] = rewritten_entries
                rewritten_schema["sections"].append(rewritten_section)
            
            elif section_type == "SUMMARY":
                # Rewrite summary
                try:
                    result = self.ai_client.rewrite_summary(
                        section.get("raw", ""),
                        job_description,
                        target_keywords
                    )
                    
                    rewritten_section = section.copy()
                    original_content = section.get("raw", "")
                    rewritten_section["raw"] = result.get("content", original_content)
                    
                    rewritten_schema["sections"].append(rewritten_section)
                    explanations.append(f"Summary: {result.get('explanation', 'Rewritten')}")
                    
                    if original_content != rewritten_section["raw"]:
                        changes.append({
                            "section": "Summary",
                            "original": original_content,
                            "rewritten": rewritten_section["raw"]
                        })
                except Exception as e:
                    logger.error(f"Failed to rewrite summary: {e}")
                    rewritten_schema["sections"].append(section)
                    explanations.append(f"Summary: Failed to rewrite - {str(e)}")
            
            elif section_type == "SKILLS":
                # Rewrite skills
                try:
                    result = self.ai_client.rewrite_skills(
                        section.get("raw", ""),
                        job_description,
                        target_keywords
                    )
                    
                    rewritten_section = section.copy()
                    original_content = section.get("raw", "")
                    rewritten_section["raw"] = result.get("content", original_content)
                    
                    rewritten_schema["sections"].append(rewritten_section)
                    explanations.append(f"Skills: {result.get('explanation', 'Rewritten')}")
                    
                    if original_content != rewritten_section["raw"]:
                        changes.append({
                            "section": "Skills",
                            "original": original_content,
                            "rewritten": rewritten_section["raw"]
                        })
                except Exception as e:
                    logger.error(f"Failed to rewrite skills: {e}")
                    rewritten_schema["sections"].append(section)
                    explanations.append(f"Skills: Failed to rewrite - {str(e)}")
            
            else:
                # Keep other sections unchanged (CONTACT, EDUCATION, etc.)
                rewritten_schema["sections"].append(section)
                logger.info(f"Keeping {section_type} section unchanged")
        
        # Generate delta report
        delta_report = self._generate_delta_report(
            layout_schema,
            rewritten_schema,
            changes,
            target_keywords
        )
        
        return {
            "rewritten_schema": rewritten_schema,
            "explanations": explanations,
            "delta_report": delta_report
        }
    
    def _generate_delta_report(
        self,
        original_schema: Dict[str, Any],
        rewritten_schema: Dict[str, Any],
        changes: List[Dict[str, Any]],
        target_keywords: List[str]
    ) -> Dict[str, Any]:
        """
        Generate before/after comparison report.
        
        Args:
            original_schema: Original layout schema
            rewritten_schema: Rewritten layout schema
            changes: List of changes made
            target_keywords: Target keywords
            
        Returns:
            Delta report dictionary
        """
        # Count keywords added
        original_text = self._schema_to_text(original_schema)
        rewritten_text = self._schema_to_text(rewritten_schema)
        
        keywords_added = []
        for keyword in target_keywords:
            if keyword.lower() not in original_text.lower() and keyword.lower() in rewritten_text.lower():
                keywords_added.append(keyword)
        
        return {
            "total_changes": len(changes),
            "changes_by_section": self._group_changes_by_section(changes),
            "keywords_added": keywords_added,
            "keywords_added_count": len(keywords_added),
            "sections_modified": len([c for c in changes if c.get("section")])
        }
    
    def _schema_to_text(self, schema: Dict[str, Any]) -> str:
        """Convert schema to plain text for keyword analysis."""
        text_parts = []
        
        for section in schema.get("sections", []):
            if section.get("type") == "EXPERIENCE":
                for entry in section.get("entries", []):
                    bullets = entry.get("bullets", [])
                    # Handle both list of strings and list of dicts
                    for bullet in bullets:
                        if isinstance(bullet, str):
                            text_parts.append(bullet)
                        elif isinstance(bullet, dict):
                            text_parts.append(bullet.get("content", ""))
            else:
                raw = section.get("raw", "")
                # Handle both string and dict responses
                if isinstance(raw, str):
                    text_parts.append(raw)
                elif isinstance(raw, dict):
                    text_parts.append(raw.get("content", ""))
        
        return " ".join(text_parts)
    
    def _group_changes_by_section(self, changes: List[Dict[str, Any]]) -> Dict[str, int]:
        """Group changes by section."""
        grouped = {}
        for change in changes:
            section = change.get("section", "Unknown")
            grouped[section] = grouped.get(section, 0) + 1
        return grouped
    
    def generate_optimization_prompt(self, resume_text: str, risks: List[str], missing_keywords: List[str] = None) -> str:
        """
        Generate a prompt to rewrite the resume (legacy method for compatibility).
        """
        prompt = f"""
You are an expert Resume Writer and ATS Optimization Specialist.
Your task is to rewrite the following resume to pass an Application Tracking System (ATS) with a high score.

### CRITICAL ISSUES TO FIX:
"""

        # Add specific instructions based on risks
        if "TALEO_TABLE_RISK" in risks:
            prompt += "- REMOVE all tables and columns. Use a standard single-column layout.\n"
        if "ICIMS_FRAGMENTATION_RISK" in risks:
            prompt += "- SIMPLIFY the layout. Avoid floating text boxes or complex formatting.\n"
        if "WORKDAY_PARSING_RISK" in risks:
            prompt += "- RENAME the 'Experience' section to exactly 'Work Experience'.\n"
        if "MISSING_EMAIL" in risks:
            prompt += "- ADD a placeholder for Email Address at the top.\n"
        if "POOR_SECTION_HEADERS" in risks:
            prompt += "- USE standard section headers: 'Summary', 'Work Experience', 'Education', 'Skills'.\n"
            
        if missing_keywords:
            prompt += f"\n### KEYWORDS TO INTEGRATE:\nPlease naturally integrate these missing keywords into the Summary or Skills section:\n{', '.join(missing_keywords)}\n"
            
        prompt += """
### FORMATTING RULES:
1. Use a clean, chronological format.
2. Use standard bullet points (•).
3. Do not use graphics, icons, or photos.
4. Ensure dates are in 'Month Year' format (e.g., 'Jan 2020').

### ORIGINAL RESUME CONTENT:
"""
        prompt += resume_text
        
        prompt += """


### OUTPUT:
Provide the rewritten resume text in Markdown format.
"""
        return prompt
