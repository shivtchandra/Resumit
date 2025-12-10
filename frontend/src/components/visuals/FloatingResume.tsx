import React from 'react';

const styles = {
    container: {
        position: 'relative' as const,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        perspective: '1000px'
    },
    resumeCard: {
        width: '300px',
        height: '420px',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-soft)',
        padding: '2rem',
        position: 'relative' as const,
        transform: 'rotateX(5deg) rotateY(-5deg) rotateZ(2deg)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        border: '1px solid var(--border-subtle)',
        zIndex: 10
    },
    header: {
        marginBottom: '1.5rem',
        borderBottom: '2px solid var(--bg-subtle)',
        paddingBottom: '1rem'
    },
    nameLine: {
        height: '12px',
        width: '60%',
        background: 'var(--text-main)',
        marginBottom: '8px',
        borderRadius: '2px',
        opacity: 0.8
    },
    contactLine: {
        height: '6px',
        width: '40%',
        background: 'var(--text-muted)',
        borderRadius: '2px',
        opacity: 0.6
    },
    section: {
        marginBottom: '1.25rem'
    },
    sectionTitle: {
        height: '8px',
        width: '30%',
        background: 'var(--accent-primary)',
        marginBottom: '8px',
        borderRadius: '2px',
        opacity: 0.8
    },
    line: {
        height: '4px',
        width: '100%',
        background: 'var(--bg-subtle)',
        marginBottom: '6px',
        borderRadius: '1px'
    },
    lineShort: {
        width: '70%'
    },
    orbitRing: {
        position: 'absolute' as const,
        border: '1px solid var(--accent-soft)',
        borderRadius: '50%',
        opacity: 0.2,
        pointerEvents: 'none' as const
    }
};

export const FloatingResume: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div style={styles.container} className={`floating-resume-container ${className || ''}`}>
            {/* Orbit Rings */}
            <div style={{ ...styles.orbitRing, width: '400px', height: '400px', transform: 'rotateX(60deg)' }} />
            <div style={{ ...styles.orbitRing, width: '550px', height: '550px', transform: 'rotateX(60deg) rotateY(20deg)' }} />

            {/* Floating Card */}
            <div style={styles.resumeCard} className="animate-float hover:scale-105 cursor-default">
                <div style={styles.header}>
                    <div style={styles.nameLine} />
                    <div style={styles.contactLine} />
                </div>

                <div style={styles.section}>
                    <div style={styles.sectionTitle} />
                    <div style={styles.line} />
                    <div style={styles.line} />
                    <div style={{ ...styles.line, ...styles.lineShort }} />
                </div>

                <div style={styles.section}>
                    <div style={styles.sectionTitle} />
                    <div style={styles.line} />
                    <div style={styles.line} />
                    <div style={styles.line} />
                    <div style={{ ...styles.line, ...styles.lineShort }} />
                </div>

                <div style={styles.section}>
                    <div style={styles.sectionTitle} />
                    <div style={styles.line} />
                    <div style={{ ...styles.line, ...styles.lineShort }} />
                </div>

                {/* Decorative Badge */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '2px solid var(--accent-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{ width: '12px', height: '12px', background: 'var(--accent-secondary)', borderRadius: '50%' }} />
                </div>
            </div>
        </div>
    );
};
