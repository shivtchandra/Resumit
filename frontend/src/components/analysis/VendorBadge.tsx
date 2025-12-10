import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface VendorBadgeProps {
    vendor: string;
    status: 'compatible' | 'warning' | 'incompatible';
    score?: number;
}

const styles = {
    compatible: {
        container: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.75rem',
            borderRadius: '9999px',
            border: '1px solid #bbf7d0',
            background: '#f0fdf4'
        },
        icon: { width: '1rem', height: '1rem', color: '#15803d' },
        text: { fontSize: '0.875rem', fontWeight: 500, color: '#15803d' },
        score: {
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.125rem 0.375rem',
            borderRadius: '0.25rem',
            background: 'rgba(255,255,255,0.5)',
            color: '#15803d'
        }
    },
    warning: {
        container: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.75rem',
            borderRadius: '9999px',
            border: '1px solid #fde68a',
            background: '#fefce8'
        },
        icon: { width: '1rem', height: '1rem', color: '#a16207' },
        text: { fontSize: '0.875rem', fontWeight: 500, color: '#a16207' },
        score: {
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.125rem 0.375rem',
            borderRadius: '0.25rem',
            background: 'rgba(255,255,255,0.5)',
            color: '#a16207'
        }
    },
    incompatible: {
        container: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.75rem',
            borderRadius: '9999px',
            border: '1px solid #fecaca',
            background: '#fef2f2'
        },
        icon: { width: '1rem', height: '1rem', color: '#b91c1c' },
        text: { fontSize: '0.875rem', fontWeight: 500, color: '#b91c1c' },
        score: {
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.125rem 0.375rem',
            borderRadius: '0.25rem',
            background: 'rgba(255,255,255,0.5)',
            color: '#b91c1c'
        }
    }
};

export const VendorBadge: React.FC<VendorBadgeProps> = ({ vendor, status, score }) => {
    const config = {
        compatible: { icon: CheckCircle, label: 'Compatible' },
        warning: { icon: AlertTriangle, label: 'Issues Found' },
        incompatible: { icon: XCircle, label: 'Incompatible' }
    };

    const style = styles[status];
    const Icon = config[status].icon;

    return (
        <div style={style.container}>
            <Icon style={style.icon} />
            <span style={style.text}>
                {vendor.charAt(0).toUpperCase() + vendor.slice(1)}
            </span>
            {score !== undefined && (
                <span style={style.score}>
                    {score}%
                </span>
            )}
        </div>
    );
};
