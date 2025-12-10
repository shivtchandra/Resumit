import { Card } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface VendorCompatibilityGridProps {
    vendors: Array<{
        name: string;
        status: 'compatible' | 'warning' | 'incompatible';
        icon: string;
    }>;
}

export const VendorCompatibilityGrid = ({ vendors }: VendorCompatibilityGridProps) => {
    const statusConfig = {
        compatible: {
            icon: CheckCircle,
            color: 'text-green-success',
            bg: 'bg-green-success/10',
            border: 'border-green-success',
        },
        warning: {
            icon: AlertTriangle,
            color: 'text-amber-warning',
            bg: 'bg-amber-warning/10',
            border: 'border-amber-warning',
        },
        incompatible: {
            icon: XCircle,
            color: 'text-red-critical',
            bg: 'bg-red-critical/10',
            border: 'border-red-critical',
        },
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {vendors.map((vendor) => {
                const config = statusConfig[vendor.status];
                const StatusIcon = config.icon;

                return (
                    <Card
                        key={vendor.name}
                        className={`tactical-card border-2 ${config.border} ${config.bg} p-4 text-center`}
                    >
                        <div className="text-3xl mb-2">{vendor.icon}</div>
                        <div className="text-sm font-bold text-text-primary mb-2">
                            {vendor.name}
                        </div>
                        <StatusIcon className={`w-5 h-5 ${config.color} mx-auto`} />
                    </Card>
                );
            })}
        </div>
    );
};
