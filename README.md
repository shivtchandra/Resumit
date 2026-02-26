# Resumit (ATS Emulator V2)

Resumit is a full-stack resume optimization app that helps users:
- analyze resume ATS compatibility,
- get practical rewrite suggestions,
- compare template options,
- and turn GitHub projects into role-specific resume proof.

It includes a FastAPI backend (analysis + AI services) and a React/Vite frontend.

## Core Features

- Resume analysis with ATS friendliness scoring
- Async job-based analysis flow for long-running requests
- Resume rewrite workflows (section and full rewrite)
- Role-based template recommendations
- GitHub repository analysis for resume proof strategy
- PDF export endpoint for generated resume content

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Axios, Framer Motion
- Backend: FastAPI, Uvicorn, scikit-learn, Supabase, OpenAI/Gemini integrations
- Deployment: Vercel (frontend), Render (backend)

## Repository Structure

```text
resume/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/      # analyze, rewrite, templates, github, export, settings
│   │   ├── services/              # ingestion, ML, rewrite, github, export, compliance
│   │   └── core/                  # Supabase client and shared backend config
│   ├── data/models/               # trained ML artifacts
│   ├── templates/                 # ATS template markdown files
│   ├── previews/                  # generated template preview PDFs
│   ├── requirements*.txt
│   ├── supabase_schema.sql
│   └── README_API.md
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Landing, Analysis, Templates, GitHub, Optimization Hub
│   │   ├── components/
│   │   ├── services/api.ts
│   │   └── types/
│   ├── package.json
│   └── vercel.json
├── .github/workflows/keep-awake.yml
└── start.sh                        # starts backend + frontend locally
```

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.9+
- `pip` and `venv`

### 1) Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-api.txt
cp .env.example .env
```

Start backend:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`.

### 2) Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend will be available at `http://localhost:5173`.

### 3) Start both services (optional)

From project root:

```bash
./start.sh
```

## Environment Variables

### Backend (`backend/.env`)

Commonly used variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `OPENAI_API_KEY` and/or `GEMINI_API_KEY`
- `GITHUB_TOKEN` (optional but recommended for higher GitHub API limits)
- `FIRECRAWL_API_KEY` (optional; used for enhanced GitHub/profile scraping)

See `backend/.env.example` for the full list, including model/time budget tuning variables.

### Frontend (`frontend/.env`)

- `VITE_API_URL=http://localhost:8000/api/v1`

## API Overview

Base URL: `http://localhost:8000`

- `GET /health` - service health check
- `POST /api/v1/analyze/full` - enqueue full analysis (returns `job_id`)
- `GET /api/v1/analyze/status/{job_id}` - poll analysis status/result
- `POST /api/v1/rewrite/section` - rewrite one section
- `POST /api/v1/rewrite/full` - rewrite full resume
- `POST /api/v1/github/analyze` - analyze and rank GitHub repositories
- `GET /api/v1/templates/recommend` - template recommendations
- `POST /api/v1/export/pdf` - generate PDF from structured content
- `GET /api/v1/settings` - frontend runtime feature flags

Interactive API docs are available at:
- `http://localhost:8000/docs`

## Typical Product Flow

1. Upload resume in Analysis (`/analysis`) for ATS diagnostics and critique.
2. Move to Match & Fix (`/resume-fix-lab`) for structured rewrite.
3. Use GitHub Strategy (`/github`) to pick repos that strengthen claims.
4. Export or apply improvements to final resume version.

## Deployment Notes

- Backend deployment config lives in `backend/render.yaml`.
- Frontend routing config for SPA deployment lives in `frontend/vercel.json`.
- The workflow `.github/workflows/keep-awake.yml` pings the Render health endpoint on a schedule to reduce cold starts.

## Additional Documentation

- Backend details: `backend/README_API.md`
- Template/design references:
  - `ATS_OPTIMIZED_TEMPLATES.md`
  - `ATS_TEMPLATES_COMPLETE.md`
  - `PRODUCTION_TEMPLATES_SUMMARY.md`
  - `PROFESSIONAL_DESIGN_CHECKLIST.md`
