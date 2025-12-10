import { Card } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, XCircle, MapPin, Lightbulb } from 'lucide-react';
import { useState } from 'react';

interface RiskCardProps {
    type: string;
    message: string;
    severity: 'critical' | 'warning' | 'info';
    penalty?: number;
    location?: string;
    onFix?: () => void;
}

export const RiskCard = ({ type, message, severity, penalty, location, onFix }: RiskCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const severityConfig = {
        critical: {
            icon: XCircle,
            color: 'text-red-critical',
            bg: 'bg-red-critical/10',
            border: 'border-red-critical',
            badge: 'risk-badge-critical',
        },
        warning: {
            icon: AlertTriangle,
            color: 'text-amber-warning',
            bg: 'bg-amber-warning/10',
            border: 'border-amber-warning',
            badge: 'risk-badge-warning',
        },
        info: {
            icon: CheckCircle,
            color: 'text-cyan-neon',
            bg: 'bg-cyan-neon/10',
            border: 'border-cyan-neon',
            badge: 'risk-badge-success',
        },
    };

    const config = severityConfig[severity];
    const Icon = config.icon;

    return (
        <Card className={`tactical-card border-l-4 ${config.border} ${config.bg} cursor-pointer`}
            onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                    <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-1`} />

                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="font-bold text-text-primary">{type}</span>
                            <span className={config.badge}>{severity.toUpperCase()}</span>
                        </div>

                        <p className="text-sm text-text-secondary">{message}</p>

                        {isExpanded && (
                            <div className="mt-3 space-y-2 text-xs font-mono">
                                {location && (
                                    <div className="text-text-muted flex items-center gap-1">
                                        <MapPin size={12} /> Location: {location}
                                    </div>
                                )}
                                {penalty && (
                                    <div className={`${config.color} flex items-center gap-1`}>
                                        <AlertTriangle size={12} /> Penalty: -{penalty} points
                                    </div>
                                )}
                                <div className="text-cyan-neon flex items-center gap-1">
                                    <Lightbulb size={12} /> Click "Fix Now" to apply automated correction
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {onFix && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onFix();
                        }}
                        className="ml-4 px-4 py-2 bg-cyan-neon text-slate-deep text-sm font-bold rounded hover:shadow-cyan transition-all"
                    >
                        Fix Now
                    </button>
                )}
            </div>
        </Card>
    );
};
