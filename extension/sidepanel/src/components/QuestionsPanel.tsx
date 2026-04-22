import { useState } from 'react';
import { Sparkles, RefreshCw, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  detectQuestionsOnPage,
  answerQuestions,
  fillAnswersOnPage,
  type DetectedQuestion,
  type QuestionAnswer,
} from '../lib/api';

interface Props {
  resumeText: string;
  jobDescription?: string;
}

export function QuestionsPanel({ resumeText, jobDescription }: Props) {
  const [status, setStatus] = useState<'idle' | 'detecting' | 'answering' | 'done' | 'error'>('idle');
  const [questions, setQuestions] = useState<DetectedQuestion[]>([]);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [expanded, setExpanded] = useState(false);

  async function handleDetectAndAnswer() {
    setStatus('detecting');
    setErrorMsg('');
    setAnswers([]);

    try {
      const detected = await detectQuestionsOnPage();
      if (!detected.length) {
        setErrorMsg('No open-ended questions found on this page.');
        setStatus('error');
        setTimeout(() => setStatus('idle'), 4000);
        return;
      }
      setQuestions(detected);
      setStatus('answering');

      const answered = await answerQuestions(resumeText, detected, jobDescription);
      setAnswers(answered);
      setStatus('done');
      setExpanded(true);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to generate answers');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  }

  async function handleFill() {
    try {
      await fillAnswersOnPage(answers);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Fill failed');
    }
  }

  const isLoading = status === 'detecting' || status === 'answering';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        className="btn btn-secondary w-full"
        style={{ padding: '10px 16px', borderRadius: 10, gap: 8 }}
        disabled={isLoading || !resumeText}
        onClick={handleDetectAndAnswer}
      >
        {isLoading && <div className="spinner" style={{ width: 14, height: 14 }} />}
        {status === 'done' && <Check size={14} color="var(--green)" />}
        {status === 'error' && <AlertCircle size={14} color="var(--red)" />}
        {!isLoading && status !== 'done' && status !== 'error' && (
          <Sparkles size={14} color="var(--teal)" />
        )}
        {status === 'detecting' ? 'Scanning page…' :
         status === 'answering' ? 'Generating answers…' :
         status === 'done' ? 'Answers ready!' :
         status === 'error' ? 'Try again' :
         'Answer Application Questions'}
      </button>

      {status === 'error' && errorMsg && (
        <p style={{ fontSize: 10, color: 'var(--red)', textAlign: 'center' }}>{errorMsg}</p>
      )}

      {status === 'idle' && (
        <p style={{ fontSize: 10, color: 'var(--text-subtle)', textAlign: 'center' }}>
          Detects "Why us?" and similar questions, fills AI-written answers.
        </p>
      )}

      {answers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
              color: 'var(--text-subtle)', fontSize: 11, padding: '2px 0',
            }}
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {answers.length} question{answers.length > 1 ? 's' : ''} answered — click to {expanded ? 'hide' : 'review'}
          </button>

          {expanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {answers.map((a, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '8px 10px',
                  }}
                >
                  <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginBottom: 4, fontWeight: 600 }}>
                    {a.question}
                  </p>
                  <textarea
                    value={a.answer}
                    onChange={e => {
                      const updated = [...answers];
                      updated[i] = { ...a, answer: e.target.value };
                      setAnswers(updated);
                    }}
                    style={{
                      width: '100%', fontSize: 11, resize: 'vertical',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '6px 8px', color: 'var(--text)',
                      minHeight: 64, boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12 }}
                  onClick={handleFill}
                >
                  Fill All Answers
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px 10px', borderRadius: 8 }}
                  title="Re-generate"
                  onClick={handleDetectAndAnswer}
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
