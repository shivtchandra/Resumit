import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { AlertTriangle } from 'lucide-react';

interface TimelineData {
    year: string;
    duration: number; // in months
    role: string;
    company: string;
    gap?: boolean;
}

interface TimelineChartProps {
    data: TimelineData[];
}

export const TimelineChart = ({ data }: TimelineChartProps) => {
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="bg-surface border border-border-subtle p-3 rounded shadow-lg text-xs">
                    <p className="font-bold text-primary">{item.role}</p>
                    <p className="text-text-secondary">{item.company}</p>
                    <p className="text-text-muted mt-1">{item.duration} months</p>
                    {item.gap && (
                        <p className="text-signal-danger font-bold mt-1 flex items-center gap-1">
                            <AlertTriangle size={14} /> Employment Gap
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="year"
                        type="category"
                        tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                        width={40}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar
                        dataKey="duration"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                    >
                        {data.map((entry, index) => (
                            <cell
                                key={`cell-${index}`}
                                fill={entry.gap ? 'var(--color-signal-danger)' : 'var(--color-brand-blue)'}
                                opacity={entry.gap ? 0.6 : 1}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
