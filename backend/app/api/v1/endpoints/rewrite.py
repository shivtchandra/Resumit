"""
AI-powered rewrite endpoint for resume optimization with Gemini
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import tempfile
import logging
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


class RewriteSectionRequest(BaseModel):
    """Request model for section rewrite"""
    layout_schema: Dict[str, Any]
    section_index: int
    job_description: str
    target_keywords: List[str]


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
        
        # Rewrite based on section type
        if section_type == "EXPERIENCE":
            # Rewrite experience entry
            rewriter = get_rewriter()
            # Assuming 'section_content' should be derived from 'section'
            # The original code used section["entries"][0]
            section_content = section.get("entries")[0] if section.get("entries") else {}
            result = rewriter.gemini_client.rewrite_experience_entry(
                entry=section_content,
                job_description=request.job_description or "",
                target_keywords=request.target_keywords or []
            )
            
            return {
                    "section_index": request.section_index,
                    "section_type": section_type,
                    "rewritten": result.get("bullets", []),
                    "explanation": result.get("explanation", "")
                }
        elif section_type == "SUMMARY":
            rewriter = get_rewriter() # Added lazy getter
            result = rewriter.gemini_client.rewrite_summary(
                section.get("raw", ""),
                request.job_description,
                request.target_keywords
            )
            return {
                "section_index": request.section_index,
                "section_type": section_type,
                "rewritten": result.get("content", ""),
                "explanation": result.get("explanation", "")
            }
        elif section_type == "SKILLS":
            rewriter = get_rewriter() # Added lazy getter
            result = rewriter.gemini_client.rewrite_skills(
                section.get("raw", ""),
                request.job_description,
                request.target_keywords
            )
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
        comprehensive_analyzer = get_comprehensive_analyzer() # Use lazy getter
        comprehensive_analysis = comprehensive_analyzer.analyze_comprehensive(text, job_description)
        
        # Extract layout schema
        logger.info("Extracting layout schema")
        schema_extractor = get_schema_extractor()
        layout_schema = schema_extractor.extract_from_parsed_data(parsing_result, filename) # Kept original method signature
        
        # Score original resume (lazy loaded)
        logger.info("Scoring original resume")
        
        # Get visibility score
        visibility_ranker = get_visibility_ranker()
        visibility_before = visibility_ranker.rank(raw_text, job_description)
        
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
        
        if not original_text:
            raise HTTPException(status_code=400, detail="Could not extract text from resume")
        
        # Get rewriter with brutal review capability
        logger.info("Generating brutal review")
        rewriter = get_rewriter()
        
        # Call the new brutal review method
        brutal_result = rewriter.ai_client.rewrite_with_brutal_review(
            original_resume_text=original_text,
            job_description=job_description
        )
        
        # Extract layout schema for rebuilding
        schema_extractor = get_schema_extractor()
        layout_schema = schema_extractor.extract_from_parsed_data(parsing_result, filename)
        
        # Build DOCX from plain_text (we'll need to update the schema with new text)
        # For now, just return the JSON response
        # TODO: Rebuild DOCX with marked-up content
        
        return {
            "plain_text": brutal_result.get("plain_text", ""),
            "marked_up_resume": brutal_result.get("marked_up_resume", ""),
            "changes": brutal_result.get("changes", []),
            "company_expectations": brutal_result.get("company_expectations", {}),
            "harsh_review": brutal_result.get("harsh_review", {}),
            "original_text": original_text
        }
        
    except Exception as e:
        logger.error(f"Brutal review failed: {e}")
        raise HTTPException(status_code=500, detail=f"Brutal review failed: {str(e)}")
