<div align="center">

<h1>⚡ Resumit</h1>
<p><strong>The Resume Workflow Built for Humans.</strong></p>
<p>Diagnose ATS failures, rewrite with AI, match GitHub projects to your target role — all in one place.</p>

<p>
  <a href="https://resumit-kappa.vercel.app"><img src="https://img.shields.io/badge/Live%20Demo-resumit.app-6366f1?style=for-the-badge&logo=vercel&logoColor=white" /></a>
  <a href="https://resumit.onrender.com/docs"><img src="https://img.shields.io/badge/API%20Docs-Swagger-85ea2d?style=for-the-badge&logo=swagger&logoColor=black" /></a>
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" />
  <img src="https://img.shields.io/github/stars/shivtchandra/Resumit?style=for-the-badge&color=f59e0b" />
</p>

<p>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-latest-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/scikit--learn-1.7.2-F7931E?style=flat-square&logo=scikitlearn&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenAI%20%2F%20Gemini-AI-412991?style=flat-square&logo=openai&logoColor=white" />
</p>

</div>

---

## 🧠 What is ResuMit?

Most resume tools just check formatting. **ResuMit actually emulates what ATS software does** — parsing your PDF the way Workday, Greenhouse, Taleo, and iCIMS parse it — then gives you a scored breakdown of exactly why your resume gets dropped before a human reads it.

Then it helps you fix it: AI rewrites, ATS-optimized templates, GitHub repo scoring, and interview prep — all in one coherent workflow.

```
Upload Resume → ATS Score + Roast → AI Rewrite → Pick Template → GitHub Proof Strategy → Export
```

---

## ✨ Features

### 📊 ATS Compatibility Analyzer
- Emulates real ATS parsers (Workday, Taleo, Greenhouse, iCIMS, Lever)
- Detects **image-based PDFs**, z-order fragmentation, floating objects, missing contact fields
- ML-powered friendliness score (0–100) + risk classification (Safe / Moderate / High Risk)
- Keyword coverage heatmap against job description
- Async job queue — no 30-second timeouts

### 🤖 AI-Powered Rewrite Engine
- Section-level and full-resume rewrites
- Two modes: **Brutal** (no sugarcoating) and **Professional** (constructive)
- Dual provider: **Google Gemini** + **OpenAI GPT-4o** with automatic fallback
- Match & Fix lab — structured rewrite workflow tied to your target JD

### 🐙 GitHub Proof Strategy
- Analyzes your GitHub repos and ranks them by relevance to the target role
- Flags weak repos, suggests improvements
- Generates interview prep questions from your actual projects
- Maps repositories to resume bullet points

### 🎨 ATS-Optimized Templates
- 50+ templates tagged by role, experience level, and ATS vendor compatibility
- Filter by: role, experience level, ATS system
- PDF preview in-browser before applying
- Real historical ATS success rates

### 📈 Live Analysis Counter
- Landing page badge reflects the real number of resumes analyzed — pulled live from the database

### 🎯 Interview Prep
- Score your answers to real interview questions
- Feedback tied to your resume content and target role

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS v4, Framer Motion |
| **UI Components** | Radix UI, Lucide Icons, Recharts |
| **Backend** | FastAPI, Uvicorn, Python 3.14 |
| **ML / NLP** | scikit-learn, BM25, spaCy, sentence-transformers |
| **AI** | Google Gemini 2.0, OpenAI GPT-4o-mini |
| **Document Parsing** | PyMuPDF, pdfminer.six, python-docx, pytesseract |
| **Database** | Supabase (PostgreSQL) |
| **Auth / Storage** | Supabase Storage |
| **Payments** | Razorpay |
| **Deployment** | Vercel (frontend) + Render (backend) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- A Supabase project (free tier works)
- At least one AI key: OpenAI **or** Google Gemini

### 1 — Clone

```bash
git clone https://github.com/shivtchandra/Resumit.git
cd Resumit
```

### 2 — Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # then fill in your keys
uvicorn app.main:app --reload --port 8000
```

Backend runs at → `http://localhost:8000`
Swagger docs → `http://localhost:8000/docs`

### 3 — Frontend

```bash
cd frontend
npm install
cp .env.example .env             # set VITE_API_URL=http://localhost:8000
npm run dev
```

Frontend runs at → `http://localhost:5173`

### 4 — One command (both services)

```bash
./start.sh
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_KEY` | ✅ | Supabase service role key |
| `OPENAI_API_KEY` | ⚠️ one of these | OpenAI API key |
| `GEMINI_API_KEY` | ⚠️ one of these | Google Gemini API key |
| `GITHUB_TOKEN` | 🔶 optional | Higher GitHub API rate limits |
| `FIRECRAWL_API_KEY` | 🔶 optional | Enhanced GitHub profile scraping |

### Frontend (`frontend/.env`)

| Variable | Value |
|---|---|
| `VITE_API_URL` | `http://localhost:8000` (dev) or your Render URL (prod) |

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/v1/stats` | Live analysis count |
| `POST` | `/api/v1/analyze/full` | Enqueue resume analysis → returns `job_id` |
| `GET` | `/api/v1/analyze/status/{job_id}` | Poll result |
| `POST` | `/api/v1/rewrite/section` | AI rewrite single section |
| `POST` | `/api/v1/rewrite/full` | Full resume rewrite |
| `POST` | `/api/v1/rewrite/brutal` | Harsh-mode full rewrite |
| `GET` | `/api/v1/templates/recommend` | Template recommendations |
| `POST` | `/api/v1/github/analyze` | Rank GitHub repos by role |
| `POST` | `/api/v1/export/pdf` | Export resume as PDF |
| `GET` | `/api/v1/settings` | Frontend feature flags |

Full interactive docs: [`/docs`](https://resumit.onrender.com/docs)

---

## 🗂️ Project Structure

```
Resumit/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/      # analyze · rewrite · templates · github · export · settings
│   │   ├── services/              # ingestion · ML models · AI clients · compliance
│   │   └── core/                  # Supabase client
│   ├── data/models/               # Pre-trained sklearn .joblib artifacts
│   ├── scripts/                   # Model training scripts
│   ├── supabase_schema.sql        # DB schema (run once in Supabase SQL editor)
│   └── render.yaml                # Render deploy config
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Landing · Analysis · Templates · GitHub · OptimizationHub · Pricing
│   │   ├── components/            # UI + layout components
│   │   ├── services/api.ts        # Axios client + typed API helpers
│   │   └── types/                 # TypeScript interfaces
│   └── vercel.json                # Vercel SPA routing config
├── .github/workflows/
│   └── keep-awake.yml             # Cron ping to prevent Render cold starts
└── start.sh                       # Start both services locally
```

---

## 🗄️ Database Setup

Run `backend/supabase_schema.sql` in your Supabase SQL editor once to create:

- `analyses` — stores every resume analysis result
- `templates` — ATS-optimized template metadata
- `sessions` — anonymous session tracking

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'add: your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

Please keep PRs focused. If you're adding a big feature, open an issue first to discuss.

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ by [Shivat Chandra](https://github.com/shivtchandra)**

If ResuMit helped you land an interview — drop a ⭐ It genuinely helps.

</div>
