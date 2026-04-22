import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'https://resumit.onrender.com';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      // Persist session in chrome.storage.local so it survives panel close/open
      getItem: (key) =>
        new Promise((resolve) =>
          chrome.storage.local.get(key, (r) => resolve(r[key] ?? null))
        ),
      setItem: (key, value) =>
        new Promise((resolve) => chrome.storage.local.set({ [key]: value }, resolve)),
      removeItem: (key) =>
        new Promise((resolve) => chrome.storage.local.remove(key, resolve)),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type LocalUser = { id: string; email: string };

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function signUpWithEmail(email: string, password: string): Promise<LocalUser> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Sign-up succeeded but no user returned — check your email for a confirmation link.');
  return { id: data.user.id, email: data.user.email! };
}

export async function signInWithEmail(email: string, password: string): Promise<LocalUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return { id: data.user.id, email: data.user.email! };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ── Resume API (via backend, authenticated with Supabase JWT) ─────────────────

export interface StoredResume {
  id: string;
  filename: string;
  created_at: string;
  resume_text?: string;
}

async function authHeaders(): Promise<HeadersInit> {
  const session = await getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchResumes(): Promise<StoredResume[]> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/v1/users/resumes`, { headers });
  if (!res.ok) throw new Error(`Failed to load resumes: ${res.status}`);
  const data = await res.json();
  return data.resumes ?? [];
}

export async function uploadResume(file: File): Promise<StoredResume> {
  const headers = await authHeaders();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/v1/users/resumes`, {
    method: 'POST',
    headers,
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Upload failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchResumeText(resumeId: string): Promise<string> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/v1/users/resumes/${resumeId}`, { headers });
  if (!res.ok) throw new Error(`Failed to load resume: ${res.status}`);
  const data = await res.json();
  return data.resume_text ?? '';
}

export async function deleteResume(resumeId: string): Promise<void> {
  const headers = await authHeaders();
  await fetch(`${API_BASE}/api/v1/users/resumes/${resumeId}`, { method: 'DELETE', headers });
}
