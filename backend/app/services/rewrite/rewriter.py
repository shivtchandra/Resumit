"""
Enhanced Resume Rewriter
Orchestrates full resume rewrites using AI (Gemini or OpenAI) with layout schema.
"""

import os
from typing import Dict, Any, List, Optional, Tuple
import logging
from copy import deepcopy
import re
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)

JD_STOP_WORDS = {
    "with", "that", "this", "from", "have", "will", "your", "their", "about",
    "years", "year", "experience", "ability", "using", "team", "work", "role",
    "required", "preferred", "strong", "skills", "knowledge", "development",
    "build", "built", "building", "engineer", "engineering", "candidate",
    "responsibilities", "responsibility", "requirements", "plus", "good",
    "excellent", "proven", "across", "including", "design", "implement",
    "analysis", "analyze", "company", "product", "business", "customers",
    "stakeholders", "communication", "written", "verbal", "ability",
}

GENERIC_SIGNAL_BLOCKLIST = {
    "analysis",
    "architectural",
    "billions",
    "build",
    "develop",
    "working",
    "ownership",
    "solution",
    "solutions",
    "technical",
    "engineering",
    "product",
    "projects",
    "problem",
    "problems",
    "systems",
    "software",
    "scalable",
    "code",
    "testing",
    "metrics",
}

TECH_FALLBACK_ALLOWLIST = {
    "backend",
    "frontend",
    "fullstack",
    "full-stack",
    "api",
    "apis",
    "testing",
    "pytest",
    "jest",
    "oauth",
    "jwt",
    "security",
    "performance",
    "scalability",
    "scalable",
    "devops",
    "sre",
    "observability",
    "monitoring",
    "linux",
    "agile",
    "scrum",
    "kafka",
    "airflow",
    "etl",
    "serverless",
    "kotlin",
    "swift",
    "android",
    "ios",
    "graphql",
    "rest",
    "cloud",
    "distributed",
    "architecture",
    "architectures",
}

JD_TECH_SIGNAL_PATTERNS: List[Tuple[str, str]] = [
    ("React", r"\breact(?:\.js)?\b"),
    ("TypeScript", r"\btypescript\b"),
    ("JavaScript", r"\bjavascript\b"),
    ("Node.js", r"\bnode(?:\.js)?\b"),
    ("Express.js", r"\bexpress(?:\.js)?\b"),
    ("Next.js", r"\bnext(?:\.js)?\b"),
    ("Python", r"\bpython\b"),
    ("Java", r"\bjava\b"),
    ("Go", r"\bgolang\b|\bgo\b"),
    ("C++", r"\bc\+\+\b"),
    ("C#", r"\bc#\b"),
    ("SQL", r"\bsql\b"),
    ("PostgreSQL", r"\bpostgres(?:ql)?\b"),
    ("MySQL", r"\bmysql\b"),
    ("MongoDB", r"\bmongodb\b"),
    ("Redis", r"\bredis\b"),
    ("Docker", r"\bdocker\b"),
    ("Kubernetes", r"\bkubernetes\b|\bk8s\b"),
    ("CI/CD", r"\bci\s*/\s*cd\b|\bci-cd\b"),
    ("GitHub Actions", r"\bgithub actions\b"),
    ("Terraform", r"\bterraform\b"),
    ("AWS", r"\baws\b|\bamazon web services\b"),
    ("GCP", r"\bgcp\b|\bgoogle cloud\b"),
    ("Azure", r"\bazure\b"),
    ("REST APIs", r"\brest\b|\brestful\b"),
    ("GraphQL", r"\bgraphql\b"),
    ("Microservices", r"\bmicroservices?\b"),
    ("System Design", r"\bsystem design\b"),
    ("Distributed Systems", r"\bdistributed systems?\b"),
    ("Machine Learning", r"\bmachine learning\b"),
    ("Deep Learning", r"\bdeep learning\b"),
    ("NLP", r"\bnlp\b|\bnatural language processing\b"),
    ("LLMs", r"\bllm\b|\bllms\b|\blarge language models?\b"),
    ("RAG", r"\brag\b|\bretrieval-augmented generation\b"),
    ("TensorFlow", r"\btensorflow\b"),
    ("PyTorch", r"\bpytorch\b"),
    ("Scikit-learn", r"\bscikit-learn\b|\bsklearn\b"),
    ("Spark", r"\bspark\b"),
    ("Tableau", r"\btableau\b"),
    ("Power BI", r"\bpower\s*bi\b"),
]

_BULLET_PATTERN = r"[•●◦▪\-\*]"


class ResumeRewriter:
    def __init__(self):
        """Initialize rewriter with AI client (Gemini or OpenAI)."""
        # Ensure environment variables are loaded
        from dotenv import load_dotenv
        from pathlib import Path
        env_path = Path(__file__).parent.parent.parent.parent / '.env'
        load_dotenv(dotenv_path=env_path)
        
        configured_provider = os.getenv("AI_PROVIDER", "auto").lower()
        if configured_provider == "auto":
            if os.getenv("OPENAI_API_KEY"):
                ai_provider = "openai"
            elif os.getenv("GEMINI_API_KEY"):
                ai_provider = "gemini"
            else:
                ai_provider = "gemini"
        else:
            ai_provider = configured_provider
        
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
            logger.warning(f"AI client unavailable, using fallback rewrite mode: {e}")
            self.ai_client = None
            self.has_gemini = False
    
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
        if not self.ai_client:
            return self._rewrite_without_ai(layout_schema, target_keywords)
        
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

    def rewrite_with_brutal_review(
        self,
        original_resume_text: str,
        job_description: str,
        company_name: Optional[str] = None,
        detected_linkedin_url: Optional[str] = None,
        detected_github_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Run AI brutal review when available, otherwise return deterministic practical feedback."""
        fallback_result = self._fallback_brutal_review(
            original_resume_text=original_resume_text,
            job_description=job_description,
            company_name=company_name,
            detected_linkedin_url=detected_linkedin_url,
            detected_github_url=detected_github_url,
        )

        if self.ai_client and hasattr(self.ai_client, "rewrite_with_brutal_review"):
            try:
                ai_result = self.ai_client.rewrite_with_brutal_review(
                    original_resume_text=original_resume_text,
                    job_description=job_description,
                    company_name=company_name,
                )
                if ai_result is None:
                    raise ValueError("AI client returned None")
                merged = self._merge_brutal_payload(
                    ai_result=ai_result,
                    fallback_result=fallback_result,
                )
                ai_interview = ai_result.get("interview_prep") if isinstance(ai_result, dict) else None
                fallback_interview = self._generate_interview_prep(
                    original_resume_text=original_resume_text,
                    job_description=job_description,
                    company_name=company_name,
                )
                merged["interview_prep"] = self._merge_interview_prep(
                    ai_interview=ai_interview,
                    fallback_interview=fallback_interview,
                )
                merged = self._stabilize_brutal_payload(
                    result=merged,
                    original_resume_text=original_resume_text,
                    job_description=job_description,
                    detected_linkedin_url=detected_linkedin_url,
                    detected_github_url=detected_github_url,
                )

                if not self._is_valid_brutal_result(merged):
                    raise ValueError("AI brutal review response is incomplete")

                mode = "ai" if merged.get("changes") and merged.get("marked_up_resume") != fallback_result.get("marked_up_resume") else "hybrid"
                merged["generation_mode"] = mode
                return merged
            except Exception as exc:
                import traceback
                logger.warning("AI brutal review failed, switching to fallback: %s\n%s", exc, traceback.format_exc())

        fallback_result["generation_mode"] = "fallback"
        fallback_result["interview_prep"] = self._merge_interview_prep(
            ai_interview=None,
            fallback_interview=self._generate_interview_prep(
                original_resume_text=original_resume_text,
                job_description=job_description,
                company_name=company_name,
            ),
        )
        fallback_result = self._stabilize_brutal_payload(
            result=fallback_result,
            original_resume_text=original_resume_text,
            job_description=job_description,
            detected_linkedin_url=detected_linkedin_url,
            detected_github_url=detected_github_url,
        )
        return fallback_result

    def _rewrite_without_ai(
        self,
        layout_schema: Dict[str, Any],
        target_keywords: List[str]
    ) -> Dict[str, Any]:
        rewritten_schema = deepcopy(layout_schema)
        explanations: List[str] = []
        changes: List[Dict[str, Any]] = []

        for section in rewritten_schema.get("sections", []):
            section_type = section.get("type")
            if section_type == "SUMMARY":
                original = section.get("raw", "") or ""
                missing = [kw for kw in target_keywords if kw.lower() not in original.lower()][:3]
                if missing:
                    addition = f" Core strengths include {', '.join(missing)}."
                    section["raw"] = (original.strip() + addition).strip()
                    changes.append({"section": "Summary", "original": original, "rewritten": section["raw"]})
                    explanations.append("Summary optimized with relevant target keywords (fallback mode).")

            if section_type == "SKILLS":
                original = section.get("raw", "") or ""
                normalized = [s.strip() for s in original.replace("\n", ",").split(",") if s.strip()]
                current = {s.lower() for s in normalized}
                additions = [kw for kw in target_keywords if kw.lower() not in current][:8]
                if additions:
                    merged = normalized + additions
                    section["raw"] = ", ".join(merged)
                    changes.append({"section": "Skills", "original": original, "rewritten": section["raw"]})
                    explanations.append("Skills expanded with missing role keywords (fallback mode).")

        delta_report = self._generate_delta_report(
            layout_schema,
            rewritten_schema,
            changes,
            target_keywords
        )

        if not explanations:
            explanations.append("AI provider not configured; resume structure preserved in fallback mode.")

        return {
            "rewritten_schema": rewritten_schema,
            "explanations": explanations,
            "delta_report": delta_report
        }

    def _fallback_brutal_review(
        self,
        original_resume_text: str,
        job_description: str,
        company_name: Optional[str] = None,
        detected_linkedin_url: Optional[str] = None,
        detected_github_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        lines = [line.strip() for line in original_resume_text.splitlines() if line.strip()]
        bullet_lines = [line for line in lines if line.startswith(("-", "•", "*")) or len(line) > 35]
        with_numbers = [line for line in bullet_lines if any(ch.isdigit() for ch in line)]
        missing = self._derive_missing_jd_signals(
            job_description=job_description,
            resume_text=original_resume_text,
            limit=8,
        )
        jd_signals = self._extract_jd_keywords(job_description, limit=8)
        label_heavy_lines = [
            line for line in bullet_lines
            if re.match(r"(?i)^[•\-\*]?\s*(objective|description|key contributions|technologies used|outcome)\s*:", line)
        ]
        has_linkedin = bool(detected_linkedin_url) or bool(
            re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/", original_resume_text, re.IGNORECASE)
        )
        has_github = bool(detected_github_url) or bool(
            re.search(r"(?:https?://)?(?:www\.)?github\.com/[A-Za-z0-9-]+", original_resume_text, re.IGNORECASE)
        )
        evidence_lines = self._extract_evidence_lines(original_resume_text, limit=6)

        plain_text, marked_up_resume, structured_changes = self._build_deterministic_rewrite(
            original_resume_text=original_resume_text,
            job_description=job_description,
            detected_linkedin_url=detected_linkedin_url,
            detected_github_url=detected_github_url,
        )

        strengths = []
        weaknesses = []
        if with_numbers:
            strengths.append("Some bullets have numbers — that's the bare minimum, not a strength. But at least you tried.")
        else:
            weaknesses.append("Zero quantified outcomes. Every bullet reads like a job description copy-paste. Recruiters see through this instantly.")

        if has_linkedin:
            strengths.append("LinkedIn is present. Good — recruiters will check it within 30 seconds of reading your resume.")
        else:
            weaknesses.append("No LinkedIn URL. In 2024+, this is a red flag. Recruiters assume you have something to hide.")

        if has_github:
            strengths.append("GitHub link found. This helps if your repos aren't full of tutorial code.")
        else:
            weaknesses.append("No GitHub link on a technical resume. Recruiters immediately question your coding ability.")

        if len(label_heavy_lines) >= 3:
            weaknesses.append("Resume is stuffed with label-heavy lines ('Objective:', 'Description:', 'Outcome:'). This screams junior template. Remove them.")

        if len(lines) < 20:
            weaknesses.append("Resume is thin — looks like you barely have experience. Even if you do, the layout is not selling it.")
        if missing:
            weaknesses.append(f"Missing {len(missing)} critical JD signals. The ATS will likely filter you out before a human ever sees this.")
        if jd_signals and not missing:
            strengths.append("Most JD keywords are present. Good coverage, but keyword stuffing alone won't save a weak resume.")

        harsh_review = {
            "overall_verdict": (
                "You're close but not close enough. A recruiter with 200 applications would skip yours."
                if strengths and missing
                else "This resume needs serious work. As it stands, it's a fast rejection."
            ),
            "strengths": strengths[:4] or ["Honestly? Nothing stands out. That's the core problem."],
            "weaknesses": weaknesses[:6] or ["Generic, unfocused, and indistinguishable from 90% of applicants."],
            "missing_or_weak_skills": [
                {
                    "skill": kw,
                    "why_it_matters": f"'{kw}' is explicitly in this JD. If you can't show it, the ATS filters you and the recruiter never sees your name.",
                    "how_to_build_it": self._build_skill_gap_advice(kw, evidence_lines),
                    "success_story": self._success_story_hint(kw),
                }
                for kw in missing[:6]
            ],
            "risk_flags": ["LOW_METRIC_DENSITY", "GENERIC_LANGUAGE"] + (["MISSING_JD_TERMS"] if missing else []),
            "would_I_interview_you": "maybe" if len(strengths) >= 3 else "no",
            "rationale": (
                "Some signals are there but the overall presentation wouldn't survive a 6-second recruiter scan. Fix the gaps or get auto-rejected."
                if missing
                else "Keywords check out but the resume lacks depth. You'd survive ATS but not a human review."
            ),
            "top_3_actions": [
                {
                    "action": "Rewrite your top 5 bullets with real numbers",
                    "how_to_do_it": "Every bullet needs: what you did + the scale + the measurable result. 'Improved API performance by 40%, reducing P99 latency from 800ms to 200ms' — not 'Worked on API improvements'.",
                    "resources": ["STAR method", "XYZ formula"],
                    "time_estimate": "60-90 minutes",
                    "what_helped_others": "Candidates who added metrics saw 2-3x more callbacks."
                },
                {
                    "action": "Match your language to the JD — word for word",
                    "how_to_do_it": (
                        f"You're missing: {', '.join(missing[:3])}. If these are truthful, weave them into your bullets today."
                        if missing
                        else "Mirror the JD phrasing in your summary, skills, and project descriptions."
                    ),
                    "resources": ["JD keyword mapping"],
                    "time_estimate": "30 minutes",
                    "what_helped_others": "ATS keyword match jumped from 40% to 80%+ after alignment."
                },
                {
                    "action": "Cut every line that doesn't prove something",
                    "how_to_do_it": "If a bullet doesn't have a number, a deliverable, or a concrete outcome — delete it. Filler hurts more than gaps.",
                    "resources": ["Resume anti-pattern guide"],
                    "time_estimate": "20 minutes",
                    "what_helped_others": "Shorter, sharper resumes consistently outperform longer generic ones."
                },
            ],
        }

        return {
            "plain_text": plain_text,
            "marked_up_resume": marked_up_resume,
            "changes": structured_changes,
            "company_expectations": {
                "role_summary": "Hiring team expects role-relevant evidence, not generic claims.",
                "what_the_company_cares_about": ["Execution ownership", "Measurable outcomes", "Role-fit skills"],
                "ideal_candidate_snapshot": ["Shows impact", "Uses precise role language", "Demonstrates growth"],
            },
            "harsh_review": harsh_review,
            "interview_prep": self._generate_interview_prep(
                original_resume_text=original_resume_text,
                job_description=job_description,
                company_name=company_name,
            ),
        }

    def _is_valid_brutal_result(self, result: Dict[str, Any]) -> bool:
        if not isinstance(result, dict):
            return False

        harsh_review = result.get("harsh_review", {})
        if not isinstance(harsh_review, dict):
            return False

        verdict = str(harsh_review.get("overall_verdict", "")).lower()
        if "unable to generate" in verdict:
            return False

        if not harsh_review.get("top_3_actions") and not harsh_review.get("weaknesses"):
            return False

        return True

    def _generate_interview_prep(
        self,
        original_resume_text: str,
        job_description: str,
        company_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        company = (company_name or "the company").strip()

        impactful_lines = self._extract_evidence_lines(original_resume_text, limit=5)
        jd_keywords = self._extract_jd_keywords(job_description, limit=8)
        missing_keywords = self._derive_missing_jd_signals(
            job_description=job_description,
            resume_text=original_resume_text,
            limit=5,
        )

        questions = []

        for line in impactful_lines[:3]:
            answer_framework = self._build_answer_framework("resume_deep_dive", line, company, job_description)
            questions.append({
                "category": "resume_deep_dive",
                "question": f"Walk me through this achievement in detail: \"{line}\". What exactly did you own and what moved because of your work?",
                "why_asked": "Interviewers validate ownership and depth behind resume claims.",
                "prep_tip": "Prepare STAR story with scope, constraints, and final metrics.",
                "answer_framework": answer_framework,
                "sample_answer": self._build_sample_answer(answer_framework, line)
            })

        for kw in (missing_keywords or jd_keywords[:3]):
            answer_framework = self._build_answer_framework("jd_alignment", kw, company, job_description)
            questions.append({
                "category": "jd_alignment",
                "question": f"Give one concrete project example where you used {kw}. What trade-off did you make, and what measurable result followed?",
                "why_asked": "Hiring managers probe role-fit for JD-critical capabilities.",
                "prep_tip": f"Use one project, one technical decision, and one metric tied to {kw}.",
                "answer_framework": answer_framework,
                "sample_answer": self._build_sample_answer(answer_framework, kw)
            })

        company_fit_framework = self._build_answer_framework("company_fit", company, company, job_description)
        questions.extend([
            {
                "category": "company_fit",
                "question": f"Why do you want to join {company}, and which part of our product/business are you most excited to improve?",
                "why_asked": "Assesses motivation and whether the candidate researched the company.",
                "prep_tip": "Use specific company/product context, not generic motivation.",
                "answer_framework": company_fit_framework,
                "sample_answer": self._build_sample_answer(company_fit_framework, company)
            },
            {
                "category": "company_fit",
                "question": f"If you joined {company}, what would be your 30-60-90 day plan for this role?",
                "why_asked": "Checks practical thinking, prioritization, and execution readiness.",
                "prep_tip": "Present a phased plan: onboarding, quick wins, and medium-term impact.",
                "answer_framework": "30 days: understand stack, team workflows, and success metrics. 60 days: ship one scoped improvement tied to a KPI. 90 days: own a larger initiative with measurable impact and cross-team coordination.",
                "sample_answer": f"In the first 30 days at {company}, I would map the product goals and current bottlenecks. By day 60, I would ship one scoped fix tied to a key metric. By day 90, I would own a larger project and report measurable impact with clear follow-up priorities."
            },
        ])

        prep_plan = [
            "Prepare 5 STAR stories tied to your strongest resume bullets.",
            "Map each JD keyword to one project example and one measurable result.",
            f"Research {company}'s product, business model, and recent updates before interview day."
        ]

        return {
            "company": company,
            "likely_questions": questions[:10],
            "prep_plan": prep_plan,
        }

    def _normalize_signal_token(self, token: str) -> str:
        cleaned = token.strip().lower()
        cleaned = re.sub(r"^[^a-z0-9+#]+|[^a-z0-9+#/.\-]+$", "", cleaned)
        cleaned = cleaned.rstrip(".,;:()[]{}<>")
        cleaned = cleaned.replace("ci-cd", "ci/cd")
        cleaned = cleaned.replace("restful", "rest")
        return cleaned

    def _canonical_signal_label(self, token: str) -> str:
        mapping = {
            "react.js": "React",
            "react": "React",
            "node": "Node.js",
            "node.js": "Node.js",
            "express": "Express.js",
            "express.js": "Express.js",
            "next.js": "Next.js",
            "typescript": "TypeScript",
            "javascript": "JavaScript",
            "python": "Python",
            "java": "Java",
            "golang": "Go",
            "go": "Go",
            "postgres": "PostgreSQL",
            "postgresql": "PostgreSQL",
            "mysql": "MySQL",
            "mongodb": "MongoDB",
            "redis": "Redis",
            "aws": "AWS",
            "gcp": "GCP",
            "azure": "Azure",
            "docker": "Docker",
            "kubernetes": "Kubernetes",
            "k8s": "Kubernetes",
            "ci/cd": "CI/CD",
            "graphql": "GraphQL",
            "microservices": "Microservices",
            "system design": "System Design",
            "distributed systems": "Distributed Systems",
            "machine learning": "Machine Learning",
            "deep learning": "Deep Learning",
            "nlp": "NLP",
            "llm": "LLMs",
            "llms": "LLMs",
            "rag": "RAG",
            "tensorflow": "TensorFlow",
            "pytorch": "PyTorch",
            "scikit-learn": "Scikit-learn",
            "sklearn": "Scikit-learn",
            "spark": "Spark",
            "tableau": "Tableau",
            "power bi": "Power BI",
            "rest": "REST APIs",
            "api": "REST APIs",
            "apis": "REST APIs",
            "backend": "Backend Engineering",
            "frontend": "Frontend Engineering",
            "fullstack": "Full-stack Development",
            "full-stack": "Full-stack Development",
            "scalable": "Scalability",
            "scalability": "Scalability",
            "distributed": "Distributed Systems",
        }
        if token in mapping:
            return mapping[token]
        if token.startswith("c++"):
            return "C++"
        if token.startswith("c#"):
            return "C#"
        return token.upper() if token.isupper() else token.capitalize()

    def _signal_regex(self, signal: str) -> str:
        normalized = signal.strip().lower()
        aliases = {
            "node.js": r"\bnode(?:\.js)?\b",
            "react": r"\breact(?:\.js)?\b",
            "express.js": r"\bexpress(?:\.js)?\b",
            "next.js": r"\bnext(?:\.js)?\b",
            "ci/cd": r"\bci\s*/\s*cd\b|\bci-cd\b",
            "rest apis": r"\brest\b|\brestful\b",
            "llms": r"\bllm\b|\bllms\b|\blarge language models?\b",
            "scikit-learn": r"\bscikit-learn\b|\bsklearn\b",
            "postgresql": r"\bpostgres(?:ql)?\b",
            "distributed systems": r"\bdistributed systems?\b",
            "machine learning": r"\bmachine learning\b",
            "deep learning": r"\bdeep learning\b",
            "system design": r"\bsystem design\b",
            "power bi": r"\bpower\s*bi\b",
        }
        if normalized in aliases:
            return aliases[normalized]
        return rf"\b{re.escape(normalized)}\b"

    def _signal_present(self, text: str, signal: str) -> bool:
        if not text or not signal:
            return False
        return bool(re.search(self._signal_regex(signal), text.lower(), re.IGNORECASE))

    def _extract_jd_keywords(self, job_description: str, limit: int = 8) -> List[str]:
        if not job_description:
            return []

        lowered = job_description.lower()
        ordered: List[Tuple[int, str]] = []
        seen: set[str] = set()

        for label, pattern in JD_TECH_SIGNAL_PATTERNS:
            match = re.search(pattern, lowered, re.IGNORECASE)
            if not match:
                continue
            key = label.lower()
            if key in seen:
                continue
            seen.add(key)
            ordered.append((match.start(), label))

        for match in re.finditer(r"[A-Za-z][A-Za-z0-9+#/.\-]{2,}", lowered):
            token = self._normalize_signal_token(match.group(0))
            if len(token) < 3:
                continue
            if token in JD_STOP_WORDS or token in GENERIC_SIGNAL_BLOCKLIST:
                continue
            if token.isdigit():
                continue
            is_symbolic = any(ch in token for ch in "+#/") or token.endswith(".js")
            if not is_symbolic and token not in TECH_FALLBACK_ALLOWLIST:
                continue
            canonical = self._canonical_signal_label(token)
            key = canonical.lower()
            if key in seen:
                continue
            seen.add(key)
            ordered.append((match.start(), canonical))

        ordered.sort(key=lambda item: item[0])
        return [label for _, label in ordered[:limit]]

    def _derive_missing_jd_signals(self, job_description: str, resume_text: str, limit: int = 6) -> List[str]:
        jd_signals = self._extract_jd_keywords(job_description, limit=max(limit * 2, 10))
        resume_lower = (resume_text or "").lower()
        missing: List[str] = []
        for signal in jd_signals:
            if self._signal_present(resume_lower, signal):
                continue
            missing.append(signal)
            if len(missing) >= limit:
                break
        return missing

    def _extract_evidence_lines(self, resume_text: str, limit: int = 5) -> List[str]:
        lines = [line.strip("•●◦▪- ").strip() for line in (resume_text or "").splitlines() if line.strip()]
        candidates: List[str] = []
        for line in lines:
            lower = line.lower()
            if len(line) < 35:
                continue
            if re.fullmatch(r"[A-Z][A-Z0-9\s&/\-]{2,}", line):
                continue
            has_action = bool(re.search(r"\b(built|led|improved|reduced|increased|designed|launched|optimized|managed|implemented|developed|delivered|trained)\b", lower))
            has_metric = bool(re.search(r"\d", line))
            if has_action and has_metric:
                candidates.append(line)
        if not candidates:
            for line in lines:
                if len(line) >= 30 and not re.fullmatch(r"[A-Z][A-Z0-9\s&/\-]{2,}", line):
                    candidates.append(line)
                if len(candidates) >= limit:
                    break
        # Deduplicate while preserving order
        seen = set()
        deduped: List[str] = []
        for item in candidates:
            key = item.lower()
            if key in seen:
                continue
            seen.add(key)
            deduped.append(item)
            if len(deduped) >= limit:
                break
        if not deduped:
            deduped = [line for line in lines[:limit] if line]
        return deduped[:limit]

    def _build_skill_gap_advice(self, skill: str, evidence_lines: List[str]) -> str:
        skill_lower = (skill or "").lower()
        if "ci/cd" in skill_lower or "github actions" in skill_lower:
            return "Add one bullet showing automated build/test/deploy (tool + trigger + measurable release speed/reliability gain)."
        if "system design" in skill_lower or "distributed" in skill_lower or "microservices" in skill_lower:
            return "Document one architecture decision: constraints, design choice, and the scaling or reliability result."
        if "aws" in skill_lower or "gcp" in skill_lower or "azure" in skill_lower:
            return "Add deployment evidence on cloud: service used, workload size, and one operational metric."
        if "machine learning" in skill_lower or "llm" in skill_lower or "rag" in skill_lower:
            return "Show end-to-end ML ownership: dataset, model/pipeline choice, evaluation metric, and production impact."
        if "react" in skill_lower or "node" in skill_lower or "typescript" in skill_lower:
            return "Add one ship-ready feature example with stack details, performance/quality metric, and user/business impact."
        if evidence_lines:
            return f"Reuse evidence you already have and add one explicit {skill} example with scope, trade-off, and metric."
        return f"Add one truthful project bullet showing {skill} in production with a measurable outcome."

    def _success_story_hint(self, skill: str) -> str:
        return (
            f"Candidates usually improve callback rates when they pair {skill} with one concrete metric and one business outcome."
        )

    def _looks_like_heading(self, line: str) -> bool:
        stripped = line.strip()
        if not stripped:
            return False
        if len(stripped) > 40:
            return False
        return bool(re.fullmatch(r"[A-Z][A-Z0-9\s&/\-]{2,}", stripped))

    def _normalize_compare_text(self, text: str) -> str:
        normalized = re.sub(r"\s+", " ", str(text or "")).strip().lower()
        return normalized

    def _is_materially_different(self, candidate: str, baseline: str, min_delta: float = 0.015) -> bool:
        candidate_norm = self._normalize_compare_text(candidate)
        baseline_norm = self._normalize_compare_text(baseline)
        if not candidate_norm and not baseline_norm:
            return False
        if candidate_norm != baseline_norm and (not candidate_norm or not baseline_norm):
            return True
        similarity = SequenceMatcher(None, candidate_norm, baseline_norm).ratio()
        return similarity < (1.0 - max(0.001, min_delta))

    def _has_markup_tags(self, text: str) -> bool:
        return bool(re.search(r"</?(ADD|DEL|REWRITE)>", text or ""))

    def _build_deterministic_rewrite(
        self,
        original_resume_text: str,
        job_description: str,
        detected_linkedin_url: Optional[str] = None,
        detected_github_url: Optional[str] = None,
    ) -> Tuple[str, str, List[Dict[str, Any]]]:
        def _clean_profile_url(raw_url: Optional[str], platform: str) -> Optional[str]:
            value = str(raw_url or "").strip().rstrip(".,);")
            if not value:
                return None
            if not value.lower().startswith(("http://", "https://")):
                value = f"https://{value}"
            if platform == "linkedin":
                match = re.search(
                    r"(?:https?://)?(?:www\.)?linkedin\.com/(?:in|pub)/[A-Za-z0-9\-_/%]+/?",
                    value,
                    re.IGNORECASE,
                )
                if not match:
                    return None
                cleaned = match.group(0)
            else:
                match = re.search(
                    r"(?:https?://)?(?:www\.)?github\.com/([A-Za-z0-9-]{1,39})(?:/[A-Za-z0-9_.-]+)?/?",
                    value,
                    re.IGNORECASE,
                )
                if not match:
                    return None
                cleaned = f"github.com/{match.group(1)}"
            cleaned = re.sub(r"^https?://(?:www\.)?", "", cleaned, flags=re.IGNORECASE).rstrip("/")
            return cleaned

        lines = original_resume_text.splitlines()
        missing_keywords = self._derive_missing_jd_signals(
            job_description=job_description,
            resume_text=original_resume_text,
            limit=4,
        )
        linkedin_match = re.search(
            r"(?:https?://)?(?:www\.)?linkedin\.com/(?:in|pub)/[A-Za-z0-9\-_/%]+/?",
            original_resume_text,
            re.IGNORECASE,
        )
        github_match = re.search(
            r"(?:https?://)?(?:www\.)?github\.com/([A-Za-z0-9-]{1,39})(?:/[A-Za-z0-9_.-]+)?/?",
            original_resume_text,
            re.IGNORECASE,
        )
        resolved_linkedin_url = _clean_profile_url(
            linkedin_match.group(0) if linkedin_match else detected_linkedin_url,
            "linkedin",
        )
        resolved_github_url = _clean_profile_url(
            github_match.group(0) if github_match else detected_github_url,
            "github",
        )
        default_linkedin_url = "linkedin.com/in/yourname"
        default_github_url = "github.com/yourname"
        has_linkedin = bool(linkedin_match)
        has_github = bool(github_match)

        updated_lines: List[str] = []
        marked_lines: List[str] = []
        changes: List[Dict[str, Any]] = []

        section = ""
        rewritten_bullets = 0
        profile_hint_added = False

        for idx, line in enumerate(lines):
            raw = line.rstrip("\n")
            stripped = raw.strip()
            upper = stripped.upper()

            if self._looks_like_heading(stripped):
                section = upper

            plain_line = raw
            marked_line = raw

            is_header_band = idx < 8
            if is_header_band and stripped and ("@" in stripped or "|" in stripped or re.search(r"(?i)\b(linkedin|github)\b", stripped)):
                replaced_placeholder = False
                placeholder_line = raw
                if re.search(r"\blinkedin\b", placeholder_line, re.IGNORECASE) and "linkedin.com" not in placeholder_line.lower():
                    placeholder_line = re.sub(
                        r"(?i)\blinkedin\b",
                        f"LinkedIn: {resolved_linkedin_url or default_linkedin_url}",
                        placeholder_line,
                        count=1,
                    )
                    has_linkedin = True
                    replaced_placeholder = True
                if re.search(r"\bgithub\b", placeholder_line, re.IGNORECASE) and "github.com" not in placeholder_line.lower():
                    placeholder_line = re.sub(
                        r"(?i)\bgithub\b",
                        f"GitHub: {resolved_github_url or default_github_url}",
                        placeholder_line,
                        count=1,
                    )
                    has_github = True
                    replaced_placeholder = True
                if replaced_placeholder and placeholder_line != raw:
                    plain_line = placeholder_line
                    marked_line = f"<REWRITE>{placeholder_line}</REWRITE>"
                    changes.append({
                        "section": "Header",
                        "type": "rewrite",
                        "before": raw,
                        "after": placeholder_line,
                        "reason": "Replaced placeholder profile labels with actionable profile URLs.",
                        "jd_signal": "Recruiters need clickable LinkedIn/GitHub proof in the header.",
                    })

                additions: List[str] = []
                if not has_linkedin:
                    additions.append(f"LinkedIn: {resolved_linkedin_url or default_linkedin_url}")
                if not has_github:
                    additions.append(f"GitHub: {resolved_github_url or default_github_url}")
                if additions:
                    addition_text = " | " + " | ".join(additions)
                    base_line = plain_line
                    plain_line = f"{base_line}{addition_text}"
                    marked_line = f"{base_line}<ADD>{addition_text}</ADD>"
                    profile_hint_added = True
                    changes.append({
                        "section": "Header",
                        "type": "add",
                        "before": base_line,
                        "after": plain_line,
                        "reason": "Added missing profile links expected in technical resumes.",
                        "jd_signal": "Recruiters verify candidate credibility through LinkedIn/GitHub.",
                    })
                    has_linkedin = True
                    has_github = True

            bullet_match = re.match(rf"^(\s*{_BULLET_PATTERN}\s*)(.+)$", raw)
            if bullet_match and rewritten_bullets < 12:
                bullet_prefix = bullet_match.group(1)
                bullet_body = bullet_match.group(2).strip()
                rewritten_body = bullet_body
                section_upper = section.upper() if section else ""
                is_skills_section = "SKILL" in section_upper
                is_execution_section = any(
                    token in section_upper
                    for token in ("EXPERIENCE", "PROJECT", "INTERNSHIP", "WORK", "VOLUNTEER", "PARTICIPATION")
                )

                if is_skills_section:
                    # Skills bullets should stay taxonomy-style, not action-verb style.
                    rewritten_body = re.sub(r"(?i)^delivered\s+", "", rewritten_body)
                    rewritten_body = re.sub(r"(?i)^(scope|owned|impact|stack|outcome)\s*:\s*", "", rewritten_body)
                else:
                    rewritten_body = re.sub(r"(?i)^responsible for\s+", "Owned ", rewritten_body)
                    rewritten_body = re.sub(r"(?i)^worked on\s+", "Built and improved ", rewritten_body)
                    rewritten_body = re.sub(r"(?i)^helped\s+", "Contributed to ", rewritten_body)
                    rewritten_body = re.sub(r"(?i)^objective\s*:\s*", "Scope: ", rewritten_body)
                    rewritten_body = re.sub(r"(?i)^key contributions\s*:\s*", "Owned: ", rewritten_body)
                    rewritten_body = re.sub(r"(?i)^description\s*:\s*", "Impact: ", rewritten_body)
                    rewritten_body = re.sub(r"(?i)^technologies used\s*:\s*", "Stack: ", rewritten_body)
                    rewritten_body = re.sub(r"(?i)^outcome\s*:\s*", "Outcome: ", rewritten_body)
                rewritten_body = re.sub(r"\s{2,}", " ", rewritten_body).strip()

                is_label_bullet = bool(re.match(r"(?i)^(scope|owned|impact|stack|outcome)\s*:", rewritten_body))
                if (
                    is_execution_section
                    and not is_skills_section
                    and not is_label_bullet
                    and not re.match(
                        r"(?i)^(built|led|designed|implemented|optimized|delivered|developed|created|owned|managed|launched|improved|automated|shipped)\b",
                        rewritten_body,
                    )
                ):
                    rewritten_body = f"Delivered {rewritten_body[:1].lower()}{rewritten_body[1:]}" if rewritten_body else rewritten_body

                if rewritten_body != bullet_body:
                    plain_line = f"{bullet_prefix}{rewritten_body}"
                    marked_line = f"{bullet_prefix}<REWRITE>{rewritten_body}</REWRITE>"
                    rewritten_bullets += 1
                    changes.append({
                        "section": section.title() if section else "Experience",
                        "type": "rewrite",
                        "before": bullet_body,
                        "after": rewritten_body,
                        "reason": (
                            "Normalized skills wording to avoid generic action-verb noise."
                            if is_skills_section
                            else "Tightened phrasing to emphasize ownership, impact, and readability."
                        ),
                        "jd_signal": "Cleaner bullets improve recruiter comprehension in first-pass scans.",
                    })

            updated_lines.append(plain_line)
            marked_lines.append(marked_line)

        if not profile_hint_added and (not has_linkedin or not has_github):
            append_items: List[str] = []
            if not has_linkedin:
                append_items.append(f"LinkedIn: {resolved_linkedin_url or default_linkedin_url}")
            if not has_github:
                append_items.append(f"GitHub: {resolved_github_url or default_github_url}")
            if append_items:
                addition = " | ".join(append_items)
                updated_lines.insert(0, addition)
                marked_lines.insert(0, f"<ADD>{addition}</ADD>")
                changes.append({
                    "section": "Header",
                    "type": "add",
                    "before": "",
                    "after": addition,
                    "reason": "Inserted missing profile links in resume header.",
                    "jd_signal": "Most technical recruiters expect visible LinkedIn/GitHub links.",
                })

        if missing_keywords:
            changes.append({
                "section": "Alignment",
                "type": "add",
                "before": "",
                "after": ", ".join(missing_keywords),
                "reason": "Identified JD signals still missing from resume evidence.",
                "jd_signal": "Use these signals to guide next round of truthful bullet improvements.",
            })

        plain_text = "\n".join(updated_lines)
        marked_up = "\n".join(marked_lines)
        return plain_text, marked_up, changes

    def _normalize_brutal_changes(self, raw_changes: Any) -> List[Dict[str, Any]]:
        if not isinstance(raw_changes, list):
            return []

        normalized: List[Dict[str, Any]] = []
        for idx, item in enumerate(raw_changes):
            if not isinstance(item, dict):
                continue
            section = str(item.get("section") or item.get("type") or f"Change {idx + 1}")
            before = str(item.get("before") or item.get("original") or "")
            after = str(item.get("after") or item.get("rewritten") or item.get("content") or "")
            change_type = str(item.get("type") or ("rewrite" if before and after else "add")).lower()
            if change_type not in {"add", "remove", "rewrite"}:
                change_type = "rewrite"

            normalized.append({
                "section": section,
                "type": change_type,
                "before": before,
                "after": after,
                "reason": str(item.get("reason") or "Improved relevance and readability."),
                "jd_signal": str(item.get("jd_signal") or item.get("signal_to_company") or "Supports stronger role alignment."),
            })
        return normalized

    def _stabilize_brutal_payload(
        self,
        result: Dict[str, Any],
        original_resume_text: str,
        job_description: str,
        detected_linkedin_url: Optional[str] = None,
        detected_github_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        stable = deepcopy(result) if isinstance(result, dict) else {}

        plain_text = str(stable.get("plain_text") or "").strip()
        marked = str(stable.get("marked_up_resume") or "").strip()
        changes = self._normalize_brutal_changes(stable.get("changes"))

        if not plain_text:
            plain_text = original_resume_text
        if not marked:
            marked = plain_text

        if len(changes) < 2:
            fallback_plain, fallback_marked, fallback_changes = self._build_deterministic_rewrite(
                original_resume_text=plain_text or original_resume_text,
                job_description=job_description,
                detected_linkedin_url=detected_linkedin_url,
                detected_github_url=detected_github_url,
            )
            if plain_text.strip() == original_resume_text.strip():
                plain_text = fallback_plain
            if marked.strip() == original_resume_text.strip() or marked.strip() == plain_text.strip():
                marked = fallback_marked

            seen_pairs = {(c.get("before"), c.get("after"), c.get("section")) for c in changes}
            for item in fallback_changes:
                key = (item.get("before"), item.get("after"), item.get("section"))
                if key not in seen_pairs:
                    changes.append(item)
                    seen_pairs.add(key)
                if len(changes) >= 12:
                    break

        stable["plain_text"] = plain_text
        stable["marked_up_resume"] = marked
        stable["changes"] = changes

        # Guardrail: ensure the "optimized resume" actually contains meaningful edits.
        if (
            not self._is_materially_different(stable.get("plain_text", ""), original_resume_text, min_delta=0.01)
            or not self._has_markup_tags(stable.get("marked_up_resume", ""))
        ):
            fallback_plain, fallback_marked, fallback_changes = self._build_deterministic_rewrite(
                original_resume_text=original_resume_text,
                job_description=job_description,
                detected_linkedin_url=detected_linkedin_url,
                detected_github_url=detected_github_url,
            )
            if self._is_materially_different(fallback_plain, original_resume_text, min_delta=0.005):
                stable["plain_text"] = fallback_plain
                stable["marked_up_resume"] = fallback_marked
                if len(stable.get("changes", [])) < 4:
                    stable["changes"] = fallback_changes

        harsh_review = stable.get("harsh_review", {})
        if not isinstance(harsh_review, dict):
            harsh_review = {}
        if not harsh_review.get("top_3_actions"):
            harsh_review["top_3_actions"] = [{
                "action": "Rewrite key bullets with measurable outcomes",
                "how_to_do_it": "Use action + scope + metric + result structure in top experience bullets.",
                "resources": ["STAR method", "impact bullet checklist"],
                "time_estimate": "45-60 minutes",
                "what_helped_others": "Quantified bullets improved interview callbacks.",
            }]
        stable["harsh_review"] = harsh_review
        return stable

    def _merge_brutal_payload(self, ai_result: Any, fallback_result: Dict[str, Any]) -> Dict[str, Any]:
        merged = deepcopy(fallback_result)
        if not isinstance(ai_result, dict):
            return merged

        ai_plain_text = str(ai_result.get("plain_text") or "").strip()
        ai_marked = str(ai_result.get("marked_up_resume") or "").strip()
        ai_changes = self._normalize_brutal_changes(ai_result.get("changes"))
        fallback_plain = str(fallback_result.get("plain_text") or "").strip()
        fallback_marked = str(fallback_result.get("marked_up_resume") or "").strip()

        use_ai_plain = bool(
            ai_plain_text
            and len(ai_plain_text) > 80
            and self._is_materially_different(ai_plain_text, fallback_plain, min_delta=0.008)
        )
        use_ai_marked = bool(
            ai_marked
            and len(ai_marked) > 80
            and (
                self._has_markup_tags(ai_marked)
                or self._is_materially_different(ai_marked, fallback_marked, min_delta=0.008)
            )
        )

        if use_ai_plain:
            merged["plain_text"] = ai_plain_text
        if use_ai_marked:
            merged["marked_up_resume"] = ai_marked
        # Always prefer AI changes when they exist (AI may not return plain_text/marked_up_resume)
        if ai_changes and len(ai_changes) >= 1:
            merged["changes"] = ai_changes

        ai_company = ai_result.get("company_expectations")
        if isinstance(ai_company, dict):
            fallback_company = merged.get("company_expectations", {})
            merged["company_expectations"] = {
                "role_summary": str(ai_company.get("role_summary") or fallback_company.get("role_summary") or ""),
                "what_the_company_cares_about": ai_company.get("what_the_company_cares_about") or fallback_company.get("what_the_company_cares_about") or [],
                "ideal_candidate_snapshot": ai_company.get("ideal_candidate_snapshot") or fallback_company.get("ideal_candidate_snapshot") or [],
            }

        ai_review = ai_result.get("harsh_review")
        if isinstance(ai_review, dict):
            fallback_review = merged.get("harsh_review", {})
            merged["harsh_review"] = {
                "overall_verdict": str(ai_review.get("overall_verdict") or fallback_review.get("overall_verdict") or ""),
                "strengths": ai_review.get("strengths") or fallback_review.get("strengths") or [],
                "weaknesses": ai_review.get("weaknesses") or fallback_review.get("weaknesses") or [],
                "missing_or_weak_skills": ai_review.get("missing_or_weak_skills") or fallback_review.get("missing_or_weak_skills") or [],
                "risk_flags": ai_review.get("risk_flags") or fallback_review.get("risk_flags") or [],
                "would_I_interview_you": str(ai_review.get("would_I_interview_you") or fallback_review.get("would_I_interview_you") or "maybe").lower(),
                "rationale": str(ai_review.get("rationale") or fallback_review.get("rationale") or ""),
                "top_3_actions": ai_review.get("top_3_actions") or fallback_review.get("top_3_actions") or [],
            }
        return merged

    def _merge_interview_prep(self, ai_interview: Any, fallback_interview: Dict[str, Any]) -> Dict[str, Any]:
        merged = deepcopy(fallback_interview)
        if not isinstance(ai_interview, dict):
            return merged

        company = str(ai_interview.get("company") or merged.get("company") or "the company").strip()
        merged["company"] = company

        ai_questions = ai_interview.get("likely_questions")
        if isinstance(ai_questions, list):
            normalized_questions: List[Dict[str, str]] = []
            for idx, item in enumerate(ai_questions[:10]):
                if not isinstance(item, dict):
                    continue
                question_text = str(item.get("question") or "").strip()
                if not question_text:
                    continue
                category = str(item.get("category") or "role_fit").strip() or "role_fit"
                why_asked = str(item.get("why_asked") or "Interviewers validate ownership and role fit.").strip()
                prep_tip = str(item.get("prep_tip") or "Use concrete examples with measurable outcomes.").strip()
                framework = str(item.get("answer_framework") or self._build_answer_framework(category, question_text, company, "")).strip()
                sample_answer = str(item.get("sample_answer") or self._build_sample_answer(framework, question_text)).strip()
                normalized_questions.append({
                    "category": category,
                    "question": question_text,
                    "why_asked": why_asked,
                    "prep_tip": prep_tip,
                    "answer_framework": framework,
                    "sample_answer": sample_answer,
                })
            if normalized_questions:
                merged["likely_questions"] = normalized_questions

        ai_plan = ai_interview.get("prep_plan")
        if isinstance(ai_plan, list):
            cleaned = [str(step).strip() for step in ai_plan if str(step).strip()]
            if cleaned:
                merged["prep_plan"] = cleaned[:6]

        return merged

    def _build_answer_framework(self, category: str, subject: str, company: str, job_description: str) -> str:
        category_norm = (category or "").lower()
        if "resume_deep_dive" in category_norm:
            return "Use STAR: context, your exact ownership, technical decisions, measurable result, and what you would improve next."
        if "jd_alignment" in category_norm:
            return f"Define {subject}, explain where you used it, detail trade-offs, and quantify outcome tied to business impact."
        if "company_fit" in category_norm:
            return f"Show why {company} aligns with your experience, reference a company problem, and propose a practical first milestone."
        if "behavioral" in category_norm:
            return "Use STAR with emphasis on conflict handling, decision-making, and measurable team outcome."
        if "technical" in category_norm:
            return "Explain approach, constraints, alternatives considered, and why your final decision was correct."
        if job_description:
            return "Tie your answer to one JD requirement, one real example, and one measurable business result."
        return "Answer with context, your actions, and a measurable result. Keep it specific and defensible."

    def _build_sample_answer(self, framework: str, subject: str) -> str:
        concise_subject = subject.strip().strip('"')[:180]
        return (
            f"For \"{concise_subject}\", I would answer in STAR format: brief context, my exact ownership, "
            f"the key technical decision and trade-off, and one measurable outcome. "
            f"I would close with what I would improve next and why. ({framework})"
        )
    
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
