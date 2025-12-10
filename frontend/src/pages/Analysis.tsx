import { useState } from 'react';
import { MaterialIcon } from '../components/ui/MaterialIcon';
import { Upload, FileText, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';
import { UploadConsole } from '../components/tactical/UploadConsole';
import { VendorBadge } from '../components/analysis/VendorBadge';
import { ScoreGauge } from '../components/analysis/ScoreGauge';
import { GapVisualizer } from '../components/analysis/GapVisualizer';
import { IssueCard } from '../components/analysis/IssueCard';
import { analyzeResume } from '../services/api';
import type { AnalysisResult } from '../types';

const styles = {
    container: {
        padding: '3rem 1rem',
        maxWidth: '1200px',
        margin: '0 auto'
    },
    header: {
        marginBottom: '4rem',
        textAlign: 'center' as const
    },
    statusBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.375rem 0.75rem',
        borderRadius: '9999px',
        border: '1px solid var(--border-subtle)',
        background: 'white',
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
        marginBottom: '1.5rem',
        letterSpacing: '0.02em'
    },
    pulseOuter: {
        position: 'relative' as const,
        display: 'flex',
        height: '0.5rem',
        width: '0.5rem'
    },
    pulseInner: {
        position: 'absolute' as const,
        display: 'inline-flex',
        height: '100%',
        width: '100%',
        borderRadius: '9999px',
        background: '#10b981',
        opacity: 0.75,
        animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite'
    },
    pulseDot: {
        position: 'relative' as const,
        display: 'inline-flex',
        borderRadius: '9999px',
        height: '0.5rem',
        width: '0.5rem',
        background: '#10b981'
    },
    title: {
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: '3.5rem',
        lineHeight: 1.1,
        marginBottom: '1.5rem',
        color: 'var(--text-main)',
        letterSpacing: '-0.02em'
    },
    subtitle: {
        color: 'var(--text-muted)',
        fontSize: '1.25rem',
        lineHeight: 1.6,
        maxWidth: '36rem',
        margin: '0 auto',
        fontFamily: "'Inter', sans-serif"
    },
    uploadContainer: {
        maxWidth: '48rem',
        margin: '0 auto'
    },
    resultsContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '3rem',
        animation: 'fadeInUp 0.5s ease-out'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem'
    },
    statsGridMd: {
        gridTemplateColumns: 'repeat(3, 1fr)'
    },
    statCard: {
        padding: '2.5rem',
        borderRadius: '1rem',
        border: '1px solid var(--border-subtle)',
        background: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        position: 'relative' as const,
        overflow: 'hidden'
    },
    statCardTopBar: (color: string) => ({
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '4px',
        background: color
    }),
    statCardGradient: (color: string) => ({
        position: 'absolute' as const,
        inset: 0,
        background: `radial-gradient(circle at top right, ${color}08, transparent 70%)`
    }),
    statHeader: {
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
        fontSize: '0.875rem',
        color: 'var(--text-muted)',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        letterSpacing: '0.05em',
        textTransform: 'uppercase' as const
    },
    vendorGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem'
    },
    vendorGridSm: {
        gridTemplateColumns: 'repeat(4, 1fr)'
    },
    vendorCard: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        padding: '1.25rem',
        borderRadius: '0.75rem',
        background: 'var(--bg-surface)',
        border: '1px solid transparent',
        transition: 'all 0.2s',
        cursor: 'pointer'
    },
    vendorCardHover: {
        borderColor: 'var(--border-subtle)',
        background: 'white',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    },
    vendorLabel: {
        fontSize: '0.75rem',
        marginTop: '0.75rem',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 500,
        color: 'var(--text-muted)',
        textTransform: 'capitalize' as const
    },
    tabs: {
        display: 'flex',
        borderBottom: '1px solid var(--border-subtle)',
        overflowX: 'auto' as const,
        gap: '2rem',
        marginBottom: '2rem'
    },
    tab: (active: boolean) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '1rem 0',
        fontWeight: 500,
        fontSize: '0.9375rem',
        transition: 'all 0.2s',
        borderBottom: active ? '2px solid var(--text-main)' : '2px solid transparent',
        color: active ? 'var(--text-main)' : 'var(--text-muted)',
        background: 'transparent',
        whiteSpace: 'nowrap' as const,
        cursor: 'pointer',
        border: 'none',
        fontFamily: "'Inter', sans-serif",
        borderBottomWidth: '2px',
        borderBottomStyle: 'solid' as const,
        borderBottomColor: active ? 'var(--text-main)' : 'transparent'
    }),
    tabContent: {
        minHeight: '25rem'
    },
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem'
    },
    contentGridMd: {
        gridTemplateColumns: 'repeat(2, 1fr)'
    },
    card: {
        padding: '2rem',
        borderRadius: '1rem',
        border: '1px solid var(--border-subtle)',
        background: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
    },
    cardHeader: {
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
        fontSize: '0.875rem',
        color: 'var(--text-muted)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        letterSpacing: '0.05em',
        textTransform: 'uppercase' as const
    },
    statsContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem'
    },
    statRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        borderRadius: '0.5rem',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)'
    },
    statLabel: {
        fontSize: '0.875rem',
        color: 'var(--text-muted)',
        fontFamily: "'Inter', sans-serif"
    },
    statValue: {
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
        color: 'var(--text-main)'
    },
    issuesContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1.5rem'
    },
    atsViewGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem'
    },
    atsViewGridMd: {
        gridTemplateColumns: 'repeat(2, 1fr)'
    },
    textPanel: {
        padding: '2rem',
        borderRadius: '1rem',
        border: '1px solid var(--border-subtle)',
        background: 'white',
        display: 'flex',
        flexDirection: 'column' as const,
        height: '40rem'
    },
    panelHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
    },
    panelTitle: {
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
        fontSize: '0.875rem',
        color: 'var(--text-muted)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em'
    },
    panelBadge: {
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 500,
        background: 'var(--bg-surface)',
        color: 'var(--text-muted)'
    },
    textContent: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.8125rem',
        color: 'var(--text-muted)',
        background: 'var(--bg-surface)',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        flex: 1,
        overflowY: 'auto' as const,
        border: '1px solid var(--border-subtle)',
        lineHeight: 1.6
    },
    sidePanel: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '2rem'
    },
    contactCard: {
        padding: '2rem',
        borderRadius: '1rem',
        border: '1px solid var(--border-subtle)',
        background: 'white'
    },
    contactList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem'
    },
    contactItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        fontSize: '0.875rem',
        color: 'var(--text-main)',
        padding: '1rem',
        borderRadius: '0.5rem',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)'
    },
    skillsContainer: {
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: '0.75rem'
    },
    skillBadge: {
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        fontSize: '0.8125rem',
        fontWeight: 500,
        background: 'var(--bg-surface)',
        color: 'var(--text-main)',
        border: '1px solid var(--border-subtle)'
    }
};

const AIInsightsCard = ({ insights }: { insights: NonNullable<AnalysisResult['ai_insights']> }) => (
    <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.1) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '50%' }}>
                <Sparkles size={20} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', margin: 0 }}>
                AI Strategic Analysis
            </h3>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                {insights.executive_summary}
            </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {/* Tactical Actions */}
            <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Tactical Action Plan
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {insights.tactical_actions.map((action, i) => (
                        <li key={i} style={{
                            display: 'flex',
                            gap: '0.75rem',
                            marginBottom: '0.75rem',
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5
                        }}>
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>•</span>
                            {action}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Strengths & Gaps */}
            <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3b82f6', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Key Insights
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {insights.strengths.slice(0, 2).map((s, i) => (
                        <div key={`s-${i}`} style={{ fontSize: '0.8rem', padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', borderLeft: '3px solid #3b82f6' }}>
                            <span style={{ fontWeight: 600 }}>Strength:</span> {s}
                        </div>
                    ))}
                    {insights.gaps.slice(0, 2).map((g, i) => (
                        <div key={`g-${i}`} style={{ fontSize: '0.8rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px', borderLeft: '3px solid #ef4444' }}>
                            <span style={{ fontWeight: 600 }}>Gap:</span> {g}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export const Analysis = () => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'ats-view'>('overview');
    const [jobDescription, setJobDescription] = useState('');

    const handleUpload = async (file: File) => {
        setIsAnalyzing(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Pass jobDescription to analyzeResume if it exists
            const data = await analyzeResume(file, jobDescription || undefined);
            setResult(data);
        } catch (error) {
            console.error('Analysis failed:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <PageLayout header={<Navbar />} maxWidth="xl">
            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.statusBadge}>
                        <span style={styles.pulseOuter}>
                            <span style={styles.pulseInner}></span>
                            <span style={styles.pulseDot}></span>
                        </span>
                        SYSTEM_READY
                    </div>
                    <h1 style={styles.title}>
                        Mission Control
                    </h1>
                    <p style={styles.subtitle}>
                        Initialize resume diagnostic sequence. Our engine will simulate a full ATS parse event.
                    </p>
                </div>

                {!result ? (
                    <div style={styles.uploadContainer}>
                        <UploadConsole
                            onFileSelect={handleUpload}
                            isAnalyzing={isAnalyzing}
                            onJdChange={setJobDescription}
                        />
                    </div>
                ) : (
                    <div style={styles.resultsContainer}>
                        {result.ai_insights && <AIInsightsCard insights={result.ai_insights} />}

                        {/* Top Stats Grid */}
                        <div style={{ ...styles.statsGrid, ...(window.innerWidth >= 768 ? styles.statsGridMd : {}) }}>
                            {/* Main Score */}
                            <div style={styles.statCard}>
                                <div style={styles.statCardTopBar('var(--accent-primary)')} />
                                <div style={styles.statCardGradient('rgba(109, 129, 150, ')} />

                                <h3 style={styles.statHeader}>
                                    <MaterialIcon icon="insights" size={16} style={{ color: 'var(--accent-primary)' }} />
                                    ATS PASS RATE
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}>
                                    <ScoreGauge score={result.friendliness_score} size="lg" label="" />
                                </div>
                            </div>

                            {/* JD Match Score - Only show if match_score exists */}
                            {result.match_score && (
                                <div style={styles.statCard}>
                                    <div style={styles.statCardTopBar('#d9b56c')} />
                                    <div style={styles.statCardGradient('rgba(217, 181, 108, ')} />

                                    <h3 style={styles.statHeader}>
                                        <MaterialIcon icon="work" size={16} style={{ color: '#d9b56c' }} />
                                        JD MATCH SCORE
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}>
                                        <ScoreGauge score={result.match_score} size="lg" label="" />
                                    </div>
                                    {result.visibility_breakdown && (
                                        <div style={{ padding: '0 1rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            <div>Semantic: {String(result.visibility_breakdown.semantic_score)}%</div>
                                            <div>Keywords: {String(result.visibility_breakdown.keyword_score)}%</div>
                                            <div style={{ marginTop: '0.5rem', color: '#d9b56c', fontWeight: 600 }}>
                                                {typeof result.visibility_breakdown.level === 'string' ? result.visibility_breakdown.level.replace(/_/g, ' ') : ''}
                                            </div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                                (Score = 70% Meaning + 30% Keywords)
                                            </div>
                                            <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(217, 181, 108, 0.2)', paddingTop: '0.5rem' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#d9b56c', marginBottom: '0.25rem' }}>MISSING KEYWORDS</div>
                                                {result.missing_keywords && result.missing_keywords.length > 0 ? (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                                        {result.missing_keywords.map((kw, i) => (
                                                            <span key={i} style={{
                                                                fontSize: '0.65rem',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                background: 'rgba(239, 68, 68, 0.1)',
                                                                color: '#ef4444',
                                                                border: '1px solid rgba(239, 68, 68, 0.2)'
                                                            }}>
                                                                {kw}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                        No critical keywords missing from standard list.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Vendor Compatibility */}
                            <div style={{ ...styles.statCard, gridColumn: window.innerWidth >= 768 ? 'span 2' : 'span 1' }}>
                                <div style={styles.statCardTopBar('var(--accent-secondary)')} />
                                <div style={styles.statCardGradient('rgba(74, 74, 74, ')} />

                                <h3 style={styles.statHeader}>
                                    <MaterialIcon icon="shield" size={16} style={{ color: 'var(--accent-secondary)' }} />
                                    VENDOR RISK ASSESSMENT
                                </h3>
                                <div style={{ ...styles.vendorGrid, ...(window.innerWidth >= 640 ? styles.vendorGridSm : {}) }}>
                                    {Object.entries(result.vendor_compatibility).map(([vendor, data]) => (
                                        <div key={vendor} style={styles.vendorCard}>
                                            <VendorBadge vendor={vendor} status={data.status === 'pass' ? 'compatible' : data.status === 'fail' ? 'incompatible' : 'warning'} />
                                            <span style={styles.vendorLabel}>
                                                {vendor}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div style={styles.tabs}>
                            {[
                                { id: 'overview', label: 'Diagnostic Overview', icon: 'insights' },
                                { id: 'issues', label: 'Critical Issues', icon: 'warning' },
                                { id: 'ats-view', label: 'What ATS Sees', icon: 'search' },
                            ].map((tab) => {
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as 'overview' | 'issues' | 'ats-view')}
                                        style={styles.tab(activeTab === tab.id)}
                                    >
                                        <MaterialIcon icon={tab.icon} size={16} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tab Content */}
                        <div style={styles.tabContent}>
                            {activeTab === 'overview' && (
                                <div style={{ ...styles.contentGrid, ...(window.innerWidth >= 768 ? styles.contentGridMd : {}) }}>
                                    {/* Timeline Analysis */}
                                    <div style={styles.card}>
                                        <h3 style={styles.cardHeader}>
                                            <MaterialIcon icon="bolt" size={16} style={{ color: '#d9b56c' }} />
                                            CAREER TIMELINE
                                        </h3>
                                        <GapVisualizer history={result.timeline?.jobs || []} />
                                    </div>

                                    {/* Quick Stats */}
                                    <div style={styles.card}>
                                        <h3 style={styles.cardHeader}>
                                            <MaterialIcon icon="insights" size={16} style={{ color: 'var(--accent-primary)' }} />
                                            PARSING METRICS
                                        </h3>
                                        <div style={styles.statsContainer}>
                                            {[
                                                { label: 'File Size', value: `${(result.file_size_bytes / 1024).toFixed(1)} KB`, status: 'good' },
                                                { label: 'Word Count', value: result.word_count, status: 'neutral' },
                                                { label: 'Skills Extracted', value: result.ats_extracted.skills.length, status: 'good' },
                                            ].map((stat, i) => (
                                                <div key={i} style={styles.statRow}>
                                                    <span style={styles.statLabel}>{stat.label}</span>
                                                    <span style={styles.statValue}>{stat.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'issues' && (
                                <div style={styles.issuesContainer}>
                                    {result.critical_issues.map((issue, index) => (
                                        <IssueCard key={index} issue={issue} />
                                    ))}
                                </div>
                            )}

                            {activeTab === 'ats-view' && (
                                <div style={{ ...styles.atsViewGrid, ...(window.innerWidth >= 768 ? styles.atsViewGridMd : {}) }}>
                                    <div style={styles.textPanel}>
                                        <div style={styles.panelHeader}>
                                            <h3 style={styles.panelTitle}>
                                                EXTRACTED TEXT
                                            </h3>
                                            <span style={styles.panelBadge}>
                                                RAW_DATA
                                            </span>
                                        </div>
                                        <div style={styles.textContent}>
                                            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.6, margin: 0 }}>
                                                {/* Display raw_text if available from backend response */}
                                                {result.ats_extracted?.raw_text || 'No raw text data available from backend'}
                                            </pre>
                                        </div>
                                    </div>

                                    <div style={styles.sidePanel}>
                                        <div style={styles.contactCard}>
                                            <h3 style={styles.cardHeader}>
                                                CONTACT INFO
                                            </h3>
                                            <div style={styles.contactList}>
                                                {result.ats_extracted.contact.map((item, i) => (
                                                    <div key={i} style={styles.contactItem}>
                                                        <MaterialIcon icon="check_circle" size={16} style={{ color: 'var(--accent-secondary)' }} />
                                                        {item}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={styles.contactCard}>
                                            <h3 style={styles.cardHeader}>
                                                SKILLS DETECTED
                                            </h3>
                                            <div style={styles.skillsContainer}>
                                                {result.ats_extracted.skills
                                                    .filter(skill => skill && skill.length > 2 && !skill.startsWith('##'))
                                                    .map((skill, i) => (
                                                        <span key={i} style={styles.skillBadge}>
                                                            {skill}
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    );
};
