"""
Enhanced analysis endpoint for ATS Emulator V2
Provides complete analysis matching frontend dashboard expectations
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.concurrency import run_in_threadpool
from typing import Optional, Any
from pydantic import BaseModel
import asyncio
import os
import json
import logging
import re

from app.services.ingestion.pdf_parser import PDFParser
from app.services.ingestion.docx_parser import DOCXParser
from app.services.features.extractor import FeatureExtractor
from app.services.ml.friendliness_classifier import FriendlinessClassifier
from app.services.ml.visibility_ranker import VisibilityRanker
from app.services.analysis.comprehensive_analyzer import ComprehensiveAnalyzer
from app.core.supabase_client import store_analysis, get_templates
from app.services.github.github_client import GitHubClient
from app.services.github.repo_analyzer import RepositoryAnalyzer

router = APIRouter()
logger = logging.getLogger(__name__)

# Lightweight services are initialized at import.
pdf_parser = PDFParser()
docx_parser = DOCXParser()
friendliness_classifier = FriendlinessClassifier()

# Heavy services are lazy-loaded.
_feature_extractor: Optional[FeatureExtractor] = None
_visibility_ranker: Optional[VisibilityRanker] = None
_comprehensive_analyzer: Optional[ComprehensiveAnalyzer] = None


def get_feature_extractor() -> FeatureExtractor:
    global _feature_extractor
    if _feature_extractor is None:
        _feature_extractor = FeatureExtractor()
    return _feature_extractor


def get_visibility_ranker() -> VisibilityRanker:
    global _visibility_ranker
    if _visibility_ranker is None:
        _visibility_ranker = VisibilityRanker()
    return _visibility_ranker


def get_comprehensive_analyzer() -> ComprehensiveAnalyzer:
    global _comprehensive_analyzer
    if _comprehensive_analyzer is None:
        _comprehensive_analyzer = ComprehensiveAnalyzer()
    return _comprehensive_analyzer


def map_vendor_compatibility(features: dict, friendliness_result: dict) -> dict:
    """
    Map risk flags to vendor-specific compatibility status.
    
    Args:
        features: Extracted features
        friendliness_result: Friendliness classification result
    
    Returns:
        Vendor compatibility dictionary
    """
    risk_flags = features.get("risk_flags", [])
    
    vendors = {
        "workday": {"status": "pass", "issues": []},
        "taleo": {"status": "pass", "issues": []},
        "greenhouse": {"status": "pass", "issues": []},
        "icims": {"status": "pass", "issues": []}
    }
    
    # Workday risks
    if "WORKDAY_PARSING_RISK" in risk_flags:
        vendors["workday"]["status"] = "warning"
        vendors["workday"]["issues"].append("Missing standard section headers")
    
    # Taleo risks
    if "TALEO_TABLE_RISK" in risk_flags or "DETECTED_TEXT_TABLES" in risk_flags:
        vendors["taleo"]["status"] = "warning"
        vendors["taleo"]["issues"].append("Table formatting detected")
    
    # Greenhouse risks (generally more lenient)
    if "MISSING_EMAIL" in risk_flags or "MISSING_PHONE" in risk_flags:
        vendors["greenhouse"]["status"] = "warning"
        vendors["greenhouse"]["issues"].append("Missing contact information")
    
    # iCIMS risks
    if "ICIMS_FRAGMENTATION_RISK" in risk_flags or "Z_ORDER_FRAGMENTATION" in risk_flags:
        vendors["icims"]["status"] = "warning"
        vendors["icims"]["issues"].append("Complex layout fragmentation")
    
    # If friendliness score is very low, mark all as warning
    if friendliness_result.get("score", 100) < 50:
        for vendor in vendors.values():
            if vendor["status"] == "pass":
                vendor["status"] = "warning"
    
    return vendors


def format_critical_issues(friendliness_result: dict, features: dict) -> list:
    """
    Format issues for frontend display.
    
    Args:
        friendliness_result: Friendliness classification result
        features: Extracted features
    
    Returns:
        List of formatted issue dictionaries
    """
    issues = []
    
    # Map friendliness issues to frontend format
    for issue in friendliness_result.get("issues", []):
        severity = "critical" if issue.get("penalty", 0) > 15 else "warning"
        
        issues.append({
            "severity": severity,
            "type": issue.get("type", "UNKNOWN"),
            "title": issue.get("message", "Issue detected"),
            "description": issue.get("whitepaper_ref", "This may affect ATS parsing"),
            "fix_suggestions": _get_fix_suggestions(issue.get("type"))
        })
    
    # Add timeline gap issues
    timeline = features.get("timeline", {})
    if timeline.get("has_gaps"):
        for gap in timeline.get("gaps", []):
            if gap.get("duration_months", 0) >= 6:
                issues.append({
                    "severity": "info",
                    "type": "EMPLOYMENT_GAP",
                    "title": f"Employment gap detected ({gap.get('duration_months')} months)",
                    "description": f"Gap from {gap.get('start', 'unknown')} to {gap.get('end', 'unknown')}",
                    "fix_suggestions": ["Add explanation", "List freelance work", "Include volunteer experience"]
                })
    
    return issues


def _get_fix_suggestions(issue_type: str) -> list:
    """Get fix suggestions for specific issue types."""
    suggestions = {
        "DETECTED_TEXT_TABLES": ["Remove all tables", "Convert to bullet lists", "Use simple formatting"],
        "MISSING_EMAIL": ["Add email in header", "Include in contact section"],
        "MISSING_PHONE": ["Add phone number", "Include in contact section"],
        "Z_ORDER_FRAGMENTATION": ["Simplify layout", "Use single-column format"],
        "IMAGE_BASED_PDF": ["Convert to text-based PDF", "Recreate resume in Word"],
        "POOR_SECTION_HEADERS": ["Add clear section headers", "Use standard headings: Experience, Education, Skills"],
    }
    return suggestions.get(issue_type, ["Review and simplify formatting"])


def extract_ats_data(features: dict, parsing_result: dict) -> dict:
    """
    Extract data as ATS would see it.
    
    Args:
        features: Extracted features
        parsing_result: Parsing result
    
    Returns:
        Extracted data dictionary
    """
    ner_entities = features.get("ner_entities", {})
    timeline = features.get("timeline", {})
    
    # Extract skills
    skills = ner_entities.get("skills", [])
    if not skills:
        skills = features.get("ner_skills", [])
    
    # Extract job titles from timeline
    job_titles = []
    for job in timeline.get("jobs", []):
        if job.get("title"):
            job_titles.append(job["title"])
    
    # Extract education
    education = ner_entities.get("education", [])
    
    # Extract contact info
    contact = []
    raw_text = parsing_result.get("raw_text", "")
    
    # Simple extraction (could be enhanced)
    import re
    emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', raw_text)
    phones = re.findall(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', raw_text)
    
    if emails:
        contact.extend(emails[:1])
    if phones:
        contact.extend(phones[:1])
    
    # Add location if found
    locations = ner_entities.get("locations", [])
    if locations:
        contact.extend(locations[:1])
    
    return {
        "skills": skills[:20],  # Limit to top 20
        "job_titles": job_titles[:5],
        "education": education[:3],
        "contact": contact,
        "raw_text": raw_text
    }


def _sentences(text: str) -> list[str]:
    if not text:
        return []

    # Normalize erratic whitespace from OCR/PDF extraction.
    normalized = re.sub(r"[ \t]+", " ", text)
    normalized = normalized.replace("\u000c", "\n")
    lines = [line.strip("•- \t").strip() for line in normalized.splitlines() if line.strip()]

    sentences: list[str] = []
    for line in lines:
        if len(line) <= 220:
            sentences.append(line)
            continue
        parts = [part.strip() for part in re.split(r'(?<=[.!?])\s+', line) if part.strip()]
        if parts:
            sentences.extend(parts)
        else:
            sentences.append(line)

    # Deduplicate while preserving order.
    seen = set()
    deduped = []
    for item in sentences:
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped


def _extract_resume_keywords(text: str) -> set[str]:
    words = re.findall(r"[A-Za-z][A-Za-z0-9+\-#.]{2,}", text.lower())
    stop = {"the", "and", "for", "with", "from", "your", "this", "that", "have", "will", "you", "are"}
    return {w for w in words if w not in stop}


_INTERVIEW_JD_STOPWORDS = {
    "the", "and", "for", "with", "from", "your", "this", "that", "have", "will",
    "you", "are", "our", "we", "us", "join", "candidate", "role", "team", "work",
    "build", "building", "strong", "experience", "years", "required", "preferred",
    "skills", "knowledge", "ability", "responsibilities", "responsibility",
    "analysis", "architectural", "software", "scalable", "systems", "users", "serving",
}

_INTERVIEW_TECH_PATTERNS: list[tuple[str, str]] = [
    ("React", r"\breact(?:\.js)?\b"),
    ("TypeScript", r"\btypescript\b"),
    ("JavaScript", r"\bjavascript\b"),
    ("Node.js", r"\bnode(?:\.js)?\b"),
    ("Express.js", r"\bexpress(?:\.js)?\b"),
    ("Python", r"\bpython\b"),
    ("Java", r"\bjava\b"),
    ("PostgreSQL", r"\bpostgres(?:ql)?\b"),
    ("MySQL", r"\bmysql\b"),
    ("SQL", r"\bsql\b"),
    ("REST APIs", r"\brest\b|\brestful\b"),
    ("GraphQL", r"\bgraphql\b"),
    ("Microservices", r"\bmicroservices?\b"),
    ("Distributed Systems", r"\bdistributed systems?\b"),
    ("System Design", r"\bsystem design\b"),
    ("CI/CD", r"\bci\s*/\s*cd\b|\bci-cd\b"),
    ("Docker", r"\bdocker\b"),
    ("Kubernetes", r"\bkubernetes\b|\bk8s\b"),
    ("AWS", r"\baws\b|\bamazon web services\b"),
    ("GCP", r"\bgcp\b|\bgoogle cloud\b"),
    ("Azure", r"\bazure\b"),
    ("Machine Learning", r"\bmachine learning\b"),
    ("Deep Learning", r"\bdeep learning\b"),
    ("NLP", r"\bnlp\b|\bnatural language processing\b"),
    ("LLMs", r"\bllm\b|\bllms\b|\blarge language models?\b"),
    ("RAG", r"\brag\b|\bretrieval-augmented generation\b"),
]


def _extract_jd_interview_signals(job_description: Optional[str], limit: int = 6) -> list[str]:
    if not job_description:
        return []

    lowered = job_description.lower()
    ordered: list[tuple[int, str]] = []
    seen = set()

    for label, pattern in _INTERVIEW_TECH_PATTERNS:
        match = re.search(pattern, lowered, re.IGNORECASE)
        if not match:
            continue
        key = label.lower()
        if key in seen:
            continue
        seen.add(key)
        ordered.append((match.start(), label))

    for match in re.finditer(r"[A-Za-z][A-Za-z0-9+#/.\-]{2,}", lowered):
        token = match.group(0).strip(".,:;()[]{}<>").lower()
        if len(token) < 3:
            continue
        if token in _INTERVIEW_JD_STOPWORDS:
            continue
        if token.isdigit():
            continue
        if not (any(ch in token for ch in "+#/") or token.endswith(".js")):
            continue
        normalized = {
            "react.js": "React",
            "node.js": "Node.js",
            "express.js": "Express.js",
            "ci-cd": "CI/CD",
            "restful": "REST APIs",
            "sklearn": "Scikit-learn",
        }.get(token, token.upper() if token.isupper() else token.capitalize())
        key = normalized.lower()
        if key in seen:
            continue
        seen.add(key)
        ordered.append((match.start(), normalized))

    ordered.sort(key=lambda item: item[0])
    return [label for _, label in ordered[:limit]]


def _is_technical_role(target_role: Optional[str]) -> bool:
    normalized = (target_role or "").strip().lower().replace("-", " ").replace("_", " ")
    technical_tokens = {
        "software", "engineer", "developer", "frontend", "backend", "full stack",
        "data scientist", "ml", "machine learning", "ai", "devops", "cloud", "sre", "data engineer",
    }
    return any(token in normalized for token in technical_tokens)


def _has_linkedin_url(text: str) -> bool:
    return bool(re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[A-Za-z0-9\-_/%]+/?", text or "", re.IGNORECASE))


def _has_github_url(text: str) -> bool:
    return bool(re.search(r"(?:https?://)?(?:www\.)?github\.com/[A-Za-z0-9-]+/?", text or "", re.IGNORECASE))


def _extract_quantified_bullets(text: str) -> list[str]:
    lines = [line.strip("•- \t").strip() for line in (text or "").splitlines() if line.strip()]
    action_verb_pattern = r"\b(built|led|improved|reduced|increased|designed|launched|optimized|managed|implemented|developed|delivered|architected|spearheaded|owned)\b"
    return [
        line for line in lines
        if re.search(r"\d", line) and re.search(action_verb_pattern, line.lower())
    ]


def _has_summary_with_signal(text: str) -> bool:
    lines = [line.strip() for line in (text or "").splitlines() if line.strip()]
    top = " ".join(lines[:14]).lower()
    if not top:
        return False
    has_role_word = bool(re.search(r"\b(engineer|developer|analyst|scientist|manager|designer)\b", top))
    has_signal = bool(re.search(r"\d", top) or re.search(r"\b(experience|years|built|led|launched|delivered)\b", top))
    return has_role_word and has_signal


def _section_presence(text: str) -> dict:
    upper = (text or "").upper()
    return {
        "experience": "EXPERIENCE" in upper,
        "projects": "PROJECT" in upper,
        "skills": "SKILLS" in upper,
        "education": "EDUCATION" in upper,
    }


def build_beginner_checklist(
    resume_text: str,
    ats_extracted: dict,
    target_role: Optional[str],
    linkedin_url: Optional[str],
    github_url: Optional[str],
) -> dict:
    contacts = [str(c).strip() for c in (ats_extracted.get("contact", []) or []) if str(c).strip()]
    joined_contacts = " ".join(contacts)
    has_email = bool(re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", joined_contacts))
    has_phone = bool(re.search(r"\+?\d[\d\-\s()]{7,}", joined_contacts))
    has_linkedin = bool(linkedin_url) or _has_linkedin_url(resume_text)
    has_github = bool(github_url) or _has_github_url(resume_text)
    quantified_bullets = _extract_quantified_bullets(resume_text)
    section_state = _section_presence(resume_text)
    has_core_sections = all(section_state.values())
    summary_ok = _has_summary_with_signal(resume_text)
    skills_count = len(ats_extracted.get("skills", []) or [])
    has_enough_skills = skills_count >= 8

    technical_role = _is_technical_role(target_role)
    checklist = [
        {
            "id": "contact_email",
            "label": "Valid email in header",
            "required": True,
            "passed": has_email,
            "why_it_matters": "Recruiters cannot schedule interviews without a valid email.",
            "how_to_fix": "Add a professional email in the first line of the resume.",
        },
        {
            "id": "contact_phone",
            "label": "Phone number present",
            "required": True,
            "passed": has_phone,
            "why_it_matters": "Some recruiters still prefer phone screening.",
            "how_to_fix": "Add country code + phone number near your email.",
        },
        {
            "id": "linkedin_link",
            "label": "LinkedIn URL present",
            "required": True,
            "passed": has_linkedin,
            "why_it_matters": "LinkedIn helps recruiters verify profile and work history quickly.",
            "how_to_fix": "Add full LinkedIn URL (linkedin.com/in/username) in header.",
        },
        {
            "id": "github_link",
            "label": "GitHub URL present (technical roles)",
            "required": technical_role,
            "passed": has_github if technical_role else True,
            "why_it_matters": "For technical roles, GitHub is strong proof of actual coding ability.",
            "how_to_fix": "Add full GitHub profile URL in header and list 2-3 strong repos.",
        },
        {
            "id": "impact_bullets",
            "label": "At least 4 quantified impact bullets",
            "required": True,
            "passed": len(quantified_bullets) >= 4,
            "why_it_matters": "Hiring teams trust measurable outcomes more than generic responsibilities.",
            "how_to_fix": "Use bullets in this format: action + scope + metric + business/result impact.",
        },
        {
            "id": "core_sections",
            "label": "Core sections: Experience, Projects, Skills, Education",
            "required": True,
            "passed": has_core_sections,
            "why_it_matters": "ATS and recruiters expect standard sections for fast evaluation.",
            "how_to_fix": "Use explicit section headers with standard names.",
        },
        {
            "id": "summary_quality",
            "label": "Summary has role + evidence signal",
            "required": True,
            "passed": summary_ok,
            "why_it_matters": "Top 6-10 lines decide whether recruiters keep reading.",
            "how_to_fix": "State role focus and one proof point (years, impact metric, or key outcome).",
        },
        {
            "id": "skills_density",
            "label": "Minimum skill density (8+ relevant skills)",
            "required": True,
            "passed": has_enough_skills,
            "why_it_matters": "Low visible skill density hurts keyword matching and role fit.",
            "how_to_fix": "Add missing role-specific tools/skills you can defend in interviews.",
        },
    ]

    required_items = [item for item in checklist if item.get("required")]
    passed_required = sum(1 for item in required_items if item.get("passed"))
    readiness_score = round((passed_required / max(len(required_items), 1)) * 100)
    gate_status = "pass" if readiness_score >= 85 else "warning" if readiness_score >= 65 else "fail"
    must_fix = [item["label"] for item in required_items if not item.get("passed")][:6]

    return {
        "role": target_role or "general",
        "readiness_score": readiness_score,
        "gate_status": gate_status,
        "must_fix_before_apply": must_fix,
        "checklist": checklist,
    }


def calibrate_friendliness_score(
    raw_friendliness_score: float,
    resume_text: str,
    target_role: Optional[str],
    linkedin_url: Optional[str],
    github_url: Optional[str],
) -> dict:
    penalties: list[dict] = []
    total_penalty = 0

    lines = [line.strip("•- ").strip() for line in (resume_text or "").splitlines() if line.strip()]
    action_verb_pattern = r"\b(built|led|improved|reduced|increased|designed|launched|optimized|managed|implemented|developed|delivered|architected|spearheaded)\b"
    quantified_lines = [
        line for line in lines
        if re.search(r"\d", line) and re.search(action_verb_pattern, line.lower())
    ]

    if len(quantified_lines) < 4:
        penalties.append({
            "reason": "Low count of quantified impact bullets (action + metric).",
            "penalty": 10,
        })
        total_penalty += 10

    top_block = " ".join(lines[:14]).lower()
    if ("aspiring" in top_block or "passionate" in top_block) and not re.search(r"\d", top_block):
        penalties.append({
            "reason": "Summary sounds generic and lacks concrete evidence.",
            "penalty": 6,
        })
        total_penalty += 6

    if not linkedin_url:
        penalties.append({
            "reason": "LinkedIn URL missing from resume header.",
            "penalty": 4,
        })
        total_penalty += 4

    if _is_technical_role(target_role) and not github_url:
        penalties.append({
            "reason": "GitHub URL missing for a technical role.",
            "penalty": 6,
        })
        total_penalty += 6

    if len((resume_text or "").strip()) < 1400:
        penalties.append({
            "reason": "Resume content is thin; impact density is likely low.",
            "penalty": 5,
        })
        total_penalty += 5

    total_penalty = min(total_penalty, 30)
    adjusted = max(35.0, min(100.0, round((raw_friendliness_score or 0) - total_penalty, 1)))

    return {
        "raw_score": round(raw_friendliness_score or 0, 1),
        "adjusted_score": adjusted,
        "total_penalty": total_penalty,
        "penalties": penalties[:5],
    }


def score_answer_heuristic(question: str, answer: str) -> dict:
    answer = (answer or "").strip()
    question = (question or "").strip()
    word_count = len(re.findall(r"\b\w+\b", answer))
    score = 45
    strengths: list[str] = []
    improvements: list[str] = []

    if word_count >= 90:
        score += 12
        strengths.append("Answer has enough depth for interviewer follow-up.")
    else:
        improvements.append("Expand the answer with more context, action, and measurable result.")

    if re.search(r"\d", answer):
        score += 12
        strengths.append("You included at least one concrete metric.")
    else:
        improvements.append("Add one metric (%, time, scale, or business impact).")

    if re.search(r"\b(I|my|we)\b", answer, re.IGNORECASE):
        score += 6
        strengths.append("Ownership language is present.")
    else:
        improvements.append("Clarify what YOU specifically owned.")

    star_terms = sum(
        1 for token in ["situation", "task", "action", "result", "impact", "challenge"]
        if token in answer.lower()
    )
    if star_terms >= 2:
        score += 8
        strengths.append("Structure resembles STAR and is easier to follow.")
    else:
        improvements.append("Use STAR framing: context, action, result.")

    q_keywords = {w.lower() for w in re.findall(r"[A-Za-z]{4,}", question)}
    a_keywords = {w.lower() for w in re.findall(r"[A-Za-z]{4,}", answer)}
    overlap = len(q_keywords & a_keywords)
    if overlap >= 2:
        score += 8
        strengths.append("Answer stays relevant to the question focus.")
    else:
        improvements.append("Mirror key terms from the question to improve relevance.")

    score = max(25, min(95, score))
    band = "strong" if score >= 80 else "good" if score >= 65 else "average" if score >= 50 else "weak"

    improved_answer = (
        "Situation: <brief context>. Task: <what you owned>. "
        "Action: <2-3 concrete actions with tools>. "
        "Result: <metric + business/user impact>. "
        "Reflection: <what you learned and would improve next>."
    )

    if not strengths:
        strengths.append("You attempted to address the question directly.")
    if not improvements:
        improvements.append("Tighten the story with clearer sequencing and one stronger metric.")

    return {
        "score": score,
        "band": band,
        "strengths": strengths[:4],
        "improvements": improvements[:5],
        "improved_answer": improved_answer,
        "evaluation_mode": "heuristic",
    }


def score_answer_with_ai(
    question: str,
    answer: str,
    company_name: Optional[str],
    target_role: Optional[str],
    job_description: Optional[str],
) -> Optional[dict]:
    try:
        from app.services.rewrite.openai_client import OpenAIClient
        ai_client = OpenAIClient()
    except Exception as exc:
        logger.info("OpenAI interview scoring unavailable: %s", exc)
        return None

    prompt = f"""You are an expert technical interviewer.
Score this interview answer from 0-100 and provide practical feedback.
Return STRICT JSON with exactly:
{{
  "score": 0,
  "band": "weak|average|good|strong",
  "strengths": ["..."],
  "improvements": ["..."],
  "improved_answer": "...",
  "evaluation_mode": "ai"
}}

Rules:
- Be concrete and practical.
- Penalize vague claims and lack of ownership.
- Reward metrics, trade-offs, and clear outcomes.
- Keep improved_answer concise (120-180 words max).

INPUT:
{json.dumps({
    "question": question,
    "answer": answer,
    "company_name": company_name or "the company",
    "target_role": target_role or "general",
    "job_description_excerpt": (job_description or "")[:1200],
}, indent=2)}
"""

    try:
        raw = ai_client._call_gemini(prompt, max_retries=1)
        parsed = ai_client._parse_json_response(raw)
        score = int(max(0, min(100, int(parsed.get("score", 0)))))
        band = str(parsed.get("band", "average")).strip().lower()
        if band not in {"weak", "average", "good", "strong"}:
            band = "good" if score >= 65 else "average"
        strengths = [str(s).strip() for s in parsed.get("strengths", []) if str(s).strip()][:4]
        improvements = [str(s).strip() for s in parsed.get("improvements", []) if str(s).strip()][:5]
        improved_answer = str(parsed.get("improved_answer", "")).strip()
        if not strengths or not improvements or not improved_answer:
            return None
        return {
            "score": score,
            "band": band,
            "strengths": strengths,
            "improvements": improvements,
            "improved_answer": improved_answer,
            "evaluation_mode": "ai",
        }
    except Exception as exc:
        logger.warning("OpenAI interview scoring failed: %s", exc)
        return None


class InterviewAnswerScoreRequest(BaseModel):
    question: str
    answer: str
    company_name: Optional[str] = None
    target_role: Optional[str] = None
    job_description: Optional[str] = None


def _normalize_url(url: str) -> str:
    if not url:
        return ""
    cleaned = url.strip().rstrip(".,);")
    if not cleaned:
        return ""
    if cleaned.startswith("http://") or cleaned.startswith("https://"):
        return cleaned
    return f"https://{cleaned}"


def extract_profile_links(resume_text: str) -> dict:
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    github_username: Optional[str] = None

    source_text = resume_text or ""
    compact_text = re.sub(r"\s+", "", source_text)

    linkedin_matches = re.findall(
        r"(?:https?://)?(?:www\.)?linkedin\.com/(?:in|pub)/[A-Za-z0-9\-_/%]+/?",
        source_text,
        re.IGNORECASE,
    )
    if not linkedin_matches:
        linkedin_matches = re.findall(
            r"(?:https?://)?(?:www\.)?linkedin\.com/(?:in|pub)/[A-Za-z0-9\-_/%]+/?",
            compact_text,
            re.IGNORECASE,
        )
    if linkedin_matches:
        linkedin_url = _normalize_url(linkedin_matches[0])
    else:
        broad_linkedin = re.findall(
            r"(?:https?://)?(?:www\.)?linkedin\.com/[A-Za-z0-9\-_/%]+/?",
            source_text,
            re.IGNORECASE,
        )
        blocked_linkedin_paths = {"jobs", "feed", "company", "learning", "events", "help", "posts"}
        for candidate in broad_linkedin:
            normalized_candidate = _normalize_url(candidate)
            lowered = normalized_candidate.lower()
            if any(f"/{blocked}/" in lowered or lowered.endswith(f"/{blocked}") for blocked in blocked_linkedin_paths):
                continue
            linkedin_url = normalized_candidate
            break

    blocked_handles = {
        "features", "topics", "orgs", "organizations", "enterprise", "about", "events",
        "marketplace", "settings", "login", "signup", "pricing", "explore", "site", "contact",
    }
    for match in re.finditer(
        r"(?:https?://)?(?:www\.)?github\.com/([A-Za-z0-9-]+)(?:/[A-Za-z0-9_.-]+)?/?",
        resume_text or "",
        re.IGNORECASE,
    ):
        candidate_username = match.group(1).strip()
        if not candidate_username:
            continue
        if candidate_username.lower() in blocked_handles:
            continue
        github_username = candidate_username
        github_url = _normalize_url(f"github.com/{candidate_username}")
        break

    if not github_url:
        compact_github_match = re.search(
            r"(?:https?://)?(?:www\.)?github\.com/([A-Za-z0-9-]+)(?:/[A-Za-z0-9_.-]+)?/?",
            compact_text,
            re.IGNORECASE,
        )
        if compact_github_match:
            candidate_username = compact_github_match.group(1).strip()
            if candidate_username and candidate_username.lower() not in blocked_handles:
                github_username = candidate_username
                github_url = _normalize_url(f"github.com/{candidate_username}")

    if not github_url:
        handle_match = re.search(r"(?:github|git\s*hub)\s*[:\-]\s*([A-Za-z0-9-]{2,39})", source_text, re.IGNORECASE)
        if handle_match:
            candidate_username = handle_match.group(1).strip()
            if candidate_username and candidate_username.lower() not in blocked_handles:
                github_username = candidate_username
                github_url = _normalize_url(f"github.com/{candidate_username}")

    return {
        "linkedin_url": linkedin_url,
        "github_url": github_url,
        "github_username": github_username,
    }


def _clean_str_list(raw: Any, limit: int, fallback: list[str]) -> list[str]:
    if not isinstance(raw, list):
        return fallback[:limit]
    cleaned = [str(item).strip() for item in raw if str(item).strip()]
    if not cleaned:
        return fallback[:limit]
    return cleaned[:limit]


def _unique_non_empty(items: list[Any], limit: int) -> list[str]:
    cleaned: list[str] = []
    seen = set()
    for item in items:
        text = str(item or "").strip()
        if not text:
            continue
        key = text.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(text)
        if len(cleaned) >= limit:
            break
    return cleaned


_ROLE_PLACEHOLDER_TOKENS = {
    "detected role",
    "role 1",
    "role 2",
    "role a",
    "role b",
    "strong fit role",
    "weak fit role",
    "n/a",
    "na",
    "none",
    "unknown",
}


def _coerce_point_items(
    raw: Any,
    limit: int,
    fallback: list[str],
    primary_keys: list[str],
    secondary_keys: Optional[list[str]] = None,
) -> list[str]:
    if not isinstance(raw, list):
        return fallback[:limit]

    secondary_keys = secondary_keys or []
    cleaned: list[str] = []
    seen = set()

    for item in raw:
        text = ""
        detail = ""
        if isinstance(item, dict):
            for key in primary_keys:
                candidate = str(item.get(key, "")).strip()
                if candidate:
                    text = candidate
                    break
            for key in secondary_keys:
                candidate = str(item.get(key, "")).strip()
                if candidate:
                    detail = candidate
                    break
        else:
            text = str(item).strip()

        if not text:
            continue

        combined = f"{text} (Evidence: {detail})" if detail else text
        dedupe_key = combined.lower()
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        cleaned.append(combined)
        if len(cleaned) >= limit:
            break

    return cleaned or fallback[:limit]


def _is_placeholder_role(value: str) -> bool:
    lowered = (value or "").strip().lower()
    if not lowered:
        return True
    if lowered in _ROLE_PLACEHOLDER_TOKENS:
        return True
    return lowered.startswith("detected role")


def _normalize_role_bucket(raw: Any, limit: int, fallback: list[str]) -> list[str]:
    if not isinstance(raw, list):
        return fallback[:limit]

    cleaned: list[str] = []
    seen = set()

    for item in raw:
        role = ""
        confidence = None
        reasons: list[str] = []

        if isinstance(item, dict):
            role = str(item.get("role", "")).strip()
            confidence = item.get("confidence")
            reasons_raw = item.get("reasons", [])
            if isinstance(reasons_raw, list):
                reasons = [str(r).strip() for r in reasons_raw if str(r).strip()]
        else:
            role = str(item).strip()

        if _is_placeholder_role(role):
            continue

        label = role
        if isinstance(confidence, (int, float)):
            label = f"{role} ({int(round(float(confidence)))}% confidence)"
        if reasons:
            label = f"{label} - {reasons[0]}"

        dedupe_key = label.lower()
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        cleaned.append(label)
        if len(cleaned) >= limit:
            break

    return cleaned or fallback[:limit]


def _normalize_role_key(role: Optional[str]) -> str:
    return (role or "").strip().lower().replace("-", "_").replace(" ", "_")


def _recommend_certs_from_resume_evidence(
    analyzer: ComprehensiveAnalyzer,
    resume_text: str,
    target_role: Optional[str],
) -> list[dict]:
    resume_lower = (resume_text or "").lower()
    if not resume_lower:
        return []

    cert_db = getattr(analyzer, "cert_data", {}) or {}
    role_key = _normalize_role_key(target_role)
    role_certs = cert_db.get("certifications_by_role", {}).get(role_key, [])

    if not role_certs:
        return []

    recommendations = []
    for cert in role_certs:
        if not isinstance(cert, dict):
            continue
        cert_name = str(cert.get("name", "")).strip()
        cert_provider = str(cert.get("provider", "")).strip()
        cert_url = str(cert.get("url", "")).strip()
        if not cert_name:
            continue
        if cert_name.lower() in resume_lower:
            continue

        keywords = [str(k).strip() for k in cert.get("relevance_keywords", []) if str(k).strip()]
        matched_keywords = [kw for kw in keywords if kw.lower() in resume_lower]
        # In no-JD mode, keep cert suggestions evidence-based (at least one adjacent signal).
        if len(matched_keywords) < 1:
            continue

        impact_score = int(cert.get("impact_score", 10))
        recommendations.append({
            "name": cert_name,
            "provider": cert_provider,
            "relevance": f"Evidence-based for your profile ({', '.join(matched_keywords[:2])})",
            "impact": f"+{impact_score}% signal",
            "url": cert_url,
            "why_this_person_needs_it": f"Your resume already signals {', '.join(matched_keywords[:2])}; this cert adds recruiter trust.",
            "gap_it_closes": "Converts implied skill into externally verified proof.",
            "time_to_complete": "2-6 weeks",
            "proof_project_to_build_after_cert": "Build one role-relevant project and publish the repo + README before adding the cert.",
        })

    return recommendations[:3]


def _clean_questions(raw: Any) -> list[dict]:
    if not isinstance(raw, list):
        return []

    cleaned = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        question = str(item.get("question", "")).strip()
        if not question:
            continue
        cleaned.append({
            "category": str(item.get("category", "role_fit")).strip() or "role_fit",
            "question": question,
            "why_asked": str(item.get("why_asked", "Interviewers are validating fit and depth.")).strip() or "Interviewers are validating fit and depth.",
            "prep_tip": str(item.get("prep_tip", "Prepare a concrete, metric-backed example.")).strip() or "Prepare a concrete, metric-backed example.",
            "answer_framework": str(item.get("answer_framework", "Answer with context, your actions, and measurable outcome.")).strip() or "Answer with context, your actions, and measurable outcome.",
            "sample_answer": str(item.get("sample_answer", "")).strip(),
        })

    for item in cleaned:
        if not item.get("sample_answer"):
            item["sample_answer"] = _build_sample_answer(item.get("answer_framework", ""), item.get("question", ""))
    return cleaned[:10]


def _build_answer_framework(category: str, subject: str, company: str, job_description: Optional[str]) -> str:
    category_norm = (category or "").lower()
    if "resume_deep_dive" in category_norm:
        return "Use STAR: context, your exact ownership, technical decisions, measurable result, and what you would improve next."
    if "jd_alignment" in category_norm:
        return f"Define {subject}, explain where you used it, detail trade-offs, and quantify outcome tied to business impact."
    if "company_fit" in category_norm:
        return f"Show why {company} fits your goals, reference one company challenge, and propose a practical contribution."
    if "behavioral" in category_norm:
        return "Use STAR with emphasis on conflict handling, decision quality, and team impact."
    if "technical" in category_norm:
        return "Explain approach, constraints, alternatives considered, and why your final decision was best."
    if job_description:
        return "Tie your answer to one JD requirement, one real example, and one measurable result."
    return "Answer with context, your actions, and a measurable outcome."


def _build_sample_answer(framework: str, subject: str) -> str:
    concise_subject = subject.strip().strip('"')[:180]
    return (
        f"I would answer using this structure: {framework} "
        f"For {concise_subject}, I would explain what I owned, the key decision I made, and the measurable impact."
    )


def build_ai_roast_only(
    resume_text: str,
    job_description: Optional[str],
    company_name: Optional[str],
    target_role: Optional[str],
    feedback_tone: str,
    friendliness_score: float,
    match_score: Optional[float],
    missing_keywords: list[str],
    risk_flags: list[str],
) -> Optional[dict]:
    try:
        from app.services.rewrite.openai_client import OpenAIClient
        ai_client = OpenAIClient()
    except Exception as exc:
        logger.info("OpenAI roast generation unavailable: %s", exc)
        return None

    tone_instruction = (
        "Be blunt, practical, and specific. Critique hard but stay respectful."
        if feedback_tone == "brutal"
        else "Be direct, practical, and professional."
    )
    has_jd = bool((job_description or "").strip())
    company = (company_name or "the company").strip()
    evidence_lines = _sentences(resume_text)[:10]

    prompt_payload = {
        "target_role": target_role or "unknown",
        "company_name": company,
        "feedback_tone": feedback_tone,
        "has_job_description": has_jd,
        "ats_friendliness_score": friendliness_score,
        "jd_match_score": match_score,
        "risk_flags": risk_flags[:12],
        "missing_keywords": missing_keywords[:12],
        "job_description_excerpt": (job_description or "")[:1200],
        "resume_excerpt": (resume_text or "")[:2400],
        "evidence_lines": evidence_lines,
    }

    prompt = f"""You are a senior hiring manager and resume diagnostician.
{tone_instruction}
Your goal is to produce a deeply personalized diagnostic report from the provided evidence.
No generic filler.

Return STRICT JSON only with this exact shape:
{{
  "executive_snapshot": {{
    "overall_verdict": "",
    "roast_score_0_to_100": 0,
    "biggest_blocker": "",
    "fastest_win": ""
  }},
  "what_is_good": [
    {{"point": "", "evidence": ""}}
  ],
  "what_is_bad": [
    {{"point": "", "evidence": "", "impact": ""}}
  ],
  "hard_truths": [
    {{"point": "", "why_it_hurts": ""}}
  ],
  "priority_fixes": [
    {{"fix": "", "effort": "low|medium|high", "impact": "low|medium|high", "exact_edit_example": ""}}
  ],
  "resume_loopholes": [
    {{"issue": "", "why_it_matters": ""}}
  ],
  "remove_from_resume": [
    {{"line": "", "reason": "", "better_replacement": ""}}
  ],
  "role_fit": {{
    "strong_fit": [
      {{"role": "", "confidence": 0, "reasons": [""]}}
    ],
    "conditional_fit": [
      {{"role": "", "confidence": 0, "reasons": [""], "must_fix": [""]}}
    ],
    "weak_fit": [
      {{"role": "", "confidence": 0, "reasons": [""]}}
    ]
  }},
  "certification_suggestions": [
    {{
      "name": "",
      "provider": "",
      "why_this_person_needs_it": "",
      "gap_it_closes": "",
      "resume_impact": "",
      "time_to_complete": "",
      "proof_project_to_build_after_cert": "",
      "url": ""
    }}
  ]
}}

Rules:
- Every item must use evidence from input (resume lines, risk flags, profile signals).
- If job_description is empty:
  - Do NOT invent JD keyword gap output.
  - Do NOT produce generic cert recommendations.
- Role fit must be explicit:
  - STRONG_FIT = competitive now
  - CONDITIONAL_FIT = needs 1-2 fixes
  - WEAK_FIT = currently not competitive
- Certification suggestions:
  - Max 3 suggestions.
  - If no high-confidence suggestion, return [].
- Keep output practical:
  - 2-5 items per section.
  - concise sentences.

INPUT:
{json.dumps(prompt_payload, indent=2)}
"""
    try:
        model_timeout = float(os.getenv("ANALYZE_AI_MODEL_TIMEOUT_SECONDS", "16"))
        analyze_model = (
            os.getenv("OPENAI_ANALYZE_MODEL")
            or os.getenv("OPENAI_MODEL_FAST")
            or ai_client.model_name
        )
        ai_text = ai_client._call_gemini(
            prompt,
            max_retries=1,
            max_tokens=1200,
            timeout_seconds=model_timeout,
            model_name=analyze_model,
        )
        parsed = ai_client._parse_json_response(ai_text)
    except Exception as exc:
        logger.warning("OpenAI roast generation failed: %s", exc)
        return None

    if not isinstance(parsed, dict):
        parsed = {}

    executive_snapshot = parsed.get("executive_snapshot", {})
    role_fit_raw = parsed.get("role_fit", {})
    if not isinstance(role_fit_raw, dict):
        role_fit_raw = {}

    strong_roles = _normalize_role_bucket(
        role_fit_raw.get("strong_fit"),
        limit=3,
        fallback=[target_role.replace("-", " ").title()] if target_role else ["General Software Engineer"],
    )
    weak_roles = _normalize_role_bucket(
        role_fit_raw.get("weak_fit"),
        limit=3,
        fallback=["Senior/Staff roles requiring deeper specialization"],
    )
    conditional_roles = _normalize_role_bucket(
        role_fit_raw.get("conditional_fit"),
        limit=2,
        fallback=[],
    )

    overview = ""
    if isinstance(executive_snapshot, dict):
        overview = str(executive_snapshot.get("overall_verdict", "")).strip()
    if not overview:
        overview = "This resume has potential but needs sharper evidence and targeting."
    if conditional_roles:
        overview = f"{overview} Conditional fit: {', '.join(conditional_roles)}."

    roast_report = {
        "strengths": _coerce_point_items(
            parsed.get("what_is_good"),
            limit=6,
            fallback=["Your resume has useful raw material, but the positioning needs tightening."],
            primary_keys=["point"],
            secondary_keys=["evidence"],
        ),
        "weaknesses": _coerce_point_items(
            parsed.get("what_is_bad"),
            limit=8,
            fallback=["The document still reads more like responsibilities than quantified outcomes."],
            primary_keys=["point"],
            secondary_keys=["impact"],
        ),
        "hard_truths": _coerce_point_items(
            parsed.get("hard_truths"),
            limit=6,
            fallback=["If your impact is not measurable, interviewers assume it was small."],
            primary_keys=["point"],
            secondary_keys=["why_it_hurts"],
        ),
        "priority_fixes": _coerce_point_items(
            parsed.get("priority_fixes"),
            limit=8,
            fallback=["Rewrite top bullets using action + scope + metric + business impact."],
            primary_keys=["fix", "action"],
            secondary_keys=["exact_edit_example"],
        ),
        "resume_loopholes": _coerce_point_items(
            parsed.get("resume_loopholes"),
            limit=5,
            fallback=["Could not detect specific loopholes — re-run with your resume for detailed analysis."],
            primary_keys=["issue"],
            secondary_keys=["why_it_matters"],
        ),
        "should_remove": _coerce_point_items(
            parsed.get("remove_from_resume"),
            limit=5,
            fallback=["Review your summary for generic filler phrases like 'passionate' or 'team player'."],
            primary_keys=["line"],
            secondary_keys=["better_replacement"],
        ),
        "role_fit_verdict": {
            "best_fit_roles": strong_roles,
            "weak_fit_roles": weak_roles,
            "verdict": overview,
        },
    }

    certification_suggestions = []
    for cert in parsed.get("certification_suggestions", []) if isinstance(parsed.get("certification_suggestions"), list) else []:
        if not isinstance(cert, dict):
            continue
        name = str(cert.get("name", "")).strip()
        provider = str(cert.get("provider", "")).strip()
        if not name:
            continue
        certification_suggestions.append({
            "name": name,
            "provider": provider,
            "relevance": str(cert.get("gap_it_closes", "Targeted gap closure")).strip() or "Targeted gap closure",
            "impact": str(cert.get("resume_impact", "Signal boost")).strip() or "Signal boost",
            "url": str(cert.get("url", "")).strip(),
            "why_this_person_needs_it": str(cert.get("why_this_person_needs_it", "")).strip(),
            "time_to_complete": str(cert.get("time_to_complete", "")).strip(),
            "proof_project_to_build_after_cert": str(cert.get("proof_project_to_build_after_cert", "")).strip(),
        })

    return {
        "roast_report": roast_report,
        "certification_suggestions": certification_suggestions[:3],
    }


def build_roast_report(
    features: dict,
    friendliness_result: dict,
    visibility_result: Optional[dict],
    ats_extracted: dict,
    job_description: Optional[str],
    target_role: Optional[str] = None,
    has_linkedin_signal: Optional[bool] = None,
    has_github_signal: Optional[bool] = None,
) -> dict:
    strengths: list[str] = []
    weaknesses: list[str] = []
    hard_truths: list[str] = []
    priority_fixes: list[str] = []

    raw_text = ats_extracted.get("raw_text", "") or ""
    skills_list = [str(s).strip() for s in (ats_extracted.get("skills", []) or []) if str(s).strip()]
    job_titles = [str(t).strip() for t in (ats_extracted.get("job_titles", []) or []) if str(t).strip()]
    quantified_bullets = _extract_quantified_bullets(raw_text)
    section_state = _section_presence(raw_text)
    summary_ok = _has_summary_with_signal(raw_text)
    technical_role = _is_technical_role(target_role)
    links = extract_profile_links(raw_text)
    has_linkedin = bool(has_linkedin_signal) if has_linkedin_signal is not None else bool(links.get("linkedin_url"))
    has_github = bool(has_github_signal) if has_github_signal is not None else bool(links.get("github_url"))
    line_samples = [line.strip() for line in raw_text.splitlines() if line.strip()]
    label_heavy_lines = [
        line for line in line_samples
        if re.match(r"(?i)^[•\-\*]?\s*(objective|description|key contributions|technologies used|outcome)\s*:", line)
    ]

    if features.get("email_found"):
        strengths.append("You included an email address, so ATS can route your application correctly.")
    if features.get("phone_found"):
        strengths.append("You included a phone number, which reduces recruiter follow-up friction.")
    if skills_list:
        strengths.append(f"You already have {len(skills_list)} detectable skill keywords, which helps ATS coverage.")
    if len(quantified_bullets) >= 4:
        strengths.append("You already have quantified impact bullets; this is recruiter-grade evidence.")
    elif len(quantified_bullets) >= 2:
        strengths.append("You have some measurable bullets; expanding this will quickly improve interview pull.")

    if features.get("word_count", 0) < 220:
        weaknesses.append("Resume is thin on defensible outcomes; it reads more like claims than proof.")
        hard_truths.append("If your resume is this short, recruiters will assume low ownership depth.")
        priority_fixes.append("Add 4-6 quantified bullets with action + scope + metric + outcome.")

    if len(quantified_bullets) < 4:
        weaknesses.append("Too few bullets show measurable impact across projects/internships.")
        hard_truths.append("Without metrics, even real work looks generic and low-impact in screening.")
        priority_fixes.append("Rewrite top bullets to include numbers, latency/time improvements, or user/business outcomes.")

    if not summary_ok:
        weaknesses.append("Top summary lines are generic and do not immediately establish role-fit evidence.")
        hard_truths.append("If your first 6 lines are vague, most recruiters stop reading there.")
        priority_fixes.append("Replace summary with role focus + strongest proof line from experience/projects.")

    risk_flags = set(features.get("risk_flags", []))
    if "DETECTED_TEXT_TABLES" in risk_flags:
        weaknesses.append("Table-heavy layout can break ATS parsing.")
        hard_truths.append("Pretty formatting is not worth getting partially parsed by ATS.")
        priority_fixes.append("Replace table layouts with plain headings and bullet lists.")
    if "WORKDAY_PARSING_RISK" in risk_flags:
        weaknesses.append("Section naming is non-standard for Workday parsing.")
        priority_fixes.append("Use standard headers: Summary, Experience, Projects, Skills, Education.")

    if not section_state.get("experience"):
        weaknesses.append("Experience section is weak/missing, making role-level assessment difficult.")
        priority_fixes.append("Add a clean Experience section with role, stack, scope, and measurable outcomes.")
    if technical_role and not section_state.get("projects"):
        weaknesses.append("Technical profile lacks visible project depth in ATS-visible structure.")
        priority_fixes.append("Add 2-3 projects with stack + metric + outcome for technical role credibility.")

    if not has_linkedin:
        weaknesses.append("LinkedIn signal is weak or missing from visible header text.")
        priority_fixes.append("Add full LinkedIn URL in header for recruiter verification.")
    if technical_role and not has_github:
        weaknesses.append("GitHub proof signal is missing for a technical role.")
        hard_truths.append("For technical roles, no GitHub proof makes skill claims harder to trust.")
        priority_fixes.append("Add GitHub profile URL in header and showcase 2-3 strongest repos.")

    friendliness_score = friendliness_result.get("score", 0)
    if friendliness_score < 60:
        hard_truths.append("Current ATS quality is likely too low for consistent callbacks.")
        priority_fixes.append("Fix ATS blockers first, then optimize phrasing and impact bullets.")
    elif friendliness_score >= 80:
        strengths.append("ATS baseline is already decent, so content quality is now your biggest lever.")

    has_jd = bool((job_description or "").strip())
    if visibility_result:
        missing = visibility_result.get("missing_keywords", [])[:10]
        if missing:
            weaknesses.append("JD-critical language is missing in core sections.")
            priority_fixes.append(f"Naturally include these truthful role terms: {', '.join(missing[:6])}.")
        if visibility_result.get("score", 0) < 65:
            hard_truths.append("Current language alignment to the JD is not strong enough yet.")
    elif has_jd:
        weaknesses.append("JD was provided but keyword/semantic fit analysis was limited in this run.")
        priority_fixes.append("Retry once with the same JD to get full role-match scoring.")
    else:
        strengths.append("Analyze mode is running in no-JD diagnostic mode by design (structure + signal focus).")
        priority_fixes.append("After structural fixes, run Match & Fix with one target JD for role-specific tuning.")

    # Build loopholes with meaningful defaults (no blank/generic filler).
    resume_loopholes: list[str] = []
    if len(skills_list) >= 12 and len(quantified_bullets) < 3:
        resume_loopholes.append("Skills list is dense but proof density is low; this looks like keyword stuffing to recruiters.")
    if label_heavy_lines:
        resume_loopholes.append("Bullets using labels like Objective/Description/Technologies reduce readability and waste prime real estate.")
    if technical_role and not has_github:
        resume_loopholes.append("Technical role target without GitHub proof lowers trust in implementation depth.")
    if not section_state.get("projects"):
        resume_loopholes.append("No clear projects block reduces evidence depth for early-career technical screening.")
    if not resume_loopholes:
        resume_loopholes.append("Main gap is evidence compression: convert responsibilities into measurable, ownership-based bullets.")

    should_remove: list[str] = []
    if features.get("word_count", 0) > 800:
        should_remove.append("Trim low-signal/old lines; keep content that proves current role fit and measurable impact.")
    should_remove.append("Remove generic phrases like 'passionate', 'team player', 'excellent communication skills'.")
    if label_heavy_lines:
        should_remove.append("Remove repeated bullet labels like 'Objective:' and 'Description:'; write direct action-impact bullets.")
    if "WORKDAY_PARSING_RISK" in risk_flags:
        should_remove.append("Remove non-standard section headers; use Experience, Projects, Skills, Education.")

    normalized_target_role = (target_role or "").replace("-", " ").replace("_", " ").strip().title()
    skill_blob = " ".join(skills_list).lower()
    inferred_best: list[str] = []
    if normalized_target_role:
        inferred_best.append(normalized_target_role)
    if any(token in skill_blob for token in ["react", "frontend", "ui", "typescript", "javascript"]):
        inferred_best.append("Frontend Developer")
    if any(token in skill_blob for token in ["node", "express", "api", "sql", "postgres", "backend"]):
        inferred_best.append("Backend Developer")
    if any(token in skill_blob for token in ["machine learning", "tensorflow", "pytorch", "nlp", "llm"]):
        inferred_best.append("Machine Learning Engineer")
    if any(token in skill_blob for token in ["tableau", "power bi", "analytics", "pandas"]):
        inferred_best.append("Data Analyst / Data Scientist")
    if not inferred_best:
        inferred_best = [job_titles[0]] if job_titles else ["Software Engineer"]

    weak_fit_roles = ["Senior/Staff roles requiring deep specialization"]
    if len(quantified_bullets) < 3:
        weak_fit_roles.append("Impact-heavy product roles demanding strong metric ownership evidence")
    if technical_role and not has_github:
        weak_fit_roles.append("Code-first engineering roles where public project proof is expected")

    role_fit_verdict = {
        "best_fit_roles": _unique_non_empty(inferred_best, 3),
        "weak_fit_roles": _unique_non_empty(weak_fit_roles, 3),
        "verdict": "This resume can compete for entry-to-mid roles, but evidence density and role-targeting must tighten before interviews.",
    }

    strengths = _unique_non_empty(strengths + [
        "Your resume has usable raw material; the next gains come from sharper evidence presentation."
    ], 6)
    weaknesses = _unique_non_empty(weaknesses + [
        "Current narrative still under-communicates ownership and measurable impact."
    ], 8)
    hard_truths = _unique_non_empty(hard_truths + [
        "If a recruiter cannot quickly see ownership + metric + outcome, they move to the next resume."
    ], 6)
    priority_fixes = _unique_non_empty(priority_fixes + [
        "Rewrite the top 5 bullets in action + scope + metric + outcome format.",
        "Keep only role-relevant lines and remove low-signal filler.",
    ], 8)
    resume_loopholes = _unique_non_empty(resume_loopholes, 5)
    should_remove = _unique_non_empty(should_remove, 5)

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "hard_truths": hard_truths,
        "priority_fixes": priority_fixes,
        "resume_loopholes": resume_loopholes,
        "should_remove": should_remove,
        "role_fit_verdict": role_fit_verdict,
    }


def _merge_roast_reports(base: dict, candidate: Optional[dict]) -> dict:
    if not isinstance(base, dict):
        base = {}
    if not isinstance(candidate, dict):
        return base

    merged = {
        "strengths": _unique_non_empty(
            (candidate.get("strengths", []) or []) + (base.get("strengths", []) or []),
            6,
        ),
        "weaknesses": _unique_non_empty(
            (candidate.get("weaknesses", []) or []) + (base.get("weaknesses", []) or []),
            8,
        ),
        "hard_truths": _unique_non_empty(
            (candidate.get("hard_truths", []) or []) + (base.get("hard_truths", []) or []),
            6,
        ),
        "priority_fixes": _unique_non_empty(
            (candidate.get("priority_fixes", []) or []) + (base.get("priority_fixes", []) or []),
            8,
        ),
        "resume_loopholes": _unique_non_empty(
            (candidate.get("resume_loopholes", []) or []) + (base.get("resume_loopholes", []) or []),
            5,
        ),
        "should_remove": _unique_non_empty(
            (candidate.get("should_remove", []) or []) + (base.get("should_remove", []) or []),
            5,
        ),
    }

    base_role = base.get("role_fit_verdict", {}) if isinstance(base.get("role_fit_verdict"), dict) else {}
    cand_role = candidate.get("role_fit_verdict", {}) if isinstance(candidate.get("role_fit_verdict"), dict) else {}
    merged["role_fit_verdict"] = {
        "best_fit_roles": _unique_non_empty(
            (cand_role.get("best_fit_roles", []) or []) + (base_role.get("best_fit_roles", []) or []),
            3,
        ),
        "weak_fit_roles": _unique_non_empty(
            (cand_role.get("weak_fit_roles", []) or []) + (base_role.get("weak_fit_roles", []) or []),
            3,
        ),
        "verdict": str(cand_role.get("verdict") or base_role.get("verdict") or "").strip(),
    }

    return merged


def build_content_decisions(
    parsing_result: dict,
    ats_extracted: dict,
    missing_keywords: list[str],
    critical_issues: list[dict],
) -> dict:
    raw_text = parsing_result.get("raw_text", "")
    sentences = _sentences(raw_text)
    keep = []
    rewrite = []
    remove = []
    proof_needed = []

    for sentence in sentences[:40]:
        lower = sentence.lower()
        has_number = bool(re.search(r"\d", sentence))
        mentions_action = bool(re.search(r"\b(built|led|improved|reduced|increased|delivered|launched|designed|optimized)\b", lower))
        if has_number and mentions_action and len(keep) < 8:
            keep.append(sentence)
        elif mentions_action and len(rewrite) < 8:
            rewrite.append(sentence)
        elif ("responsible for" in lower or "hardworking" in lower or "team player" in lower) and len(remove) < 6:
            remove.append(sentence)

    for issue in critical_issues:
        if issue.get("severity") in {"critical", "warning"} and len(proof_needed) < 6:
            proof_needed.append(f"{issue.get('type', 'Issue')}: {issue.get('title', 'Fix required')}")

    for kw in missing_keywords[:6]:
        rewrite.append(f"Add a truthful bullet demonstrating {kw} with outcome + scope.")

    if not keep:
        keep = ats_extracted.get("skills", [])[:5]
    if not rewrite:
        rewrite = ["Rewrite experience bullets to include metrics, ownership, and tech stack context."]
    if not remove:
        remove = ["Remove vague summary lines that do not show measurable impact."]

    return {
        "keep": keep[:8],
        "rewrite": rewrite[:10],
        "remove": remove[:8],
        "proof_needed": proof_needed[:8],
    }


def build_linkedin_intel(
    linkedin_text: Optional[str],
    resume_text: str,
    linkedin_url: Optional[str] = None,
) -> dict:
    if not linkedin_text or not linkedin_text.strip():
        must_include = []
        if linkedin_url:
            must_include.append(f"Keep your LinkedIn URL visible in resume header: {linkedin_url}")
            summary = "LinkedIn URL detected from resume. Add LinkedIn text input for deeper keep/remove analysis."
        else:
            must_include.append("Add your LinkedIn profile URL in resume header for recruiter verification.")
            summary = "No LinkedIn URL detected in resume text."
        return {
            "linkedin_must_include": must_include,
            "linkedin_remove": [],
            "linkedin_summary": summary,
        }

    resume_keywords = _extract_resume_keywords(resume_text)
    linkedin_sentences = _sentences(linkedin_text)
    must_include = []
    remove = []

    for sentence in linkedin_sentences:
        lower = sentence.lower()
        has_metric = bool(re.search(r"\d", sentence))
        has_signal = bool(re.search(r"\b(led|built|launched|grew|improved|reduced|increased|managed|owned)\b", lower))
        sentence_tokens = _extract_resume_keywords(sentence)
        overlap = len(sentence_tokens & resume_keywords)

        if has_metric and has_signal and overlap < 2 and len(must_include) < 8:
            must_include.append(sentence)
        if ("seeking opportunities" in lower or "passionate" in lower or "results-driven" in lower) and len(remove) < 5:
            remove.append(sentence)

    summary = "LinkedIn compared against resume to identify transferable evidence."
    if not must_include:
        summary = "LinkedIn mostly overlaps with resume; focus on deeper quantification instead of duplication."
    if linkedin_url:
        must_include.insert(0, f"Keep your LinkedIn URL visible in resume header: {linkedin_url}")
    else:
        must_include.insert(0, "Add LinkedIn profile URL in resume header to increase trust and recruiter follow-through.")

    return {
        "linkedin_must_include": must_include[:8],
        "linkedin_remove": remove[:6],
        "linkedin_summary": summary,
    }


def build_github_intel(
    github_username: Optional[str],
    target_role: Optional[str],
    job_description: Optional[str],
    github_token: Optional[str],
    source: str = "user_input",
    github_profile_url: Optional[str] = None,
) -> dict:
    if not github_username:
        return {
            "github_best_projects": [],
            "github_drop_projects": [],
            "github_summary": "No GitHub profile detected. Add GitHub URL in resume header for technical roles.",
        }

    try:
        github_client = GitHubClient(access_token=github_token)
        analyzer = RepositoryAnalyzer()
        username = github_client.extract_username_from_url(github_username)
        analyze_max_repos = int(os.getenv("ANALYZE_GITHUB_MAX_REPOS", "18"))
        analyze_readme_scan_limit = int(os.getenv("ANALYZE_GITHUB_README_SCAN_LIMIT", "8"))
        analyze_readme_content_limit = int(os.getenv("ANALYZE_GITHUB_README_CONTENT_LIMIT", "3"))
        if github_token:
            analyze_max_repos = max(analyze_max_repos, 24)

        repositories = github_client.get_user_repositories(
            username,
            max_repos=analyze_max_repos,
            readme_scan_limit=analyze_readme_scan_limit,
            readme_content_limit=analyze_readme_content_limit,
        )

        analyzed = analyzer.analyze_repositories(
            repositories=repositories,
            job_role=target_role or "software-engineer",
            job_description=job_description or "",
            use_ai=False,
            pinned_repos=[],
        )

        best = []
        drop = []
        for repo in analyzed[:6]:
            if repo.get("relevance_score", 0) >= 60:
                best.append({
                    "name": repo.get("name"),
                    "score": repo.get("relevance_score"),
                    "reason": repo.get("why_relevant", ""),
                    "resume_bullet": repo.get("suggested_resume_text", ""),
                })
            else:
                drop.append({
                    "name": repo.get("name"),
                    "score": repo.get("relevance_score"),
                    "reason": "Low signal for target role or weak evidence density.",
                })

        return {
            "github_best_projects": best[:4],
            "github_drop_projects": drop[:4],
            "github_summary": (
                f"Analyzed {len(analyzed)} repositories for role relevance. "
                f"Profile source: {'resume' if source == 'resume_text' else 'input'}."
                + (f" Profile: {github_profile_url}" if github_profile_url else "")
            ),
        }
    except Exception as exc:
        logger.warning("GitHub analysis skipped: %s", exc)
        return {
            "github_best_projects": [],
            "github_drop_projects": [],
            "github_summary": f"GitHub analysis unavailable: {exc}",
        }


def _fallback_jd_for_role(target_role: Optional[str]) -> str:
    role = (target_role or "").strip().lower().replace("_", "-")
    role_map = {
        "software-engineer": "Software engineer role requiring backend APIs, system design, SQL, cloud, CI/CD, testing, and ownership.",
        "backend-engineer": "Backend engineer role requiring API design, databases, distributed systems, cloud deployment, and reliability.",
        "frontend-engineer": "Frontend engineer role requiring React, TypeScript, UI performance, accessibility, testing, and collaboration.",
        "full-stack-engineer": "Full-stack engineer role requiring React, Node.js, API design, SQL, cloud deployment, and CI/CD.",
        "devops-engineer": "DevOps engineer role requiring cloud, infrastructure as code, Kubernetes, CI/CD, monitoring, and automation.",
        "data-scientist": "Data scientist role requiring Python, ML modeling, experimentation, statistics, SQL, and production deployment.",
        "ml-engineer": "ML engineer role requiring model deployment, MLOps, Python, cloud infrastructure, and monitoring.",
        "data-engineer": "Data engineer role requiring ETL pipelines, SQL, Python, cloud data platforms, and orchestration.",
        "product-manager": "Product manager role requiring roadmap ownership, metrics, stakeholder communication, and execution.",
    }
    return role_map.get(role, "Role requiring measurable outcomes, technical depth, communication, and execution ownership.")


def _normalize_missing_keywords(raw_keywords: list[str]) -> list[str]:
    cleaned: list[str] = []
    seen = set()
    drop = {
        "analysis", "design", "ownership", "problem", "problems", "system", "systems",
        "software", "scalable", "build", "building", "team", "candidate", "experience",
        "skills", "knowledge", "communication", "business", "product",
    }
    allow_short = {"ci", "cd", "ml", "ai", "ui", "ux", "qa"}
    ci_cd_seen = False

    for raw in raw_keywords or []:
        token = str(raw).strip().lower().strip(".,:;()[]{}")
        if not token:
            continue
        if token in {"ci", "cd", "ci/cd", "ci-cd"}:
            if ci_cd_seen:
                continue
            ci_cd_seen = True
            token = "CI/CD"
        else:
            if len(token) < 3 and token not in allow_short:
                continue
            if token in drop:
                continue
            token = token.upper() if token.isupper() else token.capitalize()

        key = token.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(token)
        if len(cleaned) >= 12:
            break
    return cleaned


def _build_detailed_action_plan(
    missing_tech: list[str],
    missing_soft: list[str],
    certs: list[dict],
    has_linkedin_url: bool,
    has_github_url: bool,
) -> list[dict]:
    plan: list[dict] = []

    if not has_linkedin_url:
        plan.append({
            "title": "Fix LinkedIn Signal",
            "priority": "P0",
            "effort": "10 min",
            "why": "Recruiters verify profile credibility from LinkedIn before scheduling calls.",
            "steps": [
                "Add full LinkedIn URL in resume header.",
                "Match headline to target role and top 2 skills.",
                "Ensure latest internship/project details match resume bullets.",
            ],
            "example": "Header: linkedin.com/in/your-handle",
        })

    if not has_github_url:
        plan.append({
            "title": "Fix GitHub Proof",
            "priority": "P0",
            "effort": "15 min",
            "why": "Technical recruiters expect live project proof, not just skill claims.",
            "steps": [
                "Add GitHub URL in header.",
                "Pin 2-3 role-relevant repositories with clear README.",
                "Add one repository line in Projects with measurable result.",
            ],
            "example": "Project bullet: Built CivicWatch API (Node/Postgres), reduced report submission latency by 28%.",
        })

    if missing_tech:
        skill = missing_tech[0]
        plan.append({
            "title": f"Add Defensible {skill} Evidence",
            "priority": "P1",
            "effort": "30-45 min",
            "why": f"{skill} is appearing as a role signal but lacks visible proof in resume language.",
            "steps": [
                "Find one real project/task where you used this skill.",
                "Write one bullet with action + scope + metric + outcome.",
                "Place it in Experience or Projects (not only Skills section).",
            ],
            "example": f"Implemented {skill} pipeline for vendor dashboard; improved page render speed by 22% on core workflow.",
        })

    if certs:
        cert = certs[0]
        cert_name = str(cert.get("name", "Relevant certification")).strip()
        cert_provider = str(cert.get("provider", "")).strip()
        plan.append({
            "title": "Certification Leverage Strategy",
            "priority": "P2",
            "effort": "2-6 weeks",
            "why": "A targeted certification improves trust when experience depth is still growing.",
            "steps": [
                f"Shortlist {cert_name} based on role fit.",
                "Complete associated mini-project and publish it on GitHub.",
                "Add certification only after progress/milestone is real.",
            ],
            "example": f"Certification: {cert_name}" + (f" ({cert_provider})" if cert_provider else ""),
        })

    if missing_soft:
        soft = missing_soft[0]
        plan.append({
            "title": f"Show {soft} Through Outcomes",
            "priority": "P2",
            "effort": "20 min",
            "why": "Soft skills need evidence through work outcomes, not adjectives.",
            "steps": [
                "Pick one project where collaboration or ownership mattered.",
                "Mention stakeholders and decision made.",
                "Attach one measurable result.",
            ],
            "example": f"Aligned cross-team priorities with 3 stakeholders, shipped feature in 2 weeks with 0 rollback incidents.",
        })

    return plan[:5]


def _build_sample_resume_upgrades(missing_tech: list[str]) -> list[dict]:
    examples = [
        {
            "area": "Summary",
            "before": "Aspiring engineer with strong technical skills.",
            "after": "Software Engineer focused on React + Node systems, delivered vendor workflow improvements with measurable performance gains.",
            "reason": "Adds role focus + concrete evidence instead of generic claim.",
        },
        {
            "area": "Experience Bullet",
            "before": "Worked on vendor panel improvements.",
            "after": "Built vendor panel workflow improvements in React/Node, cutting image-upload handling time by 30%.",
            "reason": "Uses action + stack + metric + outcome format.",
        },
    ]
    if missing_tech:
        skill = missing_tech[0]
        examples.append({
            "area": "Skills to Project Link",
            "before": f"Skills: {skill}",
            "after": f"{skill}: Applied in [project-name], where I solved [problem] and improved [metric].",
            "reason": "Turns isolated skill listing into defensible project evidence.",
        })
    return examples[:3]


def build_comprehensive_guidance(
    resume_text: str,
    job_description: Optional[str],
    target_role: Optional[str],
    has_linkedin_url: bool = False,
    has_github_url: bool = False,
) -> dict:
    has_jd = bool((job_description or "").strip())
    analyzer = get_comprehensive_analyzer()
    resume_lower = (resume_text or "").lower()

    if not has_jd:
        baseline_role_signals = _extract_jd_interview_signals(_fallback_jd_for_role(target_role), limit=8)
        no_jd_missing_tech = [
            signal for signal in baseline_role_signals
            if signal and signal.lower() not in resume_lower
        ][:5]
        cert_recs = _recommend_certs_from_resume_evidence(analyzer, resume_text, target_role)
        actionable_lines = []
        if no_jd_missing_tech:
            actionable_lines.append(
                f"No-JD role baseline gaps to consider: {', '.join(no_jd_missing_tech[:4])}."
            )
        if cert_recs:
            top = cert_recs[0]
            actionable_lines.append(
                f"Certification to consider only if role-aligned evidence exists: {top['name']} -> Build proof project before adding to resume."
            )
        else:
            actionable_lines.append(
                "No certification recommendation in no-JD mode. Prioritize quantified bullets + GitHub proof first."
            )

        action_plan = _build_detailed_action_plan(
            missing_tech=no_jd_missing_tech,
            missing_soft=[],
            certs=cert_recs,
            has_linkedin_url=has_linkedin_url,
            has_github_url=has_github_url,
        )
        return {
            "missing_keywords": no_jd_missing_tech,
            "missing_technical_skills": no_jd_missing_tech,
            "missing_soft_skills": [],
            "certification_recommendations": cert_recs,
            "actionable_recommendations": actionable_lines[:8],
            "action_plan": action_plan,
            "sample_resume_upgrades": _build_sample_resume_upgrades(no_jd_missing_tech),
        }

    try:
        jd_context = (job_description or "").strip()
        raw = analyzer.analyze_comprehensive(resume_text=resume_text, jd_text=jd_context)
    except Exception as exc:
        logger.warning("Comprehensive guidance generation failed: %s", exc)
        return {
            "missing_keywords": [],
            "missing_technical_skills": [],
            "missing_soft_skills": [],
            "certification_recommendations": [],
            "actionable_recommendations": [],
            "action_plan": [],
            "sample_resume_upgrades": [],
        }

    missing_skills = raw.get("missing_skills", {}) if isinstance(raw, dict) else {}
    actionable = raw.get("actionable_recommendations", []) if isinstance(raw, dict) else []

    actionable_lines: list[str] = []
    for item in actionable:
        if isinstance(item, dict):
            action = str(item.get("action", "")).strip()
            priority = str(item.get("priority", "")).strip()
            where = str(item.get("where", "")).strip()
            if action:
                suffix = f" ({priority})" if priority else ""
                location = f" -> {where}" if where else ""
                actionable_lines.append(f"{action}{suffix}{location}")
        elif str(item).strip():
            actionable_lines.append(str(item).strip())

    cert_recs = raw.get("certification_recommendations", []) if isinstance(raw, dict) else []
    normalized_certs = []
    for cert in cert_recs[:6]:
        if not isinstance(cert, dict):
            continue
        normalized_certs.append({
            "name": str(cert.get("name", "")).strip(),
            "provider": str(cert.get("provider", "")).strip(),
            "relevance": str(cert.get("relevance", "")).strip(),
            "impact": str(cert.get("impact", "")).strip(),
            "url": str(cert.get("url", "")).strip(),
        })

    normalized_missing_keywords = _normalize_missing_keywords(raw.get("missing_keywords", []) if isinstance(raw, dict) else [])
    normalized_missing_tech = _normalize_missing_keywords((missing_skills.get("technical", []) if isinstance(missing_skills, dict) else [])[:10])
    normalized_missing_soft = _normalize_missing_keywords((missing_skills.get("soft", []) if isinstance(missing_skills, dict) else [])[:6])
    action_plan = _build_detailed_action_plan(
        missing_tech=normalized_missing_tech,
        missing_soft=normalized_missing_soft,
        certs=normalized_certs,
        has_linkedin_url=has_linkedin_url,
        has_github_url=has_github_url,
    )
    sample_resume_upgrades = _build_sample_resume_upgrades(normalized_missing_tech)

    return {
        "missing_keywords": normalized_missing_keywords[:12],
        "missing_technical_skills": normalized_missing_tech[:10],
        "missing_soft_skills": normalized_missing_soft[:6],
        "certification_recommendations": normalized_certs,
        "actionable_recommendations": actionable_lines[:8],
        "action_plan": action_plan,
        "sample_resume_upgrades": sample_resume_upgrades,
    }


def build_interview_prep(
    resume_text: str,
    job_description: Optional[str],
    company_name: Optional[str],
) -> dict:
    company = (company_name or "the company").strip()
    lines = [line.strip("•- ").strip() for line in resume_text.splitlines() if line.strip()]
    accomplishment_lines = [
        line for line in lines
        if re.search(r"\d", line) and re.search(r"\b(built|led|improved|reduced|increased|designed|launched|optimized|managed|implemented)\b", line.lower())
    ][:3]
    if not accomplishment_lines:
        accomplishment_lines = lines[:3]

    unique_jd = _extract_jd_interview_signals(job_description, limit=5)

    questions = []
    for line in accomplishment_lines:
        framework = _build_answer_framework("resume_deep_dive", line, company, job_description)
        questions.append({
            "category": "resume_deep_dive",
            "question": f"Tell me the real story behind: \"{line}\". What did you own and how did you measure success?",
            "why_asked": "Interviewers validate ownership and depth behind resume bullets.",
            "prep_tip": "Use STAR and include exact scope, constraints, and measurable outcome.",
            "answer_framework": framework,
            "sample_answer": _build_sample_answer(framework, line),
        })

    for keyword in unique_jd[:3]:
        framework = _build_answer_framework("jd_alignment", keyword, company, job_description)
        questions.append({
            "category": "jd_alignment",
            "question": f"Where have you used {keyword} in a real project, and what measurable result came from it?",
            "why_asked": "Hiring teams test fit to role-critical requirements from the JD.",
            "prep_tip": f"Use one concrete {keyword} example with context, trade-off, and metric.",
            "answer_framework": framework,
            "sample_answer": _build_sample_answer(framework, keyword),
        })

    company_framework = _build_answer_framework("company_fit", company, company, job_description)
    questions.extend([
        {
            "category": "company_fit",
            "question": f"Why {company}? What about our product/business makes this role a fit for you?",
            "why_asked": "Assesses motivation and whether you researched the company.",
            "prep_tip": "Reference specific products, business priorities, and where you can add value.",
            "answer_framework": company_framework,
            "sample_answer": _build_sample_answer(company_framework, company),
        },
        {
            "category": "company_fit",
            "question": f"If you joined {company}, what would your first 90 days look like?",
            "why_asked": "Evaluates planning, communication, and practical execution mindset.",
            "prep_tip": "Share a 30/60/90 day plan: onboarding, quick wins, and measurable impact.",
            "answer_framework": "30 days: understand product, team workflow, and key metrics. 60 days: ship one scoped improvement tied to a KPI. 90 days: own a larger initiative and report measurable outcomes.",
            "sample_answer": f"In the first 30 days at {company}, I would focus on product context, stakeholders, and baseline metrics. By day 60, I would deliver one scoped improvement tied to a KPI. By day 90, I would own a larger initiative and report measurable impact.",
        }
    ])

    return {
        "company": company,
        "likely_questions": questions[:10],
        "prep_plan": [
            "Prepare 5 STAR stories tied to your strongest bullets.",
            "Map each major JD signal to one concrete project example.",
            f"Research {company}'s product and role expectations before interview.",
        ],
    }


def _offline_templates(role: Optional[str], target_ats: str) -> list[dict]:
    templates = [
        {"id": "software-engineer-mid", "name": "Software Engineer - ATS Optimized", "role": "software-engineer", "ats_vendors": ["workday", "taleo", "greenhouse", "icims"]},
        {"id": "data-scientist-senior", "name": "Data Scientist - Research Focus", "role": "data-scientist", "ats_vendors": ["workday", "greenhouse"]},
        {"id": "product-manager-mid", "name": "Product Manager - Strategic", "role": "product-manager", "ats_vendors": ["taleo", "workday"]},
        {"id": "designer-ux-mid", "name": "UX Designer - Portfolio", "role": "designer", "ats_vendors": ["greenhouse", "lever"]},
    ]

    filtered = templates
    if role:
        filtered = [t for t in filtered if t["role"] == role]
    if target_ats and target_ats != "all":
        filtered = [t for t in filtered if target_ats in t["ats_vendors"]]
    return filtered


@router.post("/analyze/full")
async def full_analysis(
    file: UploadFile = File(...),
    job_description: Optional[str] = Form(None),
    target_role: Optional[str] = Form(None),
    target_ats: str = Form("all"),
    analysis_mode: str = Form("jd_or_general"),
    feedback_tone: str = Form("brutal"),
    company_name: Optional[str] = Form(None),
    github_username: Optional[str] = Form(None),
    linkedin_text: Optional[str] = Form(None),
    github_token: Optional[str] = Form(None),
):
    """
    Complete ATS analysis matching frontend dashboard expectations.
    
    Args:
        file: Resume file (PDF or DOCX)
        job_description: Optional job description for matching
        target_role: Optional target role
        target_ats: Target ATS system (default: all)
    
    Returns:
        Complete analysis result
    """
    try:
        # 1. Parse resume
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".pdf"):
            parsing_result = pdf_parser.parse(content)
        elif filename.endswith(".docx"):
            parsing_result = docx_parser.parse(content)
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Please upload PDF or DOCX."
            )
        
        if "error" in parsing_result:
            raise HTTPException(status_code=500, detail=parsing_result["error"])
        
        # 2. Extract features
        feature_extractor = get_feature_extractor()
        features = feature_extractor.extract_features(parsing_result)
        resume_text = parsing_result.get("raw_text", "")
        extracted_urls = [str(u).strip() for u in (parsing_result.get("extracted_urls") or []) if str(u).strip()]
        profile_source_text = "\n".join([resume_text] + extracted_urls)
        detected_profiles = extract_profile_links(profile_source_text)
        resolved_github = (github_username or "").strip() or detected_profiles.get("github_username") or detected_profiles.get("github_url")
        resolved_linkedin_url = detected_profiles.get("linkedin_url")
        extracted_profile_urls = [
            url for url in extracted_urls
            if ("github.com" in url.lower()) or ("linkedin.com" in url.lower())
        ][:10]
        
        # 3. ATS Friendliness
        friendliness_result = friendliness_classifier.predict(features)
        raw_friendliness_score = friendliness_result.get("score", 0)
        score_calibration = calibrate_friendliness_score(
            raw_friendliness_score=raw_friendliness_score,
            resume_text=resume_text,
            target_role=target_role,
            linkedin_url=resolved_linkedin_url,
            github_url=detected_profiles.get("github_url"),
        )
        friendliness_score = score_calibration.get("adjusted_score", raw_friendliness_score)
        
        # 4. Visibility Ranking (if JD provided)
        match_score = None
        visibility_result = None
        
        if job_description:
            visibility_ranker = get_visibility_ranker()
            visibility_result = visibility_ranker.rank(resume_text, job_description)
            match_score = visibility_result.get("score", 0)
        
        # 5. Map to frontend format
        vendor_compatibility = map_vendor_compatibility(features, friendliness_result)
        critical_issues = format_critical_issues(friendliness_result, features)
        ats_extracted = extract_ats_data(features, parsing_result)
        
        # 6. Generate recommendations
        recommendations = []
        
        # Recommend templates based on role and issues
        if target_role:
            templates = []
            try:
                templates = await get_templates(role=target_role, ats_vendor=target_ats)
            except Exception as exc:
                logger.warning("Template lookup failed, using offline fallback: %s", exc)
                templates = _offline_templates(target_role, target_ats)
            if not templates:
                templates = _offline_templates(target_role, target_ats)

            if templates:
                recommendations.append({
                    "type": "template",
                    "template_id": templates[0].get("id"),
                    "template_name": templates[0].get("name"),
                    "message": f"Try our {templates[0].get('name')} template"
                })
        
        # Recommend rewrite if match score is low
        if match_score and match_score < 60:
            recommendations.append({
                "type": "rewrite",
                "section": "summary",
                "message": "Optimize your summary to better match the job description"
            })
        for penalty in score_calibration.get("penalties", []):
            recommendations.append({
                "type": "quality",
                "message": f"Score adjustment: {penalty.get('reason')}",
            })

        # 7. Practical "roast" + keep/remove decisions
        roast_report = build_roast_report(
            features=features,
            friendliness_result=friendliness_result,
            visibility_result=visibility_result,
            ats_extracted=ats_extracted,
            job_description=job_description,
            target_role=target_role,
            has_linkedin_signal=bool(resolved_linkedin_url),
            has_github_signal=bool(resolved_github),
        )
        missing_keywords = visibility_result.get("missing_keywords", [])[:10] if visibility_result else []
        risk_flags = features.get("risk_flags", [])

        ai_timeout = float(os.getenv("ANALYZE_AI_TIMEOUT_SECONDS", "24"))
        github_timeout = float(os.getenv("ANALYZE_GITHUB_TIMEOUT_SECONDS", "12"))

        ai_task = asyncio.create_task(
            asyncio.wait_for(
                run_in_threadpool(
                    build_ai_roast_only,
                    resume_text,
                    job_description,
                    company_name,
                    target_role,
                    feedback_tone,
                    friendliness_score,
                    match_score,
                    missing_keywords,
                    risk_flags,
                ),
                timeout=ai_timeout,
            )
        )

        github_task = None
        if resolved_github:
            github_task = asyncio.create_task(
                asyncio.wait_for(
                    run_in_threadpool(
                        build_github_intel,
                        resolved_github,
                        target_role,
                        job_description,
                        github_token,
                        "user_input" if (github_username or "").strip() else "resume_text",
                        detected_profiles.get("github_url"),
                    ),
                    timeout=github_timeout,
                )
            )
        else:
            github_intel = build_github_intel(
                None,
                target_role,
                job_description,
                github_token,
                "resume_text",
                detected_profiles.get("github_url"),
            )

        try:
            ai_generated = await ai_task
        except asyncio.TimeoutError:
            logger.warning("AI roast timed out after %ss. Using heuristic fallback.", ai_timeout)
            ai_generated = None
            recommendations.append({
                "type": "quality",
                "message": "AI roast timed out in this run; using fallback diagnostics.",
            })

        if ai_generated:
            roast_report = _merge_roast_reports(roast_report, ai_generated.get("roast_report"))
            ai_generation_mode = "ai"
        else:
            ai_generation_mode = "heuristic"

        if github_task:
            try:
                github_intel = await github_task
            except asyncio.TimeoutError:
                logger.warning("GitHub intel timed out after %ss.", github_timeout)
                github_intel = {
                    "github_best_projects": [
                        {
                            "name": "Pin 2-3 strongest repos",
                            "score": 60,
                            "reason": "Use repos with clear README, architecture notes, and measurable outcomes.",
                            "resume_bullet": "Built [project], solved [problem], improved [metric], and documented implementation choices.",
                        }
                    ],
                    "github_drop_projects": [
                        {
                            "name": "Tutorial/fork-only repos",
                            "score": 25,
                            "reason": "Low ownership signal unless you document your unique contribution.",
                        }
                    ],
                    "github_summary": "GitHub deep scan timed out. Applied quick fallback guidance; retry with token for repository-level ranking.",
                }
                recommendations.append({
                    "type": "quality",
                    "message": "GitHub intel timed out; retry with token or fewer repositories.",
                })
        linkedin_intel = build_linkedin_intel(
            linkedin_text=linkedin_text,
            resume_text=resume_text,
            linkedin_url=resolved_linkedin_url,
        )
        comprehensive_guidance = build_comprehensive_guidance(
            resume_text=resume_text,
            job_description=job_description,
            target_role=target_role,
            has_linkedin_url=bool(resolved_linkedin_url),
            has_github_url=bool(resolved_github),
        )

        ai_cert_suggestions = []
        if isinstance(ai_generated, dict):
            ai_cert_suggestions = ai_generated.get("certification_suggestions", []) or []
        if ai_cert_suggestions:
            # Prefer AI-personalized cert guidance when available.
            comprehensive_guidance["certification_recommendations"] = ai_cert_suggestions[:3]
            for cert in ai_cert_suggestions[:2]:
                if not isinstance(cert, dict):
                    continue
                cert_name = str(cert.get("name", "")).strip()
                why = str(cert.get("why_this_person_needs_it", "")).strip()
                proof = str(cert.get("proof_project_to_build_after_cert", "")).strip()
                if cert_name:
                    actionable_line = f"Cert path: {cert_name}"
                    if why:
                        actionable_line += f" -> {why}"
                    if proof:
                        actionable_line += f" -> Proof project: {proof}"
                    comprehensive_guidance.setdefault("actionable_recommendations", []).append(actionable_line)

        normalized_role = (target_role or "").strip().lower().replace("-", " ").replace("_", " ")
        profile_actions = []
        if not resolved_linkedin_url:
            profile_actions.append("Add your LinkedIn profile URL in the resume header.")
        if not resolved_github and normalized_role in {
            "software engineer", "frontend engineer", "backend engineer", "full stack engineer",
            "devops engineer", "data scientist", "ml engineer", "data engineer"
        }:
            profile_actions.append("Add your GitHub profile URL in the resume header for technical roles.")

        for action in profile_actions:
            if action not in roast_report.get("priority_fixes", []):
                roast_report.setdefault("priority_fixes", []).append(action)
        for cert in comprehensive_guidance.get("certification_recommendations", [])[:2]:
            cert_name = str(cert.get("name", "")).strip()
            cert_provider = str(cert.get("provider", "")).strip()
            if not cert_name:
                continue
            cert_action = (
                f"Certification to consider: {cert_name} ({cert_provider})."
                if cert_provider
                else f"Certification to consider: {cert_name}."
            )
            if cert_action not in roast_report.get("priority_fixes", []):
                roast_report.setdefault("priority_fixes", []).append(cert_action)

        for action_line in comprehensive_guidance.get("actionable_recommendations", [])[:4]:
            recommendations.append({
                "type": "cert_or_gap",
                "message": action_line,
            })

        if ai_generation_mode != "ai":
            recommendations.append({
                "type": "quality",
                "message": "AI roast unavailable in this run; output uses heuristic fallback diagnostics.",
            })

        # Final guardrails: never ship blank critical roast sections.
        roast_report["hard_truths"] = _unique_non_empty(
            (roast_report.get("hard_truths", []) or []) + [
                "If ownership and measurable impact are unclear, callbacks drop sharply."
            ],
            6,
        )
        roast_report["priority_fixes"] = _unique_non_empty(
            (roast_report.get("priority_fixes", []) or []) + [
                "Rewrite top bullets with action + scope + metric + outcome.",
                "Keep only role-relevant lines and remove generic filler language.",
            ],
            8,
        )
        role_verdict = roast_report.get("role_fit_verdict", {})
        if not isinstance(role_verdict, dict):
            role_verdict = {}
        fallback_role = (target_role or "Software Engineer").replace("-", " ").replace("_", " ").title()
        role_verdict["best_fit_roles"] = _unique_non_empty(role_verdict.get("best_fit_roles", []) or [fallback_role], 3)
        role_verdict["weak_fit_roles"] = _unique_non_empty(
            role_verdict.get("weak_fit_roles", []) or ["Senior/Staff roles requiring deep specialization"],
            3,
        )
        role_verdict["verdict"] = str(
            role_verdict.get("verdict")
            or "This resume can compete for entry-to-mid opportunities, but impact evidence still needs tightening."
        ).strip()
        roast_report["role_fit_verdict"] = role_verdict

        overall_score = round(((friendliness_score or 0) * 0.6) + ((match_score or friendliness_score or 0) * 0.4), 1)

        # 8. Prepare response
        response = {
            "filename": file.filename,
            "file_size_bytes": len(content),
            "word_count": features.get("word_count", 0),
            "friendliness_score": friendliness_score,
            "match_score": match_score,
            "analysis_summary": {
                "mode": analysis_mode,
                "tone": feedback_tone,
                "generation_mode": ai_generation_mode,
                "overall_score": overall_score,
                "ats_score": friendliness_score,
                "jd_fit_score": match_score,
                "ats_score_raw": score_calibration.get("raw_score"),
            },
            "vendor_compatibility": vendor_compatibility,
            "critical_issues": critical_issues,
            "ats_extracted": ats_extracted,
            "timeline": features.get("timeline", {}),
            "recommendations": recommendations,
            "visibility_breakdown": visibility_result.get("breakdown", {}) if visibility_result else None,
            "missing_keywords": missing_keywords,
            "roast_report": roast_report,
            "external_profile_intel": {
                **github_intel,
                **linkedin_intel,
                "detected_github_url": detected_profiles.get("github_url"),
                "detected_linkedin_url": resolved_linkedin_url,
                "detected_github_username": detected_profiles.get("github_username"),
                "extracted_profile_urls": extracted_profile_urls,
            },
            "comprehensive_analysis": comprehensive_guidance,
            "top_actions": roast_report.get("priority_fixes", [])[:6],
            "score_calibration": score_calibration,
        }
        
        # 9. Store in Supabase (async, don't block response)
        try:
            await store_analysis({
                "filename": file.filename,
                "file_size_bytes": len(content),
                "friendliness_score": friendliness_score,
                "match_score": match_score,
                "result_json": response,
                "resume_text": resume_text
            })
        except Exception as e:
            # Log but don't fail the request
            print(f"Failed to store analysis in Supabase: {e}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# Keep original endpoint for backward compatibility
@router.post("/analyze/ingest")
async def ingest_resume(
    file: UploadFile = File(...),
    jd_text: str = Form(None)
):
    """
    Original ingestion endpoint (kept for backward compatibility).
    """
    content = await file.read()
    filename = file.filename.lower()
    
    parsing_result = {}
    
    if filename.endswith(".pdf"):
        parsing_result = pdf_parser.parse(content)
    elif filename.endswith(".docx"):
        parsing_result = docx_parser.parse(content)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF or DOCX.")
    
    if "error" in parsing_result:
        raise HTTPException(status_code=500, detail=parsing_result["error"])
        
    feature_extractor = get_feature_extractor()
    features = feature_extractor.extract_features(parsing_result)
    friendliness_result = friendliness_classifier.predict(features)
    
    visibility_result = None
    if jd_text:
        resume_text = parsing_result.get("raw_text", "")
        visibility_ranker = get_visibility_ranker()
        visibility_result = visibility_ranker.rank(resume_text, jd_text)
    
    return {
        "filename": file.filename,
        "parsing_result": parsing_result,
        "features": features,
        "ats_friendliness": friendliness_result,
        "visibility_rank": visibility_result
    }


@router.post("/analyze/interview/score")
async def score_interview_answer(payload: InterviewAnswerScoreRequest):
    question = (payload.question or "").strip()
    answer = (payload.answer or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")
    if len(answer) < 12:
        raise HTTPException(status_code=400, detail="Please provide a fuller answer for scoring.")

    ai_result = score_answer_with_ai(
        question=question,
        answer=answer,
        company_name=payload.company_name,
        target_role=payload.target_role,
        job_description=payload.job_description,
    )
    if ai_result:
        return ai_result

    return score_answer_heuristic(question=question, answer=answer)
