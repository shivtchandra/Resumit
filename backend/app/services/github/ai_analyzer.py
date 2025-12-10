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
        """Build AI prompt that thinks like a recruiter evaluating freshers."""
        
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
        
        prompt = f"""You are a RECRUITER at a tech company evaluating a FRESHER candidate for a {job_role} position.

You have 60 SECONDS to decide: "Should I interview this person?"

🎯 WHAT YOU'RE HIRING FOR: {job_role.upper()}
**Tech Stack We Use:** {', '.join(role_reqs.get('primary', []))}
**Nice to Have:** {', '.join(role_reqs.get('bonus', []))}
**Red Flags:** {', '.join(role_reqs.get('avoid', ['Outdated tech']))}

📂 CANDIDATE'S PROJECT: "{repo['name']}"

**Quick Facts:**
- Language: {primary_language}
- Size: {repo_size} KB
- Description: {repo.get('description', 'No description')}
- Topics: {', '.join(topics) if topics else 'None'}

📖 **README** (What they wrote):
```
{readme_content if readme_content else "❌ NO README - Can't even document their work!"}
```

{f"**Job Posting Keywords:** {job_description[:200]}" if job_description else ""}

🧠 RECRUITER THOUGHT PROCESS:

**FIRST 10 SECONDS** - Can they code?
- Is there a README? (If no → immediate red flag)
- Is the README professional or sloppy?
- Does it explain what the project does?
- Can I understand it without being a developer?

**NEXT 30 SECONDS** - What can they actually do?
- Is this a real project or tutorial copy-paste?
- What features did they build? (Auth? API? Database? UI?)
- Did they solve a real problem or just practice syntax?
- Does the tech stack match what we need?

**FINAL 20 SECONDS** - Should I call them?
- Would this impress my engineering team?
- Does it show learning ability and growth mindset?
- Is there passion/effort (good docs, polish, thought)?
- Can they explain this in an interview?

🎯 YOUR TASK:

Think like a recruiter. Be BRUTALLY HONEST:

**Ask yourself:**
1. "If I saw this on a resume, would I be impressed?"
2. "Does this show they can learn and solve problems?"
3. "Would my engineering team want to interview them?"
4. "Is this better than the other 100 fresher resumes I saw today?"

**Red Flags to Call Out:**
- No README or terrible README
- Tutorial clone (e.g., "Todo App", "Netflix Clone")
- Just used a framework, didn't solve a problem
- Outdated tech or wrong tech for the role
- No evidence of actual coding ability

**Green Flags to Highlight:**
- Professional README with setup instructions
- Original idea or real problem solved
- Multiple features showing depth
- Clean code structure (you can tell from README)
- Relevant tech stack for {job_role}

📦 OUTPUT (Strict JSON):

{{
  "relevance_score": 0-100,
  "interview_worthy": true/false,
  "first_impression": "Your honest first reaction in 1 sentence. Be blunt.",
  "can_they_code": "Based on README/project, do they seem capable? Why/why not?",
  "problem_solving_ability": "Did they solve a real problem or just follow tutorials? Evidence?",
  "tech_stack_fit": "Does their tech match our {job_role} needs? Explain.",
  "passion_and_effort": "Does this show they care about quality? Or is it half-baked?",
  "would_you_interview": "Yes/No and why. Be specific about what convinced you or turned you off.",
  "strengths": [
    "Specific strength that would impress in an interview",
    "Another strength"
  ],
  "red_flags": [
    "Specific concern or weakness",
    "Another red flag"
  ],
  "suggested_resume_bullets": [
    "• How to present this project on a resume (focus on impact, not just tech)",
    "• Another way to frame it that sounds impressive"
  ],
  "interview_questions": [
    "Question you'd ask them about this project",
    "Another question to test their understanding"
  ],
  "improvement_advice": [
    "What they should add/fix before putting this on resume",
    "Another improvement"
  ]
}}

SCORING LIKE A RECRUITER:
- **90-100**: "Wow, this is impressive for a fresher. Definitely interview."
- **75-89**: "Solid work. Shows potential. Worth a call."
- **50-74**: "Okay, but nothing special. Maybe if we're desperate."
- **25-49**: "Meh. Tutorial clone or weak work. Pass."
- **0-24**: "No README or terrible project. Hard pass."

**CRITICAL RULES:**
- No README = Auto score <30 ("Can't even document their work")
- Tutorial clone = Auto score <40 ("No original thinking")
- Wrong tech stack = Penalty ("They don't know what {job_role} needs")
- Good README + Original project + Right tech = 80+ ("This person gets it")

Be HARSH. You see 100 resumes a day. What makes THIS one special?

Return ONLY valid JSON, no markdown, no code blocks."""

        return prompt
    
    def _call_openai(self, prompt: str) -> Optional[Dict[str, Any]]:
        """Call OpenAI API."""
        try:
            response = self.openai_client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": "You are a brutally honest technical recruiter. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1500
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
