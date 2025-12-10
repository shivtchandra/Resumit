import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface IssueCardProps {
    issue: {
        severity: 'critical' | 'warning' | 'info';
        type: string;
        title: string;
        description: string;
        fix_suggestions: string[];
    };
}

const getSeverityConfig = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
        case 'critical':
            return {
                icon: AlertCircle,
                color: '#ef4444',
                bg: 'rgba(239, 68, 68, 0.05)',
                border: 'rgba(239, 68, 68, 0.2)',
                label: 'Critical'
            };
        case 'warning':
            return {
                icon: AlertTriangle,
                color: '#f59e0b',
                bg: 'rgba(245, 158, 11, 0.05)',
                border: 'rgba(245, 158, 11, 0.2)',
                label: 'Warning'
            };
        case 'info':
            return {
                icon: Info,
                color: 'var(--accent-primary)',
                bg: 'rgba(27, 142, 242, 0.05)',
                border: 'rgba(27, 142, 242, 0.2)',
                label: 'Info'
            };
    }
};

const styles = {
    card: (config: ReturnType<typeof getSeverityConfig>) => ({
        overflow: 'hidden',
        transition: 'all 0.3s',
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 'var(--radius-md)'
    }),
    button: {
        width: '100%',
        padding: '1rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        textAlign: 'left' as const,
        transition: 'all 0.2s',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer'
    },
    iconContainer: (color: string) => ({
        padding: '0.5rem',
        borderRadius: 'var(--radius-sm)',
        flexShrink: 0,
        background: color,
        color: '#fff'
    }),
    contentContainer: {
        flex: 1,
        minWidth: 0
    },
    headerRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.25rem'
    },
    severityLabel: {
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        color: 'var(--text-main)'
    },
    typeLabel: {
        fontSize: '0.75rem',
        padding: '0.125rem 0.5rem',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(255,255,255,0.5)',
        color: 'var(--text-subtle)',
        fontFamily: 'var(--font-mono)'
    },
    title: {
        fontFamily: "var(--font-heading)",
        fontWeight: 600,
        fontSize: '1rem',
        color: 'var(--text-main)'
    },
    description: {
        fontSize: '0.875rem',
        marginTop: '0.25rem',
        color: 'var(--text-muted)'
    },
    chevronContainer: {
        flexShrink: 0
    },
    expandedSection: (borderColor: string) => ({
        padding: '1rem',
        paddingTop: '0.5rem',
        borderTop: `1px solid ${borderColor}`,
        background: 'rgba(255,255,255,0.3)'
    }),
    fixTitle: {
        fontSize: '0.875rem',
        fontWeight: 600,
        marginBottom: '0.75rem',
        color: 'var(--text-main)'
    },
    suggestionsList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0.5rem',
        listStyle: 'none',
        padding: 0,
        margin: 0
    },
    suggestionItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        fontSize: '0.875rem',
        color: 'var(--text-muted)'
    },
    suggestionNumber: (color: string) => ({
        flexShrink: 0,
        width: '1.25rem',
        height: '1.25rem',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: 600,
        marginTop: '0.125rem',
        background: color,
        color: '#fff'
    })
};

export const IssueCard = ({ issue }: IssueCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const config = getSeverityConfig(issue.severity);
    const Icon = config.icon;

    return (
        <div style={styles.card(config)}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={styles.button}
            >
                <div style={styles.iconContainer(config.color)}>
                    <Icon style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>

                <div style={styles.contentContainer}>
                    <div style={styles.headerRow}>
                        <span style={styles.severityLabel}>
                            {config.label}
                        </span>
                        <span style={styles.typeLabel}>
                            {issue.type.replace(/_/g, ' ')}
                        </span>
                    </div>
                    <h4 style={styles.title}>
                        {issue.title}
                    </h4>
                    <p style={styles.description}>
                        {issue.description}
                    </p>
                </div>

                <div style={styles.chevronContainer}>
                    {isExpanded ? (
                        <ChevronUp style={{ width: '1.25rem', height: '1.25rem', color: config.color }} />
                    ) : (
                        <ChevronDown style={{ width: '1.25rem', height: '1.25rem', color: config.color }} />
                    )}
                </div>
            </button>

            {isExpanded && (
                <div style={styles.expandedSection(config.border)}>
                    <h5 style={styles.fixTitle}>
                        💡 How to Fix:
                    </h5>
                    <ul style={styles.suggestionsList}>
                        {issue.fix_suggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                style={styles.suggestionItem}
                            >
                                <span style={styles.suggestionNumber(config.color)}>
                                    {index + 1}
                                </span>
                                <span>{suggestion}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
