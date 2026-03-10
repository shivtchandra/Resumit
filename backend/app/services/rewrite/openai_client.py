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
        raw_timeout = os.getenv("OPENAI_TIMEOUT_SECONDS", "").strip()
        self.timeout_seconds = float(raw_timeout) if raw_timeout else None
        self.client = OpenAI(api_key=self.api_key)
        
        logger.info(
            f"Initialized OpenAI client with model: {self.model_name}, "
            f"brutal_model: {self.brutal_model_name}, "
            f"temperature: {self.temperature}, timeout={self.timeout_seconds if self.timeout_seconds is not None else 'none'}"
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
                )
                if timeout_budget is not None and float(timeout_budget) > 0:
                    call_kwargs["timeout"] = float(timeout_budget)
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
            "You are a brutally honest senior technical recruiter at a FAANG company "
            "who has screened 50,000+ resumes. You have zero patience for generic bullets, "
            "tutorial projects, or vague claims. You speak like a real recruiter — direct, "
            "sometimes harsh, always actionable. When you see a weak project, you call it "
            "out by name. When a bullet is vague, you quote it and explain exactly why it fails. "
            "Return strict JSON only."
        )
        company_context = company_name.strip() if company_name else "the company"
        brutal_timeout = float(
            os.getenv(
                "OPENAI_BRUTAL_TIMEOUT_SECONDS",
                str(max(12.0, min(45.0, (self.timeout_seconds or 30.0) + 2.0))),
            )
        )
        brutal_max_tokens = int(os.getenv("OPENAI_BRUTAL_MAX_TOKENS", "4096"))
        resume_excerpt_limit = int(os.getenv("OPENAI_BRUTAL_RESUME_CHARS", "8000"))
        jd_excerpt_limit = int(os.getenv("OPENAI_BRUTAL_JD_CHARS", "3000"))

        payload = {
            "company": company_context,
            "resume_excerpt": original_resume_text[:resume_excerpt_limit],
            "job_description_excerpt": job_description[:jd_excerpt_limit],
        }

        user_prompt = f"""You are reviewing this resume for a {company_context} role. Be BRUTALLY honest.

PERSONA: You are a senior recruiter at {company_context} who sees 200+ resumes/day.
You have 6 seconds per resume. You are tired of generic bullets and tutorial projects.

YOUR JOB:
1. Identify the 5-10 highest-impact changes needed to match this JD
2. Roast every weak point — quote specific lines from the resume, name specific projects
3. Tell them exactly what to fix and how long each fix takes

CRITICAL RULES FOR HARSH REVIEW:
- If a project is just a tutorial/course project, SAY SO: "Your [Project Name] is a tutorial project. Every CS student has this. It tells me nothing about your ability to ship production code."
- If a bullet has no metrics, QUOTE IT: "'Developed web application' — this tells me nothing. How many users? What was the latency improvement? What business problem did it solve?"
- If skills don't match JD, be specific: "The JD explicitly requires [X] but your resume shows zero evidence of it anywhere."
- For strengths: only list things that GENUINELY stand out. If nothing stands out, say "Nothing here would make me pause scrolling. That's the problem."
- For weaknesses: be specific — quote the actual weak bullet/project and explain WHY it's weak
- For missing_or_weak_skills: map EACH to a specific JD requirement, quote the JD line
- For would_I_interview_you: "yes" only if genuinely strong. "maybe" if borderline. "no" if you'd skip.
- For top_3_actions: give specific, actionable steps with realistic time estimates

DO NOT include the full rewritten resume text. Focus ONLY on the review and changes.

Return JSON with this exact shape:
{{
  "changes": [
    {{
      "section": "Summary|Experience|Skills|Header|Projects",
      "type": "add|remove|rewrite",
      "before": "exact original text being changed (quote it)",
      "after": "improved replacement text",
      "reason": "why this change matters for THIS specific JD — be specific",
      "jd_signal": "which JD requirement this directly addresses"
    }}
  ],
  "company_expectations": {{
    "role_summary": "What {company_context} actually wants for this specific role — reference JD details",
    "what_the_company_cares_about": ["3-5 specific things extracted from THIS JD, not generic values like 'teamwork'"],
    "ideal_candidate_snapshot": ["3-5 concrete traits with evidence expectations, e.g. 'Has built and owned a production service handling >1000 RPS'"]
  }},
  "harsh_review": {{
    "overall_verdict": "1 brutal sentence a real recruiter would think. Be specific to THIS resume.",
    "strengths": ["Only genuine strengths. Quote specific resume content that actually works. Max 3-5 items."],
    "weaknesses": ["Quote specific bullets/projects that are weak and explain WHY they're weak. Be brutal. 4-8 items."],
    "missing_or_weak_skills": [
      {{
        "skill": "exact skill from JD",
        "why_it_matters": "why {company_context} specifically needs this — quote the JD requirement",
        "how_to_build_it": "specific project or action to demonstrate this skill, with concrete steps (not 'take a course')",
        "success_story": "what a strong candidate's bullet looks like for this skill — give an actual example bullet"
      }}
    ],
    "would_I_interview_you": "yes|no|maybe",
    "rationale": "Honest 2-3 sentence assessment. Reference specific resume content AND specific JD gaps. Be direct.",
    "top_3_actions": [
      {{
        "action": "specific action they can do TODAY — not generic advice like 'add metrics'",
        "how_to_do_it": "step-by-step execution plan with concrete examples of what the improved bullet should look like",
        "resources": ["specific tools, courses, or references by name"],
        "time_estimate": "realistic hours/days for this specific fix",
        "what_helped_others": "concrete before/after example showing the improvement"
      }}
    ]
  }}
}}

Constraints:
- Return 5-10 changes, focus on highest-impact lines that need rewriting
- Every strength/weakness MUST quote specific text from the resume
- Every missing skill MUST reference a specific line from the JD
- Be harsh but constructive — they should feel urgency to fix things TODAY
- Keep each string focused and direct — no filler phrases

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
