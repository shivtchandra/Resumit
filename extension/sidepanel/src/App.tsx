import { useEffect, useState } from 'react';
import { LogOut, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useResumes } from './hooks/useResumes';
import { useAnalysis } from './hooks/useAnalysis';
import { Login } from './components/Login';
import { ResumeSelector } from './components/ResumeSelector';
import { JDPreview } from './components/JDPreview';
import { AnalysisPanel } from './components/AnalysisPanel';
import { AutofillButton } from './components/AutofillButton';
import { QuestionsPanel } from './components/QuestionsPanel';

function getPlatformFromUrl(url: string): string {
  if (url.includes('linkedin.com')) return 'LinkedIn';
  if (url.includes('indeed.com')) return 'Indeed';
  if (url.includes('greenhouse.io')) return 'Greenhouse';
  if (url.includes('lever.co')) return 'Lever';
  if (url.includes('workday.com') || url.includes('myworkdayjobs.com')) return 'Workday';
  return '';
}

export default function App() {
  const { user, loading: authLoading, signInWithEmail, signUpWithEmail, signOut } = useAuth();
  const { resumes, loading: resumesLoading, upload, remove, getResumeText } = useResumes();
  const { state, jd, setJd, result, error, elapsedMs, scrapeJD, analyze, reset } = useAnalysis();

  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [selectedResumeText, setSelectedResumeText] = useState<string>('');
  const [currentUrl, setCurrentUrl] = useState('');

  // Auto-scrape JD when panel opens
  useEffect(() => {
    if (!user) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url) setCurrentUrl(tab.url);
    });
    scrapeJD();
  }, [user]);

  // Fetch resume text from backend when selection changes
  useEffect(() => {
    if (!selectedResumeId) return;
    setSelectedResumeText('');
    getResumeText(selectedResumeId).then(setSelectedResumeText).catch(() => {});
  }, [selectedResumeId]);

  // Auto-select first resume
  useEffect(() => {
    if (resumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumes[0].id);
    }
  }, [resumes]);

  const platform = getPlatformFromUrl(currentUrl);
  const canAnalyze = !!selectedResumeText && !!jd && state !== 'analyzing';

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Login onLogin={signInWithEmail} onSignUp={signUpWithEmail} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Navbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
        background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(10px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={14} color="#14b8a6" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>Resumit</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </span>
          <button className="btn btn-ghost" style={{ padding: '4px 6px', borderRadius: 6 }} onClick={signOut} title="Sign out">
            <LogOut size={13} />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Resume selector */}
        <ResumeSelector
          resumes={resumes}
          selectedId={selectedResumeId}
          onSelect={setSelectedResumeId}
          onUpload={upload}
          onDelete={remove}
          loading={resumesLoading}
        />

        {/* JD Preview */}
        <JDPreview
          jd={jd}
          onChange={setJd}
          platform={platform || undefined}
        />

        {/* Re-scrape */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="divider" style={{ flex: 1 }} />
          <button
            className="btn btn-ghost"
            style={{ padding: '4px 8px', fontSize: 10, borderRadius: 6, gap: 4 }}
            onClick={scrapeJD}
            disabled={state === 'scraping'}
          >
            <RefreshCw size={10} style={{ animation: state === 'scraping' ? 'spin 0.7s linear infinite' : 'none' }} />
            Re-scan page
          </button>
          <div className="divider" style={{ flex: 1 }} />
        </div>

        {/* Analyze button */}
        {state !== 'done' && (
          <button
            className="btn btn-primary w-full"
            style={{ padding: '12px 20px', fontSize: 14, borderRadius: 12, boxShadow: canAnalyze ? '0 0 20px rgba(20,184,166,0.25)' : 'none' }}
            disabled={!canAnalyze}
            onClick={() => analyze(selectedResumeText, jd)}
          >
            {state === 'analyzing' ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16 }} />
                Analyzing… ({Math.round(elapsedMs / 1000)}s)
              </>
            ) : (
              <>
                <Zap size={16} />
                Analyze Match
              </>
            )}
          </button>
        )}

        {/* Hints */}
        {!selectedResumeId && resumes.length === 0 && (
          <p style={{ fontSize: 11, color: 'var(--text-subtle)', textAlign: 'center' }}>
            Upload a resume to get started. TXT files work best.
          </p>
        )}
        {selectedResumeId && !jd && (
          <p style={{ fontSize: 11, color: 'var(--text-subtle)', textAlign: 'center' }}>
            Navigate to a job posting, or paste the JD manually.
          </p>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, fontSize: 12, color: 'var(--red)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ flex: 1 }}>{error}</span>
            <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 11 }} onClick={reset}>Retry</button>
          </div>
        )}

        {/* Results */}
        {state === 'done' && result && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-subtle)' }}>
                Analysis Results
              </span>
              <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={reset}>← New Scan</button>
            </div>
            <AnalysisPanel result={result} />

            {selectedResumeText && (
              <>
                <div className="divider" />
                <AutofillButton resumeText={selectedResumeText} />
                <QuestionsPanel resumeText={selectedResumeText} jobDescription={jd || undefined} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
