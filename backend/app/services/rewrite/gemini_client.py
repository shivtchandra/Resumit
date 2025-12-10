"""
Gemini API client for resume rewriting.
"""
import os
import json
import time
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Prompt templates
EXPERIENCE_PROMPT_HEADER = """You are an expert ATS optimization specialist. Your goal is to rewrite resume bullet points to maximize ATS score while maintaining authenticity.

OPTIMIZATION STRATEGY:
- Integrate target keywords naturally into bullet points
- Use strong action verbs (Led, Developed, Implemented, Optimized, etc.)
- Quantify achievements with metrics where possible
- Maintain the STAR format (Situation, Task, Action, Result)
- Keep bullets concise (1-2 lines each)
- Ensure technical accuracy and authenticity

KEYWORD INTEGRATION RULES:
- Only add keywords that are relevant to the actual work performed
- Use exact keyword phrases from target list when possible
- Integrate keywords naturally - avoid keyword stuffing
- If a keyword doesn't fit naturally, skip it

RESPONSE FORMAT (JSON):
{
  "bullets": ["Rewritten bullet 1", "Rewritten bullet 2", ...],
  "explanation": "Detailed notes (3-4 lines) on keywords integrated, metrics added, and key improvements made"
}
"""

SUMMARY_PROMPT_HEADER = """You are an expert ATS optimization specialist. Your goal is to create a compelling, keyword-optimized professional summary.

OPTIMIZATION STRATEGY:
- Lead with strongest qualifications matching the job description
- Integrate target keywords naturally throughout
- Highlight years of experience and key technical skills
- Include 2-3 quantifiable achievements if possible
- Keep to 3-4 lines maximum
- Use industry-standard terminology

RESPONSE FORMAT (JSON):
{
  "content": "Optimized 3-4 line summary with integrated keywords",
  "explanation": "Detailed notes (3-4 lines) on keywords integrated, positioning strategy, and key enhancements made"
}
"""

SKILLS_PROMPT_HEADER = """You are an expert ATS optimization specialist. Your goal is to create a comprehensive, keyword-optimized skills section.

OPTIMIZATION STRATEGY:
- Reorganize skills to prioritize those matching the job description
- Add relevant keywords from target list that can be reasonably inferred from experience
- Group skills logically (e.g., "Programming Languages:", "Frameworks:", "Tools:")
- Include variations and synonyms (e.g., "JS" -> "JavaScript (JS)")
- Expand abbreviations for ATS parsing
- Add industry-standard related skills that are implied by existing skills
- Remove or deprioritize skills not relevant to the target role

INFERENCE RULES:
- If candidate has "Python", can infer common Python libraries if used in similar roles
- If candidate has "web development", can infer HTML, CSS, JavaScript
- If candidate has "data analysis", can infer Excel, SQL, data visualization
- If candidate has senior role, can infer leadership, mentoring, project management

RESPONSE FORMAT (JSON):
{
  "content": "Optimized skills section with grouped categories and expanded keywords",
  "explanation": "Detailed notes (4-5 lines) on skills added through inference, reorganization strategy, keywords integrated, and any skills removed/deprioritized"
}
"""


class GeminiClient:
    def __init__(self):
        """Initialize Gemini client configuration."""
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
        self.temperature = float(os.getenv("GEMINI_TEMPERATURE", "0.0"))
        self.model = None
        
    def _get_model(self):
        """Lazy initialization of the model to avoid fork safety issues."""
        if self.model:
            return self.model
            
        import google.generativeai as genai
        
        genai.configure(api_key=self.api_key)
        
        # Safety settings - set to BLOCK_NONE for professional resume content
        safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_NONE"
            }
        ]
        
        # Initialize model
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            generation_config={
                "temperature": self.temperature,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 2048,  # Increased for longer responses
                "response_mime_type": "text/plain",
            },
            safety_settings=safety_settings
        )
        
        logger.info(f"Initialized Gemini client with model: {self.model_name}, temperature: {self.temperature}")
        return self.model
    
    def rewrite_experience_entry(
        self,
        entry: Dict[str, Any],
        job_description: str,
        target_keywords: List[str]
    ) -> Dict[str, Any]:
        """
        Rewrite a single experience entry.
        
        Args:
            entry: Experience entry with company, title, dates, bullets
            job_description: Target job description
            target_keywords: Keywords to integrate
            
        Returns:
            Dictionary with rewritten bullets and explanation
        """
        # Build input JSON
        required = {
            "company": entry.get("company", "Unknown Company"),
            "title": entry.get("title", "Unknown Title"),
            "start": entry.get("start", ""),
            "end": entry.get("end", "Present"),
            "bullets": entry.get("bullets", []),
            "job_description_snippet": job_description[:1600],  # Limit JD length
            "target_keywords": target_keywords[:10],  # Top 10 keywords
            "required_bullet_count": len(entry.get("bullets", []))
        }
        
        # Build prompt
        prompt = f"{EXPERIENCE_PROMPT_HEADER}\n\nINPUT (JSON):\n{json.dumps(required, indent=2)}\n\nPlease provide your response in valid JSON format."
        
        # Call Gemini
        response_text = self._call_gemini(prompt)
        
        # Parse response
        try:
            result = self._parse_json_response(response_text)
            
            # Validate bullet count
            if len(result.get("bullets", [])) != required["required_bullet_count"]:
                logger.warning(f"Bullet count mismatch. Expected {required['required_bullet_count']}, got {len(result.get('bullets', []))}")
                # Pad or trim
                bullets = result.get("bullets", [])
                if len(bullets) < required["required_bullet_count"]:
                    bullets.extend(entry["bullets"][len(bullets):])
                else:
                    bullets = bullets[:required["required_bullet_count"]]
                result["bullets"] = bullets
            
            return result
        except Exception as e:
            logger.error(f"Failed to parse Gemini response: {e}")
            # Fallback: return original
            return {
                "bullets": entry.get("bullets", []),
                "explanation": f"Failed to parse AI response: {str(e)}"
            }
    
    def rewrite_summary(
        self,
        summary_text: str,
        job_description: str,
        target_keywords: List[str]
    ) -> Dict[str, Any]:
        """
        Rewrite summary section.
        
        Args:
            summary_text: Original summary
            job_description: Target job description
            target_keywords: Keywords to integrate
            
        Returns:
            Dictionary with rewritten content and explanation
        """
        required = {
            "original_summary": summary_text,
            "job_description_snippet": job_description[:1600],
            "target_keywords": target_keywords[:10]
        }
        
        prompt = f"{SUMMARY_PROMPT_HEADER}\n\nINPUT (JSON):\n{json.dumps(required, indent=2)}\n\nPlease provide your response in valid JSON format."
        
        response_text = self._call_gemini(prompt)
        
        try:
            return self._parse_json_response(response_text)
        except Exception as e:
            logger.error(f"Failed to parse summary response: {e}")
            return {
                "content": summary_text,
                "explanation": f"Failed to parse AI response: {str(e)}"
            }
    
    def rewrite_skills(
        self,
        skills_text: str,
        job_description: str,
        target_keywords: List[str]
    ) -> Dict[str, Any]:
        """
        Rewrite skills section.
        
        Args:
            skills_text: Original skills
            job_description: Target job description
            target_keywords: Keywords to integrate
            
        Returns:
            Dictionary with rewritten content and explanation
        """
        required = {
            "original_skills": skills_text,
            "job_description_snippet": job_description[:1600],
            "target_keywords": target_keywords[:10]
        }
        
        prompt = f"{SKILLS_PROMPT_HEADER}\n\nINPUT (JSON):\n{json.dumps(required, indent=2)}\n\nPlease provide your response in valid JSON format."
        
        response_text = self._call_gemini(prompt)
        
        try:
            return self._parse_json_response(response_text)
        except Exception as e:
            logger.error(f"Failed to parse skills response: {e}")
            return {
                "content": skills_text,
                "explanation": f"Failed to parse AI response: {str(e)}"
            }
    
    def rewrite_with_brutal_review(
        self,
        original_resume_text: str,
        job_description: str
    ) -> Dict[str, Any]:
        """
        Comprehensive resume rewrite with brutal hiring manager review.
        
        Args:
            original_resume_text: Full original resume as plain text
            job_description: Target job description
            
        Returns:
            Dictionary with marked-up resume, changes, company expectations, and harsh review
        """
        prompt = f"""You are an expert hiring manager and ATS specialist reviewing resumes for a specific role.

You have two jobs:
1) Rewrite the candidate's resume to better match the job description WITHOUT inventing fake experience.
2) Give a brutally honest, hiring-manager style review of how well this candidate fits the role.

Personality:
- Direct, blunt, and time-constrained, like a senior hiring manager.
- You don't sugar-coat weak points.
- You never insult the candidate, but you clearly call out weaknesses, missing skills, and risk flags.
- You respect truthfulness: never add experience, companies, or tools that were not clearly implied in the original resume.

RESUME CONTENT:
{original_resume_text}

JOB DESCRIPTION:
{job_description}

CRITICAL INSTRUCTIONS:

1. FORMAT PRESERVATION:
   - MAINTAIN the exact same resume format, structure, and layout as the original
   - Keep the same section order, headings, and visual structure
   - Only modify the CONTENT, not the FORMAT
   - Preserve bullet point styles, date formats, and spacing

2. ACTIONABLE GUIDANCE:
   - For "missing_or_weak_skills", provide SPECIFIC, ACTIONABLE advice
   - Include exact course names, platforms (Coursera, Udemy, LinkedIn Learning, etc.)
   - Mention specific certifications that would help
   - Reference real-world examples and success stories
   - Provide concrete project ideas they can build

3. TOP 3 ACTIONS - MAKE THEM PERFECT GUIDES:
   - Don't just say "Take courses on X" - specify WHICH courses (with platform names)
   - Don't just say "Build projects" - suggest SPECIFIC project ideas
   - Include time estimates (e.g., "Complete the 4-week Google Data Analytics Certificate")
   - Mention communities, forums, or resources to join
   - Reference what has worked for others in similar situations

Generate the brutal review and rewrite in this JSON format:
{{
  "plain_text": "Full rewritten resume text WITHOUT tags, MAINTAINING THE EXACT SAME FORMAT as the original",
  "marked_up_resume": "Full text with <ADD>, <DEL>, <REWRITE> tags showing changes",
  "changes": [
    {{
      "type": "add|remove|rewrite",
      "content": "Text changed",
      "reason": "Why you changed it",
      "signal_to_company": "What this change signals to the hiring manager"
    }}
  ],
  "company_expectations": {{
    "role_summary": "1 sentence summary of what they really want",
    "what_the_company_cares_about": ["value 1", "value 2"],
    "ideal_candidate_snapshot": ["trait 1", "trait 2"]
  }},
  "harsh_review": {{
    "overall_verdict": "Brutal 1-sentence summary",
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "missing_or_weak_skills": [
      {{
        "skill": "Skill Name",
        "why_it_matters": "Explain business impact and why this role needs it",
        "how_to_build_it": "SPECIFIC steps: 'Complete [Course Name] on [Platform] (X weeks, $Y). Build [Specific Project Idea]. Join [Community/Forum]. Get certified in [Certification Name].'",
        "success_story": "Example: 'Many candidates improved this by doing X, which led to Y'"
      }}
    ],
    "risk_flags": ["flag 1", "flag 2"],
    "would_I_interview_you": "yes|no|maybe",
    "rationale": "Why yes/no/maybe",
    "top_3_actions": [
      {{
        "action": "Specific, actionable step",
        "how_to_do_it": "DETAILED guide: exact courses (with platform), specific projects to build, certifications to get, communities to join, time commitment",
        "resources": ["Specific resource 1 with platform/link", "Specific resource 2", "Specific resource 3"],
        "time_estimate": "e.g., '4-6 weeks' or '2-3 months'",
        "what_helped_others": "Real example of how this helped someone transition or improve"
      }}
    ]
  }}
}}

EXAMPLES OF GOOD vs BAD GUIDANCE:

❌ BAD: "Take courses on business analytics"
✅ GOOD: "Complete 'Google Data Analytics Professional Certificate' on Coursera (6 months, $39/mo). Also take 'Business Analytics Specialization' by Wharton on Coursera. Build a portfolio project analyzing real business data (e.g., retail sales trends, customer churn analysis)."

❌ BAD: "Pursue internships focused on business analysis"
✅ GOOD: "Apply for Business Analyst internships at companies like Deloitte, PwC, or tech startups. Use platforms like LinkedIn, Handshake, and WayUp. Tailor your resume to highlight any data analysis, Excel modeling, or stakeholder communication experience. Many candidates successfully transitioned by starting with 3-month contract roles."

❌ BAD: "Engage in projects that require business insights"
✅ GOOD: "Build 3 portfolio projects: (1) Customer segmentation analysis using Python/Excel, (2) Sales forecasting dashboard in Tableau/Power BI, (3) A/B test analysis for a hypothetical product feature. Share on GitHub and LinkedIn. Join r/BusinessAnalysis and Kaggle competitions."

Return ONLY the JSON. No markdown, no code blocks, no extra text."""
        
        try:
            response_text = self._call_gemini(prompt, max_retries=3)
            result = self._parse_json_response(response_text)
            
            # Validate required fields
            required_fields = ["plain_text", "marked_up_resume", "changes", "company_expectations", "harsh_review"]
            for field in required_fields:
                if field not in result:
                    logger.warning(f"Missing field in brutal review response: {field}")
                    result[field] = self._get_default_value(field)
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to generate brutal review: {e}")
            return {
                "plain_text": original_resume_text,
                "marked_up_resume": original_resume_text,
                "changes": [],
                "company_expectations": {
                    "role_summary": "Unable to analyze",
                    "what_the_company_cares_about": [],
                    "ideal_candidate_snapshot": []
                },
                "harsh_review": {
                    "overall_verdict": "Unable to generate review due to error",
                    "strengths": [],
                    "weaknesses": [],
                    "missing_or_weak_skills": [],
                    "risk_flags": [],
                    "would_I_interview_you": "maybe",
                    "rationale": f"Error: {str(e)}",
                    "top_3_actions": []
                }
            }
    
    def _get_default_value(self, field: str) -> Any:
        """Get default value for missing field."""
        defaults = {
            "plain_text": "",
            "marked_up_resume": "",
            "changes": [],
            "company_expectations": {
                "role_summary": "",
                "what_the_company_cares_about": [],
                "ideal_candidate_snapshot": []
            },
            "harsh_review": {
                "overall_verdict": "",
                "strengths": [],
                "weaknesses": [],
                "missing_or_weak_skills": [],
                "risk_flags": [],
                "would_I_interview_you": "maybe",
                "rationale": "",
                "top_3_actions": []
            }
        }
        return defaults.get(field, None)
    
    def _call_gemini(self, prompt: str, max_retries: int = 3) -> str:
        """
        Call Gemini API with retry logic.
        
        Args:
            prompt: Prompt to send
            max_retries: Maximum number of retries
            
        Returns:
            Response text
        """
        for attempt in range(max_retries):
            try:
                model = self._get_model()
                response = model.generate_content(prompt)
                
                # Check for safety blocks or empty response
                if not response.candidates:
                    logger.warning("No candidates returned from Gemini")
                    raise ValueError("Empty response from Gemini - no candidates")
                
                candidate = response.candidates[0]
                
                # Check finish reason
                if hasattr(candidate, 'finish_reason'):
                    finish_reason = candidate.finish_reason
                    # finish_reason: 0=UNSPECIFIED, 1=STOP, 2=MAX_TOKENS, 3=SAFETY, 4=RECITATION, 5=OTHER
                    if finish_reason == 3:  # SAFETY
                        logger.warning("Response blocked by safety filters")
                        raise ValueError("Response blocked by safety filters")
                    elif finish_reason == 4:  # RECITATION
                        logger.warning("Response blocked due to recitation")
                        raise ValueError("Response blocked due to recitation")
                
                # Try to get text
                try:
                    text = response.text
                    if not text:
                        raise ValueError("Empty text in response")
                    logger.info(f"Gemini API call successful (attempt {attempt + 1})")
                    return text
                except (ValueError, AttributeError) as e:
                    # Try to extract from parts directly
                    if candidate.content and candidate.content.parts:
                        text = "".join(part.text for part in candidate.content.parts if hasattr(part, 'text'))
                        if text:
                            logger.info(f"Gemini API call successful via parts (attempt {attempt + 1})")
                            return text
                    raise ValueError(f"Could not extract text from response: {e}")
                
            except Exception as e:
                logger.error(f"Gemini API call failed (attempt {attempt + 1}/{max_retries}): {e}")
                
                if attempt < max_retries - 1:
                    # Exponential backoff
                    wait_time = 2 ** attempt
                    logger.info(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    raise
        
        raise RuntimeError("Failed to call Gemini API after all retries")
    
    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """
        Parse JSON response from Gemini.
        
        Args:
            text: Response text
            
        Returns:
            Parsed JSON dictionary
        """
        # Try to extract JSON from markdown code blocks
        if "```json" in text:
            start = text.find("```json") + 7
            end = text.find("```", start)
            text = text[start:end].strip()
        elif "```" in text:
            start = text.find("```") + 3
            end = text.find("```", start)
            text = text[start:end].strip()
        
        # Remove any leading/trailing whitespace
        text = text.strip()
        
        # Parse JSON
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            logger.error(f"Response text: {text[:500]}")
            
            # Fallback: try to extract bullets from plain text
            lines = text.split('\n')
            bullets = [line.strip('- •*').strip() for line in lines if line.strip() and not line.strip().startswith('{')]
            
            return {
                "bullets": bullets if bullets else ["Failed to parse response"],
                "explanation": "Parsed from plain text due to JSON error"
            }
