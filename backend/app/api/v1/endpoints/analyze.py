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
from difflib import SequenceMatcher

from app.services.ingestion.pdf_parser import PDFParser
from app.services.ingestion.docx_parser import DOCXParser
from app.services.features.extractor import FeatureExtractor
from app.services.ml.friendliness_classifier import FriendlinessClassifier
from app.services.ml.visibility_ranker import VisibilityRanker
from app.services.analysis.comprehensive_analyzer import ComprehensiveAnalyzer
from app.core.supabase_client import store_analysis, get_templates
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
    Extract data as ATS would see it - legacy wrapper for enhanced extraction.
    """
    return extract_ats_data_enhanced(features, parsing_result)


def extract_ats_data_enhanced(features: dict, parsing_result: dict) -> dict:
    """Context-aware extraction with confidence scoring."""
    raw_text = parsing_result.get("raw_text", "")
    
    # Use section-aware extraction instead of global regex
    sections = _extract_sections_with_positions(raw_text)
    
    ats_data = {
        "skills": _extract_skills_contextual(sections.get("skills", ""), sections.get("experience", "")),
        "job_titles": _extract_job_titles_with_dates(sections.get("experience", "")),
        "education": _extract_education_structured(sections.get("education", "")),
        "contact": _extract_contact_structured(sections.get("header", raw_text[:1000])),
        "projects": _extract_projects_with_tech(sections.get("projects", "")),
        "raw_text": raw_text,
        "extraction_confidence": {}
    }
    
    # Add confidence scores
    ats_data["extraction_confidence"] = {
        "skills": len(ats_data["skills"]) / 10 if ats_data["skills"] else 0,
        "job_titles": 1.0 if ats_data["job_titles"] else 0.0,
        "education": 1.0 if ats_data["education"] else 0.0
    }
    
    return ats_data


def _extract_sections_with_positions(text: str) -> dict:
    """Extract resume sections with boundary detection."""
    sections = {}
    # Enhanced pattern to better handle overlapping or missing sections
    section_patterns = {
        "header": r"^.*?(?=(?:SUMMARY|EXPERIENCE|EDUCATION|SKILLS|PROJECTS|OBJECTIVE|PROFESSIONAL EXPERIENCE))",
        "summary": r"(?i)(?:summary|objective|profile).*?(?=(?:EXPERIENCE|PROFESSIONAL EXPERIENCE|EDUCATION|SKILLS|PROJECTS|$))",
        "experience": r"(?i)(?:experience|professional experience|work history).*?(?=(?:EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|AWARDS|$))",
        "education": r"(?i)education.*?(?=(?:EXPERIENCE|PROFESSIONAL EXPERIENCE|SKILLS|PROJECTS|CERTIFICATIONS|ACTIVITIES|$))",
        "skills": r"(?i)(?:skills|technical skills|technologies).*?(?=(?:EXPERIENCE|PROFESSIONAL EXPERIENCE|EDUCATION|PROJECTS|AWARDS|$))",
        "projects": r"(?i)projects.*?(?=(?:EXPERIENCE|PROFESSIONAL EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS|$))"
    }
    
    for section, pattern in section_patterns.items():
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            sections[section] = match.group(0)
    
    # Fallback to header if no header found
    if "header" not in sections:
        sections["header"] = text[:1000]
        
    return sections


def _extract_skills_contextual(skills_section: str, experience_section: str) -> list:
    """Extract skills with context about where they appear."""
    # List of common tech keywords to look for
    tech_keywords = [
        "Python", "JavaScript", "React", "Node.js", "AWS", "Docker", "Kubernetes", 
        "SQL", "PostgreSQL", "MongoDB", "TensorFlow", "PyTorch", "LangChain",
        "TypeScript", "Java", "C\\+\\+", "Go", "Rust", "Azure", "GCP", "Terraform",
        "Jenkins", "Git", "Redux", "GraphQL", "REST", "FastAPI", "Flask", "Django"
    ]
    
    pattern = r"\b(" + "|".join(tech_keywords) + r")\b"
    
    explicit_skills = set()
    if skills_section:
        matches = re.findall(pattern, skills_section, re.I)
        explicit_skills.update(matches)
    
    # Infer from experience bullets (more reliable)
    experience_skills = set()
    skill_patterns = {
        r"built.*?with\s+(\w+)": "built_with",
        r"using\s+(\w+)": "using",
        r"implemented\s+(\w+)": "implemented",
        r"deployed\s+(?:to|on)\s+(\w+)": "deployed_on"
    }
    
    if experience_section:
        for p, context in skill_patterns.items():
            matches = re.findall(p, experience_section, re.I)
            for m in matches:
                experience_skills.add(f"{m} ({context})")
    
    combined = list(explicit_skills.union(experience_skills))
    return combined[:20]


def _extract_job_titles_with_dates(experience_section: str) -> list:
    """Extract job titles and associated dates from experience section."""
    if not experience_section:
        return []
    
    # Simple heuristic-based extraction for job titles
    # Usually job titles are near dates or at the start of blocks
    lines = [l.strip() for l in experience_section.splitlines() if l.strip()]
    titles = []
    
    date_pattern = r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December|[0-9]{1,2}/[0-9]{2,4}|[0-9]{4})\b"
    
    for i, line in enumerate(lines[:30]):  # Limit scan
        if re.search(date_pattern, line):
            # Often the title is on the same line or the line before/after
            if i > 0 and len(lines[i-1]) < 60:
                titles.append(lines[i-1])
            elif len(line) < 100:
                parts = re.split(r"[:|\-\u2013\u2014]", line)
                if parts:
                    titles.append(parts[0].strip())
    
    # Clean up titles (remove duplicates, very short things)
    unique_titles = []
    seen = set()
    for t in titles:
        t_clean = re.sub(r"[^\w\s].*", "", t).strip()
        if t_clean and len(t_clean) > 3 and t_clean.lower() not in seen:
            unique_titles.append(t_clean)
            seen.add(t_clean.lower())
            
    return unique_titles[:5]


def _extract_education_structured(education_section: str) -> list:
    """Extract degrees and institutions from education section."""
    if not education_section:
        return []
    
    degrees = []
    degree_patterns = [
        r"(?i)Bachelor(?:'s)?\s*(?:of\s*)?[\w\s]+",
        r"(?i)Master(?:'s)?\s*(?:of\s*)?[\w\s]+",
        r"(?i)PhD|Doctorate",
        r"(?i)B\.S\.|M\.S\.|B\.A\.|M\.A\.|B\.E\.|M\.E\."
    ]
    
    for pattern in degree_patterns:
        matches = re.findall(pattern, education_section)
        degrees.extend(matches)
        
    return list(set(degrees))[:3]


def _extract_contact_structured(header_text: str) -> list:
    """Extract emails, phones, and locations from header."""
    if not header_text:
        return []
    
    emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', header_text)
    phones = re.findall(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', header_text)
    
    # Simple location extraction (City, ST or City, Country)
    location_pattern = r"\b[A-Z][a-z]+(?: [A-Z][a-z]+)*, [A-Z]{2}\b|\b[A-Z][a-z]+(?: [A-Z][a-z]+)*, [A-Z][a-z]+\b"
    locations = re.findall(location_pattern, header_text)
    
    contact = []
    if emails: contact.append(emails[0])
    if phones: contact.append(phones[0])
    if locations: contact.append(locations[0])
    
    return contact


def _extract_projects_with_tech(projects_section: str) -> list:
    """Extract project names and tech stack from projects section."""
    if not projects_section:
        return []
    
    # Projects are often bulleted or have bold titles
    lines = [l.strip() for l in projects_section.splitlines() if l.strip()]
    projects = []
    
    for line in lines[:20]:
        if len(line) < 100 and (line.startswith(("•", "-", "*")) or line[0].isupper()):
            # Look for tech in parentheses or after a dash
            tech_match = re.search(r"\(.*?\)|[:|\-\u2013\u2014]\s*(.*)", line)
            title = re.sub(r"\(.*?\)|[:|\-\u2013\u2014].*", "", line).strip("•-* ")
            if len(title) > 3:
                projects.append(title)
                
    return projects[:5]


def analyze_semantic_gaps(resume_text: str, job_description: str) -> dict:
    """Identify conceptual gaps, not just missing keywords."""
    if not job_description:
        return {"semantic_gaps": [], "concept_coverage": 0}
        
    # Extract concepts from JD
    jd_concepts = _extract_concepts(job_description)
    resume_concepts = _extract_concepts(resume_text)
    
    gaps = []
    for concept, importance in jd_concepts.items():
        if concept not in resume_concepts:
            # Find related terms in resume
            related = _find_semantic_related(concept, resume_concepts)
            if not related:
                gaps.append({
                    "concept": concept,
                    "importance": importance,
                    "type": "missing",
                    "suggestion": f"Add experience demonstrating {concept.replace('_', ' ')}"
                })
            else:
                gaps.append({
                    "concept": concept,
                    "found_as": related,
                    "type": "partial",
                    "suggestion": f"Explicitly mention '{concept.replace('_', ' ')}' to match JD terminology"
                })
    
    coverage = 1.0
    if jd_concepts:
        partials = len([g for g in gaps if g["type"] == "partial"])
        missings = len([g for g in gaps if g["type"] == "missing"])
        coverage = (len(jd_concepts) - missings - (0.5 * partials)) / len(jd_concepts)
    
    return {
        "semantic_gaps": gaps,
        "concept_coverage": max(0, coverage)
    }


def _extract_concepts(text: str) -> dict:
    """Extract key concepts with importance weighting."""
    concepts = {}
    
    # Technical concepts with patterns
    concept_patterns = {
        "system_design": r"(?i)(?:system design|architecture|scalable|microservices|distributed)",
        "data_engineering": r"(?i)(?:data pipeline|ETL|data warehouse|Spark|Hadoop)",
        "ml_ops": r"(?i)(?:model deployment|MLflow|Kubeflow|model monitoring)",
        "frontend_performance": r"(?i)(?:bundle optimization|lazy loading|Core Web Vitals|rendering)",
        "security": r"(?i)(?:authentication|authorization|OAuth|JWT|penetration testing)",
        "cloud_infrastructure": r"(?i)(?:AWS|Azure|GCP|CloudFormation|Terraform|Kubernetes|Docker)",
        "testing": r"(?i)(?:unit testing|integration testing|TDD|BDD|Jest|Pytest|Cypress)",
        "database_management": r"(?i)(?:SQL|PostgreSQL|NoSQL|MongoDB|Redis|Database Design|Indexing)"
    }
    
    for concept, pattern in concept_patterns.items():
        matches = re.findall(pattern, text)
        if matches:
            concepts[concept] = len(matches)  # Importance = frequency
    
    return concepts


def _find_semantic_related(concept: str, resume_concepts: dict) -> Optional[str]:
    """Find if a related concept exists in the resume."""
    # Mapping of related concepts
    related_map = {
        "system_design": ["cloud_infrastructure", "database_management"],
        "data_engineering": ["database_management", "cloud_infrastructure"],
        "ml_ops": ["cloud_infrastructure", "data_engineering"],
        "frontend_performance": ["system_design"],
        "security": ["system_design", "cloud_infrastructure"],
        "cloud_infrastructure": ["system_design"],
        "testing": ["frontend_performance", "system_design"],
        "database_management": ["system_design"]
    }
    
    candidates = related_map.get(concept, [])
    for cand in candidates:
        if cand in resume_concepts:
            return cand.replace("_", " ")
    return None


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


def _unique_non_empty_fuzzy(items: list[Any], limit: int, threshold: float = 0.9) -> list[str]:
    cleaned: list[str] = []
    seen: list[str] = []
    for item in items:
        text = str(item or "").strip()
        if not text:
            continue
        key = re.sub(r"\s+", " ", text).strip().lower()
        if any(SequenceMatcher(None, key, prev).ratio() >= threshold for prev in seen):
            continue
        seen.append(key)
        cleaned.append(text)
        if len(cleaned) >= limit:
            break
    return cleaned


def _extract_candidate_name(resume_text: str, filename: Optional[str] = None) -> str:
    lines = [line.strip() for line in (resume_text or "").splitlines() if line.strip()]
    blocked_tokens = {"summary", "education", "experience", "skills", "projects", "certifications", "participation", "volunteer"}

    for line in lines[:16]:
        lower = line.lower()
        if "@" in line or "linkedin" in lower or "github" in lower:
            continue
        if re.search(r"\d{3,}", line):
            continue
        if len(line) < 3 or len(line) > 48:
            continue
        if any(token == lower for token in blocked_tokens):
            continue
        if re.fullmatch(r"[A-Za-z][A-Za-z .'\-]{2,}", line):
            parts = [p for p in re.split(r"\s+", line) if p]
            if 2 <= len(parts) <= 5:
                if line.isupper():
                    return " ".join(p.capitalize() for p in parts)
                return line

    if filename:
        base = re.sub(r"\.[A-Za-z0-9]+$", "", filename)
        base = base.replace("_", " ").replace("-", " ").strip()
        if base and re.fullmatch(r"[A-Za-z][A-Za-z .'\-]{2,}", base):
            return base.title()
    return "Candidate"


_SECTION_STOP_PATTERN = re.compile(
    r"^(CERTIFICATIONS?|PARTICIPATION|VOLUNTEER( EXPERIENCE)?|EXPERIENCE|EDUCATION|TECHNICAL SKILLS?|SKILLS?|AWARDS?|ACHIEVEMENTS?|PUBLICATIONS?|LANGUAGES?)$",
    re.IGNORECASE,
)
_BULLET_PREFIX = re.compile(r"^\s*[•●\-\*]\s+")
_HEADING_PATTERNS = [
    re.compile(r"^[A-Z][^a-z\n]{2,50}$"),                        # ALL CAPS or short Title Case
    re.compile(r"^\d+\.\s+.{5,60}$"),                             # Numbered: "1. ProjectName"
    re.compile(r"^(?:Project|PROJECT)[:\s\u2013-]+.+$", re.I),   # "Project: Name"
    re.compile(r"^.{5,60}\s*[|(]\s*[A-Z].{3,40}[)]"),            # "Name (React, Node)"
]


def _extract_project_blocks(resume_text: str, limit: int = 6) -> list[dict]:
    """Extract project blocks as {title, content} dicts for structured AI input."""
    lines = [line.strip() for line in (resume_text or "").splitlines() if line.strip()]
    if not lines:
        return []

    # Find the PROJECTS section if present, otherwise scan whole resume
    start_idx = 0
    end_idx = len(lines)
    for idx, line in enumerate(lines):
        if re.fullmatch(r"PROJECTS?", line.strip(), re.IGNORECASE):
            start_idx = idx + 1
            break

    # Find end of projects section
    for idx in range(start_idx, len(lines)):
        if _SECTION_STOP_PATTERN.match(lines[idx]) and idx > start_idx:
            end_idx = idx
            break

    section_lines = lines[start_idx:end_idx]
    blocks: list[dict] = []
    current_title: Optional[str] = None
    current_body: list[str] = []

    for line in section_lines:
        if _SECTION_STOP_PATTERN.match(line):
            break
        if _BULLET_PREFIX.match(line):
            if current_title:
                current_body.append(line)
            continue

        # Detect heading: short, not ending in comma, contains letters, not a bullet body
        is_heading = (
            4 <= len(line) <= 80
            and re.search(r"[A-Za-z]", line)
            and not line.endswith(",")
            and not line.endswith(".")
            and (
                any(p.match(line) for p in _HEADING_PATTERNS)
                or (len(line.split()) <= 8 and line[0].isupper() and ":" not in line)
            )
        )

        if is_heading:
            if current_title:
                blocks.append({
                    "title": current_title,
                    "content": " ".join(current_body)[:600],
                })
                if len(blocks) >= limit:
                    break
            # Clean em-dash / hyphen suffixes from title
            candidate = line
            for sep in (" — ", " – ", " | "):
                if sep in candidate:
                    candidate = candidate.split(sep)[0].strip()
                    break
            current_title = candidate
            current_body = []
        elif current_title:
            current_body.append(line)

    if current_title and len(blocks) < limit:
        blocks.append({
            "title": current_title,
            "content": " ".join(current_body)[:600],
        })

    return blocks[:limit]


def _infer_domains_for_text(text: str) -> list[str]:
    lowered = (text or "").lower()
    domain_rules: list[tuple[str, list[str]]] = [
        ("CivicTech", ["civic", "community", "crime", "missing persons", "geolocation", "reporting"]),
        ("Public Safety", ["crime", "fraud", "missing persons", "safety", "emergency"]),
        ("EdTech", ["study", "learning", "quiz", "tutor", "academic", "education", "adaptive"]),
        ("AI/LLM", ["llm", "rag", "langchain", "nlp", "ai-powered", "machine learning", "openai", "gemini", "gpt"]),
        ("FinTech", ["stock", "market", "esg", "financial", "trading", "portfolio", "investment"]),
        ("Assistive Tech", ["visually impaired", "accessibility", "audio feedback", "assist", "screen reader"]),
        ("E-commerce Ops", ["vendor panel", "product management", "vendor workflows", "uploads", "ecommerce", "cart"]),
        ("Cloud/DevOps", ["docker", "kubernetes", "ci/cd", "deployment", "cloud", "aws", "gcp", "azure", "terraform"]),
        ("Web/Frontend", ["react", "vue", "angular", "next.js", "typescript", "tailwind", "frontend", "ui"]),
        ("Backend/API", ["rest", "graphql", "express", "fastapi", "django", "flask", "node.js", "api"]),
        ("ML/Data", ["pandas", "sklearn", "tensorflow", "pytorch", "data pipeline", "etl", "spark"]),
        ("Mobile", ["flutter", "react native", "swift", "kotlin", "android", "ios", "mobile"]),
        ("Security", ["auth", "oauth", "jwt", "encryption", "penetration", "vulnerability", "firewall"]),
        ("Healthcare", ["health", "medical", "ehr", "fhir", "patient", "clinical"]),
        ("SaaS", ["saas", "subscription", "multi-tenant", "dashboard", "analytics"]),
    ]
    matched: list[str] = []
    for domain, patterns in domain_rules:
        if any(pattern in lowered for pattern in patterns):
            matched.append(domain)
    return matched


def _build_project_domain_coverage(resume_text: str) -> list[dict]:
    """Build structured project blocks for AI prompt input."""
    blocks = _extract_project_blocks(resume_text, limit=6)
    coverage: list[dict] = []
    for block in blocks:
        title = block["title"]
        content = block["content"]
        domains = _infer_domains_for_text(f"{title} {content}")
        if not domains:
            domains = ["General Software"]
        coverage.append({
            "project": title,
            "title": title,           # alias used by AI prompt
            "content": content,       # full body for AI context
            "domains": domains[:3],
            "evidence": (content[:220] + "...") if len(content) > 220 else content,
            "positioning_tip": f"Position {title} as {domains[0]} with one impact metric in resume bullets.",
        })
    return coverage[:6]


def _extract_summary_line(resume_text: str) -> Optional[str]:
    lines = [line.strip() for line in (resume_text or "").splitlines() if line.strip()]
    start = None
    for idx, line in enumerate(lines):
        if line.upper() == "SUMMARY":
            start = idx + 1
            break
    if start is None:
        return None
    for line in lines[start:start + 8]:
        if len(line) >= 20 and not re.fullmatch(r"[A-Z][A-Z0-9\s&/\-]{2,}", line):
            return line
    return None


def _extract_experience_bullet_line(resume_text: str) -> Optional[str]:
    lines = [line.strip() for line in (resume_text or "").splitlines() if line.strip()]
    in_experience = False
    for line in lines:
        upper = line.upper()
        if upper == "EXPERIENCE":
            in_experience = True
            continue
        if in_experience and upper in {"PROJECTS", "CERTIFICATIONS", "PARTICIPATION", "VOLUNTEER EXPERIENCE", "EDUCATION"}:
            break
        if in_experience and re.match(r"^[•●\-\*]\s+", line):
            cleaned = re.sub(r"^[•●\-\*]\s*", "", line).strip()
            if len(cleaned) >= 20:
                return cleaned
    return None


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


def validate_ai_output(ai_output: dict, resume_text: str) -> dict:
    """
    Soft-validate AI output for grounding — never blocks a valid response.
    Only logs warnings; callers must NOT discard the result based on this.
    """
    if not isinstance(ai_output, dict):
        return {"valid": False, "error": "Not a dict", "grounded_score": 0}

    warnings: list[str] = []

    # Warn (don't reject) if roast_report is missing key sections
    roast = ai_output.get("roast_report", {}) if isinstance(ai_output.get("roast_report"), dict) else {}
    for section in ("strengths", "weaknesses", "hard_truths"):
        if not roast.get(section):
            warnings.append(f"roast_report.{section} is empty or missing")

    if warnings:
        logger.debug("AI output soft-validation warnings: %s", warnings)

    return {
        "valid": True,   # always let the result through — warnings are informational only
        "warnings": warnings,
        "grounded_score": max(60, 100 - len(warnings) * 5),
    }


def compare_against_benchmarks(
    ats_extracted: dict,
    target_role: Optional[str]
) -> dict:
    """Compare resume against anonymized successful resumes for same role."""
    
    # Load benchmark data (mock for now)
    benchmarks = _load_role_benchmarks(target_role or "General")
    
    experience_bullets = []
    # Extract bullets from raw text if not structured
    raw_text = ats_extracted.get("raw_text", "")
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    experience_bullets = [l for l in lines if l.startswith(("•", "-", "*"))]
    
    candidate_metrics = len([b for b in experience_bullets if re.search(r"\d", b)])
    
    comparison = {
        "metric_density": {
            "candidate": candidate_metrics,
            "benchmark_avg": benchmarks.get("avg_metrics_per_job", 2.5),
            "percentile": 0
        },
        "skill_breadth": {
            "candidate": len(ats_extracted.get("skills", [])),
            "benchmark_avg": benchmarks.get("avg_skills_count", 12),
            "missing_common": list(set(benchmarks.get("common_skills", [])) - set([s.split('(')[0].strip() for s in ats_extracted.get("skills", [])]))
        },
        "project_evidence": {
            "candidate": len(ats_extracted.get("projects", [])),
            "benchmark_avg": benchmarks.get("avg_projects", 3),
            "quality_gap": []
        }
    }
    
    # Calculate percentiles (mock logic)
    if comparison["metric_density"]["candidate"] < comparison["metric_density"]["benchmark_avg"]:
        comparison["metric_density"]["percentile"] = 25
    else:
        comparison["metric_density"]["percentile"] = 75
    
    return comparison


def _load_role_benchmarks(target_role: str) -> dict:
    """Mock database of successful resume metrics."""
    role_benchmarks = {
        "Software Engineer": {
            "avg_metrics_per_job": 3.2,
            "avg_skills_count": 14,
            "common_skills": ["Git", "Docker", "CI/CD", "Unit Testing", "System Design"],
            "avg_projects": 4
        },
        "Data Scientist": {
            "avg_metrics_per_job": 2.8,
            "avg_skills_count": 12,
            "common_skills": ["Python", "SQL", "Machine Learning", "Statistics", "Pandas"],
            "avg_projects": 3
        }
    }
    return role_benchmarks.get(target_role, {
        "avg_metrics_per_job": 2.0,
        "avg_skills_count": 10,
        "common_skills": ["Communication", "Project Management", "Problem Solving"],
        "avg_projects": 2
    })


async def generate_ai_analysis_with_fallback(
    resume_text: str,
    job_description: Optional[str],
    company_name: Optional[str],
    target_role: Optional[str],
    candidate_name: Optional[str],
    project_domain_coverage: list[dict],
    feedback_tone: str,
    friendliness_score: float,
    match_score: Optional[float],
    missing_keywords: list[str],
    risk_flags: list[str],
) -> Optional[dict]:
    """Generate AI analysis with proper timeout and fallback."""
    
    try:
        # Use a semaphore to prevent overwhelming the API (globally or per request)
        # For simplicity, we just use wait_for here.
        outer_timeout = float(os.getenv("ANALYZE_AI_TIMEOUT_SECONDS", "55"))
        result = await asyncio.wait_for(
            run_in_threadpool(
                build_ai_roast_only,
                resume_text,
                job_description,
                company_name,
                target_role,
                candidate_name,
                project_domain_coverage,
                feedback_tone,
                friendliness_score,
                match_score,
                missing_keywords,
                risk_flags
            ),
            timeout=outer_timeout,
        )
        
        # Validate the result
        validation = validate_ai_output(result, resume_text)
        if not validation["valid"]:
            logger.warning(f"AI output validation failed: {validation['errors']}")
            
        return result
            
    except asyncio.TimeoutError:
        logger.error(
            "AI analysis timed out after %.0fs — increase ANALYZE_AI_TIMEOUT_SECONDS or check OpenAI latency.",
            outer_timeout,
        )
        return None
    except Exception as e:
        logger.error("AI analysis failed: %s — type: %s", e, type(e).__name__, exc_info=True)
        return None


def build_ai_roast_only(
    resume_text: str,
    job_description: Optional[str],
    company_name: Optional[str],
    target_role: Optional[str],
    candidate_name: Optional[str],
    project_domain_coverage: list[dict],
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

    has_jd = bool((job_description or "").strip())
    company = (company_name or "the company").strip()

    prompt_payload = {
        "candidate_name": candidate_name or "Candidate",
        "target_role": target_role or "Not specified",
        "company_name": company,
        "feedback_tone": feedback_tone,
        "has_job_description": has_jd,
        "ats_friendliness_score": round(friendliness_score, 1),
        "jd_match_score": round(match_score, 1) if match_score is not None else None,
        # Risk flags from static ATS analysis — reference these in your critiques
        "ats_risk_flags": risk_flags[:12],
        # Keywords in JD not found in resume — only present when JD is provided
        "missing_jd_keywords": missing_keywords[:15] if has_jd else [],
        # Full resume text — read this carefully before filling any JSON field
        "resume_text": (resume_text or "")[:3500],
        # Job description — cross-reference every resume section against this
        "job_description": (job_description or "")[:2000],
        # Pre-parsed project blocks: {title, content, domains} — use exact titles
        "project_blocks": [
            {"title": p.get("title") or p.get("project", ""), "content": p.get("content") or p.get("evidence", "")}
            for p in project_domain_coverage[:6]
            if (p.get("title") or p.get("project", "")).strip()
        ],
    }

    tone_clause = (
        "Do not soften findings. If a resume section is weak, say it plainly and explain exactly why it will cost the candidate interviews."
        if feedback_tone == "brutal"
        else "Be direct and practical. Name problems clearly without being harsh."
    )
    jd_clause = (
        f"A job description IS provided. Cross-reference every section against it. Flag missing keywords, misaligned framing, and unaddressed requirements."
        if has_jd
        else "No job description provided. Base all analysis on what is and is not present in the resume itself. Do NOT fabricate JD requirements."
    )

    prompt = f"""You are a principal-level technical recruiter and career strategist. You have screened 10,000+ resumes at FAANG, top startups, and mid-market tech companies. You give reference-grade, zero-fluff analysis that hiring managers actually use.

{tone_clause}
{jd_clause}

═══════════════════════════════
STEP 1 — READ AND EXTRACT (do this first, silently build your ground truth)
═══════════════════════════════
Before writing a single word of feedback, read the full resume and extract:

A. IDENTITY
   - Candidate name (exact)
   - Current / most recent title (exact)
   - Companies mentioned (exact names + visible durations)
   - Estimated total years of experience

B. EVIDENCE INVENTORY
   - Every metric already in the resume (copy the exact phrase: "reduced load time by 40%", etc.)
   - Every technology mentioned (exact names, no paraphrasing)
   - Every project title (exact, as written)
   - Ownership language: verbs like "built", "led", "owned" vs. passive: "helped", "contributed", "worked on"
   - Bullet count per role

C. GAPS INVENTORY
   - Bullets with NO metric (list the first 5 words of each)
   - Sections that read like job descriptions instead of achievements
   - Technologies implied but never named
   - Missing proof signals: no GitHub, no LinkedIn, no live link
   - Generic or filler phrases (exact quotes)

D. JD CROSS-REFERENCE (only if job_description is provided)
   - Required skills in JD not mentioned in resume
   - JD keywords present in resume (exact matches)
   - Role-level mismatch signals

This extraction is your ground truth. Every critique you write MUST trace back to a specific piece of evidence from this extraction. If you cannot cite an exact line or pattern, do not write the critique.

═══════════════════════════════
STEP 2 — PRODUCE THE ANALYSIS
═══════════════════════════════
Now fill the JSON below. Rules that apply to every field:

ABSOLUTE RULES (violating any of these fails the output):
1. Zero placeholder text: no [X], [metric], [company], [outcome], [role], or any bracketed token
2. Zero filler phrases: never write "passionate about", "strong communicator", "team player", "results-driven", "detail-oriented", "dynamic", or "fast learner"
3. Every "specific_evidence" or "exact_line_reference" must be a direct quote or near-quote from the resume — not a paraphrase
4. Every rewrite in "rewritten_line" must: (a) start with a strong past-tense action verb, (b) name the actual project or company, (c) include a number — real or labeled "(est.)", (d) stay under 22 words
5. Priority values must be exactly "P0", "P1", or "P2" — never "high", "medium", "low"
6. If a metric is genuinely missing, label your inferred estimate as "(est.)" — never present it as fact
7. Project names in project_domain_coverage must be copied EXACTLY from the resume — never use sentence fragments or tech names as project names
8. hard_truths must be genuinely hard — things the candidate probably does not want to hear but needs to. Do not soften them.
9. action_blueprint steps must be concrete executable steps, not advice. Bad: "improve your bullet points". Good: "Open your CivicWatch bullet, find the verb 'worked on', replace with 'Deployed', add Docker container count."
10. rewrite_guide must cover at minimum 1 item from each: Summary, Experience, Projects (if present)

SECTION COUNTS:
- what_is_good: 3–5 items
- what_is_bad: 4–6 items
- hard_truths: 3–5 items (make these land)
- priority_fixes: 4–6 items
- action_blueprint: 3–5 items
- rewrite_guide: 4–6 items
- cut_these_lines: 3–5 items
- project_domain_coverage: one entry per project found (max 6)
- role_fit.strong_fit / weak_fit: 1–3 each
- certification_suggestions: 0–3 (return [] if unsure)

Return ONLY valid JSON — no markdown, no commentary outside the JSON, no trailing commas.

{{
  "candidate": {{
    "name": "",
    "target_role": "",
    "experience_level": "Entry | Mid | Senior | Staff | Unknown",
    "estimated_yoe": 0,
    "ats_score": 0
  }},

  "extraction_summary": {{
    "roles": [],
    "companies": [],
    "tech_stack": [],
    "project_names": [],
    "existing_metrics": [],
    "ownership_verbs_found": [],
    "passive_verbs_found": [],
    "bullets_without_metrics": [],
    "linkedin_detected": false,
    "github_detected": false,
    "linkedin_url": "",
    "github_url": "",
    "certifications": []
  }},

  "executive_snapshot": {{
    "overall_verdict": "",
    "signal_strength": "Weak | Moderate | Strong",
    "roast_score_0_to_100": 0,
    "biggest_blocker": "",
    "fastest_win": "",
    "jd_alignment_note": ""
  }},

  "what_is_good": [
    {{
      "point": "",
      "specific_evidence": "",
      "why_it_matters_to_recruiters": ""
    }}
  ],

  "what_is_bad": [
    {{
      "point": "",
      "specific_evidence": "",
      "exact_line_reference": "",
      "recruiter_reaction": ""
    }}
  ],

  "hard_truths": [
    {{
      "truth": "",
      "why": "",
      "specific_line_that_caused_this": "",
      "what_to_do_instead": ""
    }}
  ],

  "priority_fixes": [
    {{
      "fix": "",
      "priority": "P0",
      "effort": "30 min | 1–2 hrs | Half day | Multi-day",
      "why": "",
      "before": "",
      "after": ""
    }}
  ],

  "role_fit_verdict": {{
    "summary": "",
    "jd_match_pct": 0,
    "works_for": [
      {{"role": "", "reason": "", "confidence_pct": 0}}
    ],
    "struggles_for": [
      {{"role": "", "gap": "", "how_to_close": ""}}
    ]
  }},

  "resume_loopholes": [
    {{
      "loophole": "",
      "risk": "",
      "example_question_it_triggers": ""
    }}
  ],

  "cut_these_lines": [
    {{
      "line": "",
      "reason": "",
      "replace_with": ""
    }}
  ],

  "project_domain_coverage": [
    {{
      "project_name": "",
      "primary_domain": "",
      "domain_tags": [],
      "tech_stack": [],
      "complexity_signal": "Low | Mid | High",
      "complexity_reason": "",
      "what_is_good": "",
      "what_is_missing": "",
      "rewritten_bullet": "",
      "positioning_tip": ""
    }}
  ],

  "external_proof_signals": {{
    "github": {{
      "detected": false,
      "url": "",
      "suggestions": ""
    }},
    "linkedin": {{
      "detected": false,
      "url": "",
      "suggestions": ""
    }}
  }},

  "certification_suggestions": [
    {{
      "name": "",
      "issuer": "",
      "reason": "",
      "signal_boost": "",
      "prerequisite": "",
      "time_to_complete": "",
      "proof_project_to_build_after_cert": "",
      "url": ""
    }}
  ],

  "action_blueprint": [
    {{
      "action": "",
      "priority": "P0",
      "effort": "",
      "why": "",
      "steps": [],
      "before_after_example": ""
    }}
  ],

  "rewrite_guide": [
    {{
      "section": "Summary | Experience | Projects | Skills",
      "current_line": "",
      "rewritten_line": "",
      "why_this_helps": "",
      "pattern_used": "Action + Scope + Tech + Metric"
    }}
  ],

  "role_fit": {{
    "strong_fit": [
      {{"role": "", "confidence": 0, "reasons": []}}
    ],
    "conditional_fit": [
      {{"role": "", "confidence": 0, "reasons": [], "must_fix": []}}
    ],
    "weak_fit": [
      {{"role": "", "confidence": 0, "reasons": []}}
    ]
  }},

  "remove_from_resume": [
    {{"line": "", "reason": "", "better_replacement": ""}}
  ]
}}

INPUT DATA:
{json.dumps(prompt_payload, indent=2)}
"""
    try:
        model_timeout = float(os.getenv("ANALYZE_AI_MODEL_TIMEOUT_SECONDS", "45"))
        analyze_model = (
            os.getenv("OPENAI_ANALYZE_MODEL")
            or os.getenv("OPENAI_MODEL_FAST")
            or ai_client.model_name
        )
        logger.info(
            "AI roast starting — model: %s | timeout: %.0fs | tokens: 2800",
            analyze_model, model_timeout,
        )
        ai_text = ai_client._call_gemini(
            prompt,
            max_retries=1,
            max_tokens=2800,        # sufficient for all 14 sections; lower = faster response
            timeout_seconds=model_timeout,
            model_name=analyze_model,
            temperature_override=0.3,   # grounded but not robotic; 0.0 over-repeats
            use_json_mode=True,         # no markdown wrapping, clean parse
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

    exec_snap = executive_snapshot if isinstance(executive_snapshot, dict) else {}
    signal_strength = str(exec_snap.get("signal_strength", "")).strip()
    jd_note = str(exec_snap.get("jd_alignment_note", "")).strip()
    fastest_win = str(exec_snap.get("fastest_win", "")).strip()
    biggest_blocker = str(exec_snap.get("biggest_blocker", "")).strip()

    candidate_meta = parsed.get("candidate", {}) if isinstance(parsed.get("candidate"), dict) else {}

    roast_report = {
        # ── Flat string lists (backward-compat with existing frontend rendering) ──
        "strengths": _coerce_point_items(
            parsed.get("what_is_good"),
            limit=6,
            fallback=["Your resume has useful raw material, but the positioning needs tightening."],
            primary_keys=["point"],
            secondary_keys=["why_it_matters_to_recruiters", "specific_evidence", "evidence"],
        ),
        "weaknesses": _coerce_point_items(
            parsed.get("what_is_bad"),
            limit=8,
            fallback=["The document still reads more like responsibilities than quantified outcomes."],
            primary_keys=["point"],
            secondary_keys=["recruiter_reaction", "exact_line_reference", "specific_evidence"],
        ),
        "hard_truths": _coerce_point_items(
            parsed.get("hard_truths"),
            limit=6,
            fallback=["If your impact is not measurable, interviewers assume it was small."],
            primary_keys=["truth", "point"],
            secondary_keys=["what_to_do_instead", "why", "specific_line_that_caused_this"],
        ),
        "priority_fixes": _coerce_point_items(
            parsed.get("priority_fixes"),
            limit=8,
            fallback=["Rewrite top bullets using action + scope + metric + business impact."],
            primary_keys=["fix", "action"],
            secondary_keys=["after", "why"],
        ),
        "resume_loopholes": _coerce_point_items(
            parsed.get("resume_loopholes"),
            limit=5,
            fallback=["Could not detect specific loopholes — re-run with your resume for detailed analysis."],
            primary_keys=["loophole", "issue"],
            secondary_keys=["example_question_it_triggers", "risk"],
        ),
        "should_remove": _coerce_point_items(
            parsed.get("cut_these_lines") or parsed.get("remove_from_resume"),
            limit=5,
            fallback=["Review your summary for generic filler phrases like 'passionate' or 'team player'."],
            primary_keys=["line"],
            secondary_keys=["replace_with", "reason"],
        ),
        "role_fit_verdict": {
            "best_fit_roles": strong_roles,
            "weak_fit_roles": weak_roles,
            "verdict": overview,
        },
        # ── Rich structured pass-through (new frontend sections) ──
        "what_is_good_rich": parsed.get("what_is_good") if isinstance(parsed.get("what_is_good"), list) else [],
        "what_is_bad_rich": parsed.get("what_is_bad") if isinstance(parsed.get("what_is_bad"), list) else [],
        "hard_truths_rich": parsed.get("hard_truths") if isinstance(parsed.get("hard_truths"), list) else [],
        "priority_fixes_rich": parsed.get("priority_fixes") if isinstance(parsed.get("priority_fixes"), list) else [],
        "rewrite_guide": parsed.get("rewrite_guide") if isinstance(parsed.get("rewrite_guide"), list) else [],
        "action_blueprint": parsed.get("action_blueprint") if isinstance(parsed.get("action_blueprint"), list) else [],
        "extraction_summary": parsed.get("extraction_summary") if isinstance(parsed.get("extraction_summary"), dict) else {},
        "external_proof_signals": parsed.get("external_proof_signals") if isinstance(parsed.get("external_proof_signals"), dict) else {},
        "project_domain_coverage_detail": parsed.get("project_domain_coverage") if isinstance(parsed.get("project_domain_coverage"), list) else [],
        # ── Executive metadata ──
        "signal_strength": signal_strength or "Unknown",
        "fastest_win": fastest_win,
        "biggest_blocker": biggest_blocker,
        "jd_alignment_note": jd_note,
        "candidate_meta": {
            "name": str(candidate_meta.get("name", "")).strip(),
            "target_role": str(candidate_meta.get("target_role", "")).strip(),
            "experience_level": str(candidate_meta.get("experience_level", "")).strip(),
            "estimated_yoe": candidate_meta.get("estimated_yoe", 0),
            "ats_score": candidate_meta.get("ats_score", 0),
        },
    }

    certification_suggestions = []
    for cert in parsed.get("certification_suggestions", []) if isinstance(parsed.get("certification_suggestions"), list) else []:
        if not isinstance(cert, dict):
            continue
        name = str(cert.get("name", "")).strip()
        provider = str(cert.get("issuer") or cert.get("provider", "")).strip()
        if not name:
            continue
        certification_suggestions.append({
            "name": name,
            "provider": provider,
            "relevance": str(cert.get("reason") or cert.get("gap_it_closes", "Targeted gap closure")).strip() or "Targeted gap closure",
            "impact": str(cert.get("signal_boost") or cert.get("resume_impact", "Signal boost")).strip() or "Signal boost",
            "url": str(cert.get("url", "")).strip(),
            "why_this_person_needs_it": str(cert.get("why_this_person_needs_it", "")).strip(),
            "time_to_complete": str(cert.get("time_to_complete", "")).strip(),
            "proof_project_to_build_after_cert": str(cert.get("proof_project_to_build_after_cert", "")).strip(),
            "prerequisite": str(cert.get("prerequisite", "")).strip(),
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
    candidate_name: Optional[str] = None,
    project_domain_coverage: Optional[list[dict]] = None,
    has_linkedin_signal: Optional[bool] = None,
    has_github_signal: Optional[bool] = None,
) -> dict:
    strengths: list[str] = []
    weaknesses: list[str] = []
    hard_truths: list[str] = []
    priority_fixes: list[str] = []
    name = (candidate_name or "Candidate").strip() or "Candidate"

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
        if re.match(r"(?i)^[•●\-\*]?\s*(objective|description|key contributions|technologies used|outcome)\s*:", line)
    ]
    summary_line = _extract_summary_line(raw_text)
    experience_bullet = _extract_experience_bullet_line(raw_text)
    domain_coverage = project_domain_coverage or _build_project_domain_coverage(raw_text)

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
        hard_truths.append(f"{name}, without metrics, even real work looks generic and low-impact in screening.")
        priority_fixes.append("Rewrite top bullets to include numbers, latency/time improvements, or user/business outcomes.")

    if not summary_ok:
        weaknesses.append("Top summary lines are generic and do not immediately establish role-fit evidence.")
        hard_truths.append(f"{name}, if your first 6 lines are vague, most recruiters stop reading there.")
        if summary_line:
            priority_fixes.append(
                f"Replace summary line \"{summary_line[:120]}\" with role + metric + scope."
            )
        else:
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

    if experience_bullet and re.search(r"(?i)\b(worked on|responsible for|helped)\b", experience_bullet):
        weaknesses.append("At least one key experience bullet is responsibility-heavy instead of impact-focused.")
        priority_fixes.append(
            f"Rewrite this bullet with outcome metric: \"{experience_bullet[:120]}\"."
        )

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

    if domain_coverage:
        domain_summary = []
        for item in domain_coverage[:3]:
            project = str(item.get("project", "")).strip()
            domains = ", ".join(item.get("domains", [])[:2]) if isinstance(item.get("domains"), list) else ""
            if project and domains:
                domain_summary.append(f"{project} -> {domains}")
        if domain_summary:
            strengths.append(f"Project domain coverage detected: {'; '.join(domain_summary)}.")
            priority_fixes.append("Prioritize one primary project domain narrative aligned to your target role.")

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
    hard_truths = _unique_non_empty_fuzzy(hard_truths + [
        "If a recruiter cannot quickly see ownership + metric + outcome, they move to the next resume."
    ], 6, threshold=0.92)
    priority_fixes = _unique_non_empty_fuzzy(priority_fixes + [
        "Rewrite the top 5 bullets in action + scope + metric + outcome format.",
        "Keep only role-relevant lines and remove low-signal filler.",
    ], 8, threshold=0.88)
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
        "strengths": _unique_non_empty_fuzzy(
            (candidate.get("strengths", []) or []) + (base.get("strengths", []) or []),
            6,
            threshold=0.93,
        ),
        "weaknesses": _unique_non_empty_fuzzy(
            (candidate.get("weaknesses", []) or []) + (base.get("weaknesses", []) or []),
            8,
            threshold=0.9,
        ),
        "hard_truths": _unique_non_empty_fuzzy(
            (candidate.get("hard_truths", []) or []) + (base.get("hard_truths", []) or []),
            6,
            threshold=0.9,
        ),
        "priority_fixes": _unique_non_empty_fuzzy(
            (candidate.get("priority_fixes", []) or []) + (base.get("priority_fixes", []) or []),
            8,
            threshold=0.86,
        ),
        "resume_loopholes": _unique_non_empty_fuzzy(
            (candidate.get("resume_loopholes", []) or []) + (base.get("resume_loopholes", []) or []),
            5,
            threshold=0.9,
        ),
        "should_remove": _unique_non_empty_fuzzy(
            (candidate.get("should_remove", []) or []) + (base.get("should_remove", []) or []),
            5,
            threshold=0.9,
        ),
    }

    base_role = base.get("role_fit_verdict", {}) if isinstance(base.get("role_fit_verdict"), dict) else {}
    cand_role = candidate.get("role_fit_verdict", {}) if isinstance(candidate.get("role_fit_verdict"), dict) else {}
    merged["role_fit_verdict"] = {
        "best_fit_roles": _unique_non_empty_fuzzy(
            (cand_role.get("best_fit_roles", []) or []) + (base_role.get("best_fit_roles", []) or []),
            3,
            threshold=0.92,
        ),
        "weak_fit_roles": _unique_non_empty_fuzzy(
            (cand_role.get("weak_fit_roles", []) or []) + (base_role.get("weak_fit_roles", []) or []),
            3,
            threshold=0.9,
        ),
        "verdict": str(cand_role.get("verdict") or base_role.get("verdict") or "").strip(),
    }

    # Pass through AI-only rich fields — these have no heuristic equivalent
    for rich_key in (
        "rewrite_guide", "action_blueprint", "extraction_summary",
        "external_proof_signals", "project_domain_coverage_detail",
        "what_is_good_rich", "what_is_bad_rich", "hard_truths_rich",
        "priority_fixes_rich", "signal_strength", "fastest_win",
        "biggest_blocker", "jd_alignment_note", "candidate_meta",
    ):
        val = candidate.get(rich_key)
        if val is not None:
            merged[rich_key] = val

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
            summary = "LinkedIn profile detected."
        else:
            summary = ""
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
    def _extract_github_username(value: Optional[str]) -> str:
        raw = str(value or "").strip()
        if not raw:
            raise ValueError("GitHub username is required")
        raw = raw.lstrip("@")
        match = re.search(
            r"(?:https?://)?(?:www\.)?github\.com/([A-Za-z0-9-]{1,39})",
            raw,
            re.IGNORECASE,
        )
        if match:
            return match.group(1)
        candidate = raw.split("/")[0].split("?")[0].split("#")[0].strip().strip(".,;:")
        if not re.fullmatch(r"[A-Za-z0-9-]{1,39}", candidate):
            raise ValueError("Invalid GitHub username")
        return candidate

    def _to_repo_shape(repo: dict, username: str, pinned: bool = False) -> dict:
        name = str(repo.get("name") or "").strip()
        if not name:
            return {}
        stars = int(repo.get("stars") or 0)
        forks = int(repo.get("forks") or 0)
        language = str(repo.get("language") or "").strip() or None
        description = str(repo.get("description") or "").strip()
        topics = repo.get("topics") if isinstance(repo.get("topics"), list) else []
        url = str(repo.get("url") or f"https://github.com/{username}/{name}")
        return {
            "name": name,
            "full_name": f"{username}/{name}",
            "description": description,
            "url": url,
            "homepage": None,
            "language": language,
            "languages": {},
            "topics": [str(t).strip().lower() for t in topics if str(t).strip()][:8],
            "stars": stars,
            "forks": forks,
            "watchers": stars,
            "created_at": None,
            "updated_at": repo.get("updated_at"),
            "pushed_at": repo.get("pushed_at"),
            "size": 0,
            "is_fork": bool(repo.get("is_fork", False)),
            "has_readme": bool(description),
            "readme_content": "",
            "open_issues": 0,
            "license": None,
            "is_pinned": pinned,
        }

    def _boosted_repo_score(repo: dict) -> int:
        base = int(float(repo.get("relevance_score", 0) or 0))
        bonus = 0
        if repo.get("is_pinned"):
            bonus += 18
        if int(repo.get("stars", 0) or 0) > 0:
            bonus += min(10, 2 + int(repo.get("stars", 0)))
        if int(repo.get("forks", 0) or 0) > 0:
            bonus += 4
        if repo.get("language"):
            bonus += 5
        description = str(repo.get("description", "") or "").strip()
        if len(description.split()) >= 8:
            bonus += 6
        if repo.get("has_readme"):
            bonus += 4
        return int(min(100, max(0, base + bonus)))

    def _keep_reason(repo: dict) -> str:
        signals = []
        if repo.get("is_pinned"):
            signals.append("Pinned project with portfolio visibility")
        if repo.get("language"):
            signals.append(f"clear tech signal ({repo.get('language')})")
        if int(repo.get("stars", 0) or 0) > 0:
            signals.append(f"{repo.get('stars')} stars")
        if str(repo.get("description", "") or "").strip():
            signals.append("problem statement is visible")
        if not signals:
            return "Good candidate to keep if you add a stronger README and one measurable result."
        return "; ".join(signals) + "."

    def _drop_reason(repo: dict) -> str:
        reasons = []
        if not str(repo.get("description", "") or "").strip():
            reasons.append("description does not explain the problem or outcome")
        if not repo.get("language"):
            reasons.append("tech stack is not obvious")
        if int(repo.get("stars", 0) or 0) == 0 and int(repo.get("forks", 0) or 0) == 0:
            reasons.append("limited external validation")
        if not reasons:
            reasons.append("currently weaker signal for target role")
        return "; ".join(reasons).capitalize() + "."

    if not github_username:
        return {
            "github_best_projects": [],
            "github_drop_projects": [],
            "github_summary": "No GitHub profile detected. Add GitHub URL in resume header for technical roles.",
            "github_profile": {},
        }

    try:
        from concurrent.futures import ThreadPoolExecutor, as_completed
        from app.services.github.firecrawl_github_scraper import (
            scrape_github_profile,
            scrape_github_repositories,
        )

        analyzer = RepositoryAnalyzer()
        username = _extract_github_username(github_username)
        analyze_max_repos = int(os.getenv("ANALYZE_GITHUB_MAX_REPOS", "18"))
        firecrawl_timeout = int(os.getenv("ANALYZE_FIRECRAWL_GITHUB_TIMEOUT_SECONDS", "12"))

        profile_data: dict = {}
        repo_payload: dict = {}

        with ThreadPoolExecutor(max_workers=2) as pool:
            future_profile = pool.submit(scrape_github_profile, username, firecrawl_timeout)
            future_repos = pool.submit(scrape_github_repositories, username, firecrawl_timeout, analyze_max_repos)
            for fut in as_completed([future_profile, future_repos], timeout=max(16, firecrawl_timeout + 6)):
                if fut is future_profile:
                    try:
                        profile_data = fut.result()
                    except Exception as exc:
                        logger.warning("Firecrawl profile scrape failed: %s", exc)
                        profile_data = {"error": str(exc), "pinned_repos": []}
                else:
                    try:
                        repo_payload = fut.result()
                    except Exception as exc:
                        logger.warning("Firecrawl repositories scrape failed: %s", exc)
                        repo_payload = {"error": str(exc), "repositories": []}

        repositories = repo_payload.get("repositories", []) if isinstance(repo_payload, dict) else []
        pinned_raw = profile_data.get("pinned_repos", []) if isinstance(profile_data, dict) else []
        pinned_map = {
            str(item.get("name") or "").strip(): item
            for item in pinned_raw
            if isinstance(item, dict) and str(item.get("name") or "").strip()
        }
        pinned_names = list(pinned_map.keys())

        normalized_repos: list[dict] = []
        seen_repo_names = set()
        for repo in repositories:
            if not isinstance(repo, dict):
                continue
            repo_name = str(repo.get("name") or "").strip()
            if not repo_name:
                continue
            pinned_repo_data = pinned_map.get(repo_name, {})
            if pinned_repo_data:
                if not repo.get("description") and pinned_repo_data.get("description"):
                    repo["description"] = pinned_repo_data.get("description")
                if not repo.get("language") and pinned_repo_data.get("language"):
                    repo["language"] = pinned_repo_data.get("language")
                repo["stars"] = max(int(repo.get("stars") or 0), int(pinned_repo_data.get("stars") or 0))
                repo["forks"] = max(int(repo.get("forks") or 0), int(pinned_repo_data.get("forks") or 0))
            shaped = _to_repo_shape(repo, username, pinned=repo_name in pinned_map)
            if shaped:
                normalized_repos.append(shaped)
                seen_repo_names.add(repo_name)

        # Ensure pinned repos are represented even if repo-tab scrape misses some cards.
        for repo_name, pinned_repo in pinned_map.items():
            if repo_name in seen_repo_names:
                continue
            shaped = _to_repo_shape(pinned_repo, username, pinned=True)
            if shaped:
                normalized_repos.append(shaped)

        analyzed = analyzer.analyze_repositories(
            repositories=normalized_repos,
            job_role=target_role or "software-engineer",
            job_description=job_description or "",
            use_ai=False,
            pinned_repos=pinned_names,
        )

        ranked_candidates: list[dict] = []
        for repo in analyzed:
            repo_copy = dict(repo)
            repo_copy["final_score"] = _boosted_repo_score(repo_copy)
            ranked_candidates.append(repo_copy)

        ranked_candidates.sort(
            key=lambda r: (
                int(r.get("final_score", 0)),
                1 if r.get("is_pinned") else 0,
                int(r.get("stars", 0) or 0),
                1 if r.get("description") else 0,
            ),
            reverse=True,
        )

        best: list[dict] = []
        drop: list[dict] = []
        for idx, repo in enumerate(ranked_candidates[:12], start=1):
            score = int(repo.get("final_score", 0) or 0)
            is_pinned = bool(repo.get("is_pinned", False))
            repo_name = repo.get("name")
            language = repo.get("language", "")
            stars = int(repo.get("stars", 0) or 0)
            resume_bullet = repo.get("suggested_resume_text", "")
            should_keep = (
                score >= 52
                or is_pinned
                or (idx <= 3 and score >= 40)
            )

            if should_keep:
                best.append({
                    "name": repo_name,
                    "rank": idx,
                    "score": score,
                    "reason": _keep_reason(repo),
                    "resume_bullet": resume_bullet,
                    "resume_keep_note": (
                        "Keep this in resume: show ownership + stack + one measurable result."
                        if not resume_bullet
                        else "Keep this in resume: adapt the bullet with truthful metric + impact."
                    ),
                    "is_pinned": is_pinned,
                    "language": language,
                    "stars": stars,
                    "url": repo.get("url") or f"https://github.com/{username}/{repo_name or ''}",
                })
            else:
                drop.append({
                    "name": repo_name,
                    "rank": idx,
                    "score": score,
                    "reason": _drop_reason(repo),
                    "resume_action": "Deprioritize for now, unless you can add a better README and an impact metric.",
                    "is_pinned": is_pinned,
                })

        # Always provide at least a few keep suggestions so users know what to include.
        if not best and ranked_candidates:
            for idx, repo in enumerate(ranked_candidates[:3], start=1):
                repo_name = repo.get("name")
                best.append({
                    "name": repo_name,
                    "rank": idx,
                    "score": int(repo.get("final_score", 0) or 0),
                    "reason": "Potential keep candidate with clearer project storytelling.",
                    "resume_bullet": repo.get("suggested_resume_text", ""),
                    "resume_keep_note": "Keep only if you can show problem, ownership, and measurable result.",
                    "is_pinned": bool(repo.get("is_pinned", False)),
                    "language": repo.get("language", ""),
                    "stars": int(repo.get("stars", 0) or 0),
                    "url": repo.get("url") or f"https://github.com/{username}/{repo_name or ''}",
                })

        followers = int(profile_data.get("followers", 0) or 0) if isinstance(profile_data, dict) else 0
        bio = str(profile_data.get("bio", "") or "") if isinstance(profile_data, dict) else ""
        profile_summary_parts = []
        if bio:
            profile_summary_parts.append(f'Bio: "{bio[:120]}"')
        if followers:
            profile_summary_parts.append(f"{followers} followers")

        scrape_notes = []
        if isinstance(profile_data, dict) and profile_data.get("error"):
            scrape_notes.append(f"profile scrape note: {profile_data.get('error')}")
        if isinstance(repo_payload, dict) and repo_payload.get("error"):
            scrape_notes.append(f"repo scrape note: {repo_payload.get('error')}")

        keep_count = len(best)
        drop_count = len(drop)
        summary = (
            f"GitHub profile analyzed for role relevance. Ranked {len(ranked_candidates)} repositories, "
            f"recommended {keep_count} to keep in resume, and {drop_count} to deprioritize."
        )
        if pinned_names:
            summary += f" Pinned repos detected: {', '.join(pinned_names[:3])}{'...' if len(pinned_names) > 3 else ''}."
        if not ranked_candidates:
            summary += " We couldn't extract enough repository signals in this run."

        return {
            "github_best_projects": best[:6],
            "github_drop_projects": drop[:4],
            "github_summary": summary,
            "github_profile": {
                "username": username,
                "bio": bio,
                "location": profile_data.get("location", "") if isinstance(profile_data, dict) else "",
                "followers": followers,
                "following": int(profile_data.get("following", 0) or 0) if isinstance(profile_data, dict) else 0,
                "pinned_repos": pinned_raw[:6] if isinstance(pinned_raw, list) else [],
                "profile_url": (
                    profile_data.get("profile_url")
                    if isinstance(profile_data, dict) and profile_data.get("profile_url")
                    else f"https://github.com/{username}"
                ),
                "profile_summary": " · ".join(profile_summary_parts) if profile_summary_parts else "",
                "scrape_error": " | ".join(scrape_notes) if scrape_notes else None,
            },
        }
    except Exception as exc:
        logger.warning("GitHub analysis skipped: %s", exc)
        return {
            "github_best_projects": [],
            "github_drop_projects": [],
            "github_summary": "GitHub deep scan unavailable right now. Please retry in a moment.",
            "github_profile": {},
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


def build_roast_report_v2(
    features: dict,
    friendliness_result: dict,
    visibility_result: Optional[dict],
    ats_extracted: dict,
    job_description: Optional[str],
    target_role: Optional[str] = None,
    candidate_name: Optional[str] = None,
) -> dict:
    """Evidence-based roast report that quotes specific resume lines."""
    
    raw_text = ats_extracted.get("raw_text", "")
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    text_lower = raw_text.lower()
    
    # Find specific problematic lines
    vague_lines = []
    responsibility_lines = []
    metric_lines = []
    
    for i, line in enumerate(lines):
        lower = line.lower()
        
        # Detect vague language
        if any(phrase in lower for phrase in ["passionate about", "team player", "hardworking", "excellent communication"]):
            vague_lines.append({"line": line, "index": i, "issue": "generic_fluff"})
        
        # Detect responsibility without outcome
        if re.search(r"\b(responsible for|helped with|worked on|assisted in|participated in)\b", lower):
            if not re.search(r"\d", line):  # No metrics
                responsibility_lines.append({"line": line, "index": i, "issue": "responsibility_no_impact"})
        
        # Detect good metrics
        if re.search(r"\d", line) and re.search(r"\b(built|led|improved|reduced|increased|delivered)\b", lower):
            metric_lines.append({"line": line, "index": i, "type": "good"})
    
    def _clean_quote(raw: str, limit: int = 90) -> str:
        """Strip bullet/label prefixes from a resume line before quoting it in UI strings."""
        s = re.sub(r"^[•●▪▸\-\*]\s*", "", raw).strip()
        s = re.sub(r"^(Objective|Goal|Task|Note|Summary|Description)\s*:\s*", "", s, flags=re.I).strip()
        return s[:limit]

    # Build specific critiques
    hard_truths = []
    if vague_lines:
        examples = [f'"{_clean_quote(v["line"], 80)}..."' for v in vague_lines[:2]]
        hard_truths.append(f"Found {len(vague_lines)} generic phrases. Replace: {', '.join(examples)}")

    if responsibility_lines:
        examples = [f'"{_clean_quote(r["line"], 80)}..."' for r in responsibility_lines[:2]]
        hard_truths.append(f"{len(responsibility_lines)} bullets describe activity, not impact. Example: {examples[0]}")

    priority_fixes: list[str] = []

    for line_info in responsibility_lines[:3]:
        original = line_info["line"]
        rewritten = _generate_specific_rewrite(original, target_role)
        # Always produce a clean string — never a dict — so the frontend renders correctly
        priority_fixes.append(
            f"Rewrite: \"{_clean_quote(original, 80)}\" → {rewritten}"
        )

    # Build heuristic strengths with encouragement + recruiter framing
    heuristic_strengths: list[str] = []
    for ml in metric_lines[:3]:
        heuristic_strengths.append(f"Metric-backed bullet: \"{_clean_quote(ml['line'], 100)}\"")
    section_signals = {
        "summary": bool(re.search(r"\bsummary\b", text_lower)),
        "experience": bool(re.search(r"\bexperience\b", text_lower)),
        "projects": bool(re.search(r"\bprojects?\b", text_lower)),
        "skills": bool(re.search(r"\bskills?\b", text_lower)),
    }
    if all(section_signals.values()):
        heuristic_strengths.append("Resume structure is recruiter-friendly: clear Summary, Experience, Projects, and Skills sections.")
    skills_detected = ats_extracted.get("skills", []) if isinstance(ats_extracted.get("skills"), list) else []
    if len(skills_detected) >= 10:
        heuristic_strengths.append(f"Technical breadth is visible with {len(skills_detected)} detected skills.")
    project_lines = [l for l in lines if re.search(r"(civicwatch|quizx|stock|project)", l, re.IGNORECASE)]
    if len(project_lines) >= 2:
        heuristic_strengths.append("Project portfolio shows initiative across multiple problem domains.")
    if "intern" in text_lower:
        heuristic_strengths.append("Internship experience gives practical execution signal beyond classroom work.")
    if re.search(r"(?:https?://)?(?:www\.)?github\.com/", raw_text, re.IGNORECASE):
        heuristic_strengths.append("GitHub profile signal is present, which helps technical credibility.")
    if re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/(?:in|pub)/", raw_text, re.IGNORECASE):
        heuristic_strengths.append("LinkedIn profile signal is present, which supports recruiter verification.")

    if not heuristic_strengths:
        heuristic_strengths = ["Resume contains project and technical content worth refining for stronger impact."]
    heuristic_strengths = _unique_non_empty_fuzzy(heuristic_strengths, 6, threshold=0.9)

    # Build heuristic weaknesses from vague and responsibility lines
    heuristic_weaknesses: list[str] = []
    for vl in vague_lines[:2]:
        heuristic_weaknesses.append(f"Generic phrase found: \"{_clean_quote(vl['line'], 80)}\" — replace with a specific outcome.")
    for rl in responsibility_lines[:2]:
        heuristic_weaknesses.append(f"Responsibility-only bullet: \"{_clean_quote(rl['line'], 80)}\" — add ownership verb and metric.")
    if not heuristic_weaknesses:
        heuristic_weaknesses = ["Review bullets for passive language and missing impact metrics."]
    heuristic_weaknesses = _unique_non_empty_fuzzy(heuristic_weaknesses, 6, threshold=0.9)
    hard_truths = _unique_non_empty_fuzzy(hard_truths, 3, threshold=0.9)
    priority_fixes = _unique_non_empty_fuzzy(priority_fixes, 6, threshold=0.9)

    return {
        "evidence_based": True,
        "lines_analyzed": len(lines),
        "specific_issues": {
            "vague_phrases": vague_lines,
            "responsibility_only": responsibility_lines,
            "strong_metrics": metric_lines,
        },
        "strengths": heuristic_strengths,
        "weaknesses": heuristic_weaknesses,
        "hard_truths": hard_truths,
        "priority_fixes": priority_fixes,
        "role_fit_verdict": _calculate_role_fit_v2(ats_extracted, target_role, job_description),
    }


def _gerund_to_past_tense(gerund: str) -> str:
    """
    Convert a common gerund (verb+ing) to its simple past tense.
    Handles the most common resume verb patterns.
    Falls back to stripping -ing and appending -ed (e.g. managing → managed).
    """
    g = gerund.lower().strip()
    # Irregular / common resume verbs
    _irregular = {
        "building":      "Built",
        "leading":       "Led",
        "driving":       "Drove",
        "growing":       "Grew",
        "making":        "Made",
        "running":       "Ran",
        "winning":       "Won",
        "writing":       "Wrote",
        "bringing":      "Brought",
        "thinking":      "Developed",
        "beginning":     "Started",
        "doing":         "Executed",
        "going":         "Progressed",
        "setting":       "Set",
        "cutting":       "Cut",
        "putting":       "Deployed",
        "getting":       "Achieved",
        "having":        "Established",
        "taking":        "Took ownership of",
        "coming":        "Delivered",
    }
    if g in _irregular:
        return _irregular[g]

    # Double-consonant rule: running → ran handled above; for others strip doubled cons
    # e.g. managing → managed, enhancing → enhanced, coordinating → coordinated
    if g.endswith("ing"):
        stem = g[:-3]  # drop -ing
        # If stem ends in 'e' (e.g. manag-e from managing): manageing → managed
        # Most stems: just add -ed
        # Check double-consonant: e.g. running → runn → run (already handled)
        if stem.endswith("e"):
            past = stem + "d"
        elif len(stem) >= 3 and stem[-1] == stem[-2] and stem[-1] not in "aeiou":
            # double consonant — remove one, add -ed (runnning edge case)
            past = stem[:-1] + "ed"
        else:
            past = stem + "ed"
        return past.capitalize()

    return gerund.capitalize()


def _generate_specific_rewrite(original: str, target_role: Optional[str]) -> str:
    """Generate a context-aware rewrite — never use placeholder brackets.
    Output always starts with a PAST-TENSE action verb, not a gerund.
    """
    # Strip bullet markers and label prefixes like "Objective:", "● Objective:"
    cleaned = re.sub(r"^[•●\-\*]\s*", "", original).strip()
    cleaned = re.sub(r"^(Objective|Goal|Task|Note|Summary|Description)\s*:\s*", "", cleaned, flags=re.I).strip()

    rewritten = cleaned

    # ── Pattern A: "weak phrase + gerund + rest"
    # "Worked on enhancing the Vendor Panel..." → "Enhanced the Vendor Panel..."
    # Capture: (weak_phrase)(gerund)(rest_of_sentence)
    weak_gerund_re = re.compile(
        r"^(worked on|responsible for|helped with?|assisted in?|participated in|tasked with)\s+"
        r"(\w+ing)\b(.*)",
        re.IGNORECASE,
    )
    m = weak_gerund_re.match(rewritten)
    if m:
        gerund    = m.group(2)
        remainder = m.group(3).strip()
        past      = _gerund_to_past_tense(gerund)
        rewritten = f"{past} {remainder}".strip() if remainder else past

    else:
        # ── Pattern B: plain weak opener with no gerund following
        # "Responsible for managing..." — where "managing" is the NEXT word (already a gerund opener alone)
        # e.g. "Responsible for managing..." — weak_phrase IS the opener, next word is a gerund
        gerund_only_re = re.compile(
            r"^(worked on|responsible for|helped with?|assisted in?|participated in|tasked with)\s+(.*)",
            re.IGNORECASE,
        )
        m2 = gerund_only_re.match(rewritten)
        if m2:
            rest = m2.group(2).strip()
            # If the rest starts with a gerund, convert it to past tense
            first_word_m = re.match(r"(\w+ing)\b(.*)", rest, re.IGNORECASE)
            if first_word_m:
                past      = _gerund_to_past_tense(first_word_m.group(1))
                remainder = first_word_m.group(2).strip()
                rewritten = f"{past} {remainder}".strip() if remainder else past
            else:
                # No gerund — use strong verb mapping
                plain_map = [
                    (r"^responsible for\b", "Owned"),
                    (r"^helped with?\b",    "Contributed to"),
                    (r"^worked on\b",       "Built"),
                    (r"^assisted in?\b",    "Supported"),
                    (r"^participated in\b", "Led"),
                    (r"^tasked with\b",     "Executed"),
                ]
                for pat, strong in plain_map:
                    new, n = re.subn(pat, strong, rewritten, flags=re.I)
                    if n:
                        rewritten = new
                        break

    # Capitalise first letter
    if rewritten and not rewritten[0].isupper():
        rewritten = rewritten[0].upper() + rewritten[1:]

    # Trim to ~18 words so the line stays readable
    words = rewritten.split()
    if len(words) > 18:
        rewritten = " ".join(words[:18]).rstrip(".,;") + "..."

    # Extract any tech mentioned to pick a realistic metric
    tech = re.findall(r"\b(Python|JavaScript|React|Node\.?js|AWS|SQL|Docker|API|Postgres|TypeScript)\b", original, re.I)
    tech_str = f" using {tech[0]}" if tech else ""

    # Produce a domain-aware estimated metric — never a bracket placeholder
    if re.search(r"\b(vendor|panel|dashboard|management)\b", original, re.I):
        metric = "cutting vendor onboarding time by 30% (est.)"
    elif re.search(r"\b(event|communication|partnership|external)\b", original, re.I):
        metric = "boosting partner response rate by 20% (est.)"
    elif re.search(r"\b(api|backend|service|endpoint)\b", original, re.I):
        metric = "reducing API latency by 35% (est.)"
    elif re.search(r"\b(front.?end|ui|page|component)\b", original, re.I):
        metric = "improving page load speed by 25% (est.)"
    elif re.search(r"\b(test|qa|quality|bug)\b", original, re.I):
        metric = "reducing bug escape rate by 40% (est.)"
    elif re.search(r"\b(data|pipeline|analytics)\b", original, re.I):
        metric = "cutting data processing time by 35% (est.)"
    else:
        metric = "improving team delivery speed by 20% (est.)"

    return f"{rewritten}{tech_str}, {metric}"


def _calculate_role_fit_v2(ats_extracted: dict, target_role: Optional[str], job_description: Optional[str]) -> dict:
    """Determine role fit based on extracted evidence."""
    skills = [s.lower() for s in ats_extracted.get("skills", [])]
    
    # Simple logic for fit
    if not target_role:
        return {"status": "unknown", "score": 0}
        
    target_role_lower = target_role.lower()
    fit_score = 50
    reasons = []
    
    # Check job titles
    found_title = any(target_role_lower in t.lower() for t in ats_extracted.get("job_titles", []))
    if found_title:
        fit_score += 30
        reasons.append(f"Previous experience as {target_role}")
        
    # Check skills
    relevant_tech = ["python", "javascript", "react", "aws", "sql", "node"]
    found_tech = [t for t in relevant_tech if any(t in s for s in skills)]
    if len(found_tech) >= 3:
        fit_score += 20
        reasons.append(f"Strong tech match: {', '.join(found_tech)}")
        
    status = "STRONG_FIT" if fit_score >= 80 else "CONDITIONAL_FIT" if fit_score >= 60 else "WEAK_FIT"
    
    return {
        "status": status,
        "score": fit_score,
        "reasons": reasons
    }


def _build_sample_resume_upgrades(
    resume_text: str,
    missing_tech: list[str],
    candidate_name: Optional[str] = None,
    project_domain_coverage: Optional[list[dict]] = None,
) -> list[dict]:
    name = (candidate_name or "Candidate").strip() or "Candidate"
    summary_line = _extract_summary_line(resume_text) or "Aspiring engineer with strong technical skills."
    exp_line = _extract_experience_bullet_line(resume_text) or "Worked on vendor panel improvements."
    domains = project_domain_coverage or _build_project_domain_coverage(resume_text)

    # Strip common passive openers to get the core action phrase
    core_exp = re.sub(
        r'(?i)^(worked on|responsible for|helped with?|assisted in?|participated in?|objective\s*:?\s*)',
        '', exp_line
    ).strip()
    # Capitalize first letter if needed
    if core_exp and not core_exp[0].isupper():
        core_exp = core_exp[0].upper() + core_exp[1:]

    # Build a believable estimate based on what domain the first project is in
    first_project = (domains[0].get("project", "") if domains else "").strip()
    first_domain_tag = (domains[0].get("domains", ["Software"])[0] if domains else "Software")
    metric_estimate = (
        "reducing load time by 30% (est.)" if "DevOps" in first_domain_tag or "Cloud" in first_domain_tag
        else "improving user engagement by 25% (est.)" if "EdTech" in first_domain_tag or "AI" in first_domain_tag
        else "cutting report processing time by 40% (est.)" if "Civic" in first_domain_tag
        else "reducing manual effort by 35% (est.)"
    )

    examples = [
        {
            "area": "Summary",
            "before": summary_line,
            "after": (
                f"{name} is a Software Engineer who ships full-stack features with React and Node.js, "
                f"with production project evidence and a focus on measurable delivery outcomes."
            ),
            "reason": "Replaces vague intent language with role-specific framing and proof signals.",
        },
        {
            "area": "Experience Bullet",
            "before": exp_line,
            "after": f"Built {core_exp}, {metric_estimate}.",
            "reason": "Converts passive responsibility language into ownership + measurable impact.",
        },
    ]
    if missing_tech:
        skill = missing_tech[0]
        project_hint = first_project or "production project"
        examples.append({
            "area": "Skills to Project Link",
            "before": f"Listed skill: {skill}",
            "after": (
                f"Applied {skill} in {project_hint} to solve a real user problem, "
                f"resulting in a measurable improvement to system performance."
            ),
            "reason": "Turns isolated skill listing into defensible, domain-linked project evidence.",
        })
    return examples[:3]


def build_comprehensive_guidance(
    resume_text: str,
    job_description: Optional[str],
    target_role: Optional[str],
    candidate_name: Optional[str] = None,
    project_domain_coverage: Optional[list[dict]] = None,
    has_linkedin_url: bool = False,
    has_github_url: bool = False,
) -> dict:
    has_jd = bool((job_description or "").strip())
    analyzer = get_comprehensive_analyzer()
    resume_lower = (resume_text or "").lower()
    name = (candidate_name or "Candidate").strip() or "Candidate"
    domains = project_domain_coverage or _build_project_domain_coverage(resume_text)

    if not has_jd:
        baseline_role_signals = _extract_jd_interview_signals(_fallback_jd_for_role(target_role), limit=8)
        no_jd_missing_tech = [
            signal for signal in baseline_role_signals
            if signal and signal.lower() not in resume_lower
        ][:5]
        cert_recs = _recommend_certs_from_resume_evidence(analyzer, resume_text, target_role)
        actionable_lines = []
        if domains:
            mapped = [
                f"{item.get('project', 'Project')} ({', '.join(item.get('domains', [])[:2])})"
                for item in domains[:3]
                if isinstance(item, dict)
            ]
            if mapped:
                actionable_lines.append(f"{name}, your project domain map: {', '.join(mapped)}.")
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
            "sample_resume_upgrades": _build_sample_resume_upgrades(
                resume_text=resume_text,
                missing_tech=no_jd_missing_tech,
                candidate_name=name,
                project_domain_coverage=domains,
            ),
            "project_domain_coverage": domains,
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
            "project_domain_coverage": domains,
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
    sample_resume_upgrades = _build_sample_resume_upgrades(
        resume_text=resume_text,
        missing_tech=normalized_missing_tech,
        candidate_name=name,
        project_domain_coverage=domains,
    )
    actionable_lines = _unique_non_empty(
        actionable_lines + (
            [f"{name}, project domains detected: " + ", ".join(
                f"{item.get('project', 'Project')}->{'/'.join(item.get('domains', [])[:2])}"
                for item in domains[:3]
                if isinstance(item, dict)
            )] if domains else []
        ),
        8,
    )

    return {
        "missing_keywords": normalized_missing_keywords[:12],
        "missing_technical_skills": normalized_missing_tech[:10],
        "missing_soft_skills": normalized_missing_soft[:6],
        "certification_recommendations": normalized_certs,
        "actionable_recommendations": actionable_lines[:8],
        "action_plan": action_plan,
        "sample_resume_upgrades": sample_resume_upgrades,
        "project_domain_coverage": domains,
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
        candidate_name = _extract_candidate_name(resume_text, file.filename)
        project_domain_coverage = _build_project_domain_coverage(resume_text)
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
        
        # Enhanced extraction
        ats_extracted = extract_ats_data_enhanced(features, parsing_result)
        
        # Semantic gap analysis
        semantic_gaps = analyze_semantic_gaps(resume_text, job_description)
        
        # Benchmark comparison
        benchmarks = compare_against_benchmarks(ats_extracted, target_role)
        
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
        # Use V2 report as starting point (evidence-based heuristics)
        roast_report = build_roast_report_v2(
            features=features,
            friendliness_result=friendliness_result,
            visibility_result=visibility_result,
            ats_extracted=ats_extracted,
            job_description=job_description,
            target_role=target_role,
            candidate_name=candidate_name,
        )
        
        missing_keywords = visibility_result.get("missing_keywords", [])[:10] if visibility_result else []
        risk_flags = features.get("risk_flags", [])

        # 7.5 AI-powered deep roast with fallback
        ai_generated = await generate_ai_analysis_with_fallback(
            resume_text=resume_text,
            job_description=job_description,
            company_name=company_name,
            target_role=target_role,
            candidate_name=candidate_name,
            project_domain_coverage=project_domain_coverage,
            feedback_tone=feedback_tone,
            friendliness_score=friendliness_score,
            match_score=match_score,
            missing_keywords=missing_keywords,
            risk_flags=risk_flags,
        )

        if ai_generated:
            # Merge AI results into the heuristic report
            roast_report = _merge_roast_reports(roast_report, ai_generated)
            ai_generation_mode = "ai"
        else:
            ai_generation_mode = "heuristic"

        github_timeout = float(os.getenv("ANALYZE_GITHUB_TIMEOUT_SECONDS", "25"))
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

        if github_task:
            try:
                github_intel = await github_task
            except asyncio.TimeoutError:
                logger.warning("GitHub intel timed out after %ss.", github_timeout)
                github_intel = {
                    "github_best_projects": [
                        {
                            "name": "Pin 2-3 strongest repos",
                            "rank": 1,
                            "score": 60,
                            "reason": "Use repos with clear README, architecture notes, and measurable outcomes.",
                            "resume_bullet": "Built [project], solved [problem], improved [metric], and documented implementation choices.",
                            "resume_keep_note": "Keep only projects where you can clearly explain ownership and measurable impact.",
                        }
                    ],
                    "github_drop_projects": [
                        {
                            "name": "Tutorial/fork-only repos",
                            "rank": 2,
                            "score": 25,
                            "reason": "Low ownership signal unless you document your unique contribution.",
                            "resume_action": "Avoid listing these unless you can prove meaningful custom work.",
                        }
                    ],
                    "github_summary": "GitHub deep scan timed out. Applied quick fallback guidance from profile signals.",
                }
                recommendations.append({
                    "type": "quality",
                    "message": "GitHub intel timed out; retry in a moment. Fallback guidance was applied.",
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
            candidate_name=candidate_name,
            project_domain_coverage=project_domain_coverage,
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

        # ── Inject AI action_blueprint → action_plan (AI output beats heuristic builder) ──
        if isinstance(ai_generated, dict):
            ai_action_blueprint = ai_generated.get("roast_report", {}).get("action_blueprint") or []
            if isinstance(ai_action_blueprint, list) and ai_action_blueprint:
                # Convert action_blueprint dicts to the shape the frontend action_plan renderer expects
                converted_action_plan = []
                for item in ai_action_blueprint:
                    if not isinstance(item, dict):
                        continue
                    converted_action_plan.append({
                        "title": str(item.get("action", "")).strip(),
                        "priority": str(item.get("priority", "P1")).strip(),
                        "effort": str(item.get("effort", "")).strip(),
                        "why": str(item.get("why", "")).strip(),
                        "steps": item.get("steps", []) if isinstance(item.get("steps"), list) else [],
                        "example": str(item.get("before_after_example", "") or item.get("example", "")).strip(),
                    })
                if converted_action_plan:
                    comprehensive_guidance["action_plan"] = converted_action_plan

            # ── Inject AI rewrite_guide → sample_resume_upgrades ──
            ai_rewrite_guide = ai_generated.get("roast_report", {}).get("rewrite_guide") or []
            if isinstance(ai_rewrite_guide, list) and ai_rewrite_guide:
                converted_upgrades = []
                for item in ai_rewrite_guide:
                    if not isinstance(item, dict):
                        continue
                    current = str(item.get("current_line", "")).strip()
                    rewritten = str(item.get("rewritten_line", "")).strip()
                    if not current or not rewritten:
                        continue
                    # Skip rewrites that still contain placeholder brackets
                    if "[" in rewritten and "]" in rewritten:
                        continue
                    converted_upgrades.append({
                        "area": str(item.get("section", "Resume")).strip(),
                        "before": current,
                        "after": rewritten,
                        "reason": str(item.get("why_this_helps", "")).strip(),
                    })
                if converted_upgrades:
                    comprehensive_guidance["sample_resume_upgrades"] = converted_upgrades

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
        roast_report["hard_truths"] = _unique_non_empty_fuzzy(
            (roast_report.get("hard_truths", []) or []) + [
                f"{candidate_name}, if ownership and measurable impact are unclear, callbacks drop sharply."
            ],
            6,
            threshold=0.92,
        )
        roast_report["priority_fixes"] = _unique_non_empty_fuzzy(
            (roast_report.get("priority_fixes", []) or []) + [
                "Rewrite top bullets with action + scope + metric + outcome.",
                "Keep only role-relevant lines and remove generic filler language.",
            ],
            8,
            threshold=0.88,
        )
        roast_report["needs_fixing"] = _unique_non_empty_fuzzy(
            (roast_report.get("weaknesses", []) or [])
            + (roast_report.get("hard_truths", []) or [])
            + (roast_report.get("priority_fixes", []) or []),
            8,
            threshold=0.9,
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
                "candidate_name": candidate_name,
                "overall_score": overall_score,
                "ats_score": friendliness_score,
                "jd_fit_score": match_score,
                "ats_score_raw": score_calibration.get("raw_score"),
            },
            "vendor_compatibility": vendor_compatibility,
            "critical_issues": critical_issues,
            "ats_extracted": ats_extracted,
            "semantic_gaps": semantic_gaps,
            "benchmarks": benchmarks,
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
