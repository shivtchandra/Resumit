import { useState } from 'react';
import { Wand2, Check, AlertCircle } from 'lucide-react';
import { parseFieldsFromResumeText, triggerAutofill } from '../lib/api';

interface Props {
  resumeText: string;
}

export function AutofillButton({ resumeText }: Props) {
  const [status, setStatus] = useState<'idle' | 'filling' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleFill() {
    setStatus('filling');
    setErrorMsg('');
    try {
      const fields = parseFieldsFromResumeText(resumeText);
      await triggerAutofill(fields);
      setStatus('done');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Autofill failed');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        className="btn btn-secondary w-full"
        style={{ padding: '10px 16px', borderRadius: 10, gap: 8 }}
        disabled={status === 'filling'}
        onClick={handleFill}
      >
        {status === 'filling' && <div className="spinner" style={{ width: 14, height: 14 }} />}
        {status === 'done' && <Check size={14} color="var(--green)" />}
        {status === 'error' && <AlertCircle size={14} color="var(--red)" />}
        {status === 'idle' && <Wand2 size={14} color="var(--teal)" />}

        {status === 'filling' ? 'Filling fields…' :
         status === 'done' ? 'Fields filled!' :
         status === 'error' ? 'Try again' :
         'Auto-Fill Application'}
      </button>
      {status === 'error' && errorMsg && (
        <p style={{ fontSize: 10, color: 'var(--red)', textAlign: 'center' }}>{errorMsg}</p>
      )}
      {status === 'idle' && (
        <p style={{ fontSize: 10, color: 'var(--text-subtle)', textAlign: 'center' }}>
          Fills name, email, phone & more. You still review & submit.
        </p>
      )}
    </div>
  );
}
