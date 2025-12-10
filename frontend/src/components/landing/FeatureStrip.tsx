import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureItem {
    icon: LucideIcon;
    title: string;
    desc: string;
}

interface FeatureStripProps {
    features: FeatureItem[];
}

const styles = {
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem'
    },
    gridMd: {
        gridTemplateColumns: 'repeat(3, 1fr)'
    },
    card: {
        position: 'relative' as const,
        padding: '1.5rem',
        background: '#171a13',
        borderTop: '2px solid #5fe4d6',
        transition: 'background 0.3s'
    },
    cardHover: {
        background: '#1a1d14'
    },
    iconContainer: {
        marginBottom: '1rem'
    },
    title: {
        color: '#f3f1eb',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
        fontSize: '1.125rem',
        marginBottom: '0.5rem'
    },
    desc: {
        color: '#9a958a',
        fontSize: '0.875rem',
        lineHeight: '1.5'
    }
};

export const FeatureStrip: React.FC<FeatureStripProps> = ({ features }) => {
    return (
        <div style={{ ...styles.grid, ...(window.innerWidth >= 768 ? styles.gridMd : {}) }}>
            {features.map((feature, i) => (
                <div
                    key={i}
                    style={styles.card}
                >
                    <div style={styles.iconContainer}>
                        <feature.icon style={{ width: '1.5rem', height: '1.5rem', color: '#5fe4d6' }} />
                    </div>
                    <h3 style={styles.title}>
                        {feature.title}
                    </h3>
                    <p style={styles.desc}>
                        {feature.desc}
                    </p>
                </div>
            ))}
        </div>
    );
};
