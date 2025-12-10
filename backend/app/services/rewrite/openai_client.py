"""
OpenAI Client for resume rewriting and analysis.
Provides an interface compatible with GeminiClient.
"""
import os
import json
import time
import logging
from typing import Dict, Any, List
from openai import OpenAI

logger = logging.getLogger(__name__)


class OpenAIClient:
    def __init__(self):
        """Initialize OpenAI client configuration."""
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        
        self.model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.temperature = float(os.getenv("OPENAI_TEMPERATURE", "0.0"))
        self.client = OpenAI(api_key=self.api_key)
        
        logger.info(f"Initialized OpenAI client with model: {self.model_name}, temperature: {self.temperature}")
    
    def _call_gemini(self, prompt: str, max_retries: int = 3) -> str:
        """
        Call OpenAI API with retry logic.
        Named _call_gemini for compatibility with existing code.
        
        Args:
            prompt: Prompt to send
            max_retries: Maximum number of retries
            
        Returns:
            Response text
        """
        for attempt in range(max_retries):
            try:
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[
                        {"role": "system", "content": "You are an expert ATS resume consultant and career advisor."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=self.temperature,
                    max_tokens=2048
                )
                
                text = response.choices[0].message.content
                if not text:
                    raise ValueError("Empty response from OpenAI")
                
                logger.info(f"OpenAI API call successful (attempt {attempt + 1})")
                return text
                
            except Exception as e:
                logger.error(f"OpenAI API call failed (attempt {attempt + 1}/{max_retries}): {e}")
                
                if attempt < max_retries - 1:
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
            
            # Fallback: try to extract bullets from plain text
            lines = text.split('\n')
            bullets = [line.strip('- •*').strip() for line in lines if line.strip() and not line.strip().startswith('{')]
            
            return {
                "bullets": bullets if bullets else ["Failed to parse response"],
                "explanation": "Parsed from plain text due to JSON error"
            }
    
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
        # Build the system prompt
        system_prompt = '''You are an expert hiring manager and ATS specialist reviewing resumes for a specific role.

You have two jobs:
1) Rewrite the candidate's resume to better match the job description WITHOUT inventing fake experience.
2) Give a brutally honest, hiring-manager style review of how well this candidate fits the role.

Personality:
- Direct, blunt, and time-constrained, like a senior hiring manager.
- You don't sugar-coat weak points.
- You never insult the candidate, but you clearly call out weaknesses, missing skills, and risk flags.
- You respect truthfulness: never add experience, companies, or tools that were not clearly implied in the original resume.

Output:
- ALWAYS return valid JSON only. No markdown, no extra commentary outside JSON.
- In "marked_up_resume", wrap additions in <ADD>...</ADD>, removals in <DEL>...</DEL>, and major rewrites in <REWRITE>...</REWRITE>.
- In "harsh_review", talk as if you are writing notes for another hiring manager, not the candidate. Keep it blunt and practical.
- Never make up employment history, degrees, or certifications that are not in the original resume.
- You may infer reasonable skills (e.g. SQL from "wrote queries in PostgreSQL") but label them as inferred.'''

        user_prompt = f"""RESUME CONTENT:
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

        # Call OpenAI with extended max_tokens for longer response
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=4096
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
