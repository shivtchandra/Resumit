"""
OpenAI Client for resume rewriting and analysis.
Provides an interface compatible with GeminiClient.
"""
import os
import json
import time
import logging
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
from openai import OpenAI

logger = logging.getLogger(__name__)


class OpenAIClient:
    def __init__(self):
        """Initialize OpenAI client configuration."""
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        
        self.model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.brutal_model_name = (
            os.getenv("OPENAI_BRUTAL_MODEL")
            or os.getenv("OPENAI_MODEL_FAST")
            or self.model_name
        )
        self.temperature = float(os.getenv("OPENAI_TEMPERATURE", "0.0"))
        self.timeout_seconds = float(os.getenv("OPENAI_TIMEOUT_SECONDS", "25"))
        self.client = OpenAI(api_key=self.api_key)
        
        logger.info(
            f"Initialized OpenAI client with model: {self.model_name}, "
            f"brutal_model: {self.brutal_model_name}, "
            f"temperature: {self.temperature}, timeout={self.timeout_seconds}s"
        )
    
    def _call_gemini(
        self,
        prompt: str,
        max_retries: Optional[int] = None,
        max_tokens: Optional[int] = None,
        timeout_seconds: Optional[float] = None,
        model_name: Optional[str] = None,
        temperature_override: Optional[float] = None,
        use_json_mode: bool = False,
    ) -> str:
        """
        Call OpenAI API with retry logic.
        Named _call_gemini for compatibility with existing code.
        
        Args:
            prompt: Prompt to send
            max_retries: Maximum number of retries
            
        Returns:
            Response text
        """
        retries = max_retries if max_retries is not None else int(os.getenv("OPENAI_MAX_RETRIES", "1"))
        retries = max(1, retries)
        token_budget = max_tokens if max_tokens is not None else 2048
        timeout_budget = timeout_seconds if timeout_seconds is not None else self.timeout_seconds
        selected_model = (model_name or self.model_name).strip() or self.model_name
        effective_temperature = temperature_override if temperature_override is not None else self.temperature

        for attempt in range(retries):
            try:
                current_date_str = datetime.now().strftime("%B %d, %Y")
                call_kwargs: Dict[str, Any] = dict(
                    model=selected_model,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                f"Today's date is {current_date_str}. "
                                "You are a principal-level technical recruiter and resume strategist. "
                                "You give reference-grade analysis: every critique cites an exact line, "
                                "every rewrite uses the candidate's real project names and tech stack, "
                                "every number is either quoted from the resume or labeled (est.). "
                                "You never use filler phrases, placeholder brackets, or generic advice. "
                                "You always return valid JSON exactly matching the requested schema."
                            )
                        },
                        {"role": "user", "content": prompt}
                    ],
                    temperature=effective_temperature,
                    max_tokens=token_budget,
                    timeout=timeout_budget,
                )
                if use_json_mode:
                    call_kwargs["response_format"] = {"type": "json_object"}
                response = self.client.chat.completions.create(**call_kwargs)
                
                text = response.choices[0].message.content
                if not text:
                    raise ValueError("Empty response from OpenAI")
                
                logger.info(f"OpenAI API call successful (attempt {attempt + 1})")
                return text
                
            except Exception as e:
                logger.error(f"OpenAI API call failed (attempt {attempt + 1}/{retries}): {e}")
                
                if attempt < retries - 1:
                    # Exponential backoff
                    wait_time = 2 ** attempt
                    logger.info(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    raise
        
        raise RuntimeError("Failed to call OpenAI API after all retries")
    
    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """
        Parse JSON response from OpenAI.
        
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

            candidate = self._extract_json_object(text)
            if candidate:
                for attempt in (
                    candidate,
                    candidate.replace("\u201c", '"').replace("\u201d", '"').replace("\u2018", "'").replace("\u2019", "'"),
                    re.sub(r",(\s*[}\]])", r"\1", candidate),
                ):
                    try:
                        return json.loads(attempt)
                    except json.JSONDecodeError:
                        continue
            
            # Fallback: try to extract bullets from plain text
            lines = text.split('\n')
            bullets = [line.strip('- •*').strip() for line in lines if line.strip() and not line.strip().startswith('{')]
            
            return {
                "bullets": bullets if bullets else ["Failed to parse response"],
                "explanation": "Parsed from plain text due to JSON error"
            }

    def _extract_json_object(self, text: str) -> Optional[str]:
        """Extract first balanced JSON object from mixed content."""
        if not text:
            return None

        start = text.find("{")
        if start == -1:
            return None

        depth = 0
        in_string = False
        escaped = False

        for idx in range(start, len(text)):
            ch = text[idx]
            if in_string:
                if escaped:
                    escaped = False
                elif ch == "\\":
                    escaped = True
                elif ch == '"':
                    in_string = False
                continue

            if ch == '"':
                in_string = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return text[start:idx + 1]
        return None
    
    # Compatibility methods for resume rewriting
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
            "job_description_snippet": job_description[:1600],
            "target_keywords": target_keywords[:10],
            "required_bullet_count": len(entry.get("bullets", []))
        }
        
        # Build enhanced prompt
        prompt = f"""You are an expert ATS optimization specialist and resume writer. Transform these bullet points into powerful, achievement-focused statements that maximize ATS score while showcasing real impact.

TASK: Rewrite these resume bullets to be more impactful and ATS-friendly.

ORIGINAL BULLETS:
{chr(10).join(f"- {b}" for b in required["bullets"])}

TARGET KEYWORDS TO INTEGRATE (if relevant): {', '.join(target_keywords[:10])}

RULES:
1. Start each bullet with a STRONG action verb (Engineered, Spearheaded, Architected, etc.)
2. Add SPECIFIC METRICS (%, $, time saved, users impacted)
3. Keep bullets under 2 lines
4. Integrate keywords NATURALLY - do not force them
5. Be truthful - do not invent achievements

EXPLANATION FORMAT (CRITICAL):
- You MUST return a JSON object.
- The "explanation" field must be a SINGLE string containing 1-3 short bullet points separated by newlines.
- Each bullet must start with "✓ ".
- MAX 10 words per bullet.
- NO introductory text. NO paragraphs.

  "bullets": [
    "Rewritten bullet 1",
    "Rewritten bullet 2"
  ],
  "explanation": "✓ Short change 1\\n✓ Short change 2"
}}

Be EXTREMELY concise. If you write a paragraph, you fail."""
        
        # Call OpenAI
        response_text = self._call_gemini(prompt)
        
        # Parse response
        try:
            result = self._parse_json_response(response_text)
            
            # Validate bullet count
            if len(result.get("bullets", [])) != required["required_bullet_count"]:
                logger.warning(f"Bullet count mismatch. Expected {required['required_bullet_count']}, got {len(result.get('bullets', []))}")
                bullets = result.get("bullets", [])
                if len(bullets) < required["required_bullet_count"]:
                    bullets.extend(entry["bullets"][len(bullets):])
                else:
                    bullets = bullets[:required["required_bullet_count"]]
                result["bullets"] = bullets
            
            return result
        except Exception as e:
            logger.error(f"Failed to parse OpenAI response: {e}")
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
        """Rewrite summary section."""
        required = {
            "original_summary": summary_text,
            "job_description_snippet": job_description[:1600],
            "target_keywords": target_keywords[:10]
        }
        
        prompt = f"""You are an expert resume writer specializing in compelling professional summaries. Create a powerful, keyword-rich summary that immediately captures attention and passes ATS screening.

⚠️ CONSERVATIVE APPROACH:
- **If the original summary is already strong** (has role, years, keywords, achievements), make only minor improvements
- **Only do a full rewrite if the summary has major problems** (too generic, no metrics, missing keywords, wrong focus)
- **Preserve the candidate's voice and style** - don't completely change their tone

CRITICAL ELEMENTS:
1. **Opening Hook**: Start with your strongest credential (e.g., "Senior Full-Stack Engineer with 5+ years...", "Results-driven Data Scientist specializing in...")
2. **Core Expertise**: List 4-6 key technical skills/technologies that match the job
3. **Quantified Achievement**: Include 1-2 specific, impressive metrics
4. **Value Proposition**: End with what you bring to the role

FORMULA:
[Title/Role] with [X years] experience in [core skills]. Proven track record of [quantified achievement]. Expert in [key technologies from job description]. [Unique value proposition or specialization].

EXAMPLES:

**Example 1 - NEEDS FULL REWRITE**:
**Before**: "Software engineer with experience in web development and databases."
**Problem**: Too generic, no years, no metrics, no specific skills
**After**: "Full-Stack Software Engineer with 4+ years building scalable web applications using React, Node.js, and PostgreSQL. Delivered 20+ production features serving 100K+ users with 99.9% uptime. Expert in modern JavaScript, RESTful API design, and cloud deployment (AWS, Docker). Passionate about writing clean, maintainable code and mentoring junior developers."

**Example 2 - MINOR IMPROVEMENTS ONLY**:
**Before**: "Senior Data Analyst with 5+ years of experience in Python, SQL, and Tableau. Increased revenue by $2M through predictive modeling. Skilled in statistical analysis and data visualization."
**Problem**: Already strong, just needs keyword integration
**After**: "Senior Data Analyst with 5+ years transforming complex datasets into actionable business insights using Python, SQL, and Tableau. Increased revenue by $2M through predictive modeling and customer segmentation analysis. Expert in statistical analysis, data visualization, and stakeholder communication. Proven ability to translate technical findings into executive-level recommendations."

KEYWORD INTEGRATION:
- Naturally weave in target keywords from the job description
- Use exact phrases when possible ("React.js" not just "React" if that's in the JD)
- Include both hard skills (technologies) and soft skills (leadership, communication)
- Don't keyword stuff - maintain readability

LENGTH: 3-4 lines (60-80 words)
TONE: Confident, professional, achievement-focused

INPUT DATA:
{json.dumps(required, indent=2)}

RESPONSE FORMAT (JSON):
{{
  "content": "Powerful 3-4 line summary with integrated keywords and quantified achievements",
  "explanation": "Explain: (1) If original was strong, what minor improvements were made, OR (2) If full rewrite, what major problems were fixed. List keywords integrated and why."
}}

Create a summary that makes recruiters want to read more. Preserve what's already good."""
        
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
        """Rewrite skills section."""
        required = {
            "original_skills": skills_text,
            "job_description_snippet": job_description[:1600],
            "target_keywords": target_keywords[:10]
        }
        
        prompt = f"""Optimize this skills section for ATS.

ORIGINAL:
{skills_text}

TARGET KEYWORDS: {', '.join(target_keywords[:12])}

RULES:
1. Group by category (Languages, Frameworks, Tools, etc.)
2. Expand abbreviations (JS -> JavaScript)
3. Add missing relevant keywords
4. Remove outdated/irrelevant skills
5. Order by relevance to job

RESPONSE FORMAT (JSON):
{{
  "content": "Organized skills with categories",
  "explanation": "✓ Change 1\\n✓ Change 2"
}}

Explanation must be under 60 characters total. Use "✓" bullets. NO paragraphs."""
        
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
        job_description: str,
        company_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Comprehensive resume rewrite with brutal hiring manager review.
        
        Args:
            original_resume_text: Full original resume as plain text
            job_description: Target job description
            
        Returns:
            Dictionary with marked-up resume, changes, company expectations, and harsh review
        """
        system_prompt = (
            "You are a senior hiring manager and ATS specialist. "
            "Return strict JSON only. Never invent experience. Be blunt but practical."
        )
        company_context = company_name.strip() if company_name else "the company"
        brutal_timeout = float(
            os.getenv(
                "OPENAI_BRUTAL_TIMEOUT_SECONDS",
                str(max(12.0, min(24.0, self.timeout_seconds + 2.0))),
            )
        )
        brutal_max_tokens = int(os.getenv("OPENAI_BRUTAL_MAX_TOKENS", "1200"))
        resume_excerpt_limit = int(os.getenv("OPENAI_BRUTAL_RESUME_CHARS", "6500"))
        jd_excerpt_limit = int(os.getenv("OPENAI_BRUTAL_JD_CHARS", "2200"))

        payload = {
            "company": company_context,
            "resume_excerpt": original_resume_text[:resume_excerpt_limit],
            "job_description_excerpt": job_description[:jd_excerpt_limit],
        }

        user_prompt = f"""Rewrite and review this resume for the target role.

Rules:
- Preserve truthful claims. Do not fabricate companies, dates, metrics, or tools.
- Keep format close to original.
- In marked_up_resume, wrap additions with <ADD>, removals with <DEL>, rewrites with <REWRITE>.
- Keep output concise and practical.
- Focus on highest-impact fixes only.

Return JSON with this exact top-level shape:
{{
  "plain_text": "rewritten resume text without tags",
  "marked_up_resume": "rewritten text with <ADD>/<DEL>/<REWRITE> tags",
  "changes": [
    {{
      "section": "Summary|Experience|Skills|Header",
      "type": "add|remove|rewrite",
      "before": "original text",
      "after": "new text",
      "reason": "why changed",
      "jd_signal": "what signal this sends to hiring team"
    }}
  ],
  "company_expectations": {{
    "role_summary": "1 sentence",
    "what_the_company_cares_about": ["3-5 items"],
    "ideal_candidate_snapshot": ["3-5 items"]
  }},
  "harsh_review": {{
    "overall_verdict": "1 sentence",
    "strengths": ["3-5 items"],
    "weaknesses": ["4-8 items"],
    "missing_or_weak_skills": [
      {{
        "skill": "name",
        "why_it_matters": "business impact",
        "how_to_build_it": "specific course/project steps",
        "success_story": "short practical example"
      }}
    ],
    "would_I_interview_you": "yes|no|maybe",
    "rationale": "decision rationale",
    "top_3_actions": [
      {{
        "action": "specific step",
        "how_to_do_it": "clear execution plan",
        "resources": ["resource 1", "resource 2"],
        "time_estimate": "duration",
        "what_helped_others": "short evidence"
      }}
    ]
  }}
}}

Constraints:
- Return 4-10 total change items.
- Keep each list focused and non-repetitive.
- Keep each string under 220 characters when possible.

Input JSON:
{json.dumps(payload)}"""

        # Call OpenAI with a tighter budget for faster turnaround.
        try:
            try:
                response = self.client.chat.completions.create(
                    model=self.brutal_model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.1,
                    response_format={"type": "json_object"},
                    max_tokens=brutal_max_tokens,
                    timeout=brutal_timeout,
                )
            except Exception as structured_exc:
                logger.warning(
                    "Structured brutal review call failed, retrying without response_format: %s",
                    structured_exc,
                )
                response = self.client.chat.completions.create(
                    model=self.brutal_model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.1,
                    max_tokens=min(brutal_max_tokens, 1200),
                    timeout=brutal_timeout,
                )
            
            response_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
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
