import { useState, useCallback } from 'react';
import { analyzeResume, getJDFromCurrentTab, type AnalysisResult } from '../lib/api';

export type AnalysisState = 'idle' | 'scraping' | 'analyzing' | 'done' | 'error';

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>('idle');
  const [jd, setJd] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const scrapeJD = useCallback(async () => {
    setState('scraping');
    setError(null);
    try {
      const extracted = await getJDFromCurrentTab();
      if (extracted) {
        setJd(extracted);
        setState('idle');
        return extracted;
      } else {
        setState('idle');
        return null;
      }
    } catch (e) {
      setState('idle');
      return null;
    }
  }, []);

  const analyze = useCallback(async (resumeText: string, jobDescription: string) => {
    if (!resumeText || !jobDescription) return;
    setState('analyzing');
    setError(null);
    setResult(null);

    const start = Date.now();
    const timer = setInterval(() => setElapsedMs(Date.now() - start), 500);

    try {
      const data = await analyzeResume(resumeText, jobDescription);
      setResult(data);
      setState('done');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Analysis failed';
      setError(msg);
      setState('error');
    } finally {
      clearInterval(timer);
      setElapsedMs(0);
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setResult(null);
    setError(null);
    setElapsedMs(0);
  }, []);

  return { state, jd, setJd, result, error, elapsedMs, scrapeJD, analyze, reset };
}
