import React from 'react';
import { LucideIcon } from 'lucide-react';

// Robotic Badge
interface RoboticBadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline';
    className?: string;
}

export const RoboticBadge: React.FC<RoboticBadgeProps> = ({ children, variant = 'outline', className = '' }) => {
    const variantClasses = {
        primary: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
        secondary: 'bg-brand-accent/10 text-brand-accent border-brand-accent/20',
        outline: 'bg-transparent text-text-muted border-border-subtle'
    };

    return (
        <span className={`
            inline-flex items-center px-3 py-1 rounded-sm text-[10px] font-bold font-mono tracking-widest uppercase border transition-colors
            ${variantClasses[variant]}
            ${className}
        `}>
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

export const TechIcon: React.FC<TechIconProps> = ({ icon: Icon, size = 'md', active = false }) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    const activeClasses = active
        ? 'bg-bg-surface shadow-sm border border-border-subtle text-brand-primary'
        : 'bg-black/5 text-text-muted';

    return (
        <div className={`
            flex items-center justify-center rounded-sm transition-all duration-200
            ${sizeClasses[size]}
            ${activeClasses}
        `}>
            <Icon size={size === 'sm' ? 16 : size === 'md' ? 24 : 32} />
        </div>
    );
};

// Metric Gauge
interface MetricGaugeProps {
    value: number; // 0-100
    label: string;
    color?: string;
}

export const MetricGauge: React.FC<MetricGaugeProps> = ({ value, label, color = 'var(--color-brand-primary)' }) => {
    const circumference = 2 * Math.PI * 16; // r=16
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-12 h-12">
                <svg width="48" height="48" className="-rotate-90">
                    <circle
                        cx="24"
                        cy="24"
                        r="16"
                        fill="none"
                        stroke="var(--color-border-subtle)"
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
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono text-text-main">
                    {value}
                </div>
            </div>
            <span className="text-[10px] text-text-muted font-bold tracking-tight">{label}</span>
        </div>
    );
};
