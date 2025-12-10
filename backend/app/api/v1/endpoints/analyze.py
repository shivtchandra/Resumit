"""
Enhanced analysis endpoint for ATS Emulator V2
Provides complete analysis matching frontend dashboard expectations
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import json

from app.services.ingestion.pdf_parser import PDFParser
from app.services.ingestion.docx_parser import DOCXParser
from app.services.features.extractor import FeatureExtractor
from app.services.ml.friendliness_classifier import FriendlinessClassifier
from app.services.ml.visibility_ranker import VisibilityRanker
from app.core.supabase_client import store_analysis, get_templates

router = APIRouter()

# Initialize services
pdf_parser = PDFParser()
docx_parser = DOCXParser()
feature_extractor = FeatureExtractor()
friendliness_classifier = FriendlinessClassifier()
visibility_ranker = VisibilityRanker()


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
        "contact": contact
    }


@router.post("/analyze/full")
async def full_analysis(
    file: UploadFile = File(...),
    job_description: Optional[str] = Form(None),
    target_role: Optional[str] = Form(None),
    target_ats: str = Form("all")
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
        features = feature_extractor.extract_features(parsing_result)
        
        # 3. ATS Friendliness
        friendliness_result = friendliness_classifier.predict(features)
        friendliness_score = friendliness_result.get("score", 0)
        
        # 4. Visibility Ranking (if JD provided)
        match_score = None
        visibility_result = None
        
        if job_description:
            resume_text = parsing_result.get("raw_text", "")
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
            templates = await get_templates(role=target_role, ats_vendor=target_ats)
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
        
        # 7. Prepare response
        response = {
            "filename": file.filename,
            "file_size_bytes": len(content),
            "friendliness_score": friendliness_score,
            "match_score": match_score,
            "vendor_compatibility": vendor_compatibility,
            "critical_issues": critical_issues,
            "ats_extracted": ats_extracted,
            "timeline": features.get("timeline", {}),
            "recommendations": recommendations,
            "visibility_breakdown": visibility_result.get("breakdown", {}) if visibility_result else None,
            "missing_keywords": visibility_result.get("missing_keywords", [])[:10] if visibility_result else []
        }
        
        # 8. Store in Supabase (async, don't block response)
        try:
            await store_analysis({
                "filename": file.filename,
                "file_size_bytes": len(content),
                "friendliness_score": friendliness_score,
                "match_score": match_score,
                "result_json": response,
                "resume_text": parsing_result.get("raw_text", "")
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
        
    features = feature_extractor.extract_features(parsing_result)
    friendliness_result = friendliness_classifier.predict(features)
    
    visibility_result = None
    if jd_text:
        resume_text = parsing_result.get("raw_text", "")
        visibility_result = visibility_ranker.rank(resume_text, jd_text)
    
    return {
        "filename": file.filename,
        "parsing_result": parsing_result,
        "features": features,
        "ats_friendliness": friendliness_result,
        "visibility_rank": visibility_result
    }
