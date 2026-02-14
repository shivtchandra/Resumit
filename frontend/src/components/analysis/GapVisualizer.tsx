import React from 'react';

interface TimelineItem {
    role?: string;
    title?: string;
    company?: string;
    startDate?: string; // YYYY-MM
    endDate?: string | 'Present';
    start_date?: string;
    end_date?: string;
    start?: string;
    end?: string;
}

interface GapVisualizerProps {
    history: TimelineItem[];
}

export const GapVisualizer: React.FC<GapVisualizerProps> = ({ history }) => {
    const getMonthValue = (dateInput?: string): number | null => {
        if (!dateInput || typeof dateInput !== 'string') return null;
        const value = dateInput.trim();
        if (!value) return null;

        if (/^(present|current|now)$/i.test(value)) {
            return new Date().getFullYear() * 12 + new Date().getMonth();
        }

        const isoMatch = value.match(/^(\d{4})(?:-(\d{1,2}))?(?:-\d{1,2})?$/);
        if (isoMatch) {
            const year = Number(isoMatch[1]);
            const month = Number(isoMatch[2] || '1');
            if (!Number.isNaN(year) && !Number.isNaN(month) && month >= 1 && month <= 12) {
                return year * 12 + (month - 1);
            }
            return null;
        }

        const slashMatch = value.match(/^(\d{1,2})[/-](\d{4})$/);
        if (slashMatch) {
            const month = Number(slashMatch[1]);
            const year = Number(slashMatch[2]);
            if (!Number.isNaN(year) && !Number.isNaN(month) && month >= 1 && month <= 12) {
                return year * 12 + (month - 1);
            }
            return null;
        }

        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.getFullYear() * 12 + parsed.getMonth();
        }
        return null;
    };

    const normalizedHistory = history
        .map((item) => {
            const startLabel = item.startDate ?? item.start_date ?? item.start ?? '';
            const endLabel = item.endDate ?? item.end_date ?? item.end ?? 'Present';
            const startValue = getMonthValue(startLabel);
            const endValue = getMonthValue(endLabel);
            return {
                role: item.role || item.title || 'Role',
                company: item.company || 'Company',
                startLabel: startLabel || 'Unknown',
                endLabel: endLabel || 'Unknown',
                startValue,
                endValue,
            };
        })
        .filter((item) => item.startValue !== null && item.endValue !== null)
        .map((item) => ({
            ...item,
            endValue: Math.max(item.endValue as number, item.startValue as number),
        }))
        .sort((a, b) => (a.startValue as number) - (b.startValue as number));

    if (normalizedHistory.length === 0) return null;

    const start = normalizedHistory[0].startValue as number;
    const end = normalizedHistory[normalizedHistory.length - 1].endValue as number;
    const totalMonths = Math.max(end - start + 1, 1);

    return (
        <div style={{ width: '100%' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', fontFamily: 'var(--font-heading)' }}>
                Employment Timeline
            </h3>
            <div style={{ position: 'relative', height: '3rem', background: 'var(--bg-page)', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '0 0.5rem', border: '1px solid var(--border-subtle)' }}>
                {/* Render timeline bars */}
                {normalizedHistory.map((item, idx) => {
                    const itemStart = item.startValue as number;
                    const itemEnd = item.endValue as number;
                    const duration = Math.max(itemEnd - itemStart + 1, 1);

                    const left = ((itemStart - start) / totalMonths) * 100;
                    const width = (duration / totalMonths) * 100;

                    return (
                        <div
                            key={idx}
                            style={{
                                position: 'absolute',
                                height: '2rem',
                                background: 'var(--accent-primary)',
                                borderRadius: 'var(--radius-sm)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                cursor: 'help',
                                left: `${left}%`,
                                width: `${Math.max(width, 1)}%`,
                                transition: 'background 0.2s'
                            }}
                            title={`${item.role} at ${item.company}\n${item.startLabel} - ${item.endLabel}`}
                        />
                    );
                })}

                {/* Render Gaps (Red zones) */}
                {normalizedHistory.map((item, idx) => {
                    if (idx === 0) return null;
                    const prevEnd = normalizedHistory[idx - 1].endValue as number;
                    const currStart = item.startValue as number;

                    if (currStart - prevEnd > 1) { // Gap > 1 month
                        const gapStart = prevEnd + 1;
                        const gapDuration = currStart - prevEnd - 1;
                        const left = ((gapStart - start) / totalMonths) * 100;
                        const width = (gapDuration / totalMonths) * 100;

                        return (
                            <div
                                key={`gap-${idx}`}
                                style={{
                                    position: 'absolute',
                                    height: '2rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    borderLeft: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRight: '1px solid rgba(239, 68, 68, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    left: `${left}%`,
                                    width: `${width}%`
                                }}
                            >
                                <span style={{ fontSize: '0.625rem', color: '#ef4444', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>GAP</span>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                <span>{normalizedHistory[0].startLabel}</span>
                <span>{normalizedHistory[normalizedHistory.length - 1].endLabel}</span>
            </div>
        </div>
    );
};
