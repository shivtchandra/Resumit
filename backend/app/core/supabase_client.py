"""
Supabase client configuration for ATS Emulator V2
"""
import os
from supabase import create_client, Client
from typing import Optional

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# Initialize client
supabase: Optional[Client] = None

def get_supabase_client(use_service_key: bool = False) -> Client:
    """
    Get Supabase client instance.
    
    Args:
        use_service_key: If True, use service key for admin operations
    
    Returns:
        Supabase client instance
    """
    global supabase
    
    if not SUPABASE_URL:
        raise ValueError("SUPABASE_URL environment variable not set")
    
    key = SUPABASE_SERVICE_KEY if use_service_key else SUPABASE_ANON_KEY
    
    if not key:
        raise ValueError("Supabase key not set in environment variables")
    
    if supabase is None:
        supabase = create_client(SUPABASE_URL, key)
    
    return supabase


async def store_analysis(analysis_data: dict) -> str:
    """
    Store analysis result in Supabase.
    
    Args:
        analysis_data: Analysis result dictionary
    
    Returns:
        Analysis ID
    """
    client = get_supabase_client()
    
    result = client.table("analyses").insert({
        "filename": analysis_data.get("filename"),
        "file_size_bytes": analysis_data.get("file_size_bytes"),
        "friendliness_score": analysis_data.get("friendliness_score"),
        "match_score": analysis_data.get("match_score"),
        "result_json": analysis_data.get("result_json"),
        "resume_text": analysis_data.get("resume_text", "")[:10000]  # Truncate for storage
    }).execute()
    
    return result.data[0]["id"] if result.data else None


async def get_templates(role: str = None, ats_vendor: str = None, experience_level: str = None):
    """
    Query templates from Supabase with filters.
    
    Args:
        role: Target role filter
        ats_vendor: ATS vendor filter
        experience_level: Experience level filter
    
    Returns:
        List of matching templates
    """
    client = get_supabase_client()
    
    query = client.table("templates").select("*")
    
    if role and role != "all":
        query = query.eq("role", role)
    
    if ats_vendor and ats_vendor != "all":
        query = query.contains("ats_vendors", [ats_vendor])
    
    if experience_level and experience_level != "all":
        query = query.eq("experience_level", experience_level)
    
    query = query.order("historical_score", desc=True).limit(20)
    
    result = query.execute()
    return result.data if result.data else []


async def upload_file_to_storage(bucket: str, file_path: str, file_bytes: bytes) -> str:
    """
    Upload file to Supabase storage.
    
    Args:
        bucket: Storage bucket name
        file_path: Path within bucket
        file_bytes: File content
    
    Returns:
        Public URL of uploaded file
    """
    client = get_supabase_client(use_service_key=True)
    
    result = client.storage.from_(bucket).upload(
        file_path,
        file_bytes,
        {"content-type": "application/octet-stream"}
    )
    
    if result:
        return client.storage.from_(bucket).get_public_url(file_path)
    
    return None
