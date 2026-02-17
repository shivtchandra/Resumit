"""
AI-powered rewrite endpoint for resume optimization with Gemini
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import asyncio
import tempfile
import logging
import re
from pathlib import Path

# Import services
from app.services.ingestion.pdf_parser import PDFParser
from app.services.ingestion.docx_parser import DOCXParser
from app.services.ingestion.layout_schema_extractor import LayoutSchemaExtractor
from app.services.rewrite.rewriter import ResumeRewriter
from app.services.export.docx_rebuilder import DOCXRebuilder
from app.services.export.pdf_exporter import PDFExporter
from app.services.ml.friendliness_classifier import FriendlinessClassifier
from app.services.ml.visibility_ranker import VisibilityRanker
from app.services.analysis.comprehensive_analyzer import ComprehensiveAnalyzer

logger = logging.getLogger(__name__)

router = APIRouter()

# Service instances (lazy loaded to avoid fork safety issues)
_rewrite_services = {}

def get_pdf_parser():
    if 'pdf_parser' not in _rewrite_services:
        _rewrite_services['pdf_parser'] = PDFParser()
    return _rewrite_services['pdf_parser']

def get_docx_parser():
    if 'docx_parser' not in _rewrite_services:
        _rewrite_services['docx_parser'] = DOCXParser()
    return _rewrite_services['docx_parser']

def get_schema_extractor():
    if 'schema_extractor' not in _rewrite_services:
        _rewrite_services['schema_extractor'] = LayoutSchemaExtractor()
    return _rewrite_services['schema_extractor']

def get_rewriter():
    if 'rewriter' not in _rewrite_services:
        _rewrite_services['rewriter'] = ResumeRewriter()
    return _rewrite_services['rewriter']

def get_docx_rebuilder():
    if 'docx_rebuilder' not in _rewrite_services:
        _rewrite_services['docx_rebuilder'] = DOCXRebuilder()
    return _rewrite_services['docx_rebuilder']

def get_pdf_exporter():
    if 'pdf_exporter' not in _rewrite_services:
        _rewrite_services['pdf_exporter'] = PDFExporter()
    return _rewrite_services['pdf_exporter']

def get_friendliness_classifier():
    if 'friendliness_classifier' not in _rewrite_services:
        _rewrite_services['friendliness_classifier'] = FriendlinessClassifier()
    return _rewrite_services['friendliness_classifier']

def get_visibility_ranker():
    if 'visibility_ranker' not in _rewrite_services:
        _rewrite_services['visibility_ranker'] = VisibilityRanker()
    return _rewrite_services['visibility_ranker']

def get_comprehensive_analyzer():
    if 'comprehensive_analyzer' not in _rewrite_services:
        _rewrite_services['comprehensive_analyzer'] = ComprehensiveAnalyzer()
    return _rewrite_services['comprehensive_analyzer']


def _normalize_url(url: str) -> str:
    cleaned = str(url or "").strip().rstrip(".,);")
    if not cleaned:
        return ""
    if cleaned.startswith(("http://", "https://")):
        return cleaned
    return f"https://{cleaned}"


def _extract_profile_urls(raw_text: str, extracted_urls: Optional[List[str]] = None) -> Dict[str, Optional[str]]:
    source_text = raw_text or ""
    links = [str(url).strip() for url in (extracted_urls or []) if str(url).strip()]
    if links:
        source_text = "\n".join([source_text] + links)
    compact_text = re.sub(r"\s+", "", source_text)

    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None

    linkedin_pattern = r"(?:https?://)?(?:www\.)?linkedin\.com/(?:in|pub)/[A-Za-z0-9\-_/%]+/?"
    linkedin_match = re.search(linkedin_pattern, source_text, re.IGNORECASE)
    if not linkedin_match:
        linkedin_match = re.search(linkedin_pattern, compact_text, re.IGNORECASE)
    if linkedin_match:
        linkedin_url = _normalize_url(linkedin_match.group(0))

    blocked_handles = {
        "features", "topics", "orgs", "organizations", "enterprise", "about", "events",
        "marketplace", "settings", "login", "signup", "pricing", "explore", "site", "contact",
    }
    github_pattern = r"(?:https?://)?(?:www\.)?github\.com/([A-Za-z0-9-]{1,39})(?:/[A-Za-z0-9_.-]+)?/?"
    for match in re.finditer(github_pattern, source_text, re.IGNORECASE):
        username = (match.group(1) or "").strip()
        if not username or username.lower() in blocked_handles:
            continue
        github_url = _normalize_url(f"github.com/{username}")
        break
    if not github_url:
        compact_match = re.search(github_pattern, compact_text, re.IGNORECASE)
        if compact_match:
            username = (compact_match.group(1) or "").strip()
            if username and username.lower() not in blocked_handles:
                github_url = _normalize_url(f"github.com/{username}")

    return {"linkedin_url": linkedin_url, "github_url": github_url}


class RewriteSectionRequest(BaseModel):
    """Request model for section rewrite"""
    layout_schema: Dict[str, Any]
    section_index: int
    job_description: str = ""
    target_keywords: List[str] = []


class RewriteFullResponse(BaseModel):
    """Response model for full rewrite"""
    before_score: float
    after_score: float
    before_friendliness: float
    after_friendliness: float
    file_url: str
    delta_report: Dict[str, Any]
    explanations: List[str]


@router.post("/rewrite/section")
async def rewrite_section(request: RewriteSectionRequest):
    """
    Rewrite a specific resume section using Gemini AI.
    
    Args:
        request: Section rewrite request with schema and parameters
        
    Returns:
        Rewritten section data
    """
    try:
        # Validate section index
        sections = request.layout_schema.get("sections", [])
        if request.section_index < 0 or request.section_index >= len(sections):
            raise HTTPException(status_code=400, detail="Invalid section index")
        
        section = sections[request.section_index]
        section_type = section.get("type")
        
        rewriter = get_rewriter()
        ai_client = rewriter.ai_client
        if not ai_client:
            return {
                "section_index": request.section_index,
                "section_type": section_type,
                "rewritten": section.get("raw", section.get("entries", [])),
                "explanation": "AI provider not configured. Returning original content."
            }

        # Rewrite based on section type
        if section_type == "EXPERIENCE":
            section_content = section.get("entries")[0] if section.get("entries") else {}
            try:
                result = ai_client.rewrite_experience_entry(
                    entry=section_content,
                    job_description=request.job_description or "",
                    target_keywords=request.target_keywords or []
                )
            except Exception as exc:
                logger.warning("Experience section rewrite fallback: %s", exc)
                result = {"bullets": section_content.get("bullets", []), "explanation": "AI rewrite unavailable. Returned original bullets."}
            
            return {
                    "section_index": request.section_index,
                    "section_type": section_type,
                    "rewritten": result.get("bullets", []),
                    "explanation": result.get("explanation", "")
                }
        elif section_type == "SUMMARY":
            try:
                result = ai_client.rewrite_summary(
                    section.get("raw", ""),
                    request.job_description,
                    request.target_keywords
                )
            except Exception as exc:
                logger.warning("Summary rewrite fallback: %s", exc)
                result = {"content": section.get("raw", ""), "explanation": "AI rewrite unavailable. Returned original summary."}
            return {
                "section_index": request.section_index,
                "section_type": section_type,
                "rewritten": result.get("content", ""),
                "explanation": result.get("explanation", "")
            }
        elif section_type == "SKILLS":
            try:
                result = ai_client.rewrite_skills(
                    section.get("raw", ""),
                    request.job_description,
                    request.target_keywords
                )
            except Exception as exc:
                logger.warning("Skills rewrite fallback: %s", exc)
                result = {"content": section.get("raw", ""), "explanation": "AI rewrite unavailable. Returned original skills."}
            return {
                "section_index": request.section_index,
                "section_type": section_type,
                "rewritten": result.get("content", ""),
                "explanation": result.get("explanation", "")
            }
        else:
            raise HTTPException(status_code=400, detail=f"Section type {section_type} not supported for rewriting")
            
    except Exception as e:
        logger.error(f"Section rewrite failed: {e}")
        raise HTTPException(status_code=500, detail=f"Rewrite failed: {str(e)}")


@router.post("/rewrite/full")
async def rewrite_full(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    user_id: str = Form("anonymous")
):
    """
    Rewrite entire resume using Gemini AI.
    
    Args:
        file: Resume file (PDF or DOCX)
        job_description: Target job description
        user_id: User identifier
        
    Returns:
        Complete rewrite results with before/after scores
    """
    try:
        # Read file
        file_bytes = await file.read()
        filename = file.filename
        
        # Parse file (lazy loaded)
        logger.info(f"Parsing resume: {filename}")
        if file.filename.endswith('.pdf'):
            parser = get_pdf_parser()
        elif file.filename.endswith('.docx'):
            parser = get_docx_parser()
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF or DOCX.")
        
        parsing_result = parser.parse(file_bytes)
        text = parsing_result.get("raw_text", "")
        
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from resume")
        
        # COMPREHENSIVE ANALYSIS (NEW)
        logger.info("Performing comprehensive analysis")
        try:
            comprehensive_analyzer = get_comprehensive_analyzer()
            comprehensive_analyzer.analyze_comprehensive(text, job_description)
        except Exception as exc:
            logger.warning("Comprehensive analysis skipped: %s", exc)
        
        # Extract layout schema
        logger.info("Extracting layout schema")
        schema_extractor = get_schema_extractor()
        layout_schema = schema_extractor.extract_from_parsed_data(parsing_result, filename) # Kept original method signature
        
        # Score original resume (lazy loaded)
        logger.info("Scoring original resume")
        
        # Get visibility score
        visibility_ranker = get_visibility_ranker()
        visibility_before = visibility_ranker.rank(text, job_description)
        
        # Get friendliness score
        from app.services.features.extractor import FeatureExtractor
        feature_extractor = FeatureExtractor()
        features = feature_extractor.extract_features(parsing_result)
        friendliness_classifier = get_friendliness_classifier()
        friendliness_before = friendliness_classifier.predict(features)
        
        # Perform full resume rewrite (lazy loaded)
        logger.info("Rewriting resume")
        target_keywords = visibility_before.get("missing_keywords", [])
        
        rewriter = get_rewriter()
        rewrite_result = rewriter.rewrite_full_resume(
            layout_schema=layout_schema,
            job_description=job_description,
            target_keywords=target_keywords
        )
        
        rewritten_schema = rewrite_result["rewritten_schema"]
        delta_report = rewrite_result["delta_report"]
        explanations = rewrite_result["explanations"]
        
        # Rebuild DOCX (lazy loaded)
        logger.info("Rebuilding DOCX from schema")
        
        # Create output directory if not exists
        output_dir = Path("outputs")
        output_dir.mkdir(exist_ok=True)
        
        # Generate unique filename
        import uuid
        file_id = str(uuid.uuid4())
        docx_filename = f"rewritten_{file_id}.docx"
        docx_path = output_dir / docx_filename
        
        docx_rebuilder = get_docx_rebuilder()
        docx_rebuilder.rebuild_from_schema(rewritten_schema, str(docx_path))
        
        # Convert to PDF (lazy loaded)
        logger.info("Converting to PDF")
        pdf_filename = f"rewritten_{file_id}.pdf"
        pdf_path = output_dir / pdf_filename
        
        try:
            pdf_exporter = get_pdf_exporter()
            pdf_exporter.convert_docx_to_pdf(str(docx_path), str(output_dir))
            final_file_url = f"/outputs/{pdf_filename}"
        except Exception as e:
            logger.warning(f"PDF conversion failed: {e}. Using DOCX only.")
            final_file_url = f"/outputs/{docx_filename}"
            pdf_path = None
        
        # Re-score rewritten resume (lazy loaded)
        logger.info("Scoring rewritten resume")
        
        # Read rewritten text from DOCX
        docx_parser = get_docx_parser()
        rewritten_docx_result = docx_parser.parse(open(docx_path, 'rb').read())
        rewritten_text = rewritten_docx_result.get("raw_text", "")
        
        visibility_ranker = get_visibility_ranker()
        visibility_after = visibility_ranker.rank(rewritten_text, job_description)
        
        # Re-extract features for friendliness
        from app.services.features.extractor import FeatureExtractor
        feature_extractor = FeatureExtractor()
        rewritten_features = feature_extractor.extract_features(rewritten_docx_result)
        friendliness_classifier = get_friendliness_classifier()
        friendliness_after = friendliness_classifier.predict(rewritten_features)
        
        # Build response
        response = {
            "before_score": visibility_before.get("score", 0),
            "after_score": visibility_after.get("score", 0),
            "before_friendliness": friendliness_before.get("score", 0),
            "after_friendliness": friendliness_after.get("score", 0),
            "file_url": f"http://localhost:8000{final_file_url}", # Full URL for local dev
            "docx_path": str(docx_path),
            "pdf_path": str(pdf_path) if pdf_path else None,
            "original_text": text,  # Add original text for comparison
            "rewritten_text": rewritten_text,  # Add rewritten text for comparison
            "delta_report": {
                **delta_report,
                "score_improvement": visibility_after.get("score", 0) - visibility_before.get("score", 0),
                "friendliness_improvement": friendliness_after.get("score", 0) - friendliness_before.get("score", 0),
                "keywords_before": len(visibility_before.get("missing_keywords", [])),
                "keywords_after": len(visibility_after.get("missing_keywords", [])),
            },
            "explanations": explanations
        }
        
        logger.info(f"Rewrite complete. Score: {visibility_before.get('score', 0)} → {visibility_after.get('score', 0)}")
        
        return response
        
    except Exception as e:
        logger.error(f"Full rewrite failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Rewrite failed: {str(e)}")


# Keep legacy endpoint for backward compatibility
@router.post("/rewrite/ats_optimized")
async def rewrite_resume_legacy(resume_text: str = Form(...), jd_text: str = Form(...)):
    """Legacy endpoint - redirects to new implementation."""
    return {
        "status": "deprecated",
        "message": "Please use /rewrite/full endpoint with file upload",
        "optimized_content": None
    }


@router.post("/rewrite/brutal")
async def rewrite_with_brutal_feedback(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    company_name: Optional[str] = Form(None),
    user_id: str = Form("anonymous")
):
    """
    Rewrite resume with brutal hiring manager feedback.
    
    Args:
        file: Resume file (PDF or DOCX)
        job_description: Target job description
        user_id: User identifier
        
    Returns:
        Marked-up resume, changes, company expectations, and harsh review
    """
    try:
        warnings: List[str] = []
        # Read file
        file_bytes = await file.read()
        filename = file.filename
        
        # Parse file
        logger.info(f"Parsing resume for brutal review: {filename}")
        if file.filename.endswith('.pdf'):
            parser = get_pdf_parser()
        elif file.filename.endswith('.docx'):
            parser = get_docx_parser()
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF or DOCX.")
        
        parsing_result = parser.parse(file_bytes)
        original_text = parsing_result.get("raw_text", "")
        extracted_urls = [str(url).strip() for url in (parsing_result.get("extracted_urls") or []) if str(url).strip()]
        detected_profiles = _extract_profile_urls(original_text, extracted_urls)
        detected_linkedin_url = detected_profiles.get("linkedin_url")
        detected_github_url = detected_profiles.get("github_url")
        
        if not original_text:
            raise HTTPException(status_code=400, detail="Could not extract text from resume")
        
        # Get rewriter with brutal review capability
        logger.info("Generating brutal review")
        rewriter = get_rewriter()
        
        # Call brutal review with AI when available, fallback otherwise
        brutal_timeout = max(20.0, float(os.getenv("REWRITE_BRUTAL_TIMEOUT_SECONDS", "60")))
        fallback_timeout = max(5.0, float(os.getenv("REWRITE_BRUTAL_FALLBACK_TIMEOUT_SECONDS", "15")))
        try:
            brutal_result = await asyncio.wait_for(
                run_in_threadpool(
                    rewriter.rewrite_with_brutal_review,
                    original_text,
                    job_description,
                    company_name,
                    detected_linkedin_url=detected_linkedin_url,
                    detected_github_url=detected_github_url,
                ),
                timeout=brutal_timeout,
            )
        except asyncio.TimeoutError:
            logger.warning("Brutal rewrite timed out after %ss, forcing deterministic fallback.", brutal_timeout)
            warnings.append(
                "AI rewrite timed out. Returned deterministic fallback rewrite with practical fixes."
            )
            try:
                brutal_result = await asyncio.wait_for(
                    run_in_threadpool(
                        rewriter._fallback_brutal_review,
                        original_text,
                        job_description,
                        company_name,
                        detected_linkedin_url=detected_linkedin_url,
                        detected_github_url=detected_github_url,
                    ),
                    timeout=fallback_timeout,
                )
            except asyncio.TimeoutError:
                logger.warning(
                    "Fallback brutal rewrite also timed out after %ss. Returning minimal payload.",
                    fallback_timeout,
                )
                warnings.append(
                    "Fallback rewrite was slow. Returned minimal practical output; retry once for a richer result."
                )
                brutal_result = {
                    "plain_text": original_text,
                    "marked_up_resume": original_text,
                    "changes": [],
                    "company_expectations": {
                        "role_summary": "Role-fit signal could not be fully generated in time.",
                        "what_the_company_cares_about": [],
                        "ideal_candidate_snapshot": [],
                    },
                    "harsh_review": {
                        "overall_verdict": "Partial output due to timeout.",
                        "strengths": [],
                        "weaknesses": [
                            "Generation timed out before deep rewrite completed."
                        ],
                        "missing_or_weak_skills": [],
                        "risk_flags": ["timeout_partial_output"],
                        "would_I_interview_you": "maybe",
                        "rationale": "Retry once with the same JD for a complete AI rewrite.",
                        "top_3_actions": [
                            {
                                "action": "Retry the same run once",
                                "how_to_do_it": "Use the same resume and JD to reuse warm caches.",
                                "resources": [],
                                "time_estimate": "1 minute",
                                "what_helped_others": "Second run usually returns the full payload on warm instances.",
                            }
                        ],
                    },
                    "interview_prep": {},
                    "generation_mode": "fallback_timeout_minimal",
                }

            if isinstance(brutal_result, dict) and "generation_mode" not in brutal_result:
                brutal_result["generation_mode"] = "fallback_timeout"

        return {
            "plain_text": brutal_result.get("plain_text", ""),
            "marked_up_resume": brutal_result.get("marked_up_resume", ""),
            "changes": brutal_result.get("changes", []),
            "company_expectations": brutal_result.get("company_expectations", {}),
            "harsh_review": brutal_result.get("harsh_review", {}),
            "interview_prep": brutal_result.get("interview_prep", {}),
            "generation_mode": brutal_result.get("generation_mode", "fallback"),
            "warnings": warnings,
            "original_text": original_text,
            "detected_linkedin_url": detected_linkedin_url,
            "detected_github_url": detected_github_url,
        }
        
    except Exception as e:
        logger.error(f"Brutal review failed: {e}")
        raise HTTPException(status_code=500, detail=f"Brutal review failed: {str(e)}")
