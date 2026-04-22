import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Sparkles, UserPlus } from 'lucide-react';

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
}

export function Login({ onLogin, onSignUp }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        await onSignUp(email, password);
        setInfo('Account created! Check your email to confirm, then sign in.');
        setMode('signin');
      } else {
        await onLogin(email, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '32px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'rgba(20,184,166,0.12)',
          border: '1px solid rgba(20,184,166,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Sparkles size={24} color="#14b8a6" />
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>
          Resumit Copilot
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6 }}>
          {mode === 'signin' ? 'Sign in to access your resumes.' : 'Create an account to get started.'}
        </p>
      </div>

      {/* Mode toggle */}
      <div style={{
        display: 'flex', borderRadius: 10,
        border: '1px solid var(--border)',
        overflow: 'hidden', marginBottom: 20,
      }}>
        {(['signin', 'signup'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(null); setInfo(null); }}
            style={{
              flex: 1, padding: '9px 0', fontSize: 12, border: 'none', cursor: 'pointer',
              background: mode === m ? 'rgba(20,184,166,0.15)' : 'transparent',
              color: mode === m ? '#14b8a6' : 'var(--text-subtle)',
              fontWeight: mode === m ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            {m === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <Mail size={14} color="var(--text-subtle)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            className="input"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            style={{ paddingLeft: 32 }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <Lock size={14} color="var(--text-subtle)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            className="input"
            type={showPw ? 'text' : 'password'}
            placeholder={mode === 'signup' ? 'Choose a password (min 6 chars)' : 'Password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ paddingLeft: 32, paddingRight: 36 }}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: 2 }}
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        {error && (
          <div style={{ padding: '8px 12px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {info && (
          <div style={{ padding: '8px 12px', background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--teal)' }}>
            {info}
          </div>
        )}

        <button
          className="btn btn-primary w-full"
          type="submit"
          disabled={loading || !email || !password}
          style={{ padding: '12px 20px', marginTop: 4, borderRadius: 10, fontSize: 14, gap: 8 }}
        >
          {loading ? (
            <><div className="spinner" style={{ width: 16, height: 16 }} /> {mode === 'signin' ? 'Signing in…' : 'Creating account…'}</>
          ) : mode === 'signin' ? (
            <><Sparkles size={15} /> Sign In</>
          ) : (
            <><UserPlus size={15} /> Create Account</>
          )}
        </button>
      </form>

      <p style={{ marginTop: 'auto', paddingTop: 32, textAlign: 'center', fontSize: 10, color: 'var(--text-subtle)', lineHeight: 1.6 }}>
        Resumes synced across devices via Supabase.<br />
        Analysis powered by <span style={{ color: 'var(--teal)' }}>Resumit AI</span>.
      </p>
    </div>
  );
}
