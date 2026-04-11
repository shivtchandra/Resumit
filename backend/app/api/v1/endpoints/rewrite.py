"""
AI-powered rewrite endpoint for resume optimization with Gemini
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import asyncio
import tempfile
import logging
import re
import json
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
from app.services.research.reddit_company_evidence import fetch_reddit_company_evidence
from app.services.research.jd_url_fetch import resolve_job_description_if_url

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

def get_openai_client():
    if 'openai_client' not in _rewrite_services:
        from app.services.rewrite.openai_client import OpenAIClient
        _rewrite_services['openai_client'] = OpenAIClient()
    return _rewrite_services['openai_client']


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
    request: Request,
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
        job_description = await _resolve_form_job_description(job_description)
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
        public_file_url = f"{str(request.base_url).rstrip('/')}{final_file_url}"
        response = {
            "before_score": visibility_before.get("score", 0),
            "after_score": visibility_after.get("score", 0),
            "before_friendliness": friendliness_before.get("score", 0),
            "after_friendliness": friendliness_after.get("score", 0),
            "file_url": public_file_url,
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
        
    except HTTPException:
        raise
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
        job_description = await _resolve_form_job_description(job_description)
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

        # Compute alignment and ATS scores using existing services
        alignment_score = 0.0
        ats_score = 0.0
        matched_keywords: List[str] = []
        missing_keywords: List[str] = []
        try:
            visibility_ranker = get_visibility_ranker()
            visibility_result = visibility_ranker.rank(original_text, job_description)
            alignment_score = round(visibility_result.get("score", 0) or 0, 1)
            # Use rewriter's better keyword extractor for display (it filters noise)
            rewriter_tmp = get_rewriter()
            all_jd_kw = rewriter_tmp._extract_jd_keywords(job_description, limit=20)
            resume_lower = original_text.lower()
            for kw in all_jd_kw:
                if rewriter_tmp._signal_present(resume_lower, kw):
                    matched_keywords.append(kw)
                else:
                    missing_keywords.append(kw)
        except Exception as exc:
            logger.warning("Alignment score computation skipped: %s", exc)

        try:
            from app.services.features.extractor import FeatureExtractor
            feature_extractor = FeatureExtractor()
            features = feature_extractor.extract_features(parsing_result)
            friendliness_classifier = get_friendliness_classifier()
            friendliness_result = friendliness_classifier.predict(features)
            ats_score = round(friendliness_result.get("score", 0), 1)
        except Exception as exc:
            logger.warning("ATS score computation skipped: %s", exc)
        
        # Get rewriter with brutal review capability
        logger.info("Generating brutal review")
        rewriter = get_rewriter()
        
        # Call brutal review — no timeout, let AI take as long as it needs
        brutal_result = await run_in_threadpool(
            rewriter.rewrite_with_brutal_review,
            original_text,
            job_description,
            company_name,
            detected_linkedin_url=detected_linkedin_url,
            detected_github_url=detected_github_url,
        )

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
            "alignment_score": alignment_score,
            "ats_score": ats_score,
            "matched_keywords": matched_keywords,
            "missing_keywords": missing_keywords,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Brutal review failed: {e}")
        raise HTTPException(status_code=500, detail=f"Brutal review failed: {str(e)}")


async def _resolve_form_job_description(job_description: str) -> str:
    """
    Normalize multipart `job_description`: plain text unchanged, or fetch when the field is a single URL.
    """
    raw = (job_description or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail="job_description is empty")
    try:
        resolved = await run_in_threadpool(resolve_job_description_if_url, raw)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    resolved = (resolved or "").strip()
    if not resolved:
        raise HTTPException(status_code=400, detail="job_description is empty after resolving URL")
    return resolved


async def _match_fix_reddit_evidence(
    company_name: Optional[str], target_role: Optional[str]
) -> str:
    """Best-effort Reddit snippets for `company_insights` (empty if disabled or on failure)."""
    name = (company_name or "").strip()
    if len(name) < 2:
        return ""
    try:
        return await run_in_threadpool(
            fetch_reddit_company_evidence,
            name,
            (target_role or "").strip(),
        )
    except Exception as exc:
        logger.warning("Match & Fix Reddit evidence skipped: %s", exc)
        return ""


def _match_fix_envelope(
    *,
    filename: str,
    original_text: str,
    job_description: str,
    target_role: Optional[str],
    company_name: Optional[str],
    parsing_result: Dict[str, Any],
    detected_profiles: Dict[str, Any],
    report: Dict[str, Any],
) -> Dict[str, Any]:
    """Shared response shape for Match & Fix (sync + stream)."""
    alignment_score = None
    ats_score = None
    missing_keywords: List[str] = []
    matched_keywords: List[str] = []
    try:
        visibility_ranker = get_visibility_ranker()
        visibility_result = visibility_ranker.rank(original_text, job_description)
        alignment_score = round(float(visibility_result.get("score", 0) or 0), 1)
        missing_keywords = visibility_result.get("missing_keywords", [])[:20]
        if isinstance(visibility_result.get("matched_phrases"), list):
            matched_keywords = [str(k).strip() for k in visibility_result.get("matched_phrases", []) if str(k).strip()][:20]
    except Exception as exc:
        logger.warning("Match & Fix scoring snapshot skipped: %s", exc)

    try:
        from app.services.features.extractor import FeatureExtractor
        feature_extractor = FeatureExtractor()
        features = feature_extractor.extract_features(parsing_result)
        friendliness_classifier = get_friendliness_classifier()
        friendliness_result = friendliness_classifier.predict(features)
        ats_score = round(float(friendliness_result.get("score", 0) or 0), 1)
    except Exception as exc:
        logger.warning("Match & Fix ATS snapshot skipped: %s", exc)

    return {
        "generation_mode": "openai",
        "filename": filename,
        "target_role": (target_role or "").strip(),
        "company_name": (company_name or "").strip(),
        "detected_linkedin_url": detected_profiles.get("linkedin_url"),
        "detected_github_url": detected_profiles.get("github_url"),
        "alignment_score": alignment_score,
        "ats_score": ats_score,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "report": report,
    }


@router.post("/rewrite/match-fix")
async def rewrite_match_fix(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    target_role: Optional[str] = Form(None),
    company_name: Optional[str] = Form(None),
    user_id: str = Form("anonymous"),
):
    """
    Generate structured Match & Fix report using OpenAI.

    Returns:
      - JD requirements
      - resume matches
      - misses/gaps
      - recommended resume edits
      - suggested projects/certifications
      - action plan
    """
    try:
        job_description = await _resolve_form_job_description(job_description)
        file_bytes = await file.read()
        filename = file.filename or "resume"
        lower_name = filename.lower()

        if lower_name.endswith(".pdf"):
            parser = get_pdf_parser()
        elif lower_name.endswith(".docx"):
            parser = get_docx_parser()
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF or DOCX.")

        parsing_result = parser.parse(file_bytes)
        original_text = parsing_result.get("raw_text", "")
        if not original_text:
            raise HTTPException(status_code=400, detail="Could not extract text from resume")

        extracted_urls = [str(url).strip() for url in (parsing_result.get("extracted_urls") or []) if str(url).strip()]
        detected_profiles = _extract_profile_urls(original_text, extracted_urls)

        # Ensure this route uses OpenAI (not Gemini fallback).
        try:
            ai_client = get_openai_client()
        except Exception as exc:
            logger.error("OpenAI Match & Fix unavailable: %s", exc)
            raise HTTPException(
                status_code=503,
                detail="OpenAI is not configured. Set OPENAI_API_KEY and retry.",
            )

        reddit_evidence = await _match_fix_reddit_evidence(company_name, target_role)
        report = await run_in_threadpool(
            ai_client.generate_match_fix_report,
            original_text,
            job_description,
            target_role,
            company_name,
            reddit_evidence,
        )

        return _match_fix_envelope(
            filename=filename,
            original_text=original_text,
            job_description=job_description,
            target_role=target_role,
            company_name=company_name,
            parsing_result=parsing_result,
            detected_profiles=detected_profiles,
            report=report,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Match & Fix failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Match & Fix failed: {str(e)}")


@router.post("/rewrite/match-fix/stream")
async def rewrite_match_fix_stream(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    target_role: Optional[str] = Form(None),
    company_name: Optional[str] = Form(None),
    user_id: str = Form("anonymous"),
):
    """
    Same inputs as /rewrite/match-fix; streams OpenAI output as SSE (delta tokens),
    then sends a final `result` event with the full JSON body (report + ATS / alignment).
    """
    try:
        job_description = await _resolve_form_job_description(job_description)
        file_bytes = await file.read()
        filename = file.filename or "resume"
        lower_name = filename.lower()

        if lower_name.endswith(".pdf"):
            parser = get_pdf_parser()
        elif lower_name.endswith(".docx"):
            parser = get_docx_parser()
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF or DOCX.")

        parsing_result = parser.parse(file_bytes)
        original_text = parsing_result.get("raw_text", "")
        if not original_text:
            raise HTTPException(status_code=400, detail="Could not extract text from resume")

        extracted_urls = [str(url).strip() for url in (parsing_result.get("extracted_urls") or []) if str(url).strip()]
        detected_profiles = _extract_profile_urls(original_text, extracted_urls)

        try:
            ai_client = get_openai_client()
        except Exception as exc:
            logger.error("OpenAI Match & Fix stream unavailable: %s", exc)
            raise HTTPException(
                status_code=503,
                detail="OpenAI is not configured. Set OPENAI_API_KEY and retry.",
            )

        reddit_evidence = await _match_fix_reddit_evidence(company_name, target_role)

        def sse_gen():
            final_report: Optional[Dict[str, Any]] = None
            try:
                for line in ai_client.iter_match_fix_sse(
                    original_text,
                    job_description,
                    target_role,
                    company_name,
                    reddit_evidence,
                ):
                    yield line
                    if line.startswith("data:"):
                        try:
                            obj = json.loads(line[5:].strip())
                        except json.JSONDecodeError:
                            continue
                        if obj.get("type") == "report":
                            final_report = obj.get("report")
                if final_report is not None:
                    envelope = _match_fix_envelope(
                        filename=filename,
                        original_text=original_text,
                        job_description=job_description,
                        target_role=target_role,
                        company_name=company_name,
                        parsing_result=parsing_result,
                        detected_profiles=detected_profiles,
                        report=final_report,
                    )
                    yield f"data: {json.dumps({'type': 'result', 'data': envelope}, ensure_ascii=False)}\n\n"
            except Exception as exc:
                logger.error("Match & Fix stream failed: %s", exc, exc_info=True)
                yield f"data: {json.dumps({'type': 'error', 'message': str(exc)}, ensure_ascii=False)}\n\n"

        return StreamingResponse(
            sse_gen(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Match & Fix stream failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Match & Fix stream failed: {str(e)}")
