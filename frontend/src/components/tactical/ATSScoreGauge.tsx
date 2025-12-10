interface ATSScoreGaugeProps {
    score: number;
    label: string;
    maxScore?: number;
}

export const ATSScoreGauge = ({ score, label, maxScore = 100 }: ATSScoreGaugeProps) => {
    const percentage = (score / maxScore) * 100;
    const circumference = 2 * Math.PI * 70;
    const offset = circumference - (percentage / 100) * circumference;

    const getColor = () => {
        if (percentage >= 80) return 'var(--color-green-success)';
        if (percentage >= 60) return 'var(--color-amber-warning)';
        return 'var(--color-red-critical)';
    };

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                    {/* Background circle */}
                    <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="var(--color-slate-light)"
                        strokeWidth="12"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke={getColor()}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div
                        className="text-5xl font-bold font-mono"
                        style={{ color: getColor() }}
                    >
                        {score}
                    </div>
                    <div className="text-sm text-text-muted">/{maxScore}</div>
                </div>
            </div>

            <div className="mt-4 text-center">
                <div className="text-sm font-bold text-text-primary uppercase tracking-wider">
                    {label}
                </div>
            </div>
        </div>
    );
};
