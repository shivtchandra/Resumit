from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import analyze, rewrite, templates, export, github

app = FastAPI(title="ATS Emulator V2 API")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api/v1", tags=["analyze"])
app.include_router(rewrite.router, prefix="/api/v1", tags=["rewrite"])
app.include_router(templates.router, prefix="/api/v1", tags=["templates"])
app.include_router(export.router, prefix="/api/v1", tags=["export"])
app.include_router(github.router, prefix="/api/v1", tags=["github"])

@app.get("/")
async def root():
    return {"message": "ATS Emulator V2 API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}

