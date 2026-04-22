import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env if present
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

from app.api.v1.endpoints import analyze, rewrite, templates, export, github, settings, users, questions
from app.core.supabase_client import get_analysis_count

app = FastAPI(title="ATS Emulator V2 API")

# Expose rewritten files for download.
output_dir = Path("outputs")
output_dir.mkdir(exist_ok=True)
app.mount("/outputs", StaticFiles(directory=str(output_dir)), name="outputs")

def _normalize_origin(origin: str) -> str:
    return origin.strip().rstrip("/")


def _build_cors_origins() -> list[str]:
    origins = {
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://localhost:3000",
        "https://localhost:5173",
        "https://localhost:5174",
        # Current production frontend origin (Vercel)
        "https://resumit-kappa.vercel.app",
    }

    # Comma-separated list preferred for deployment environments.
    raw_cors_origins = os.getenv("CORS_ORIGINS", "")
    if raw_cors_origins:
        for origin in raw_cors_origins.split(","):
            cleaned = _normalize_origin(origin)
            if cleaned:
                origins.add(cleaned)

    # Single-origin convenience envs.
    for env_key in ("FRONTEND_URL", "FRONTEND_ORIGIN", "RENDER_EXTERNAL_URL"):
        value = _normalize_origin(os.getenv(env_key, ""))
        if value:
            origins.add(value)

    return sorted(origins)


allow_all_origins = os.getenv("CORS_ALLOW_ALL", "false").lower() == "true"
cors_origins = _build_cors_origins()
cors_origin_regex = os.getenv("CORS_ORIGIN_REGEX", "").strip() or r"^https://[a-z0-9-]+\.vercel\.app$"

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all_origins else cors_origins,
    allow_origin_regex=None if allow_all_origins else cors_origin_regex,
    allow_credentials=not allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api/v1", tags=["analyze"])
app.include_router(rewrite.router, prefix="/api/v1", tags=["rewrite"])
app.include_router(templates.router, prefix="/api/v1", tags=["templates"])
app.include_router(export.router, prefix="/api/v1", tags=["export"])
app.include_router(github.router, prefix="/api/v1", tags=["github"])
app.include_router(settings.router, prefix="/api/v1", tags=["settings"])
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(questions.router, prefix="/api/v1", tags=["questions"])

@app.get("/")
@app.head("/")
async def root():
    return {"message": "ATS Emulator V2 API is running"}

@app.get("/health")
@app.head("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}

@app.get("/api/v1/stats")
async def get_stats():
    count = await get_analysis_count()
    return {"analyses_count": count}
