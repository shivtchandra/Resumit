import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit3, Zap } from 'lucide-react';

interface Props {
  jd: string;
  onChange: (v: string) => void;
  platform?: string;
}

export function JDPreview({ jd, onChange, platform }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const preview = jd.slice(0, 200) + (jd.length > 200 ? '…' : '');

  return (
    <div className="surface" style={{ padding: '12px 14px', borderRadius: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={13} color="var(--teal)" />
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-subtle)' }}>
            Job Description
          </span>
          {platform && (
            <span className="badge badge-teal" style={{ fontSize: 9 }}>{platform}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost" style={{ padding: '3px 6px', borderRadius: 6 }} onClick={() => setEditing((v) => !v)}>
            <Edit3 size={11} />
          </button>
          <button className="btn btn-ghost" style={{ padding: '3px 6px', borderRadius: 6 }} onClick={() => setExpanded((v) => !v)}>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {editing ? (
        <textarea
          className="input"
          style={{ resize: 'vertical', minHeight: 120, fontSize: 11, lineHeight: 1.6, borderRadius: 8 }}
          value={jd}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste or edit the job description here…"
        />
      ) : (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {jd ? (expanded ? jd : preview) : (
            <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>
              No job description detected. Click edit to paste one manually.
            </span>
          )}
        </p>
      )}

      {!editing && jd.length > 200 && (
        <button
          className="btn btn-ghost"
          style={{ padding: '4px 0', fontSize: 10, marginTop: 6, color: 'var(--teal)' }}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show less' : `Show all ${jd.split(' ').length} words`}
        </button>
      )}
    </div>
  );
}
