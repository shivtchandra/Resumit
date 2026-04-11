"""
OpenAI Client for resume rewriting and analysis.
Provides an interface compatible with GeminiClient.
"""
import os
import json
import time
import logging
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple, Iterator
from openai import OpenAI

logger = logging.getLogger(__name__)


class OpenAIClient:
    def __init__(self):
        """Initialize OpenAI client configuration."""
        # Ensure environment variables are loaded
        from dotenv import load_dotenv
        from pathlib import Path
        env_path = Path(__file__).resolve().parent.parent.parent.parent / '.env'
        load_dotenv(dotenv_path=env_path)
        
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        
        # Default aligns with OpenAI "latest model" guidance; override via OPENAI_MODEL.
        self.model_name = os.getenv("OPENAI_MODEL", "gpt-5.4")
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

    @staticmethod
    def _model_supports_reasoning_effort(model: str) -> bool:
        """GPT-5.2+ style models accept reasoning_effort (none/low/...) on Chat Completions."""
        m = (model or "").strip().lower()
        if not m:
            return False
        return "gpt-5.2" in m or "gpt-5.4" in m

    def _call_gemini(
        self,
        prompt: str,
        max_retries: Optional[int] = None,
        max_tokens: Optional[int] = None,
        timeout_seconds: Optional[float] = None,
        model_name: Optional[str] = None,
        temperature_override: Optional[float] = None,
        use_json_mode: bool = False,
        reasoning_effort: Optional[str] = None,
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
                )
                
                # GPT-5 and o1 series use max_completion_tokens instead of max_tokens
                if selected_model.startswith(("gpt-5", "o1")):
                    call_kwargs["max_completion_tokens"] = token_budget
                    # Newer models often don't support temperature=0.0 in the same way, 
                    # but gpt-5 usually supports it. If it fails, we might need to adjust.
                else:
                    call_kwargs["max_tokens"] = token_budget

                if timeout_budget is not None and float(timeout_budget) > 0:
                    call_kwargs["timeout"] = float(timeout_budget)
                if use_json_mode:
                    call_kwargs["response_format"] = {"type": "json_object"}
                effort = (reasoning_effort or "").strip().lower()
                if effort and self._model_supports_reasoning_effort(selected_model):
                    call_kwargs["reasoning_effort"] = effort
                try:
                    response = self.client.chat.completions.create(**call_kwargs)
                except TypeError:
                    call_kwargs.pop("reasoning_effort", None)
                    response = self.client.chat.completions.create(**call_kwargs)
                except Exception as api_err:
                    if "reasoning_effort" in call_kwargs:
                        msg = str(api_err).lower()
                        if "reasoning" in msg or "unknown parameter" in msg or "unsupported" in msg:
                            logger.info("Retrying OpenAI without reasoning_effort after: %s", api_err)
                            call_kwargs.pop("reasoning_effort", None)
                            response = self.client.chat.completions.create(**call_kwargs)
                        else:
                            raise
                    else:
                        raise
                
                msg = response.choices[0].message
                text = msg.content
                
                # Check for reasoning models (like o1 or newer gpt-5 variants)
                if not text and hasattr(msg, "reasoning_content") and msg.reasoning_content:
                    logger.warning("Main content is empty but reasoning_content was found. Using reasoning_content.")
                    text = msg.reasoning_content
                
                if not text:
                    finish_reason = getattr(response.choices[0], "finish_reason", "unknown")
                    logger.error(f"Empty response from OpenAI. finish_reason: {finish_reason}, model: {selected_model}")
                    if hasattr(response, "usage"):
                        logger.error(f"Usage: {response.usage}")
                    raise ValueError(f"Empty response from OpenAI (finish_reason: {finish_reason})")
                
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
                    re.sub(r"\\u(?![0-9a-fA-F]{4})", r"\\\\u", candidate),
                    re.sub(r"\\(?![\"\\/bfnrtu])", r"\\\\", candidate),
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

    def _match_fix_jd_digest(
        self,
        jd_slice: str,
        target_role: str,
        company_name: str,
        model: str,
        max_tokens: int,
        timeout: Optional[float],
        temperature: float,
    ) -> Dict[str, Any]:
        prompt = f"""Extract hiring signal from this job description ONLY. Do not invent company facts.
Return ONLY valid JSON:
{{
  "must_have_skills": [],
  "nice_to_have_skills": [],
  "tools_and_technologies": [],
  "experience_level": "",
  "seniority_signals": "",
  "role_focus": "",
  "keywords_for_ats": [],
  "responsibilities_bullets": [],
  "hidden_expectations": []
}}
Use short strings and compact lists (max ~12 items per array). Role hint: {target_role}. Company label: {company_name}.

Job description:
{jd_slice}"""
        text = self._call_gemini(
            prompt=prompt,
            max_retries=1,
            max_tokens=max_tokens,
            model_name=model,
            temperature_override=temperature,
            use_json_mode=True,
            timeout_seconds=timeout,
        )
        raw = self._parse_json_response(text)
        return raw if isinstance(raw, dict) else {}

    def _match_fix_resume_digest(
        self,
        resume_slice: str,
        target_role: str,
        model: str,
        max_tokens: int,
        timeout: Optional[float],
        temperature: float,
    ) -> Dict[str, Any]:
        prompt = f"""Extract factual signals from this resume text ONLY. Do not invent employers, dates, or metrics.
Return ONLY valid JSON:
{{
  "skills": {{ "technical": [], "tools": [], "domains": [] }},
  "experience_level": "",
  "strengths": [],
  "weaknesses": [],
  "notable_lines": [],
  "projects": [{{ "name": "", "tech_stack": [], "one_line_impact": "" }}]
}}
Keep lists concise (max ~12 items per array). Target role context: {target_role}.

Resume:
{resume_slice}"""
        text = self._call_gemini(
            prompt=prompt,
            max_retries=1,
            max_tokens=max_tokens,
            model_name=model,
            temperature_override=temperature,
            use_json_mode=True,
            timeout_seconds=timeout,
        )
        raw = self._parse_json_response(text)
        return raw if isinstance(raw, dict) else {}

    def _match_fix_parallel_digests(
        self,
        resume_slice: str,
        jd_slice: str,
        target_role: str,
        company_name: str,
        model: str,
        max_tokens: int,
        timeout: Optional[float],
        temperature: float,
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """Two cheap extractions in parallel; wall clock ~= max(jd, resume), not sum."""

        def jd_worker() -> Dict[str, Any]:
            try:
                return self._match_fix_jd_digest(
                    jd_slice, target_role, company_name, model, max_tokens, timeout, temperature
                )
            except Exception as exc:
                logger.warning("Match & Fix JD digest failed: %s", exc)
                return {}

        def resume_worker() -> Dict[str, Any]:
            try:
                return self._match_fix_resume_digest(
                    resume_slice, target_role, model, max_tokens, timeout, temperature
                )
            except Exception as exc:
                logger.warning("Match & Fix resume digest failed: %s", exc)
                return {}

        with ThreadPoolExecutor(max_workers=2) as pool:
            fut_jd = pool.submit(jd_worker)
            fut_rs = pool.submit(resume_worker)
            jd_out = fut_jd.result()
            rs_out = fut_rs.result()
        return jd_out, rs_out

    def _match_fix_prepare(
        self,
        resume_text: str,
        job_description: str,
        target_role: Optional[str] = None,
        company_name: Optional[str] = None,
        reddit_evidence: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Build user prompt + scalar config for Match & Fix primary OpenAI call."""
        resume_text = (resume_text or "").strip()
        job_description = (job_description or "").strip()
        if not resume_text:
            raise ValueError("resume_text is empty")
        if not job_description:
            raise ValueError("job_description is empty")

        # Defaults tuned for latency: tighter excerpts, lower completion cap, gpt-5-mini primary.
        # Set OPENAI_MATCHFIX_ENRICH_RETRY=1 for a second pass (uses OPENAI_MATCHFIX_SMART_MODEL).
        resume_excerpt_limit = int(os.getenv("OPENAI_MATCHFIX_RESUME_CHARS", "5200"))
        jd_excerpt_limit = int(os.getenv("OPENAI_MATCHFIX_JD_CHARS", "3800"))
        explicit_model = (os.getenv("OPENAI_MATCHFIX_MODEL") or "").strip()
        fast_model = (
            os.getenv("OPENAI_MATCHFIX_FAST_MODEL")
            or os.getenv("OPENAI_ANALYZE_MODEL")
            or os.getenv("OPENAI_MODEL_FAST")
            or "gpt-5-mini"
        ).strip()
        smart_model = (
            os.getenv("OPENAI_MATCHFIX_SMART_MODEL")
            or self.model_name
            or "gpt-5.2"
        ).strip()
        target_model = explicit_model or fast_model or smart_model
        max_tokens = int(os.getenv("OPENAI_MATCHFIX_MAX_TOKENS", "1800"))
        temperature = float(os.getenv("OPENAI_MATCHFIX_TEMPERATURE", "0.2"))
        matchfix_timeout_raw = os.getenv("OPENAI_MATCHFIX_TIMEOUT_SECONDS", "85").strip()
        matchfix_timeout = float(matchfix_timeout_raw) if matchfix_timeout_raw else None
        enrich_retry = os.getenv("OPENAI_MATCHFIX_ENRICH_RETRY", "0").strip().lower() in ("1", "true", "yes")
        primary_effort = (os.getenv("OPENAI_MATCHFIX_REASONING_EFFORT", "none") or "").strip().lower()
        retry_effort = (os.getenv("OPENAI_MATCHFIX_ENRICH_REASONING_EFFORT") or "low").strip().lower()

        # Optional: two parallel digest calls + synthesis (extra cost; default off for wall-clock).
        # Set OPENAI_MATCHFIX_USE_SHARDED=1 to enable.
        use_sharded = os.getenv("OPENAI_MATCHFIX_USE_SHARDED", "0").strip().lower() in ("1", "true", "yes")
        digest_model = (os.getenv("OPENAI_MATCHFIX_DIGEST_MODEL") or "").strip() or fast_model
        digest_max_tokens = int(os.getenv("OPENAI_MATCHFIX_DIGEST_MAX_TOKENS", "550"))
        digest_timeout_raw = os.getenv("OPENAI_MATCHFIX_DIGEST_TIMEOUT_SECONDS", "").strip()
        digest_timeout = float(digest_timeout_raw) if digest_timeout_raw else matchfix_timeout
        digest_resume_chars = min(resume_excerpt_limit, int(os.getenv("OPENAI_MATCHFIX_DIGEST_RESUME_CHARS", "4500")))
        digest_jd_chars = min(jd_excerpt_limit, int(os.getenv("OPENAI_MATCHFIX_DIGEST_JD_CHARS", "3500")))
        synth_resume_limit = int(os.getenv("OPENAI_MATCHFIX_SYNTH_RESUME_CHARS", "3800")) if use_sharded else resume_excerpt_limit
        synth_jd_limit = int(os.getenv("OPENAI_MATCHFIX_SYNTH_JD_CHARS", "3000")) if use_sharded else jd_excerpt_limit

        tr = (target_role or "").strip() or "Not specified"
        cn = (company_name or "").strip() or "Not specified"

        digest_block = ""
        if use_sharded:
            t_d0 = time.perf_counter()
            jd_d, rs_d = self._match_fix_parallel_digests(
                resume_text[:digest_resume_chars],
                job_description[:digest_jd_chars],
                tr,
                cn,
                digest_model,
                digest_max_tokens,
                digest_timeout,
                min(0.2, max(0.0, temperature)),
            )
            logger.info(
                "Match & Fix parallel digests in %.1fs (model=%s)",
                time.perf_counter() - t_d0,
                digest_model,
            )
            if jd_d or rs_d:
                blob = json.dumps({"jd_digest": jd_d, "resume_digest": rs_d}, ensure_ascii=False)
                cap = int(os.getenv("OPENAI_MATCHFIX_DIGEST_JSON_CAP", "10000"))
                if len(blob) > cap:
                    blob = blob[:cap] + "…"
                digest_block = f"""

PRECOMPUTED_DIGESTS (from two parallel fast extractions). If anything conflicts with the excerpts in Input JSON, trust the excerpts.
{blob}
"""

        reddit_raw = (reddit_evidence or "").strip()
        reddit_block = ""
        if reddit_raw:
            r_cap = int(os.getenv("OPENAI_MATCHFIX_REDDIT_PROMPT_CHARS", "4000"))
            reddit_block = f"""

REDDIT_DISCUSSION_SNIPPETS (from public Reddit search; self-selected, noisy, NOT employer-official):
{reddit_raw[:r_cap]}

COMPANY_INSIGHTS WHEN REDDIT SNIPPETS EXIST:
- You MAY move hiring_intensity / hiring_trend / hiring_style / getting_in_difficulty off "unknown" when 2+ snippets (or snippet + JD) support the same theme.
- Keep confidence "low" unless several independent posts repeat the same hiring theme; "medium" only with clear repetition. Never use "high" for Reddit-only paths.
- hiring_focus should primarily reflect the JD; add at most 2 extra bullets only when Reddit clearly reinforces interview/process themes tied to this employer.
- Put rumor, toxicity, one-off rants, or contradictions in risk_signals — not as hiring facts.
- company_insights.note must state that signals may include public Reddit discussion and are not verified by the company.
"""

        payload = {
            "target_role": tr,
            "company_name": cn,
            "resume_excerpt": resume_text[:synth_resume_limit],
            "job_description_excerpt": job_description[:synth_jd_limit],
        }

        compact_on = os.getenv("OPENAI_MATCHFIX_COMPACT", "1").strip().lower() in ("1", "true", "yes")
        compact_clause = ""
        if compact_on:
            compact_clause = """

LATENCY OVERRIDES (obey even if other bullets ask for longer lists — shorter JSON returns faster):
- jd_requirements ≤8, matches ≤10, misses ≤8, resume_changes ≤8
- project_suggestions ≤2, certification_suggestions ≤2
- action_plan: ≤2 horizons, ≤4 short actions each
- coaching_tracks: each list field ≤4 strings per track
- interview_prep: this_week ≤2 items (≤2 resources each), this_month ≤2, likely_interview_questions ≤3
- Keep strings one clause when possible
"""

        prompt = f"""You are an expert technical recruiter, resume strategist, and instructor.
Your job is to produce a strict, structured "Match & Fix" analysis between a resume and a JD.
Your writing style must teach the candidate exactly what to do next like a strong mentor.

NON-NEGOTIABLE RULES:
1) Use ONLY evidence present in the provided resume/JD excerpts. If REDDIT_DISCUSSION_SNIPPETS appear below, you may additionally use them as weak third-party context for company_insights only — never as facts about the candidate's resume.
2) Quote exact lines/snippets for evidence when possible.
3) NEVER invent achievements, years, or metrics.
4) If evidence is missing, explicitly say "No direct evidence found in resume."
5) Suggestions must be practical, specific, and truthful.
6) Return ONLY valid JSON matching the schema below.
7) Act like an instructor: diagnose, explain why, then give step-by-step fixes.

GLOBAL BEHAVIOR:
- Be specific and non-generic
- Be critical, not polite
- Avoid vague advice
- Base reasoning strictly on input data
- If unsure, use low confidence instead of guessing

STYLE RULES (CRITICAL):
- Be concrete and direct. No fluff.
- BANNED phrases: "if applicable", "consider adding", "might", "maybe", "No direct line".
- Every miss must include exact proof expected by recruiter.
- Every resume change must be an edit the candidate can copy and use.
- Prefer action verbs + scope + outcome framing in suggested rewrites.
- If dates exist, reason about visible duration honestly (do not invent missing dates).
{digest_block}{reddit_block}
JSON SCHEMA:
{{
  "overview": {{
    "fit_score_estimate": 0,
    "fit_summary": "2-4 sentence summary with recruiter + instructor lens",
    "biggest_blockers": ["..."]
  }},
  "jd_requirements": [
    {{
      "id": "R1",
      "requirement": "exact requirement",
      "priority": "must_have|important|nice_to_have",
      "jd_evidence": "exact JD snippet"
    }}
  ],
  "matches": [
    {{
      "requirement_id": "R1",
      "requirement": "requirement text",
      "resume_evidence": "exact resume snippet",
      "why_it_matches": "concise explanation",
      "confidence": "high|medium|low"
    }}
  ],
  "misses": [
    {{
      "requirement_id": "R2",
      "requirement": "requirement text",
      "gap_type": "missing|weak_evidence|keyword_missing",
      "what_is_missing": "what is missing exactly",
      "where_to_fix": "summary|experience|projects|skills|certifications",
      "proof_to_add": "what proof recruiters expect"
    }}
  ],
  "resume_changes": [
    {{
      "section": "Summary|Experience|Projects|Skills|Certifications",
      "current_line": "exact line from resume. if missing, write 'No direct evidence found in resume.'",
      "recommended_change": "specific truthful rewrite or insertion, ready to paste",
      "jd_signal": "which requirement this addresses",
      "reason": "why this helps recruiter confidence and JD alignment"
    }}
  ],
  "project_suggestions": [
    {{
      "project_name": "specific project idea",
      "why_this_project": "gap it closes",
      "skills_proved": ["..."],
      "scope": "small|medium|large",
      "deliverables": ["..."],
      "resume_bullet_example": "truthful bullet template, no fake metrics",
      "timeline": "estimated duration"
    }}
  ],
  "certification_suggestions": [
    {{
      "name": "certification name",
      "provider": "provider",
      "why_this_person_needs_it": "specific gap addressed",
      "gap_it_closes": "specific gap label",
      "time_to_complete": "estimate",
      "cost_estimate": "estimate",
      "url": "official URL if known, else empty string"
    }}
  ],
  "keyword_map": {{
    "exact_jd_keywords": ["..."],
    "present_in_resume": ["..."],
    "missing_from_resume": ["..."]
  }},
  "company_insights": {{
    "hiring_intensity": "aggressive|moderate|low|freeze|unknown",
    "hiring_trend": "increasing|stable|decreasing|unknown",
    "hiring_focus": ["..."],
    "hiring_style": "mass|selective|bullseye|unknown",
    "risk_signals": ["..."],
    "strategy_signal": "",
    "getting_in_difficulty": "low|medium|high|unknown",
    "hiring_score": 0,
    "candidate_advice": "",
    "confidence": "high|medium|low",
    "note": "State clearly that this is inferred from the JD and general hiring patterns, not verified with live company data."
  }},
  "action_plan": [
    {{
      "horizon": "48_hours|2_weeks|30_days",
      "actions": ["step-by-step actions with outcomes"]
    }}
  ],
  "coaching_tracks": {{
    "student_track": {{
      "who_for": "who this is for",
      "focus": "main objective",
      "next_14_days": ["concrete steps"],
      "next_30_days": ["concrete steps"],
      "portfolio_focus": ["what to build and show"],
      "interview_focus": ["what to prepare and practice"]
    }},
    "professional_track": {{
      "who_for": "who this is for",
      "focus": "main objective",
      "next_14_days": ["concrete steps"],
      "next_30_days": ["concrete steps"],
      "portfolio_focus": ["what to build and show"],
      "interview_focus": ["what to prepare and practice"]
    }}
  }},
  "interview_prep": {{
    "estimated_total_prep_time": "e.g. 3-4 weeks",
    "this_week": [
      {{
        "topic": "specific topic tied to a JD gap",
        "why_this_first": "which JD requirement this addresses and why it is urgent",
        "resources": [
          {{
            "name": "well-known YouTube channel or platform name (e.g. NeetCode, Gaurav Sen, LeetCode)",
            "type": "youtube_channel|practice_platform|course|reading",
            "what_to_study": "specific playlist, section, problem set, or module to focus on",
            "time_needed": "estimated hours"
          }}
        ]
      }}
    ],
    "this_month": [
      {{
        "topic": "deeper topic for sustained prep",
        "why": "which gap this closes",
        "resources": [
          {{
            "name": "resource name",
            "type": "youtube_channel|practice_platform|course|reading",
            "what_to_study": "specific content to consume",
            "time_needed": "estimated hours"
          }}
        ]
      }}
    ],
    "likely_interview_questions": [
      {{
        "question": "exact interview question the candidate should expect",
        "type": "behavioral|technical|system_design|coding",
        "why_they_ask_this": "maps to which JD requirement",
        "how_to_prepare": "specific prep strategy (STAR method, whiteboard approach, etc.)",
        "prep_resource": "name of a well-known resource to use for prep"
      }}
    ],
    "mock_interview_plan": {{
      "platform": "Pramp or Interviewing.io or similar",
      "schedule": "e.g. 2 sessions/week for 3 weeks",
      "focus_areas": ["area tied to gap 1", "area tied to gap 2"]
    }}
  }}
}}

INTERVIEW PREP RULES:
- Recommend well-known YouTube channels, platforms, and courses BY NAME only.
  Do NOT include URLs. Examples: NeetCode, TakeUForward/Striver, Gaurav Sen,
  ByteByteGo, Exponent, Jeff Su, LeetCode, HackerRank, Pramp, Interviewing.io,
  AWS Skill Builder, Google Cloud Skills Boost, KodeKloud, Tech Interview Handbook.
- For each resource, specify WHAT to study (e.g. "graph playlist — BFS, DFS, topological sort"),
  not just the channel name.
- Name exact problem categories for coding prep (e.g. "sliding window", "graph BFS/DFS"),
  not just "practice DSA".
- If the candidate is already strong (>75 fit), focus on leveling up, not gap-filling.

QUALITY BAR:
- Keep every string field tight: prefer short clauses over long paragraphs so the JSON fits the output budget.
- Keep jd_requirements to top 8-12 requirements.
- Keep matches/misses specific and evidence-backed.
- Resume changes should be immediately usable edits (target 6-12 edits when clear gaps exist).
- Project suggestions should align with target role and missing skills (target 2-4 suggestions when there are 3+ misses).
- Certification suggestions should be role-relevant, not generic spam (target 2-5 suggestions when there are 3+ misses).
- fit_score_estimate should be an integer from 0 to 100.
- company_insights must stay inference-based. If Reddit snippets were supplied, you may refine fields using that weak signal; still do not pretend you have verified internal company data.
- coaching_tracks must be present and practical for both student and professional readers.
- interview_prep.this_week must have 2-4 items with specific sub-topics and time estimates.
- interview_prep.this_month must have 2-3 deeper items.
- interview_prep.likely_interview_questions must have 3-5 questions specific to THIS role at THIS company.
- Resource names must be real, well-known platforms/channels. Do NOT generate URLs.
{compact_clause}
Input JSON:
{json.dumps(payload)}"""

        return {
            "prompt": prompt,
            "target_model": target_model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "matchfix_timeout": matchfix_timeout,
            "primary_effort": primary_effort,
            "enrich_retry": enrich_retry,
            "retry_effort": retry_effort,
            "explicit_model": explicit_model,
            "smart_model": smart_model,
        }

    def generate_match_fix_report(
        self,
        resume_text: str,
        job_description: str,
        target_role: Optional[str] = None,
        company_name: Optional[str] = None,
        reddit_evidence: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate a structured Match & Fix report:
        - What the JD wants
        - What matches in the resume
        - What is missing/weak
        - Exact changes + suggested projects/certifications/action plan
        """
        p = self._match_fix_prepare(
            resume_text, job_description, target_role, company_name, reddit_evidence=reddit_evidence
        )
        prompt = p["prompt"]
        target_model = p["target_model"]
        max_tokens = p["max_tokens"]
        temperature = p["temperature"]
        matchfix_timeout = p["matchfix_timeout"]
        primary_effort = p["primary_effort"]
        enrich_retry = p["enrich_retry"]
        retry_effort = p["retry_effort"]
        explicit_model = p["explicit_model"]
        smart_model = p["smart_model"]

        t0 = time.perf_counter()
        response_text = self._call_gemini(
            prompt=prompt,
            max_retries=1,
            max_tokens=max_tokens,
            model_name=target_model,
            temperature_override=temperature,
            use_json_mode=True,
            timeout_seconds=matchfix_timeout,
            reasoning_effort=primary_effort if primary_effort and self._model_supports_reasoning_effort(target_model) else None,
        )
        logger.info(
            "Match & Fix primary done in %.1fs (model=%s, max_tokens=%s)",
            time.perf_counter() - t0,
            target_model,
            max_tokens,
        )
        raw = self._parse_json_response(response_text)
        normalized = self._normalize_match_fix_payload(raw)

        if enrich_retry and self._should_retry_match_fix(normalized):
            retry_prompt = f"""Improve this Match & Fix JSON to instructor grade.
Keep facts consistent with the original resume/JD evidence.
Do NOT reduce existing detail; only improve specificity and actionability.

Requirements for retry:
- Remove vague phrasing and banned words.
- Ensure 6+ resume_changes if misses are 3 or more.
- Ensure 2+ project_suggestions if misses are 3 or more.
- Ensure 2+ certification_suggestions if misses are 3 or more.
- Ensure company_insights is present, realistic, and clearly marked as inferred rather than verified.
- Ensure coaching_tracks.student_track and coaching_tracks.professional_track are complete and practical.
- Ensure interview_prep has 2+ this_week items, 2+ this_month items, and 3+ likely_interview_questions.
- Resource names must be real, well-known platforms/channels. Do NOT generate URLs.
- Return ONLY valid JSON in the same schema.

Current JSON:
{json.dumps(normalized)}"""
            try:
                retry_model = target_model if explicit_model else (smart_model or target_model)
                retry_text = self._call_gemini(
                    prompt=retry_prompt,
                    max_retries=1,
                    max_tokens=max_tokens,
                    model_name=retry_model,
                    temperature_override=min(0.25, max(0.0, temperature)),
                    use_json_mode=True,
                    timeout_seconds=matchfix_timeout,
                    reasoning_effort=retry_effort if retry_effort and self._model_supports_reasoning_effort(retry_model) else None,
                )
                retry_raw = self._parse_json_response(retry_text)
                retry_normalized = self._normalize_match_fix_payload(retry_raw)
                if self._match_fix_score(retry_normalized) >= self._match_fix_score(normalized):
                    normalized = retry_normalized
            except Exception as retry_exc:
                logger.warning("Match & Fix enrichment retry skipped due to error: %s", retry_exc)

        return normalized

    def iter_match_fix_sse(
        self,
        resume_text: str,
        job_description: str,
        target_role: Optional[str] = None,
        company_name: Optional[str] = None,
        reddit_evidence: Optional[str] = None,
    ) -> Iterator[str]:
        """
        Stream Match & Fix as Server-Sent Events lines (data: JSON\\n\\n).
        Event types: start, delta, report, error. Enrich retry is not applied on the stream path.
        """
        def _emit(obj: Dict[str, Any]) -> str:
            return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"

        try:
            p = self._match_fix_prepare(
                resume_text, job_description, target_role, company_name, reddit_evidence=reddit_evidence
            )
        except ValueError as exc:
            yield _emit({"type": "error", "message": str(exc)})
            return

        prompt = p["prompt"]
        selected_model = p["target_model"]
        token_budget = p["max_tokens"]
        effective_temperature = p["temperature"]
        timeout_budget = p["matchfix_timeout"]
        reasoning_effort_raw = p["primary_effort"]

        yield _emit({"type": "start", "model": selected_model})

        current_date_str = datetime.now().strftime("%B %d, %Y")
        call_kwargs: Dict[str, Any] = dict(
            model=selected_model,
            stream=True,
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
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=effective_temperature,
        )
        if selected_model.startswith(("gpt-5", "o1")):
            call_kwargs["max_completion_tokens"] = token_budget
        else:
            call_kwargs["max_tokens"] = token_budget
        if timeout_budget is not None and float(timeout_budget) > 0:
            call_kwargs["timeout"] = float(timeout_budget)
        call_kwargs["response_format"] = {"type": "json_object"}
        effort = (reasoning_effort_raw or "").strip().lower()
        if effort and self._model_supports_reasoning_effort(selected_model):
            call_kwargs["reasoning_effort"] = effort

        t0 = time.perf_counter()
        try:
            try:
                stream = self.client.chat.completions.create(**call_kwargs)
            except TypeError:
                call_kwargs.pop("reasoning_effort", None)
                stream = self.client.chat.completions.create(**call_kwargs)
            except Exception as api_err:
                if "reasoning_effort" in call_kwargs:
                    msg = str(api_err).lower()
                    if "reasoning" in msg or "unknown parameter" in msg or "unsupported" in msg:
                        call_kwargs.pop("reasoning_effort", None)
                        stream = self.client.chat.completions.create(**call_kwargs)
                    else:
                        raise
                else:
                    raise
        except Exception as exc:
            logger.error("Match & Fix stream start failed: %s", exc)
            yield _emit({"type": "error", "message": str(exc)})
            return

        parts: List[str] = []
        try:
            for chunk in stream:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                if delta is None:
                    continue
                piece = getattr(delta, "content", None) or ""
                if piece:
                    parts.append(piece)
                    yield _emit({"type": "delta", "text": piece})
        except Exception as exc:
            logger.error("Match & Fix stream read failed: %s", exc)
            yield _emit({"type": "error", "message": str(exc)})
            return

        full_text = "".join(parts).strip()
        logger.info(
            "Match & Fix stream done in %.1fs (model=%s, chars=%s)",
            time.perf_counter() - t0,
            selected_model,
            len(full_text),
        )
        if not full_text:
            yield _emit({"type": "error", "message": "Empty model response"})
            return
        try:
            raw = self._parse_json_response(full_text)
            normalized = self._normalize_match_fix_payload(raw)
            yield _emit({"type": "report", "report": normalized})
        except Exception as exc:
            logger.error("Match & Fix stream parse failed: %s", exc)
            yield _emit({"type": "error", "message": f"Failed to parse model JSON: {exc}"})

    def _normalize_match_fix_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize model output into a stable Match & Fix schema."""
        if not isinstance(payload, dict):
            payload = {}

        def _norm_dict_list(raw: Any, keep_keys: List[str]) -> List[Dict[str, Any]]:
            items: List[Dict[str, Any]] = []
            if not isinstance(raw, list):
                return items
            for row in raw:
                if not isinstance(row, dict):
                    continue
                cleaned = {k: row.get(k) for k in keep_keys}
                normalized = {}
                for key, value in cleaned.items():
                    if isinstance(value, list):
                        normalized[key] = [str(v).strip() for v in value if str(v).strip()]
                    elif value is None:
                        normalized[key] = ""
                    else:
                        normalized[key] = str(value).strip()
                items.append(normalized)
            return items

        overview = payload.get("overview") if isinstance(payload.get("overview"), dict) else {}
        fit_raw = overview.get("fit_score_estimate", 0)
        try:
            fit_score = int(float(fit_raw))
        except Exception:
            fit_score = 0
        fit_score = max(0, min(100, fit_score))
        blockers = overview.get("biggest_blockers", [])
        if not isinstance(blockers, list):
            blockers = []
        blockers = [str(b).strip() for b in blockers if str(b).strip()]

        jd_requirements = _norm_dict_list(
            payload.get("jd_requirements", []),
            ["id", "requirement", "priority", "jd_evidence"],
        )
        matches = _norm_dict_list(
            payload.get("matches", []),
            ["requirement_id", "requirement", "resume_evidence", "why_it_matches", "confidence"],
        )
        misses = _norm_dict_list(
            payload.get("misses", []),
            ["requirement_id", "requirement", "gap_type", "what_is_missing", "where_to_fix", "proof_to_add"],
        )
        resume_changes = _norm_dict_list(
            payload.get("resume_changes", []),
            ["section", "current_line", "recommended_change", "jd_signal", "reason"],
        )
        project_suggestions = _norm_dict_list(
            payload.get("project_suggestions", []),
            ["project_name", "why_this_project", "skills_proved", "scope", "deliverables", "resume_bullet_example", "timeline"],
        )
        certification_suggestions = _norm_dict_list(
            payload.get("certification_suggestions", []),
            ["name", "provider", "why_this_person_needs_it", "gap_it_closes", "time_to_complete", "cost_estimate", "url"],
        )
        action_plan = _norm_dict_list(
            payload.get("action_plan", []),
            ["horizon", "actions"],
        )
        coaching_raw = payload.get("coaching_tracks") if isinstance(payload.get("coaching_tracks"), dict) else {}

        def _norm_track(track_key: str) -> Dict[str, Any]:
            raw_track = coaching_raw.get(track_key) if isinstance(coaching_raw.get(track_key), dict) else {}
            return {
                "who_for": str(raw_track.get("who_for", "")).strip(),
                "focus": str(raw_track.get("focus", "")).strip(),
                "next_14_days": [str(v).strip() for v in raw_track.get("next_14_days", []) if str(v).strip()] if isinstance(raw_track.get("next_14_days"), list) else [],
                "next_30_days": [str(v).strip() for v in raw_track.get("next_30_days", []) if str(v).strip()] if isinstance(raw_track.get("next_30_days"), list) else [],
                "portfolio_focus": [str(v).strip() for v in raw_track.get("portfolio_focus", []) if str(v).strip()] if isinstance(raw_track.get("portfolio_focus"), list) else [],
                "interview_focus": [str(v).strip() for v in raw_track.get("interview_focus", []) if str(v).strip()] if isinstance(raw_track.get("interview_focus"), list) else [],
            }

        keyword_map_raw = payload.get("keyword_map") if isinstance(payload.get("keyword_map"), dict) else {}
        keyword_map = {
            "exact_jd_keywords": [str(k).strip() for k in keyword_map_raw.get("exact_jd_keywords", []) if str(k).strip()] if isinstance(keyword_map_raw.get("exact_jd_keywords"), list) else [],
            "present_in_resume": [str(k).strip() for k in keyword_map_raw.get("present_in_resume", []) if str(k).strip()] if isinstance(keyword_map_raw.get("present_in_resume"), list) else [],
            "missing_from_resume": [str(k).strip() for k in keyword_map_raw.get("missing_from_resume", []) if str(k).strip()] if isinstance(keyword_map_raw.get("missing_from_resume"), list) else [],
        }

        return {
            "overview": {
                "fit_score_estimate": fit_score,
                "fit_summary": str(overview.get("fit_summary", "")).strip(),
                "biggest_blockers": blockers[:8],
            },
            "jd_requirements": jd_requirements[:12],
            "matches": matches[:20],
            "misses": misses[:20],
            "resume_changes": resume_changes[:20],
            "project_suggestions": project_suggestions[:8],
            "certification_suggestions": certification_suggestions[:8],
            "keyword_map": keyword_map,
            "company_insights": self._normalize_company_insights(payload.get("company_insights")),
            "action_plan": action_plan[:3],
            "coaching_tracks": {
                "student_track": _norm_track("student_track"),
                "professional_track": _norm_track("professional_track"),
            },
            "interview_prep": self._normalize_interview_prep(payload.get("interview_prep")),
        }

    def _normalize_company_insights(self, raw: Any) -> Dict[str, Any]:
        """Normalize inferred company intelligence into a stable schema."""
        if not isinstance(raw, dict):
            raw = {}

        try:
            hiring_score = int(float(raw.get("hiring_score", 0) or 0))
        except Exception:
            hiring_score = 0

        return {
            "hiring_intensity": str(raw.get("hiring_intensity", "unknown")).strip() or "unknown",
            "hiring_trend": str(raw.get("hiring_trend", "unknown")).strip() or "unknown",
            "hiring_focus": [str(v).strip() for v in raw.get("hiring_focus", []) if str(v).strip()] if isinstance(raw.get("hiring_focus"), list) else [],
            "hiring_style": str(raw.get("hiring_style", "unknown")).strip() or "unknown",
            "risk_signals": [str(v).strip() for v in raw.get("risk_signals", []) if str(v).strip()] if isinstance(raw.get("risk_signals"), list) else [],
            "strategy_signal": str(raw.get("strategy_signal", "")).strip(),
            "getting_in_difficulty": str(raw.get("getting_in_difficulty", "unknown")).strip() or "unknown",
            "hiring_score": max(0, min(100, hiring_score)),
            "candidate_advice": str(raw.get("candidate_advice", "")).strip(),
            "confidence": str(raw.get("confidence", "low")).strip() or "low",
            "note": str(raw.get("note", "")).strip(),
        }

    def _normalize_interview_prep(self, raw: Any) -> Dict[str, Any]:
        """Normalize interview_prep output from the model."""
        if not isinstance(raw, dict):
            raw = {}

        def _norm_resources(res_list: Any) -> List[Dict[str, str]]:
            if not isinstance(res_list, list):
                return []
            out = []
            for r in res_list:
                if not isinstance(r, dict):
                    continue
                out.append({
                    "name": str(r.get("name", "")).strip(),
                    "type": str(r.get("type", "")).strip(),
                    "what_to_study": str(r.get("what_to_study", "")).strip(),
                    "time_needed": str(r.get("time_needed", "")).strip(),
                })
            return out

        this_week: List[Dict[str, Any]] = []
        for item in (raw.get("this_week", []) if isinstance(raw.get("this_week"), list) else []):
            if not isinstance(item, dict):
                continue
            this_week.append({
                "topic": str(item.get("topic", "")).strip(),
                "why_this_first": str(item.get("why_this_first", "")).strip(),
                "resources": _norm_resources(item.get("resources")),
            })

        this_month: List[Dict[str, Any]] = []
        for item in (raw.get("this_month", []) if isinstance(raw.get("this_month"), list) else []):
            if not isinstance(item, dict):
                continue
            this_month.append({
                "topic": str(item.get("topic", "")).strip(),
                "why": str(item.get("why", "")).strip(),
                "resources": _norm_resources(item.get("resources")),
            })

        questions: List[Dict[str, str]] = []
        for q in (raw.get("likely_interview_questions", []) if isinstance(raw.get("likely_interview_questions"), list) else []):
            if not isinstance(q, dict):
                continue
            questions.append({
                "question": str(q.get("question", "")).strip(),
                "type": str(q.get("type", "")).strip(),
                "why_they_ask_this": str(q.get("why_they_ask_this", "")).strip(),
                "how_to_prepare": str(q.get("how_to_prepare", "")).strip(),
                "prep_resource": str(q.get("prep_resource", "")).strip(),
            })

        mock_raw = raw.get("mock_interview_plan") if isinstance(raw.get("mock_interview_plan"), dict) else {}
        mock_plan = {
            "platform": str(mock_raw.get("platform", "")).strip(),
            "schedule": str(mock_raw.get("schedule", "")).strip(),
            "focus_areas": [str(f).strip() for f in mock_raw.get("focus_areas", []) if str(f).strip()] if isinstance(mock_raw.get("focus_areas"), list) else [],
        }

        return {
            "estimated_total_prep_time": str(raw.get("estimated_total_prep_time", "")).strip(),
            "this_week": this_week[:6],
            "this_month": this_month[:4],
            "likely_interview_questions": questions[:8],
            "mock_interview_plan": mock_plan,
        }

    def _match_fix_vague_hits(self, report: Dict[str, Any]) -> int:
        banned = [
            "if applicable",
            "consider adding",
            "might",
            "maybe",
            "no direct line",
        ]

        haystacks: List[str] = []
        for item in report.get("resume_changes", []) or []:
            if isinstance(item, dict):
                haystacks.append(str(item.get("recommended_change", "")))
                haystacks.append(str(item.get("reason", "")))
        for item in report.get("action_plan", []) or []:
            if isinstance(item, dict):
                actions = item.get("actions", [])
                if isinstance(actions, list):
                    haystacks.extend(str(a) for a in actions)
        for item in report.get("misses", []) or []:
            if isinstance(item, dict):
                haystacks.append(str(item.get("what_is_missing", "")))
                haystacks.append(str(item.get("proof_to_add", "")))

        text = " ".join(haystacks).lower()
        return sum(1 for phrase in banned if phrase in text)

    def _match_fix_score(self, report: Dict[str, Any]) -> int:
        misses = len(report.get("misses", []) or [])
        changes = len(report.get("resume_changes", []) or [])
        projects = len(report.get("project_suggestions", []) or [])
        certs = len(report.get("certification_suggestions", []) or [])
        actions = sum(
            len(item.get("actions", []))
            for item in (report.get("action_plan", []) or [])
            if isinstance(item, dict) and isinstance(item.get("actions"), list)
        )

        coaching = report.get("coaching_tracks", {}) if isinstance(report.get("coaching_tracks"), dict) else {}
        student = coaching.get("student_track", {}) if isinstance(coaching.get("student_track"), dict) else {}
        pro = coaching.get("professional_track", {}) if isinstance(coaching.get("professional_track"), dict) else {}
        coaching_depth = sum(
            len(track.get(key, []))
            for track in (student, pro)
            for key in ("next_14_days", "next_30_days", "portfolio_focus", "interview_focus")
            if isinstance(track.get(key), list)
        )

        interview = report.get("interview_prep", {}) if isinstance(report.get("interview_prep"), dict) else {}
        interview_depth = (
            len(interview.get("this_week", []) if isinstance(interview.get("this_week"), list) else [])
            + len(interview.get("this_month", []) if isinstance(interview.get("this_month"), list) else [])
            + len(interview.get("likely_interview_questions", []) if isinstance(interview.get("likely_interview_questions"), list) else [])
        )

        vague_penalty = self._match_fix_vague_hits(report) * 4
        base = (changes * 4) + (projects * 5) + (certs * 3) + (actions * 2) + coaching_depth + interview_depth + misses
        return max(0, base - vague_penalty)

    def _should_retry_match_fix(self, report: Dict[str, Any]) -> bool:
        misses = len(report.get("misses", []) or [])
        changes = len(report.get("resume_changes", []) or [])
        projects = len(report.get("project_suggestions", []) or [])
        certs = len(report.get("certification_suggestions", []) or [])

        coaching = report.get("coaching_tracks", {}) if isinstance(report.get("coaching_tracks"), dict) else {}
        student = coaching.get("student_track", {}) if isinstance(coaching.get("student_track"), dict) else {}
        pro = coaching.get("professional_track", {}) if isinstance(coaching.get("professional_track"), dict) else {}
        coaching_ready = bool(student.get("next_14_days")) and bool(pro.get("next_14_days"))

        if misses >= 3 and (changes < 6 or projects < 2 or certs < 2):
            return True
        if self._match_fix_vague_hits(report) >= 1:
            return True
        if not coaching_ready:
            return True

        interview = report.get("interview_prep", {}) if isinstance(report.get("interview_prep"), dict) else {}
        interview_ready = (
            len(interview.get("this_week", []) if isinstance(interview.get("this_week"), list) else []) >= 2
            and len(interview.get("likely_interview_questions", []) if isinstance(interview.get("likely_interview_questions"), list) else []) >= 2
        )
        if not interview_ready:
            return True

        return False

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
                # Cleanup None values
                call_kwargs_brutal = {k: v for k, v in {
                    "model": self.brutal_model_name,
                    "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                    "temperature": 0.1,
                    "response_format": {"type": "json_object"},
                    "max_completion_tokens": brutal_max_tokens if self.brutal_model_name.startswith(("gpt-5", "o1")) else None,
                    "max_tokens": brutal_max_tokens if not self.brutal_model_name.startswith(("gpt-5", "o1")) else None,
                    "timeout": brutal_timeout,
                }.items() if v is not None}
                response = self.client.chat.completions.create(**call_kwargs_brutal)
            except Exception as structured_exc:
                logger.warning(
                    "Structured brutal review call failed, retrying without response_format: %s",
                    structured_exc,
                )
                retry_kwargs = {
                    "model": self.brutal_model_name,
                    "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                    "temperature": 0.1,
                    "timeout": brutal_timeout,
                }
                if self.brutal_model_name.startswith(("gpt-5", "o1")):
                    retry_kwargs["max_completion_tokens"] = min(brutal_max_tokens, 1200)
                else:
                    retry_kwargs["max_tokens"] = min(brutal_max_tokens, 1200)
                    
                response = self.client.chat.completions.create(**retry_kwargs)
            
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
