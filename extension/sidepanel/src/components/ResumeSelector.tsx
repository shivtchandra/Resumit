import { useRef } from 'react';
import { Upload, Trash2, FileText, Plus } from 'lucide-react';
import type { StoredResume } from '../lib/api';

interface Props {
  resumes: StoredResume[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpload: (file: File) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
}

export function ResumeSelector({ resumes, selectedId, onSelect, onUpload, onDelete, loading }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-subtle)' }}>
          Your Resumes
        </span>
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: 11, borderRadius: 8, gap: 4 }}
          onClick={() => fileRef.current?.click()}
          disabled={loading}
        >
          <Plus size={12} />
          Upload
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={handleFile} />
      </div>

      {resumes.length === 0 && !loading && (
        <button
          className="btn btn-secondary w-full"
          style={{ padding: '20px 16px', borderRadius: 12, flexDirection: 'column', gap: 8, border: '1px dashed var(--border)' }}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={20} color="var(--text-subtle)" />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Upload your first resume</span>
          <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>PDF, DOCX, or TXT</span>
        </button>
      )}

      {resumes.map((resume) => {
        const isSelected = resume.id === selectedId;
        return (
          <div
            key={resume.id}
            onClick={() => onSelect(resume.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
              background: isSelected ? 'rgba(20,184,166,0.08)' : 'var(--bg-surface)',
              border: `1px solid ${isSelected ? 'rgba(20,184,166,0.3)' : 'var(--border)'}`,
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: isSelected ? 'rgba(20,184,166,0.15)' : 'var(--bg-elevated)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <FileText size={15} color={isSelected ? 'var(--teal)' : 'var(--text-muted)'} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: isSelected ? 'var(--teal-light)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {resume.filename}
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 2 }}>
                {new Date(resume.created_at).toLocaleDateString()}
              </p>
            </div>
            {isSelected && (
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', flexShrink: 0 }} />
            )}
            <button
              className="btn btn-ghost"
              style={{ padding: '4px', borderRadius: 6, color: 'var(--text-subtle)', flexShrink: 0 }}
              onClick={(e) => { e.stopPropagation(); onDelete(resume.id); }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      })}

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}
