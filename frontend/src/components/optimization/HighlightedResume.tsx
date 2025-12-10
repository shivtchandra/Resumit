import { useState } from 'react';
import type { Change } from '@/types';

interface HighlightedResumeProps {
    markedUpText: string;
    changes: Change[];
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e2e8f0'
    },
    title: {
        fontSize: '1.25rem',
        fontWeight: 700,
        color: '#0f172a'
    },
    toggle: {
        display: 'flex',
        gap: '0.5rem',
        background: '#f1f5f9',
        padding: '0.25rem',
        borderRadius: '8px'
    },
    toggleBtn: {
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: 'transparent',
        color: '#64748b'
    },
    toggleBtnActive: {
        background: 'white',
        color: '#8b5cf6',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    resumeText: {
        fontFamily: "'Georgia', serif",
        fontSize: '0.95rem',
        lineHeight: '1.8',
        color: '#1e293b',
        whiteSpace: 'pre-wrap' as const
    },
    add: {
        background: '#d1fae5',
        borderBottom: '2px solid #10b981',
        padding: '2px 4px',
        borderRadius: '3px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    del: {
        background: '#fee2e2',
        textDecoration: 'line-through',
        color: '#991b1b',
        padding: '2px 4px',
        borderRadius: '3px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    rewrite: {
        background: '#f3e8ff',
        borderBottom: '2px solid #8b5cf6',
        padding: '2px 4px',
        borderRadius: '3px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    legend: {
        display: 'flex',
        gap: '1.5rem',
        marginBottom: '1.5rem',
        fontSize: '0.85rem'
    },
    legendItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    }
};

export const HighlightedResume = ({ markedUpText, changes }: HighlightedResumeProps) => {
    const [viewMode, setViewMode] = useState<'clean' | 'changes'>('changes');

    // Parse marked-up text and render with highlights
    const renderHighlightedText = () => {
        if (viewMode === 'clean') {
            // Remove all tags for clean view
            return markedUpText
                .replace(/<ADD>/g, '')
                .replace(/<\/ADD>/g, '')
                .replace(/<DEL>.*?<\/DEL>/g, '')
                .replace(/<REWRITE>/g, '')
                .replace(/<\/REWRITE>/g, '');
        }

        // Render with highlights
        const parts = markedUpText.split(/(<ADD>.*?<\/ADD>|<DEL>.*?<\/DEL>|<REWRITE>.*?<\/REWRITE>)/g);

        return parts.map((part, i) => {
            if (part.startsWith('<ADD>')) {
                const content = part.replace(/<\/?ADD>/g, '');
                return <span key={i} style={styles.add} title="Added content">{content}</span>;
            } else if (part.startsWith('<DEL>')) {
                const content = part.replace(/<\/?DEL>/g, '');
                return <span key={i} style={styles.del} title="Removed content">{content}</span>;
            } else if (part.startsWith('<REWRITE>')) {
                const content = part.replace(/<\/?REWRITE>/g, '');
                return <span key={i} style={styles.rewrite} title="Rewritten for impact">{content}</span>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div style={styles.container}>
            {/* Header with Toggle */}
            <div style={styles.header}>
                <h3 style={styles.title}>Optimized Resume</h3>
                <div style={styles.toggle}>
                    <button
                        style={{
                            ...styles.toggleBtn,
                            ...(viewMode === 'clean' ? styles.toggleBtnActive : {})
                        }}
                        onClick={() => setViewMode('clean')}
                    >
                        Clean
                    </button>
                    <button
                        style={{
                            ...styles.toggleBtn,
                            ...(viewMode === 'changes' ? styles.toggleBtnActive : {})
                        }}
                        onClick={() => setViewMode('changes')}
                    >
                        Changes
                    </button>
                </div>
            </div>

            {/* Legend (only in changes mode) */}
            {viewMode === 'changes' && (
                <div style={styles.legend}>
                    <div style={styles.legendItem}>
                        <span style={{ ...styles.add, cursor: 'default' }}>Added</span>
                    </div>
                    <div style={styles.legendItem}>
                        <span style={{ ...styles.del, cursor: 'default' }}>Removed</span>
                    </div>
                    <div style={styles.legendItem}>
                        <span style={{ ...styles.rewrite, cursor: 'default' }}>Rewritten</span>
                    </div>
                </div>
            )}

            {/* Resume Text */}
            <div style={styles.resumeText}>
                {renderHighlightedText()}
            </div>
        </div>
    );
};
