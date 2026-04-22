"""
User resume storage endpoints for the Resumit Chrome Extension.
Allows authenticated users to CRUD their resumes stored in Supabase.
"""
import io
import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Header
from fastapi.responses import JSONResponse

from app.core.supabase_client import get_supabase_client, _is_supabase_configured

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Auth dependency ──────────────────────────────────────────────────────────

async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Verify Supabase JWT from Authorization: Bearer <token> header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.split(" ", 1)[1]

    if not _is_supabase_configured():
        raise HTTPException(status_code=503, detail="Auth service not configured")

    try:
        client = get_supabase_client()
        user_response = client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_response.user.id, "email": user_response.user.email}
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Token verification failed: %s", e)
        raise HTTPException(status_code=401, detail="Token verification failed")


# ── Resume text extraction ───────────────────────────────────────────────────

async def _extract_text(file: UploadFile) -> str:
    """Extract plain text from uploaded PDF, DOCX, or TXT resume."""
    content = await file.read()
    filename = (file.filename or "").lower()

    if filename.endswith(".txt"):
        return content.decode("utf-8", errors="replace")

    if filename.endswith(".pdf"):
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                return "\n".join(page.extract_text() or "" for page in pdf.pages)
        except ImportError:
            try:
                import PyPDF2
                reader = PyPDF2.PdfReader(io.BytesIO(content))
                return "\n".join(page.extract_text() or "" for page in reader.pages)
            except Exception as e:
                raise HTTPException(status_code=422, detail=f"Could not parse PDF: {e}")

    if filename.endswith(".docx"):
        try:
            import docx
            doc = docx.Document(io.BytesIO(content))
            return "\n".join(p.text for p in doc.paragraphs)
        except ImportError:
            raise HTTPException(status_code=422, detail="DOCX parsing not available on this server")

    # Try treating as plain text (last resort)
    try:
        return content.decode("utf-8", errors="replace")
    except Exception:
        raise HTTPException(status_code=422, detail="Unsupported file format")


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/users/resumes")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload and store a resume for the authenticated user."""
    user_id = current_user["user_id"]
    filename = file.filename or "resume"

    resume_text = await _extract_text(file)

    if len(resume_text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Could not extract meaningful text from the resume file")

    if not _is_supabase_configured():
        raise HTTPException(status_code=503, detail="Storage not configured")

    client = get_supabase_client()
    result = client.table("user_resumes").insert({
        "user_id": user_id,
        "filename": filename,
        "resume_text": resume_text[:50000],  # cap at 50k chars
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to store resume")

    return JSONResponse(result.data[0])


@router.get("/users/resumes")
async def list_resumes(current_user: dict = Depends(get_current_user)):
    """List all resumes for the authenticated user."""
    user_id = current_user["user_id"]

    if not _is_supabase_configured():
        return {"resumes": []}

    client = get_supabase_client()
    result = (
        client.table("user_resumes")
        .select("id, filename, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"resumes": result.data or []}


@router.get("/users/resumes/{resume_id}")
async def get_resume(
    resume_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a specific resume (with text) for the authenticated user."""
    user_id = current_user["user_id"]
    client = get_supabase_client()
    result = (
        client.table("user_resumes")
        .select("*")
        .eq("id", resume_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Resume not found")
    return result.data


@router.delete("/users/resumes/{resume_id}")
async def delete_resume(
    resume_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a resume for the authenticated user."""
    user_id = current_user["user_id"]
    client = get_supabase_client()
    client.table("user_resumes").delete().eq("id", resume_id).eq("user_id", user_id).execute()
    return {"ok": True}
