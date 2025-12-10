from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tempfile
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
# Get the directory where this file (main.py) is located
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Import services
from app.services.ingestion.pdf_parser import PDFParser
from app.services.features.extractor import FeatureExtractor
from app.services.ml.ml_friendliness_classifier import MLFriendlinessClassifier
from app.services.ml.visibility_scorer import VisibilityScorer
from app.services.ml.generative_feedback import GenerativeFeedback

from fastapi.staticfiles import StaticFiles
from app.api.v1.endpoints import rewrite

app = FastAPI(title="ATS Emulator API", version="3.0")

# Mount static files for downloads
output_dir = Path("outputs")
output_dir.mkdir(exist_ok=True)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(rewrite.router, prefix="/api/v1", tags=["rewrite"])

# Service instances (lazy loaded)
_services = {}

def get_pdf_parser():
    if 'pdf_parser' not in _services:
        _services['pdf_parser'] = PDFParser()
    return _services['pdf_parser']

def get_feature_extractor():
    if 'feature_extractor' not in _services:
        _services['feature_extractor'] = FeatureExtractor()
    return _services['feature_extractor']

def get_friendliness_classifier():
    if 'friendliness_classifier' not in _services:
        _services['friendliness_classifier'] = MLFriendlinessClassifier(use_ml=True)
    return _services['friendliness_classifier']

def get_visibility_scorer():
    if 'visibility_scorer' not in _services:
        _services['visibility_scorer'] = VisibilityScorer()
    return _services['visibility_scorer']

def get_generative_feedback():
    if 'generative_feedback' not in _services:
        _services['generative_feedback'] = GenerativeFeedback()
    return _services['generative_feedback']

@app.get("/")
async def root():
    return {"message": "ATS Emulator API v3.0 - Operation ATS Heist"}

@app.get("/health")
async def health():
    return {"status": "operational", "version": "3.0"}

@app.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form(None)
):
    """
    Analyze a resume and optionally compare to job description.
    
    Returns:
        - features: Extracted features (NER, timeline, category, etc.)
        - friendliness: ATS friendliness score and risks
        - relevance: Job matching score (if JD provided)
        - ai_insights: Qualitative feedback
    """
    try:
        # Read file content
        content = await file.read()

        # Parse PDF (lazy loaded)
        pdf_parser = get_pdf_parser()
        parsing_result = pdf_parser.parse(content)
        
        # Extract features (lazy loaded)
        feature_extractor = get_feature_extractor()
        features = feature_extractor.extract_features(parsing_result)
        
        # Get friendliness score (lazy loaded)
        friendliness_classifier = get_friendliness_classifier()
        friendliness = friendliness_classifier.predict(features)
        
        # Get relevance score if JD provided (lazy loaded)
        relevance = None
        if job_description:
            raw_text = parsing_result.get("raw_text", "")
            visibility_scorer = get_visibility_scorer()
            relevance = visibility_scorer.predict(raw_text, job_description)
            
        # Generate AI Insights (lazy loaded)
        generative_feedback = get_generative_feedback()
        ai_insights = generative_feedback.generate_feedback(features, friendliness, relevance)
        
        return JSONResponse({
            "features": features,
            "friendliness": friendliness,
            "relevance": relevance,
            "ai_insights": ai_insights
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
