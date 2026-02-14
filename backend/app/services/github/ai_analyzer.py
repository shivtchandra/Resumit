"""
AI-powered GitHub repository analyzer using OpenAI.
"""
import os
import logging
from typing import Dict, Any, Optional
from openai import OpenAI
from pathlib import Path
from dotenv import load_dotenv
import json

# Load environment variables
env_path = Path(__file__).resolve().parent.parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)


# Role-specific language requirements
ROLE_LANGUAGE_MAP = {
    "software-engineer": {
        "primary": ["JavaScript", "TypeScript", "Python", "Java", "Go", "C++", "C#", "Ruby"],
        "bonus": ["Rust", "Kotlin", "Swift"],
        "avoid": ["PHP < 7", "Perl", "Visual Basic"]
    },
    "frontend-developer": {
        "primary": ["JavaScript", "TypeScript", "HTML", "CSS"],
        "bonus": ["React", "Vue", "Angular", "Svelte", "Next.js"],
        "avoid": ["jQuery-only projects", "Flash"]
    },
    "backend-developer": {
        "primary": ["Python", "Java", "Go", "Node.js", "C#", "Ruby"],
        "bonus": ["Rust", "Elixir", "Scala"],
        "avoid": ["PHP < 7"]
    },
    "data-scientist": {
        "primary": ["Python", "R", "SQL"],
        "bonus": ["Julia", "Scala"],
        "avoid": ["Excel-only", "SPSS"]
    },
    "data-analyst": {
        "primary": ["Python", "R", "SQL"],
        "bonus": ["Tableau", "Power BI"],
        "avoid": ["Excel-only"]
    },
    "machine-learning-engineer": {
        "primary": ["Python", "C++"],
        "bonus": ["Julia", "R"],
        "frameworks": ["TensorFlow", "PyTorch", "Keras", "scikit-learn"]
    },
    "devops-engineer": {
        "primary": ["Python", "Go", "Bash", "Shell"],
        "bonus": ["Rust", "Ruby"],
        "tools": ["Docker", "Kubernetes", "Terraform", "Ansible"]
    },
    "mobile-developer": {
        "primary": ["Swift", "Kotlin", "Java", "Dart"],
        "bonus": ["React Native", "Flutter"],
        "avoid": ["Cordova", "PhoneGap"]
    },
    "full-stack-developer": {
        "primary": ["JavaScript", "TypeScript", "Python"],
        "bonus": ["Go", "Java"],
        "frameworks": ["React", "Node.js", "Django", "FastAPI"]
    }
}


class GitHubAIAnalyzer:
    def __init__(self):
        """Initialize AI analyzer with OpenAI client."""
        try:
            openai_key = os.getenv("OPENAI_API_KEY")
            if openai_key:
                self.openai_client = OpenAI(api_key=openai_key)
                self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
                logger.info("OpenAI initialized for GitHub analysis")
            else:
                self.openai_client = None
                logger.error("No OpenAI API key found")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI: {e}")
            self.openai_client = None
    
    def analyze_repository(
        self,
        repo: Dict[str, Any],
        job_role: str,
        job_description: str = ""
    ) -> Optional[Dict[str, Any]]:
        """
        Analyze repository using OpenAI to generate enhanced insights.
        
        Args:
            repo: Repository data dictionary
            job_role: Target job role
            job_description: Optional job description
            
        Returns:
            AI analysis with score, reasoning, resume bullets, etc.
        """
        if not self.openai_client:
            logger.error("OpenAI client not initialized")
            return None
            
        try:
            prompt = self._build_prompt(repo, job_role, job_description)
            result = self._call_openai(prompt)
            if result:
                logger.info(f"OpenAI analysis successful for {repo['name']}")
                return result
        except Exception as e:
            logger.error(f"OpenAI analysis failed for {repo['name']}: {e}")
            return None
    
    def _build_prompt(
        self,
        repo: Dict[str, Any],
        job_role: str,
        job_description: str
    ) -> str:
        """Build concise AI prompt for fast recruiter-style repository review."""
        
        # Get role-specific requirements
        role_reqs = ROLE_LANGUAGE_MAP.get(job_role, {
            "primary": [],
            "bonus": [],
            "avoid": []
        })
        
        # Format repo data
        languages_list = list(repo.get("languages", {}).keys())
        primary_language = repo.get("language", "Unknown")
        topics = repo.get("topics", [])
        readme_content = repo.get("readme_content", "")
        repo_size = repo.get("size", 0)
        
        prompt = f"""You are a strict technical recruiter. Evaluate one GitHub repo for a {job_role} role.

Role tech priorities: {', '.join(role_reqs.get('primary', []))}
Bonus tech: {', '.join(role_reqs.get('bonus', []))}
Avoid: {', '.join(role_reqs.get('avoid', ['outdated stack']))}

Repo:
- Name: {repo['name']}
- Primary language: {primary_language}
- Size: {repo_size} KB
- Description: {repo.get('description', 'No description')}
- Topics: {', '.join(topics) if topics else 'None'}
- README snippet: {readme_content[:1200] if readme_content else 'NO README'}
{f"- JD keywords: {job_description[:180]}" if job_description else ""}

Rules:
- Be blunt and practical.
- If README is missing or weak, penalize heavily.
- If tech stack mismatches role, penalize.
- Keep output short.
- Return valid JSON only.

JSON schema:
{{
  "relevance_score": 0-100,
  "interview_worthy": true/false,
  "first_impression": "1 sentence",
  "can_they_code": "1 short sentence",
  "problem_solving_ability": "1 short sentence",
  "tech_stack_fit": "1 short sentence",
  "passion_and_effort": "1 short sentence",
  "would_you_interview": "Yes/No + reason in 1 short sentence",
  "strengths": ["max 2 bullets"],
  "red_flags": ["max 2 bullets"],
  "suggested_resume_bullets": ["max 2 bullets"],
  "interview_questions": ["max 2 questions"],
  "improvement_advice": ["max 2 actions"]
}}"""

        return prompt
    
    def _call_openai(self, prompt: str) -> Optional[Dict[str, Any]]:
        """Call OpenAI API."""
        try:
            timeout_seconds = float(os.getenv("GITHUB_AI_TIMEOUT_SECONDS", "10"))
            response = self.openai_client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": "You are a brutally honest technical recruiter. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=800,
                timeout=timeout_seconds
            )
            
            # Parse JSON response
            text = response.choices[0].message.content.strip()
            # Remove markdown code blocks if present
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            
            result = json.loads(text.strip())
            return result
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
