import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ResumeComparisonProps {
    originalText: string;
    rewrittenText: string;
}

const styles = {
    container: {
        marginBottom: '2rem'
    },
    header: {
        marginBottom: '1.5rem',
        textAlign: 'center' as const
    },
    title: {
        fontSize: '1.75rem',
        fontWeight: 700,
        color: '#1e293b',
        marginBottom: '0.5rem',
        fontFamily: "'Space Grotesk', sans-serif"
    },
    subtitle: {
        fontSize: '0.95rem',
        color: '#64748b'
    },
    comparisonGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1rem',
        marginBottom: '1rem'
    },
    comparisonGridLg: {
        gridTemplateColumns: '1fr 1fr'
    },
    panel: {
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
    },
    panelHeader: {
        padding: '1rem 1.5rem',
        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    panelTitle: {
        fontSize: '0.95rem',
        fontWeight: 700,
        color: '#475569',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        fontFamily: "'Space Grotesk', sans-serif"
    },
    badge: {
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600
    },
    badgeOriginal: {
        background: '#fee2e2',
        color: '#991b1b'
    },
    badgeRewritten: {
        background: '#dcfce7',
        color: '#166534'
    },
    panelContent: {
        padding: '1.5rem',
        maxHeight: '600px',
        overflowY: 'auto' as const,
        fontSize: '0.9rem',
        lineHeight: '1.8',
        color: '#334155',
        whiteSpace: 'pre-wrap' as const,
        fontFamily: "'Inter', sans-serif"
    },
    toggleButton: {
        width: '100%',
        padding: '0.75rem',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: '#475569',
        transition: 'all 0.2s',
        fontFamily: "'Space Grotesk', sans-serif"
    }
};

export const ResumeComparison = ({ originalText, rewrittenText }: ResumeComparisonProps) => {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!originalText || !rewrittenText) {
        return null;
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>Side-by-Side Comparison</h3>
                <p style={styles.subtitle}>Review the changes made by AI to optimize your resume</p>
            </div>

            <button
                style={styles.toggleButton}
                onClick={() => setIsExpanded(!isExpanded)}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                }}
            >
                {isExpanded ? (
                    <>
                        <ChevronUp size={18} />
                        Hide Comparison
                    </>
                ) : (
                    <>
                        <ChevronDown size={18} />
                        Show Comparison
                    </>
                )}
            </button>

            {isExpanded && (
                <div style={{ ...styles.comparisonGrid, ...(window.innerWidth >= 1024 ? styles.comparisonGridLg : {}), marginTop: '1rem' }}>
                    {/* Original Panel */}
                    <div style={styles.panel}>
                        <div style={styles.panelHeader}>
                            <span style={styles.panelTitle}>Original Resume</span>
                            <span style={{ ...styles.badge, ...styles.badgeOriginal }}>Before</span>
                        </div>
                        <div style={styles.panelContent}>
                            {originalText}
                        </div>
                    </div>

                    {/* Rewritten Panel */}
                    <div style={styles.panel}>
                        <div style={styles.panelHeader}>
                            <span style={styles.panelTitle}>Optimized Resume</span>
                            <span style={{ ...styles.badge, ...styles.badgeRewritten }}>After</span>
                        </div>
                        <div style={styles.panelContent}>
                            {rewrittenText}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
