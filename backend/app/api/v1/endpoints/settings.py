"""
Runtime settings endpoint for frontend configuration.
"""
from fastapi import APIRouter
import os

router = APIRouter()


@router.get("/settings")
async def get_settings():
    """
    Return non-sensitive runtime feature flags.
    """
    return {
        "app_name": "ATS Emulator V2",
        "version": "2.0.0",
        "features": {
            "analysis": True,
            "template_selection": True,
            "rewrite": True,
            "github_intel": True,
            "linkedin_intel": True,
            "brutal_feedback": True,
        },
        "providers": {
            "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
            "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        },
    }

