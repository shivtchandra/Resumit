import React from 'react';

interface TimelineItem {
    role: string;
    company: string;
    startDate: string; // YYYY-MM
    endDate: string | 'Present';
}

interface GapVisualizerProps {
    history: TimelineItem[];
}

export const GapVisualizer: React.FC<GapVisualizerProps> = ({ history }) => {
    // Helper to convert date to months since epoch (simple approximation)
    const getMonthValue = (dateStr: string) => {
        if (dateStr === 'Present') return new Date().getFullYear() * 12 + new Date().getMonth();
        const [y, m] = dateStr.split('-').map(Number);
        return y * 12 + (m - 1);
    };

    // Sort history by start date
    const sortedHistory = [...history].sort((a, b) => getMonthValue(a.startDate) - getMonthValue(b.startDate));

    if (sortedHistory.length === 0) return null;

    const start = getMonthValue(sortedHistory[0].startDate);
    const end = getMonthValue(sortedHistory[sortedHistory.length - 1].endDate);
    const totalMonths = end - start + 1;

    return (
        <div style={{ width: '100%' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', fontFamily: 'var(--font-heading)' }}>
                Employment Timeline
            </h3>
            <div style={{ position: 'relative', height: '3rem', background: 'var(--bg-page)', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '0 0.5rem', border: '1px solid var(--border-subtle)' }}>
                {/* Render timeline bars */}
                {sortedHistory.map((item, idx) => {
                    const itemStart = getMonthValue(item.startDate);
                    const itemEnd = getMonthValue(item.endDate);
                    const duration = itemEnd - itemStart;

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
                            title={`${item.role} at ${item.company}\n${item.startDate} - ${item.endDate}`}
                        />
                    );
                })}

                {/* Render Gaps (Red zones) */}
                {sortedHistory.map((item, idx) => {
                    if (idx === 0) return null;
                    const prevEnd = getMonthValue(sortedHistory[idx - 1].endDate);
                    const currStart = getMonthValue(item.startDate);

                    if (currStart - prevEnd > 1) { // Gap > 1 month
                        const gapStart = prevEnd;
                        const gapDuration = currStart - prevEnd;
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
                <span>{sortedHistory[0].startDate}</span>
                <span>{sortedHistory[sortedHistory.length - 1].endDate}</span>
            </div>
        </div>
    );
};
