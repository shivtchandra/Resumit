const API_BASE = 'https://resumit.onrender.com';

async function getToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_TOKEN' }, (res) => {
      resolve(res?.token ?? null);
    });
  });
}

async function authHeaders(token?: string): Promise<HeadersInit> {
  const tok = token ?? (await getToken());
  return tok ? { Authorization: `Bearer ${tok}` } : {};
}

// ── Resume types ──────────────────────────────────────────────────────────────
export interface StoredResume {
  id: string;
  filename: string;
  created_at: string;
  resume_text?: string;
}

// ── JD extraction ─────────────────────────────────────────────────────────────
export async function getJDFromCurrentTab(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_JD' }, (res) => {
      resolve(res?.jd ?? null);
    });
  });
}

// ── Analysis (async job polling) ──────────────────────────────────────────────
export interface AnalysisResult {
  friendliness_score?: number;
  match_score?: number;
  analysis_summary?: { overall_score?: number; candidate_name?: string };
  roast_report?: {
    hard_truths?: string[];
    priority_fixes?: string[];
    strengths?: string[];
    role_fit_verdict?: { verdict?: string };
  };
  missing_keywords?: string[];
  comprehensive_analysis?: {
    missing_keywords?: string[];
    missing_technical_skills?: string[];
    sample_resume_upgrades?: Array<{ before: string; after: string; reason?: string }>;
  };
  top_actions?: string[];
  [key: string]: unknown;
}

/**
 * Converts plain text to a minimal DOCX blob so the backend accepts it.
 * We use a raw XML approach — no library needed.
 */
async function textToDocxBlob(text: string): Promise<Blob> {
  // Minimal DOCX: a zip containing word/document.xml
  // Since we can't build a zip in vanilla JS without a library,
  // we fall back to sending the text as a .txt file via the /analyze/ingest endpoint
  // which accepts any format for text extraction.
  // Actually the backend only accepts PDF/DOCX — so we encode the text as a PDF-like blob
  // using a minimal valid PDF structure.
  const escaped = text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

  // Minimal valid PDF with text content
  const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length ${escaped.length + 50}>>
stream
BT /F1 11 Tf 50 750 Td
(${escaped.substring(0, 2000)}) Tj
ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
trailer<</Size 6/Root 1 0 R>>
startxref
%%EOF`;

  return new Blob([pdfContent], { type: 'application/pdf' });
}

export async function analyzeResume(
  resumeText: string,
  jobDescription: string,
  token?: string
): Promise<AnalysisResult> {
  const headers = await authHeaders(token);

  // Build a minimal PDF blob from the text so the backend can parse it
  const pdfBlob = await textToDocxBlob(resumeText);
  const form = new FormData();
  form.append('file', pdfBlob, 'resume.pdf');
  form.append('job_description', jobDescription);
  form.append('analysis_mode', 'jd_or_general');
  form.append('feedback_tone', 'brutal');

  // Step 1: Submit job
  const submitRes = await fetch(`${API_BASE}/api/v1/analyze/full`, {
    method: 'POST',
    headers,
    body: form,
  });
  if (!submitRes.ok) throw new Error(`Submit failed: ${submitRes.status}`);
  const { job_id } = await submitRes.json();
  if (!job_id) throw new Error('No job ID returned');

  // Step 2: Poll for result
  const pollHeaders = { ...await authHeaders(token), 'Content-Type': 'application/json' };
  const start = Date.now();
  const MAX_WAIT_MS = 120_000; // 2 min
  const POLL_INTERVAL_MS = 3_000;

  while (Date.now() - start < MAX_WAIT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const statusRes = await fetch(`${API_BASE}/api/v1/analyze/status/${job_id}`, { headers: pollHeaders });
    if (!statusRes.ok) throw new Error(`Status check failed: ${statusRes.status}`);
    const statusData = await statusRes.json();

    if (statusData.status === 'done') return statusData.result as AnalysisResult;
    if (statusData.status === 'error') throw new Error(statusData.error ?? 'Analysis failed');
    // still 'pending' — keep polling
  }

  throw new Error('Analysis timed out after 2 minutes');
}

// ── Autofill ──────────────────────────────────────────────────────────────────
export interface AutofillFields {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneCode?: string;
  linkedIn?: string;
  github?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  currentCompany?: string;
  yearsExp?: number;
  summary?: string;
}

export function parseFieldsFromResumeText(text: string): AutofillFields {
  const fields: AutofillFields = {};
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Name — look in first 5 lines, find something that looks like a name (2-5 words, no @, no http)
  for (const line of lines.slice(0, 5)) {
    if (!line.includes('@') && !line.startsWith('http') && !/^\d/.test(line)) {
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 5 && words.every((w) => /^[A-Za-z.\-']+$/.test(w))) {
        fields.firstName = words[0];
        fields.lastName = words.slice(1).join(' ');
        break;
      }
    }
  }

  // Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) fields.email = emailMatch[0];

  // Phone — international or US formats
  const phoneMatch = text.match(/(\+?1?[\s.\-]?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/);
  const phoneMatch2 = text.match(/(\+\d{1,3}[\s.\-]?\d[\d\s.\-]{7,12}\d)/);
  const rawPhone = (phoneMatch || phoneMatch2)?.[0]?.trim();
  if (rawPhone) {
    fields.phone = rawPhone.replace(/[^\d+]/g, '').replace(/^\+?1/, ''); // strip country code for US
    if (rawPhone.startsWith('+')) fields.phoneCode = rawPhone.match(/\+\d{1,3}/)?.[0];
  }

  // LinkedIn
  const liMatch = text.match(/linkedin\.com\/in\/([a-zA-Z0-9\-]+)/i);
  if (liMatch) fields.linkedIn = `https://linkedin.com/in/${liMatch[1]}`;

  // GitHub
  const ghMatch = text.match(/github\.com\/([a-zA-Z0-9\-]+)/i);
  if (ghMatch) fields.github = `https://github.com/${ghMatch[1]}`;

  // Address — look for a line with a number at start (street address)
  for (const line of lines) {
    if (/^\d+\s+[A-Za-z]/.test(line) && line.length < 80) {
      fields.address = line;
      break;
    }
  }

  // City, State ZIP — "San Francisco, CA 94105" pattern
  const cityStateZip = text.match(/([A-Za-z\s]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
  if (cityStateZip) {
    fields.city = cityStateZip[1].trim();
    fields.state = cityStateZip[2];
    fields.zip = cityStateZip[3];
    fields.country = 'United States';
  }

  // Years of experience — "X years of experience" pattern
  const yearsMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|professional)/i);
  if (yearsMatch) fields.yearsExp = parseInt(yearsMatch[1], 10);

  // Summary — first substantial paragraph (100-500 chars) that has no email/phone/url
  for (const line of lines) {
    if (line.length > 100 && line.length < 500 && !line.includes('@') && !line.includes('http')) {
      fields.summary = line;
      break;
    }
  }

  return fields;
}

// ── Application Questions ─────────────────────────────────────────────────────
export interface DetectedQuestion {
  question: string;
  selector: string;
  currentValue: string;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  selector: string;
}

export async function detectQuestionsOnPage(): Promise<DetectedQuestion[]> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'DETECT_QUESTIONS' }, (res) => {
      resolve(res?.questions ?? []);
    });
  });
}

export async function answerQuestions(
  resumeText: string,
  questions: DetectedQuestion[],
  jobDescription?: string,
  token?: string
): Promise<QuestionAnswer[]> {
  const headers = {
    ...await authHeaders(token),
    'Content-Type': 'application/json',
  };
  const res = await fetch(`${API_BASE}/api/v1/answer-questions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      resume_text: resumeText,
      questions: questions.map(q => q.question),
      job_description: jobDescription,
    }),
  });
  if (!res.ok) throw new Error(`answer-questions failed: ${res.status}`);
  const data = await res.json();
  return (data.answers as { question: string; answer: string }[]).map((a, i) => ({
    ...a,
    selector: questions[i]?.selector ?? '',
  }));
}

export async function fillAnswersOnPage(answers: QuestionAnswer[]): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'FILL_ANSWERS', payload: answers },
      (res) => {
        if (res?.ok) resolve();
        else reject(new Error(res?.error ?? 'Fill failed'));
      }
    );
  });
}

export async function triggerAutofill(fields: AutofillFields): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'AUTOFILL', payload: fields }, (res) => {
      if (res?.ok) resolve();
      else reject(new Error(res?.error ?? 'Autofill failed'));
    });
  });
}
