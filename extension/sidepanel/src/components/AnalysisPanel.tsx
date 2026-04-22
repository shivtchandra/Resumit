import { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp, Copy, ExternalLink, AlertCircle, Sparkles } from 'lucide-react';
import { ScoreRing } from './ScoreRing';
import type { AnalysisResult } from '../lib/api';

interface Props {
  result: AnalysisResult;
}

const RESUMIT_URL = 'https://resumit-kappa.vercel.app';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn btn-ghost"
      style={{ padding: '3px 6px', borderRadius: 6, fontSize: 10, gap: 3 }}
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
    >
      {copied ? <Check size={10} color="var(--green)" /> : <Copy size={10} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <button
        className="btn btn-ghost"
        style={{ width: '100%', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 0, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && <div style={{ padding: '0 14px 14px', background: 'var(--bg-surface)' }}>{children}</div>}
    </div>
  );
}

export function AnalysisPanel({ result }: Props) {
  const matchScore = result.match_score ?? result.analysis_summary?.overall_score ?? 0;
  const missingKw: string[] = (result.missing_keywords as string[]) ?? (result.comprehensive_analysis?.missing_keywords as string[]) ?? [];
  const rewrites: Array<{ before: string; after: string; reason?: string }> = (result.comprehensive_analysis?.sample_resume_upgrades as Array<{ before: string; after: string; reason?: string }>) ?? [];
  const issues: string[] = (result.top_actions as string[]) ?? (result.roast_report?.priority_fixes as string[]) ?? [];
  const strengths: string[] = (result.roast_report?.strengths as string[]) ?? [];
  const presentKw: string[] = (result.comprehensive_analysis?.missing_technical_skills as string[] ?? []).slice(0,0); // backend gives missing, not present


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="fade-in">
      {/* Score */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 8px' }}>
        <ScoreRing score={Math.round(matchScore)} />
      </div>

      {/* Verdict */}
      {result.roast_report?.role_fit_verdict?.verdict && (
        <div className="surface-accent" style={{ padding: '10px 14px', borderRadius: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Sparkles size={14} color="var(--teal)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{result.roast_report?.role_fit_verdict?.verdict}</p>
          </div>
        </div>
      )}

      {/* Keywords */}
      {(presentKw.length > 0 || missingKw.length > 0) && (
        <Section title="Keywords">
          {presentKw.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>✅ Present</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {presentKw.slice(0, 12).map((kw) => (
                  <span key={kw} className="chip chip-present">{kw}</span>
                ))}
              </div>
            </div>
          )}
          {missingKw.length > 0 && (
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>❌ Missing</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {missingKw.slice(0, 12).map((kw) => (
                  <span key={kw} className="chip chip-missing">{kw}</span>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Issues / Top Actions */}
      {issues.length > 0 && (
        <Section title={`Top Actions (${issues.length})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {issues.slice(0, 6).map((issue, i) => (
              <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <AlertCircle size={12} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{issue}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <Section title="Strengths" defaultOpen={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {strengths.slice(0, 4).map((s, i) => (
              <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.15)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Check size={12} color="var(--green)" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{s}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Rewrites */}
      {rewrites.length > 0 && (
        <Section title="Bullet Rewrites" defaultOpen={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rewrites.slice(0, 4).map((rw, i) => (
              <div key={i} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ padding: '8px 10px', background: 'rgba(248,113,113,0.06)', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <X size={10} color="var(--red)" />
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase' }}>Before</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{rw.before}</p>
                </div>
                <div style={{ padding: '8px 10px', background: 'rgba(52,211,153,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={10} color="var(--green)" />
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase' }}>After</span>
                    </div>
                    <CopyButton text={rw.after} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>{rw.after}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Open in Resumit */}
      <a
        href={RESUMIT_URL}
        target="_blank"
        rel="noreferrer"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)', textDecoration: 'none', fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}
        onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(20,184,166,0.3)'; (e.currentTarget as HTMLElement).style.color = 'var(--teal)'; }}
        onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
      >
        <ExternalLink size={13} />
        Open Full Report in Resumit
      </a>
    </div>
  );
}
