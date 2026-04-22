# Resumit Chrome Extension

AI-powered resume copilot for job seekers. Analyzes any job posting against your stored resume in seconds, directly in your browser tab.

## Features

- 🔍 **Auto-scrapes JD** from LinkedIn, Indeed, Greenhouse, Lever, Workday
- 📊 **Match score** with teal ring showing how well your resume fits
- 🏷️ **Keyword map** — present vs. missing skills highlighted instantly
- ✍️ **Bullet rewrites** — copy-paste ready improvements
- 🪄 **Auto-fill** — one click fills application form fields from your resume
- 🔐 **Secure login** — your Supabase account, resumes stored privately

---

## Setup (Developer Sideload — No Chrome Store Required)

### Step 1: Run the Supabase SQL

1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Run the contents of `extension/supabase_schema.sql`

### Step 2: Build the Side Panel

```bash
cd extension/sidepanel
npm install
npm run build
```

This outputs the production bundle into `extension/sidepanel/assets/` and `extension/sidepanel/index.html`.

### Step 3: Load in Chrome

1. Open Chrome → navigate to `chrome://extensions`
2. Enable **Developer Mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder (the one containing `manifest.json`)

### Step 4: Use It

1. Navigate to any job posting (LinkedIn, Indeed, Greenhouse, etc.)
2. Click the **Resumit icon** in your Chrome toolbar
3. Sign in with your Resumit account
4. Your resume is auto-selected, JD is auto-scraped
5. Click **Analyze Match** → results appear in seconds!

---

## Project Structure

```
extension/
├── manifest.json              # Chrome Extension MV3 config
├── background.js              # Service worker — auth, API calls, autofill
├── supabase_schema.sql        # Run in Supabase SQL Editor
├── icons/                     # Extension icons (16, 48, 128px)
├── content-scripts/
│   ├── jd-scraper.js          # Injected on job pages — extracts JD text
│   └── autofill/              # Platform-specific form fillers
│       ├── linkedin.js
│       ├── greenhouse.js
│       └── lever.js
└── sidepanel/                 # React app (Vite)
    ├── src/
    │   ├── App.tsx            # Main orchestrator component
    │   ├── hooks/             # useAuth, useResumes, useAnalysis
    │   ├── lib/               # supabase.ts, api.ts
    │   └── components/        # Login, ResumeSelector, AnalysisPanel, etc.
    └── assets/                # Built JS/CSS (after npm run build)
```

---

## Backend: New Endpoints

The backend now exposes resume storage endpoints at:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/users/resumes` | Upload + store resume |
| GET | `/api/v1/users/resumes` | List stored resumes |
| GET | `/api/v1/users/resumes/{id}` | Get resume with text |
| DELETE | `/api/v1/users/resumes/{id}` | Delete a resume |

All endpoints require `Authorization: Bearer <supabase_jwt>` header.

---

## Supported Job Boards

| Platform | JD Scraping | Auto-fill |
|----------|-------------|-----------|
| LinkedIn | ✅ | ✅ Easy Apply |
| Indeed | ✅ | ✅ |
| Greenhouse | ✅ | ✅ |
| Lever | ✅ | ✅ |
| Workday | ✅ (best-effort) | ⚠️ Complex |

---

## Publishing to Chrome Web Store (Optional)

1. Build the extension: `cd sidepanel && npm run build`
2. Zip the `extension/` folder
3. Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
4. Pay $5 one-time fee (if not already done)
5. Upload zip → fill in description → submit for review (1–7 days)
