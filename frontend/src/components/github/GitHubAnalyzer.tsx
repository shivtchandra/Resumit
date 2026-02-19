import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
    Github,
    Code2,
    ExternalLink,
    TrendingUp,
    Award,
    CheckCircle2,
    XCircle,
    MessageSquare,
    Lightbulb,
    ThumbsUp,
    ThumbsDown,
    Search,
    BarChart3,
    Settings2,
    ShieldAlert,
    Loader2,
} from 'lucide-react';
import { analyzeGitHubRepos } from '@/services/api';
import type { GitHubAnalysisResult, GitHubRepository } from '@/types/github';

const SESSION_FORM_KEY = 'resumit_github_form';

const JOB_ROLES = [
    { value: 'software-engineer', label: 'Software Engineer' },
    { value: 'data-scientist', label: 'Data Scientist' },
    { value: 'data-analyst', label: 'Data Analyst' },
    { value: 'frontend-developer', label: 'Frontend Developer' },
    { value: 'backend-developer', label: 'Backend Developer' },
    { value: 'devops-engineer', label: 'DevOps Engineer' },
    { value: 'mobile-developer', label: 'Mobile Developer' },
    { value: 'machine-learning-engineer', label: 'ML Engineer' },
    { value: 'full-stack-developer', label: 'Full Stack Developer' },
];

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1rem',
    },
    sectionCard: {
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid var(--border-subtle)',
        padding: '1rem',
        marginBottom: '1rem',
        boxShadow: 'var(--shadow-soft)',
    },
    headerTitle: {
        fontSize: '1.6rem',
        fontWeight: 700,
        color: '#0f172a',
        marginBottom: '0.35rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
    },
    input: {
        width: '100%',
        padding: '0.68rem 0.75rem',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        fontSize: '0.9rem',
        color: '#0f172a',
        background: '#ffffff',
    },
    label: {
        display: 'block',
        fontWeight: 700,
        marginBottom: '0.45rem',
        color: '#1e293b',
        fontSize: '0.84rem',
    },
    button: (disabled: boolean) => ({
        width: '100%',
        padding: '0.82rem',
        background: disabled ? '#94a3b8' : '#0f172a',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '0.92rem',
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
    }),
};

export const GitHubAnalyzer = () => {
    // Restore form state from sessionStorage
    const savedForm = (() => {
        try {
            const stored = sessionStorage.getItem(SESSION_FORM_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    })();

    const [githubInput, setGithubInput] = useState(savedForm?.githubInput || '');
    const [jobRole, setJobRole] = useState(savedForm?.jobRole || 'software-engineer');
    const [jobDescription, setJobDescription] = useState(savedForm?.jobDescription || '');
    const [pinnedRepos, setPinnedRepos] = useState(savedForm?.pinnedRepos || '');
    const [githubToken, setGithubToken] = useState('');
    const [useAI, setUseAI] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [loadingSignal, setLoadingSignal] = useState(0);

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<GitHubAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Results are NOT persisted to sessionStorage — prevents data leakage between users.

    // Persist form inputs
    useEffect(() => {
        try {
            sessionStorage.setItem(SESSION_FORM_KEY, JSON.stringify({
                githubInput, jobRole, jobDescription, pinnedRepos
            }));
        } catch { /* ignore */ }
    }, [githubInput, jobRole, jobDescription, pinnedRepos]);

    useEffect(() => {
        if (!loading) {
            setElapsedSeconds(0);
            setLoadingSignal(0);
            return;
        }

        const secondTimer = setInterval(() => {
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);
        const signalTimer = setInterval(() => {
            setLoadingSignal((prev) => (prev + 1) % 4);
        }, 1500);

        return () => {
            clearInterval(secondTimer);
            clearInterval(signalTimer);
        };
    }, [loading]);

    const handleAnalyze = async () => {
        const input = githubInput.trim();
        if (!input) {
            setError('Please enter a GitHub username or URL');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await analyzeGitHubRepos(input, jobRole, {
                jobDescription: jobDescription.trim() || undefined,
                pinnedRepos: pinnedRepos.trim() || undefined,
                useAI,
                githubToken: githubToken.trim() || undefined,
            });
            setResult(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to analyze repositories';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.sectionCard}>
                <h1 style={styles.headerTitle}>
                    <Github size={28} />
                    GitHub Repository Analyzer
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
                    Rank your repositories by role relevance and get practical guidance on what to keep on your resume.
                </p>
            </div>

            <div style={styles.sectionCard}>
                <div style={{ display: 'grid', gap: '0.8rem' }}>
                    <div>
                        <label style={styles.label}>GitHub Username or URL</label>
                        <input
                            type="text"
                            value={githubInput}
                            onChange={(e) => setGithubInput(e.target.value)}
                            placeholder="e.g., torvalds or https://github.com/torvalds?tab=repositories"
                            style={styles.input}
                        />
                    </div>

                    <div>
                        <label style={styles.label}>Target Job Role</label>
                        <select
                            value={jobRole}
                            onChange={(e) => setJobRole(e.target.value)}
                            style={styles.input}
                        >
                            {JOB_ROLES.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowAdvanced((v) => !v)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            border: '1px solid var(--border-subtle)',
                            background: '#fff',
                            color: '#334155',
                            borderRadius: '10px',
                            padding: '0.5rem 0.7rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            width: 'fit-content',
                        }}
                    >
                        <Settings2 size={14} />
                        {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
                    </button>

                    {showAdvanced && (
                        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.75rem', display: 'grid', gap: '0.7rem', background: '#f8fafc' }}>
                            <div>
                                <label style={styles.label}>Job Description (Optional)</label>
                                <textarea
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="Paste JD for more accurate scoring and interview relevance..."
                                    style={{ ...styles.input, minHeight: '96px', resize: 'vertical' }}
                                />
                            </div>
                            <div>
                                <label style={styles.label}>Pinned Repositories (Optional)</label>
                                <input
                                    type="text"
                                    value={pinnedRepos}
                                    onChange={(e) => setPinnedRepos(e.target.value)}
                                    placeholder="repo-one, repo-two, repo-three"
                                    style={styles.input}
                                />
                                <p style={{ margin: '0.28rem 0 0', color: '#64748b', fontSize: '0.76rem' }}>
                                    These repos are prioritized in AI analysis.
                                </p>
                            </div>
                            <div>
                                <label style={styles.label}>GitHub Token (Optional)</label>
                                <input
                                    type="password"
                                    value={githubToken}
                                    onChange={(e) => setGithubToken(e.target.value)}
                                    placeholder="ghp_... (optional, helps avoid rate limits)"
                                    style={styles.input}
                                />
                            </div>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                                <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
                                Enable AI recruiter analysis (slower; best for final pass)
                            </label>
                        </div>
                    )}

                    <button onClick={handleAnalyze} disabled={loading} style={styles.button(loading)}>
                        <Search size={17} />
                        {loading ? 'Analyzing GitHub...' : 'Analyze GitHub Profile'}
                    </button>
                </div>
            </div>

            {loading && (
                <div style={{ ...styles.sectionCard, padding: '1rem', display: 'grid', gap: '0.6rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#0f172a', fontWeight: 700 }}>
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        Running GitHub analysis...
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                        {[
                            'Fetching repositories and metadata',
                            'Scoring role relevance and README quality',
                            'Preparing top recommendations',
                            'Compiling feedback cards',
                        ][loadingSignal]}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        {elapsedSeconds}s elapsed
                    </div>
                </div>
            )}

            {error && (
                <div style={{ ...styles.sectionCard, background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <XCircle size={19} />
                    <div>
                        <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>GitHub Checker Error</div>
                        <div style={{ fontSize: '0.88rem' }}>{error}</div>
                    </div>
                </div>
            )}

            {result && (
                <>
                    <div style={styles.sectionCard}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1.1rem', margin: '0 0 0.8rem', color: '#0f172a' }}>
                            <BarChart3 size={19} />
                            Analysis Summary
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
                            <MetricCard label="User" value={result.username} />
                            <MetricCard label="Total Repos" value={String(result.total_repos)} />
                            <MetricCard label="Analyzed Repos" value={String(result.analyzed_repos)} />
                            <MetricCard label="Total Stars" value={String(result.insights?.total_stars ?? 0)} />
                            <MetricCard label="Mode" value={result.analysis_mode || (result.ai_used ? 'ai' : 'heuristic')} />
                            <MetricCard label="Rate Limit Left" value={String(result.rate_limit?.remaining ?? 0)} />
                        </div>

                        {(result.rate_limit?.remaining ?? 0) < 10 && (
                            <div style={{ marginTop: '0.75rem', padding: '0.6rem', borderRadius: '8px', border: '1px solid #fde68a', background: '#fffbeb', color: '#92400e', fontSize: '0.83rem', display: 'flex', gap: '0.45rem' }}>
                                <ShieldAlert size={16} />
                                GitHub API rate limit is low. Add `github_token` in advanced options for reliable results.
                            </div>
                        )}
                    </div>

                    <div style={styles.sectionCard}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <TrendingUp size={19} />
                            Top Recommended Repositories
                        </h2>
                        {result.top_repositories.length === 0 ? (
                            <p style={{ color: '#64748b', margin: 0 }}>
                                No repositories were returned for this user.
                            </p>
                        ) : (
                            <div style={{ display: 'grid', gap: '0.85rem' }}>
                                {result.top_repositories.map((repo, index) => (
                                    <RepositoryCard
                                        key={repo.full_name}
                                        repo={repo}
                                        rank={index + 1}
                                        isHeuristicOnly={(result.analysis_mode || (result.ai_used ? 'ai' : 'heuristic')) !== 'ai'}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const MetricCard = ({ label, value }: { label: string; value: string }) => (
    <div style={{ padding: '0.7rem', border: '1px solid var(--border-subtle)', borderRadius: '10px', background: '#f8fafc' }}>
        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.15rem' }}>{label}</div>
        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', wordBreak: 'break-word' }}>{value}</div>
    </div>
);

const RepositoryCard = ({
    repo,
    rank,
    isHeuristicOnly,
}: {
    repo: GitHubRepository;
    rank: number;
    isHeuristicOnly: boolean;
}) => {
    const [expanded, setExpanded] = useState(false);
    const score = repo.relevance_score || 0;
    const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    const isInterviewWorthy = repo.interview_worthy;

    return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem', background: '#fff' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ width: '34px', height: '34px', background: '#0f172a', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                    {rank}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                        <a href={repo.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            {repo.name}
                            <ExternalLink size={15} />
                        </a>
                        <span style={{ padding: '0.2rem 0.55rem', background: scoreColor, color: '#fff', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>
                            {score.toFixed(0)}% Match
                        </span>
                        {isInterviewWorthy && (
                            <span style={{ padding: '0.2rem 0.55rem', background: '#ecfdf5', color: '#166534', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <CheckCircle2 size={12} />
                                Interview Worthy
                            </span>
                        )}
                        {isHeuristicOnly && (
                            <span style={{ padding: '0.2rem 0.55rem', background: '#fffbeb', color: '#92400e', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid #fde68a' }}>
                                Heuristic Mode
                            </span>
                        )}
                    </div>

                    {repo.description && (
                        <p style={{ color: '#475569', margin: '0 0 0.55rem', fontSize: '0.86rem' }}>{repo.description}</p>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', marginBottom: '0.6rem' }}>
                        {repo.language && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: '#64748b' }}>
                                <Code2 size={13} /> {repo.language}
                            </span>
                        )}
                    </div>

                    {repo.why_relevant && (
                        <div style={{ padding: '0.55rem', background: isInterviewWorthy ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isInterviewWorthy ? '#bbf7d0' : '#fecaca'}`, borderRadius: '8px', marginBottom: '0.55rem' }}>
                            <div style={{ fontSize: '0.74rem', color: isInterviewWorthy ? '#166534' : '#991b1b', fontWeight: 700, marginBottom: '0.18rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                {isInterviewWorthy ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                Recruiter Decision
                            </div>
                            <div style={{ fontSize: '0.8rem', color: isInterviewWorthy ? '#166534' : '#991b1b' }}>{repo.why_relevant}</div>
                        </div>
                    )}

                    {repo.suggested_resume_text && (
                        <div style={{ padding: '0.55rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', marginBottom: '0.55rem' }}>
                            <div style={{ fontSize: '0.74rem', color: '#1e40af', fontWeight: 700, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Award size={12} /> Suggested Resume Bullets
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#1e3a8a', whiteSpace: 'pre-line' }}>{repo.suggested_resume_text}</div>
                        </div>
                    )}

                    {((repo.strengths?.length ?? 0) > 0 || (repo.red_flags?.length ?? 0) > 0 || (repo.interview_questions?.length ?? 0) > 0 || (repo.improvement_advice?.length ?? 0) > 0) && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            style={{ padding: '0.42rem 0.7rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700, color: '#334155', cursor: 'pointer', width: '100%' }}
                        >
                            {expanded ? 'Hide Detailed Feedback' : 'Show Detailed Feedback'}
                        </button>
                    )}

                    {expanded && (
                        <div style={{ marginTop: '0.55rem', paddingTop: '0.55rem', borderTop: '1px solid #e2e8f0' }}>
                            {repo.strengths && repo.strengths.length > 0 && (
                                <DetailList icon={<ThumbsUp size={13} />} title="Strengths" color="#166534" items={repo.strengths} />
                            )}
                            {repo.red_flags && repo.red_flags.length > 0 && (
                                <DetailList icon={<ThumbsDown size={13} />} title="Red Flags" color="#991b1b" items={repo.red_flags} />
                            )}
                            {repo.interview_questions && repo.interview_questions.length > 0 && (
                                <DetailList icon={<MessageSquare size={13} />} title="Interview Questions" color="#0f766e" items={repo.interview_questions} />
                            )}
                            {repo.improvement_advice && repo.improvement_advice.length > 0 && (
                                <DetailList icon={<Lightbulb size={13} />} title="Improvement Advice" color="#c2410c" items={repo.improvement_advice} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DetailList = ({
    icon,
    title,
    color,
    items,
}: {
    icon: ReactNode;
    title: string;
    color: string;
    items: string[];
}) => (
    <div style={{ marginBottom: '0.6rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color, marginBottom: '0.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            {icon} {title}
        </div>
        <ul style={{ margin: 0, paddingLeft: '1rem', color, fontSize: '0.8rem' }}>
            {items.map((item, i) => (
                <li key={i} style={{ marginBottom: '0.2rem' }}>{item}</li>
            ))}
        </ul>
    </div>
);
