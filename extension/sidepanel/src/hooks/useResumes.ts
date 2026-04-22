import { useCallback, useEffect, useState } from 'react';
import { fetchResumes, uploadResume, deleteResume, fetchResumeText, type StoredResume } from '../lib/supabase';

export type { StoredResume };

export function useResumes() {
  const [resumes, setResumes] = useState<StoredResume[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchResumes();
      setResumes(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const upload = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const created = await uploadResume(file);
      setResumes((prev) => [created, ...prev]);
      return created;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteResume(id);
    setResumes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Fetch full resume text on demand (not included in list response)
  const getResumeText = useCallback(async (id: string): Promise<string> => {
    return fetchResumeText(id);
  }, []);

  return { resumes, loading, error, refresh, upload, remove, getResumeText };
}
