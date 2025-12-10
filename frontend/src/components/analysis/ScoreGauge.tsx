interface ScoreGaugeProps {
    score: number;
    label: string;
    subLabel?: string;
    color?: string;
    size?: 'sm' | 'md' | 'lg';
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center'
    },
    svgContainer: (size: 'sm' | 'md' | 'lg') => ({
        position: 'relative' as const,
        width: size === 'lg' ? '12rem' : size === 'md' ? '10rem' : '6rem',
        height: size === 'lg' ? '12rem' : size === 'md' ? '10rem' : '6rem'
    }),
    svg: {
        width: '100%',
        height: '100%',
        transform: 'rotate(-90deg)'
    },
    circle: {
        transition: 'all 1s ease-out'
    },
    scoreContainer: {
        position: 'absolute' as const,
        inset: 0,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center'
    },
    score: (size: 'sm' | 'md' | 'lg', color: string) => ({
        fontSize: size === 'lg' ? '3.75rem' : size === 'md' ? '3rem' : '1.875rem',
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        color
    }),
    subScore: {
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        fontWeight: 600,
        marginTop: '0.25rem'
    },
    labelContainer: {
        textAlign: 'center' as const,
        marginTop: '1rem'
    },
    label: {
        fontFamily: "var(--font-heading)",
        fontWeight: 600,
        fontSize: '1.125rem',
        color: 'var(--text-main)'
    },
    subLabel: {
        fontSize: '0.875rem',
        color: 'var(--text-muted)',
        marginTop: '0.25rem'
    }
};

export const ScoreGauge = ({ score, label, subLabel, color, size = 'md' }: ScoreGaugeProps) => {
    const radius = size === 'lg' ? 70 : size === 'md' ? 60 : 40;
    const strokeWidth = size === 'lg' ? 12 : size === 'md' ? 10 : 8;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    // Determine color based on score if not provided
    const gaugeColor = color || (
        score >= 80 ? 'var(--accent-secondary)' : // Teal
            score >= 50 ? '#d9b56c' : // Amber (keep for now, or use var)
                '#ef4444' // Red
    );

    const center = radius + strokeWidth;

    return (
        <div style={styles.container}>
            <div style={styles.svgContainer(size)}>
                <svg style={styles.svg} viewBox={`0 0 ${center * 2} ${center * 2}`}>
                    {/* Background Circle */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke="var(--border-subtle)"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress Circle */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke={gaugeColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ ...styles.circle, filter: `drop-shadow(0 0 8px ${gaugeColor})` }}
                    />
                </svg>
                <div style={styles.scoreContainer}>
                    <span style={styles.score(size, gaugeColor)}>
                        {score}
                    </span>
                    {size !== 'sm' && (
                        <span style={styles.subScore}>
                            / 100
                        </span>
                    )}
                </div>
            </div>
            {label && (
                <div style={styles.labelContainer}>
                    <h3 style={styles.label}>{label}</h3>
                    {subLabel && <p style={styles.subLabel}>{subLabel}</p>}
                </div>
            )}
        </div>
    );
};
