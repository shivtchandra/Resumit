import { useState } from 'react';
import { Github, Code2, ExternalLink, TrendingUp, Award, CheckCircle2, XCircle, MessageSquare, Lightbulb, ThumbsUp, ThumbsDown, BookOpen, Target, Wrench, Sparkles, Search, BarChart3 } from 'lucide-react';
import { analyzeGitHubRepos } from '@/services/api';
import type { GitHubAnalysisResult, GitHubRepository } from '@/types/github';

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

export const GitHubAnalyzer = () => {
    const [githubInput, setGithubInput] = useState('');
    const [jobRole, setJobRole] = useState('software-engineer');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<GitHubAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!githubInput.trim()) {
            setError('Please enter a GitHub username or URL');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await analyzeGitHubRepos(githubInput, jobRole);
            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Failed to analyze repositories');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Github size={32} />
                    GitHub Repository Analyzer
                </h1>
                <p style={{ color: '#64748b', fontSize: '1rem' }}>
                    Find your most relevant repositories for your target job role
                </p>
            </div>

            {/* Tips & Best Practices */}
            <div style={{ background: 'white', border: '2px solid #e2e8f0', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                    <Lightbulb size={20} />
                    How to Get the Best Results
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                            <BookOpen size={18} />
                            README is Critical
                        </div>
                        <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#475569' }}>
                            Projects <strong>without a README score &lt;30%</strong>. Add setup instructions, screenshots, and explain what problem you solved.
                        </p>
                    </div>
                    <div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                            <Target size={18} />
                            Show Real Skills
                        </div>
                        <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#475569' }}>
                            Tutorial clones score low. Original projects solving real problems get <strong>75%+</strong>. Demonstrate features like auth, APIs, databases.
                        </p>
                    </div>
                    <div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                            <Wrench size={18} />
                            Use Right Tech
                        </div>
                        <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#475569' }}>
                            Match your tech stack to the role. Frontend roles need React/TypeScript. Data roles need Python/SQL. Wrong tech = penalty.
                        </p>
                    </div>
                </div>
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', color: '#0f172a', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <Sparkles size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <strong>Pro Tip:</strong> The AI thinks like a recruiter with 60 seconds to decide. Make your README professional, explain your project clearly, and show you can code.
                    </div>
                </div>
            </div>

            {/* Input Form */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
                        GitHub Username or URL
                    </label>
                    <input
                        type="text"
                        value={githubInput}
                        onChange={(e) => setGithubInput(e.target.value)}
                        placeholder="e.g., torvalds or https://github.com/torvalds"
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '1rem' }}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
                        Target Job Role
                    </label>
                    <select
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '1rem' }}
                    >
                        {JOB_ROLES.map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: loading ? '#94a3b8' : '#0f172a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Search size={18} />
                    {loading ? 'Analyzing...' : 'Analyze Repositories'}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <XCircle size={20} />
                    {error}
                </div>
            )}

            {/* Results */}
            {result && (
                <>
                    {/* Insights */}
                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BarChart3 size={24} />
                            Profile Insights
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Total Repos</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{result.total_repos}</div>
                            </div>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Total Stars</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{result.insights.total_stars}</div>
                            </div>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Top Languages</div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                                    {result.insights.primary_languages.slice(0, 3).join(', ')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Repositories */}
                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={24} />
                            Top Recommended Repositories
                        </h2>

                        {result.top_repositories.length === 0 ? (
                            <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>
                                No repositories found
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {result.top_repositories.map((repo, index) => (
                                    <RepositoryCard key={repo.full_name} repo={repo} rank={index + 1} />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const RepositoryCard = ({ repo, rank }: { repo: GitHubRepository; rank: number }) => {
    const [expanded, setExpanded] = useState(false);
    const score = repo.relevance_score || 0;
    const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    const isInterviewWorthy = repo.interview_worthy;

    return (
        <div style={{ border: '2px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', background: 'white', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', background: '#0f172a', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.25rem', flexShrink: 0 }}>
                    {rank}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <a href={repo.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {repo.name}
                            <ExternalLink size={18} />
                        </a>
                        <div style={{ padding: '0.25rem 0.75rem', background: scoreColor, color: 'white', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 600 }}>
                            {score.toFixed(0)}% Match
                        </div>
                        {isInterviewWorthy && rank <= 3 && (
                            <div style={{ padding: '0.25rem 0.75rem', background: '#10b981', color: 'white', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <CheckCircle2 size={14} /> Interview Worthy
                            </div>
                        )}
                    </div>

                    {repo.description && (
                        <p style={{ color: '#475569', marginBottom: '1rem', lineHeight: '1.6' }}>{repo.description}</p>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                        {repo.language && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#64748b' }}>
                                <Code2 size={16} /> {repo.language}
                            </span>
                        )}
                    </div>

                    {/* First Impression */}
                    {repo.first_impression && (
                        <div style={{ padding: '0.75rem', background: '#fef3c7', border: '1px solid #fde047', borderRadius: '8px', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: 600, marginBottom: '0.25rem' }}>First Impression</div>
                            <div style={{ fontSize: '0.875rem', color: '#a16207', fontStyle: 'italic' }}>{repo.first_impression}</div>
                        </div>
                    )}

                    {/* Recruiter Decision */}
                    {repo.why_relevant && (
                        <div style={{ padding: '0.75rem', background: isInterviewWorthy ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isInterviewWorthy ? '#bbf7d0' : '#fecaca'}`, borderRadius: '8px', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.875rem', color: isInterviewWorthy ? '#166534' : '#991b1b', fontWeight: 600, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                {isInterviewWorthy ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                Recruiter Decision
                            </div>
                            <div style={{ fontSize: '0.875rem', color: isInterviewWorthy ? '#15803d' : '#991b1b' }}>{repo.why_relevant}</div>
                        </div>
                    )}

                    {/* Resume Bullets */}
                    {repo.suggested_resume_text && (
                        <div style={{ padding: '0.75rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Award size={14} /> Suggested for Resume
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#1e3a8a', whiteSpace: 'pre-line' }}>{repo.suggested_resume_text}</div>
                        </div>
                    )}

                    {/* Expandable Details */}
                    {((repo.strengths?.length ?? 0) > 0 || (repo.red_flags?.length ?? 0) > 0 || (repo.interview_questions?.length ?? 0) > 0) && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#475569', cursor: 'pointer', width: '100%', marginBottom: '1rem' }}
                        >
                            {expanded ? 'Hide Details' : 'Show Detailed Analysis'}
                        </button>
                    )}

                    {expanded && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                            {/* Strengths */}
                            {repo.strengths && repo.strengths.length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#166534', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <ThumbsUp size={14} /> Strengths
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#15803d', fontSize: '0.875rem' }}>
                                        {repo.strengths.map((strength: string, i: number) => (
                                            <li key={i} style={{ marginBottom: '0.25rem' }}>{strength}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Red Flags */}
                            {repo.red_flags && repo.red_flags.length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#991b1b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <ThumbsDown size={14} /> Red Flags
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#991b1b', fontSize: '0.875rem' }}>
                                        {repo.red_flags.map((flag: string, i: number) => (
                                            <li key={i} style={{ marginBottom: '0.25rem' }}>{flag}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Interview Questions */}
                            {repo.interview_questions && repo.interview_questions.length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#7c3aed', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <MessageSquare size={14} /> Interview Questions
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6d28d9', fontSize: '0.875rem' }}>
                                        {repo.interview_questions.map((question: string, i: number) => (
                                            <li key={i} style={{ marginBottom: '0.25rem' }}>{question}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Improvement Advice */}
                            {repo.improvement_advice && repo.improvement_advice.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ea580c', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Lightbulb size={14} /> Improvement Advice
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#c2410c', fontSize: '0.875rem' }}>
                                        {repo.improvement_advice.map((advice: string, i: number) => (
                                            <li key={i} style={{ marginBottom: '0.25rem' }}>{advice}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
