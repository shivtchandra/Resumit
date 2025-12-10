import React from 'react';
import { LucideIcon } from 'lucide-react';

// Robotic Badge
interface RoboticBadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline';
    className?: string;
}

const badgeStyles = {
    base: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.75rem',
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.05em',
        textTransform: 'uppercase' as const,
        border: '1px solid transparent'
    },
    primary: {
        background: 'rgba(27, 142, 242, 0.1)',
        color: 'var(--accent-primary)',
        borderColor: 'rgba(27, 142, 242, 0.2)'
    },
    secondary: {
        background: 'rgba(0, 194, 168, 0.1)',
        color: 'var(--accent-secondary)',
        borderColor: 'rgba(0, 194, 168, 0.2)'
    },
    outline: {
        background: 'transparent',
        color: 'var(--text-muted)',
        borderColor: 'var(--border-subtle)'
    }
};

export const RoboticBadge: React.FC<RoboticBadgeProps> = ({ children, variant = 'outline', className }) => {
    return (
        <span style={{ ...badgeStyles.base, ...badgeStyles[variant] }} className={className}>
            {children}
        </span>
    );
};

// Tech Icon
interface TechIconProps {
    icon: LucideIcon;
    size?: 'sm' | 'md' | 'lg';
    active?: boolean;
}

const iconStyles = {
    base: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-sm)',
        transition: 'all 0.2s'
    },
    sm: { width: '2rem', height: '2rem' },
    md: { width: '3rem', height: '3rem' },
    lg: { width: '4rem', height: '4rem' },
    active: {
        background: 'var(--bg-surface)',
        boxShadow: 'var(--shadow-soft)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--accent-primary)'
    },
    inactive: {
        background: 'rgba(0,0,0,0.03)',
        color: 'var(--text-muted)'
    }
};

export const TechIcon: React.FC<TechIconProps> = ({ icon: Icon, size = 'md', active = false }) => {
    return (
        <div style={{ ...iconStyles.base, ...iconStyles[size], ...(active ? iconStyles.active : iconStyles.inactive) }}>
            <Icon style={{ width: size === 'sm' ? '1rem' : size === 'md' ? '1.5rem' : '2rem', height: 'auto' }} />
        </div>
    );
};

// Metric Gauge
interface MetricGaugeProps {
    value: number; // 0-100
    label: string;
    color?: string;
}

export const MetricGauge: React.FC<MetricGaugeProps> = ({ value, label, color = 'var(--accent-primary)' }) => {
    const circumference = 2 * Math.PI * 16; // r=16
    const offset = circumference - (value / 100) * circumference;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                        cx="24"
                        cy="24"
                        r="16"
                        fill="none"
                        stroke="var(--border-subtle)"
                        strokeWidth="4"
                    />
                    <circle
                        cx="24"
                        cy="24"
                        r="16"
                        fill="none"
                        stroke={color}
                        strokeWidth="4"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                </svg>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-main)'
                }}>
                    {value}
                </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
        </div>
    );
};
