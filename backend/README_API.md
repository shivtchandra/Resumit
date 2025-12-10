# ATS Emulator V2 - Backend Setup Guide

## Overview
Backend API for ATS Emulator V2 with resume parsing, ML analysis, and AI-powered optimization.

## Features
- **Resume Analysis**: PDF/DOCX parsing with ATS friendliness scoring
- **Job Matching**: Semantic + keyword matching against job descriptions
- **Vendor Compatibility**: Workday, Taleo, Greenhouse, iCIMS specific checks
- **AI Rewrite**: Gemini/GPT-4 powered resume optimization
- **Template System**: ATS-verified resume templates
- **Supabase Integration**: Database and file storage

## Quick Start

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements-api.txt
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env
# Edit .env with your credentials
```

Required variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_KEY`: Supabase service key
- `GEMINI_API_KEY` or `OPENAI_API_KEY`: AI provider key

### 3. Set Up Supabase Database
1. Go to your Supabase project SQL Editor
2. Run the SQL from `supabase_schema.sql`
3. Create storage buckets:
   - `resumes` (30-day auto-delete)
   - `templates` (permanent)
   - `exports` (7-day auto-delete)

### 4. Run the Server
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Analysis
- `POST /api/v1/analyze/full` - Complete ATS analysis
  - Upload resume file (PDF/DOCX)
  - Optional job description
  - Returns: scores, issues, vendor compatibility, extracted data

### Templates
- `GET /api/v1/templates/recommend` - Get ATS-verified templates
  - Query params: `role`, `ats_vendor`, `experience_level`
- `GET /api/v1/templates/{template_id}` - Get template details
- `POST /api/v1/templates/export` - Generate filled template (coming soon)

### Rewrite
- `POST /api/v1/rewrite/section` - AI-powered section rewrite
  - Body: `{section, content, job_description, ats_rules}`
  - Returns: original, rewritten, improvements

### Health
- `GET /health` - Health check

## Testing

### Test Analysis Endpoint
```bash
curl -X POST http://localhost:8000/api/v1/analyze/full \
  -F "file=@test_resume.pdf" \
  -F "job_description=Software Engineer with Python..."
```

### Test Templates Endpoint
```bash
curl "http://localhost:8000/api/v1/templates/recommend?role=software-engineer&ats_vendor=workday"
```

### Test Rewrite Endpoint
```bash
curl -X POST http://localhost:8000/api/v1/rewrite/section \
  -H "Content-Type: application/json" \
  -d '{
    "section": "summary",
    "content": "Experienced software engineer...",
    "job_description": "Looking for Python developer..."
  }'
```

## Architecture

```
backend/
├── app/
│   ├── api/v1/endpoints/
│   │   ├── analyze.py       # Analysis endpoints
│   │   ├── templates.py     # Template endpoints
│   │   └── rewrite.py       # Rewrite endpoints
│   ├── core/
│   │   └── supabase_client.py  # Supabase integration
│   ├── services/
│   │   ├── ingestion/       # PDF/DOCX parsers
│   │   ├── features/        # Feature extraction
│   │   ├── ml/              # ML models
│   │   └── export/          # Template generation
│   └── main.py              # FastAPI app
├── supabase_schema.sql      # Database schema
├── requirements-api.txt     # Dependencies
└── .env.example             # Environment template
```

## Response Examples

### Analysis Response
```json
{
  "filename": "resume.pdf",
  "friendliness_score": 87,
  "match_score": 82,
  "vendor_compatibility": {
    "workday": {"status": "pass", "issues": []},
    "taleo": {"status": "pass", "issues": []},
    "greenhouse": {"status": "pass", "issues": []},
    "icims": {"status": "warning", "issues": ["fragmentation"]}
  },
  "critical_issues": [
    {
      "severity": "warning",
      "type": "DETECTED_TEXT_TABLES",
      "title": "Complex table formatting detected",
      "description": "Tables often fail to parse correctly",
      "fix_suggestions": ["Remove tables", "Convert to bullets"]
    }
  ],
  "ats_extracted": {
    "skills": ["Python", "JavaScript", "React"],
    "job_titles": ["Senior Software Engineer"],
    "education": ["B.S. Computer Science"],
    "contact": ["email@example.com", "(555) 123-4567"]
  },
  "recommendations": [
    {
      "type": "template",
      "template_id": "software_engineer_clean",
      "message": "Try our Software Engineer - Clean template"
    }
  ]
}
```

## Development

### Run Tests
```bash
pytest backend/tests/
```

### Code Style
```bash
black app/
flake8 app/
```

## Troubleshooting

### Supabase Connection Issues
- Verify `SUPABASE_URL` and keys in `.env`
- Check Supabase project is active
- Ensure database schema is created

### AI API Errors
- Verify API key is set correctly
- Check API quota/billing
- Fallback to rule-based suggestions if no API key

### Import Errors
- Ensure all dependencies are installed
- Check Python version (3.8+)
- Verify virtual environment is activated

## Next Steps
1. Run the SQL schema in Supabase
2. Set environment variables
3. Test endpoints with sample resume
4. Connect frontend to API
5. Deploy to production

## Support
For issues or questions, check the implementation plan or contact the development team.
