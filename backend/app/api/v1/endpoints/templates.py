"""
Template recommendation and export endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
from pathlib import Path

from app.core.supabase_client import get_templates, upload_file_to_storage, get_supabase_client

router = APIRouter()


class TemplateExportRequest(BaseModel):
    """Request model for template export"""
    template_id: str
    user_data: dict


@router.get("/templates/recommend")
async def recommend_templates(
    role: Optional[str] = None,
    ats_vendor: Optional[str] = None,
    experience_level: Optional[str] = None
):
    """
    Get recommended ATS-verified templates (Offline Mode).
    """
    # Hardcoded templates for Offline Mode
    templates = [
        {
            "id": "software-engineer-mid",
            "name": "Software Engineer - ATS Optimized",
            "role": "software-engineer",
            "experience_level": "mid",
            "ats_vendors": ["workday", "taleo", "greenhouse", "icims"],
            "ats_success_rate": 0.98,
            "preview_image_url": "https://via.placeholder.com/400x565.png?text=Software+Engineer+Template",
            "file_url": "#",
            "description": "Optimized for technical roles with clean skills section.",
            "sections": [
                {"name": "summary", "heading": "Professional Summary", "placeholder": "Summarize your technical experience...", "guidance": "Focus on languages and frameworks.", "order": 1},
                {"name": "experience", "heading": "Professional Experience", "placeholder": "List your roles...", "guidance": "Use STAR method.", "order": 2},
                {"name": "education", "heading": "Education", "placeholder": "Degree and University...", "guidance": "Include graduation year.", "order": 3},
                {"name": "skills", "heading": "Technical Skills", "placeholder": "Python, React, etc...", "guidance": "Group by category.", "order": 4},
                {"name": "projects", "heading": "Projects", "placeholder": "Key projects...", "guidance": "Link to GitHub if possible.", "order": 5}
            ]
        },
        {
            "id": "data-scientist-senior",
            "name": "Data Scientist - Research Focus",
            "role": "data-scientist",
            "experience_level": "senior",
            "ats_vendors": ["workday", "greenhouse"],
            "ats_success_rate": 0.96,
            "preview_image_url": "https://via.placeholder.com/400x565.png?text=Data+Scientist+Template",
            "file_url": "#",
            "description": "Highlighting publications and research impact.",
            "sections": [
                {"name": "summary", "heading": "Summary", "placeholder": "Research focus...", "guidance": "Mention key algorithms.", "order": 1},
                {"name": "experience", "heading": "Experience", "placeholder": "Data roles...", "guidance": "Quantify impact.", "order": 2},
                {"name": "education", "heading": "Education", "placeholder": "PhD/Masters...", "guidance": "Include thesis topic.", "order": 3},
                {"name": "skills", "heading": "Skills", "placeholder": "PyTorch, TensorFlow...", "guidance": "List ML libraries.", "order": 4}
            ]
        },
        {
            "id": "product-manager-mid",
            "name": "Product Manager - Strategic",
            "role": "product-manager",
            "experience_level": "mid",
            "ats_vendors": ["taleo", "workday"],
            "ats_success_rate": 0.95,
            "preview_image_url": "https://via.placeholder.com/400x565.png?text=Product+Manager+Template",
            "file_url": "#",
            "description": "Focus on product lifecycle and metrics.",
            "sections": [
                {"name": "summary", "heading": "Summary", "placeholder": "Product philosophy...", "guidance": "Mention user growth.", "order": 1},
                {"name": "experience", "heading": "Experience", "placeholder": "PM roles...", "guidance": "Focus on launches.", "order": 2},
                {"name": "skills", "heading": "Skills", "placeholder": "Jira, Agile...", "guidance": "List tools.", "order": 3}
            ]
        },
        {
            "id": "designer-ux-mid",
            "name": "UX Designer - Portfolio",
            "role": "designer",
            "experience_level": "mid",
            "ats_vendors": ["greenhouse", "lever"],
            "ats_success_rate": 0.92,
            "preview_image_url": "https://via.placeholder.com/400x565.png?text=Designer+Template",
            "file_url": "#",
            "description": "Clean layout emphasizing portfolio links.",
            "sections": [
                {"name": "summary", "heading": "Summary", "placeholder": "Design approach...", "guidance": "Link portfolio.", "order": 1},
                {"name": "experience", "heading": "Experience", "placeholder": "Design roles...", "guidance": "Mention tools (Figma).", "order": 2},
                {"name": "skills", "heading": "Skills", "placeholder": "Figma, Adobe...", "guidance": "List software.", "order": 3}
            ]
        }
    ]

    # Filter logic
    filtered = templates
    if role:
        filtered = [t for t in filtered if t['role'] == role]
    if ats_vendor:
        filtered = [t for t in filtered if ats_vendor in t['ats_vendors']]
    if experience_level:
        filtered = [t for t in filtered if t['experience_level'] == experience_level]

    return {
        "templates": filtered,
        "count": len(filtered)
    }

@router.post("/templates/export")
async def export_template(request: TemplateExportRequest):
    """
    Generate filled DOCX/PDF from template.
    """
    raise HTTPException(
        status_code=501,
        detail="Template export not yet implemented. Coming soon!"
    )

@router.get("/templates/{template_id}")
async def get_template_details(template_id: str):
    """
    Get detailed information about a specific template (Offline Mode).
    """
    # Reuse the same hardcoded list
    all_templates = await recommend_templates()
    templates = all_templates['templates']
    
    template = next((t for t in templates if t['id'] == template_id), None)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template
