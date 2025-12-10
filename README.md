# ATS Emulator V2 - Production Application

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Supabase account (for database and storage)
- Gemini or OpenAI API key (for AI rewrite)

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements-api.txt

# Configure environment
cp .env.example .env
# Edit .env and add your credentials:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_KEY
# - GEMINI_API_KEY (or OPENAI_API_KEY)

# Run Supabase schema
# Go to your Supabase project → SQL Editor
# Copy and run the contents of supabase_schema.sql

# Start backend server
uvicorn app.main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env:
# VITE_API_URL=http://localhost:8000/api/v1

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

---

## 📁 Project Structure

```
/Users/shivat/Downloads/Document/resume/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/v1/endpoints/  # API routes
│   │   ├── core/              # Supabase client
│   │   ├── services/          # Business logic
│   │   └── main.py            # FastAPI app
│   ├── supabase_schema.sql    # Database schema
│   ├── requirements-api.txt   # Python dependencies
│   └── README_API.md          # Backend documentation
│
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API client
│   │   ├── types/             # TypeScript types
│   │   └── index.css          # Design system
│   └── package.json
│
└── ats-emulator-v2/           # HTML prototype (reference)
    ├── index.html
    ├── templates.html
    ├── analysis.html
    └── src/styles/            # CSS design system
```

---

## 🎨 Design System

### Color Palette (Dark Premium SaaS)

```css
/* Backgrounds */
--color-bg-dark: #0f1419       /* Main background */
--color-bg-elevated: #1a1f2e   /* Elevated surfaces */
--color-bg-card: #1e2433       /* Card backgrounds */

/* Accents */
--color-accent-cyan: #00d9ff   /* Primary brand */
--color-accent-amber: #ffb84d  /* Warnings */
--color-accent-green: #10b981  /* Success */
--color-accent-red: #ff4757    /* Errors */

/* Text */
--color-text-primary: #ffffff
--color-text-secondary: #a0aec0
--color-text-tertiary: #64748b
```

### Typography

- **Headings**: Space Grotesk (400, 500, 600, 700)
- **Body**: Inter (300, 400, 500, 600, 700)
- **Code**: JetBrains Mono

---

## 🔌 API Endpoints

### Analysis
- `POST /api/v1/analyze/full` - Complete ATS analysis
  - **Input**: Resume file (PDF/DOCX), job description, target role/ATS
  - **Output**: Scores, vendor compatibility, issues, extracted data

### Templates
- `GET /api/v1/templates/recommend` - Get ATS-verified templates
  - **Query**: `role`, `ats_vendor`, `experience_level`
- `GET /api/v1/templates/{id}` - Template details
- `POST /api/v1/templates/export` - Generate filled template

### Rewrite
- `POST /api/v1/rewrite/section` - AI-powered section rewrite
  - **Input**: Section name, content, job description, ATS rules
  - **Output**: Original, rewritten, improvements

### Health
- `GET /health` - Health check

---

## 📊 Current Status

### ✅ Completed
- Premium SaaS HTML prototype (4 pages)
- Backend API with ML models
- Supabase integration
- AI rewrite (Gemini/OpenAI)
- API client with TypeScript types
- Dark theme design system

### 🚧 In Progress
- React component migration
- Resume viewer implementation
- Page implementations (Landing, Templates, Analysis)
- End-to-end testing

### ⏳ Planned
- Template export (DOCX/PDF generation)
- Authentication (future phase)
- Payments (future phase)
- Team features (future phase)

---

## 🐛 Troubleshooting

### Backend won't start
- Check Python version: `python --version` (need 3.8+)
- Verify dependencies: `pip install -r requirements-api.txt`
- Check Supabase credentials in `.env`

### Frontend won't start
- Check Node version: `node --version` (need 18+)
- Clear node_modules: `rm -rf node_modules && npm install`
- Check API URL in `.env`

### API calls failing
- Verify backend is running: `curl http://localhost:8000/health`
- Check CORS settings in `backend/app/main.py`
- Verify API_BASE_URL in frontend

---

## 📚 Additional Documentation

- **Backend API**: See `backend/README_API.md`
- **Implementation Plan**: See implementation plan artifact
- **Component Mapping**: See migration strategy in implementation plan

---

For detailed setup instructions, API documentation, and deployment guide, see `backend/README_API.md`.
