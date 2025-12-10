import { useState } from 'react';
import { Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { rewriteWithBrutalFeedback } from '@/services/api';
import type { BrutalRewriteResult } from '@/types';
import { BrutalFitReview } from './BrutalFitReview';
import { HighlightedResume } from './HighlightedResume';

// --- Styles ---
const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: "'Inter', -apple-system, sans-serif",
        color: '#0f172a'
    },
    hero: {
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '2.5rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        textAlign: 'center' as const,
        position: 'relative' as const,
        overflow: 'hidden'
    },
    heroAccent: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '4px',
        background: 'linear-gradient(90deg, #8b5cf6 0%, #d8b4fe 100%)'
    },
    successIcon: {
        width: '64px',
        height: '64px',
        background: '#f0fdf4',
        color: '#16a34a',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem',
        border: '1px solid #dcfce7'
    },
    heroTitle: {
        fontSize: '2rem',
        fontWeight: 700,
        color: '#0f172a',
        marginBottom: '0.75rem',
        letterSpacing: '-0.02em'
    },
    heroSubtitle: {
        fontSize: '1.05rem',
        color: '#64748b',
        maxWidth: '600px',
        margin: '0 auto 2rem',
        lineHeight: '1.6'
    },
    heroActions: {
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        flexWrap: 'wrap' as const
    },
    secondaryBtn: {
        padding: '0.875rem 2rem',
        background: 'white',
        color: '#475569',
        borderRadius: '9999px',
        fontWeight: 600,
        border: '1px solid #e2e8f0',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    uploadContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
    },
    uploadBox: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed #cbd5e1',
        borderRadius: '16px',
        padding: '3rem 2rem',
        textAlign: 'center' as const,
        background: '#f8fafc',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minHeight: '250px'
    },
    uploadBoxActive: {
        borderColor: '#8b5cf6',
        background: '#f5f3ff',
        transform: 'translateY(-2px)'
    },
    textarea: {
        width: '100%',
        height: '250px',
        padding: '1.25rem',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#e2e8f0',
        borderRadius: '16px',
        fontSize: '0.95rem',
        fontFamily: "'Inter', sans-serif",
        resize: 'none' as const,
        lineHeight: '1.6',
        color: '#334155',
        background: '#f8fafc',
        transition: 'all 0.2s ease'
    },
    textareaFocus: {
        outline: 'none',
        borderColor: '#8b5cf6',
        background: 'white',
        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.1)'
    }
};

export const FullRewrite = () => {
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState('');
    const [isRewriting, setIsRewriting] = useState(false);
    const [brutalResult, setBrutalResult] = useState<BrutalRewriteResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isTextareaFocused, setIsTextareaFocused] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }
            setResumeFile(file);
            setError(null);
        }
    };

    const handleRewrite = async () => {
        if (!resumeFile || !jobDescription.trim()) return;
        setIsRewriting(true);
        setError(null);
        setBrutalResult(null);

        try {
            const response = await rewriteWithBrutalFeedback(resumeFile, jobDescription);
            setBrutalResult(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze resume');
        } finally {
            setIsRewriting(false);
        }
    };

    // Render brutal review results
    if (brutalResult) {
        return (
            <div style={styles.container}>
                <div style={styles.hero}>
                    <div style={styles.heroAccent} />
                    <div style={styles.successIcon}>
                        <CheckCircle size={32} />
                    </div>
                    <h1 style={styles.heroTitle}>Resume Analysis Complete</h1>
                    <p style={styles.heroSubtitle}>
                        Your resume has been analyzed with brutally honest feedback from our AI hiring manager.
                    </p>
                    <div style={styles.heroActions}>
                        <button
                            style={styles.secondaryBtn}
                            onClick={() => setBrutalResult(null)}
                        >
                            Analyze Another
                        </button>
                    </div>
                </div>

                <HighlightedResume
                    markedUpText={brutalResult.marked_up_resume}
                    changes={brutalResult.changes}
                />

                <BrutalFitReview
                    companyExpectations={brutalResult.company_expectations}
                    harshReview={brutalResult.harsh_review}
                />
            </div>
        );
    }

    if (isRewriting) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
                <Loader2 size={48} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>Analyzing your resume...</h3>
                <p style={{ color: '#64748b' }}>Our AI hiring manager is reviewing your resume and preparing brutally honest feedback.</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {error && (
                <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            <div style={styles.uploadContainer}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>Upload Resume</h3>
                    <label
                        style={{
                            ...styles.uploadBox,
                            ...(isDragOver || resumeFile ? styles.uploadBoxActive : {})
                        }}
                        onMouseEnter={() => setIsDragOver(true)}
                        onMouseLeave={() => setIsDragOver(false)}
                    >
                        <input type="file" accept=".pdf,.docx" onChange={handleFileSelect} style={{ display: 'none' }} />
                        <div style={{
                            padding: '1rem',
                            background: isDragOver || resumeFile ? '#fff' : '#f1f5f9',
                            borderRadius: '50%',
                            marginBottom: '1.5rem',
                            transition: 'all 0.2s'
                        }}>
                            {resumeFile ? <CheckCircle size={32} color="#10b981" /> : <Sparkles size={32} color="#8b5cf6" />}
                        </div>
                        <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#334155', fontSize: '1.05rem' }}>
                            {resumeFile ? resumeFile.name : 'Drag & drop PDF or DOCX'}
                        </p>
                        <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                            {resumeFile ? `${(resumeFile.size / 1024 / 1024).toFixed(2)} MB` : 'Max file size: 5MB'}
                        </p>
                    </label>
                </div>

                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>Target Job Description</h3>
                    <textarea
                        style={{
                            ...styles.textarea,
                            ...(isTextareaFocused ? styles.textareaFocus : {})
                        }}
                        placeholder="Paste the job description here to enable AI keyword matching..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        onFocus={() => setIsTextareaFocused(true)}
                        onBlur={() => setIsTextareaFocused(false)}
                    />
                </div>
            </div>

            <button
                onClick={handleRewrite}
                disabled={!resumeFile || !jobDescription.trim()}
                style={{
                    width: '100%',
                    marginTop: '2rem',
                    padding: '1rem',
                    background: (!resumeFile || !jobDescription.trim()) ? '#cbd5e1' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '9999px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: (!resumeFile || !jobDescription.trim()) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: (!resumeFile || !jobDescription.trim()) ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}
            >
                <Sparkles size={20} />
                Get Brutal Review
            </button>
        </div>
    );
};
