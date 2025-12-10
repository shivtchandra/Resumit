import { AlertTriangle, CheckCircle, XCircle, TrendingDown, Target, Lightbulb, Search, Clock } from 'lucide-react';
import type { HarshReview, CompanyExpectations } from '@/types';

interface BrutalFitReviewProps {
    companyExpectations: CompanyExpectations;
    harshReview: HarshReview;
}

const styles = {
    container: {
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '2rem',
        marginBottom: '2rem'
    },
    header: {
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '2px solid #fbbf24'
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: 700,
        color: '#0f172a',
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
    },
    subtitle: {
        fontSize: '0.95rem',
        color: '#64748b',
        fontStyle: 'italic'
    },
    section: {
        marginBottom: '2rem'
    },
    sectionTitle: {
        fontSize: '1.1rem',
        fontWeight: 600,
        color: '#1e293b',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    verdict: {
        padding: '1.5rem',
        background: '#fef3c7',
        borderLeft: '4px solid #f59e0b',
        borderRadius: '8px',
        marginBottom: '1.5rem'
    },
    verdictText: {
        fontSize: '1.05rem',
        color: '#92400e',
        lineHeight: '1.6',
        fontWeight: 500
    },
    list: {
        listStyle: 'none',
        padding: 0,
        margin: 0
    },
    listItem: {
        padding: '0.75rem 1rem',
        background: '#f8fafc',
        borderRadius: '8px',
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
    },
    strengthItem: {
        background: '#ecfdf5',
        border: '1px solid #a7f3d0'
    },
    weaknessItem: {
        background: '#fef2f2',
        border: '1px solid #fecaca'
    },
    skillCard: {
        padding: '1rem',
        background: '#fff7ed',
        border: '1px solid #fed7aa',
        borderRadius: '8px',
        marginBottom: '1rem'
    },
    skillName: {
        fontWeight: 600,
        color: '#9a3412',
        marginBottom: '0.5rem'
    },
    skillDetail: {
        fontSize: '0.9rem',
        color: '#7c2d12',
        marginBottom: '0.25rem'
    },
    interviewVerdict: {
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        textAlign: 'center' as const
    },
    verdictYes: {
        background: '#ecfdf5',
        border: '2px solid #10b981'
    },
    verdictNo: {
        background: '#fef2f2',
        border: '2px solid #ef4444'
    },
    verdictMaybe: {
        background: '#fef3c7',
        border: '2px solid #f59e0b'
    },
    actionItem: {
        padding: '1rem 1.25rem',
        background: 'white',
        border: '2px solid #8b5cf6',
        borderRadius: '8px',
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem'
    },
    actionNumber: {
        width: '32px',
        height: '32px',
        background: '#8b5cf6',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        flexShrink: 0
    }
};

export const BrutalFitReview = ({ companyExpectations, harshReview }: BrutalFitReviewProps) => {
    const getVerdictStyle = () => {
        switch (harshReview.would_I_interview_you) {
            case 'yes': return styles.verdictYes;
            case 'no': return styles.verdictNo;
            default: return styles.verdictMaybe;
        }
    };

    const getVerdictIcon = () => {
        switch (harshReview.would_I_interview_you) {
            case 'yes': return <CheckCircle size={32} color="#10b981" />;
            case 'no': return <XCircle size={32} color="#ef4444" />;
            default: return <AlertTriangle size={32} color="#f59e0b" />;
        }
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h2 style={styles.title}>
                    <Search size={20} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    Brutal Fit Review (AI as a hiring manager)
                </h2>
                <p style={styles.subtitle}>
                    Unfiltered feedback on how you look for this job
                </p>
            </div>

            {/* Overall Verdict */}
            <div style={styles.verdict}>
                <p style={styles.verdictText}>{harshReview.overall_verdict}</p>
            </div>

            {/* Company Expectations */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                    <Target size={20} color="#8b5cf6" />
                    What This Company Cares About
                </h3>
                <p style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '1rem', lineHeight: '1.6' }}>
                    {companyExpectations.role_summary}
                </p>
                <ul style={styles.list}>
                    {companyExpectations.what_the_company_cares_about.map((item, i) => (
                        <li key={i} style={styles.listItem}>
                            <span style={{ color: '#8b5cf6' }}>•</span>
                            <span style={{ color: '#334155' }}>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Strengths */}
            {harshReview.strengths.length > 0 && (
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                        <CheckCircle size={20} color="#10b981" />
                        Your Strengths
                    </h3>
                    <ul style={styles.list}>
                        {harshReview.strengths.map((strength, i) => (
                            <li key={i} style={{ ...styles.listItem, ...styles.strengthItem }}>
                                <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span style={{ color: '#065f46' }}>{strength}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Weaknesses */}
            {harshReview.weaknesses.length > 0 && (
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                        <TrendingDown size={20} color="#ef4444" />
                        Where You're Weak
                    </h3>
                    <ul style={styles.list}>
                        {harshReview.weaknesses.map((weakness, i) => (
                            <li key={i} style={{ ...styles.listItem, ...styles.weaknessItem }}>
                                <XCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span style={{ color: '#991b1b' }}>{weakness}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Missing Skills */}
            {harshReview.missing_or_weak_skills.length > 0 && (
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                        <AlertTriangle size={20} color="#f59e0b" />
                        Missing or Weak Skills
                    </h3>
                    {harshReview.missing_or_weak_skills.map((skill, i) => (
                        <div key={i} style={styles.skillCard}>
                            <div style={styles.skillName}>{skill.skill}</div>
                            <div style={styles.skillDetail}>
                                <strong>Why it matters:</strong> {skill.why_it_matters}
                            </div>
                            <div style={styles.skillDetail}>
                                <strong>How to build it:</strong> {skill.how_to_build_it}
                            </div>
                            {skill.success_story && (
                                <div style={{ ...styles.skillDetail, marginTop: '0.5rem', fontStyle: 'italic', color: '#059669', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                    <Lightbulb size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span><strong>Success story:</strong> {skill.success_story}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Interview Verdict */}
            <div style={{ ...styles.interviewVerdict, ...getVerdictStyle() }}>
                <div style={{ marginBottom: '1rem' }}>{getVerdictIcon()}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
                    Would I Interview You? {harshReview.would_I_interview_you.toUpperCase()}
                </h3>
                <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.6' }}>
                    {harshReview.rationale}
                </p>
            </div>

            {/* Top 3 Actions */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                    <Lightbulb size={20} color="#8b5cf6" />
                    Top 3 Things to Fix Next
                </h3>
                {harshReview.top_3_actions.map((actionItem, i) => (
                    <div key={i} style={styles.actionItem}>
                        <div style={styles.actionNumber}>{i + 1}</div>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>
                                {actionItem.action}
                            </p>
                            <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                                {actionItem.how_to_do_it}
                            </p>
                            {actionItem.resources && actionItem.resources.length > 0 && (
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>Resources:</strong>
                                    <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                                        {actionItem.resources.map((resource, idx) => (
                                            <li key={idx}>{resource}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                                {actionItem.time_estimate && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Clock size={14} /> <strong>Time:</strong> {actionItem.time_estimate}
                                    </span>
                                )}
                            </div>
                            {actionItem.what_helped_others && (
                                <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.85rem', color: '#059669', fontStyle: 'italic', background: '#ecfdf5', padding: '0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                    <Lightbulb size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span>{actionItem.what_helped_others}</span>
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
