import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Check, X, AlertTriangle } from 'lucide-react';

interface AlignmentScoreCardProps {
    alignmentScore: number;
    atsScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    companyName?: string;
}

const RadialGauge = ({ score, label, sublabel }: { score: number; label: string; sublabel: string }) => {
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedScore(score), 100);
        return () => clearTimeout(timer);
    }, [score]);

    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (animatedScore / 100) * circumference;
    const color = animatedScore >= 70 ? '#10b981' : animatedScore >= 40 ? '#f59e0b' : '#ef4444';
    const bgColor = animatedScore >= 70 ? 'rgba(16,185,129,0.08)' : animatedScore >= 40 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';
    const verdict = animatedScore >= 70 ? 'STRONG' : animatedScore >= 40 ? 'NEEDS WORK' : 'WEAK';

    return (
        <div className="flex flex-col items-center p-8 rounded-3xl border border-border-subtle" style={{ background: bgColor }}>
            <div className="relative w-40 h-40 mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    <circle
                        cx="70" cy="70" r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black" style={{ color }}>{Math.round(animatedScore)}</span>
                    <span className="text-[10px] font-black tracking-widest uppercase" style={{ color }}>/100</span>
                </div>
            </div>
            <h3 className="text-sm font-black text-brand-secondary tracking-widest uppercase mb-1">{label}</h3>
            <p className="text-xs text-text-muted text-center">{sublabel}</p>
            <div
                className="mt-3 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase"
                style={{ color, border: `1.5px solid ${color}`, background: 'white' }}
            >
                {verdict}
            </div>
        </div>
    );
};

export const AlignmentScoreCard = ({
    alignmentScore,
    atsScore,
    matchedKeywords,
    missingKeywords,
    companyName,
}: AlignmentScoreCardProps) => {
    const totalKeywords = matchedKeywords.length + missingKeywords.length;
    const overallColor = alignmentScore >= 70 ? 'emerald' : alignmentScore >= 40 ? 'amber' : 'red';

    const recruiterVerdict =
        alignmentScore >= 80
            ? "This resume has a strong shot. Most critical signals are present."
            : alignmentScore >= 60
                ? "Borderline. A recruiter might skim past this if there are 50+ applicants."
                : alignmentScore >= 40
                    ? "This resume would likely get filtered out in the first pass. Too many gaps."
                    : "Not aligned. A recruiter wouldn't spend more than 6 seconds on this.";

    return (
        <div className="zen-card p-0 overflow-hidden">
            {/* Header Bar */}
            <div className={`p-6 bg-${overallColor}-50 border-b border-${overallColor}-100`}>
                <div className="flex items-center gap-3 mb-2">
                    {alignmentScore >= 70 ? (
                        <TrendingUp className="text-emerald-600" size={22} />
                    ) : alignmentScore >= 40 ? (
                        <AlertTriangle className="text-amber-600" size={22} />
                    ) : (
                        <TrendingDown className="text-red-600" size={22} />
                    )}
                    <h2 className="text-lg font-black text-brand-secondary tracking-tight">
                        Resume–JD Alignment Report {companyName && <span className="text-brand-primary">· {companyName}</span>}
                    </h2>
                </div>
                <p className="text-sm text-text-muted font-medium italic">{recruiterVerdict}</p>
            </div>

            {/* Gauges */}
            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <RadialGauge
                        score={alignmentScore}
                        label="JD Alignment"
                        sublabel="How closely your resume language matches the job requirements"
                    />
                    <RadialGauge
                        score={atsScore}
                        label="ATS Score"
                        sublabel="How well ATS software can parse and rank your resume"
                    />
                </div>

                {/* Keyword Match Breakdown */}
                {totalKeywords > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-brand-secondary tracking-widest uppercase">
                                Keyword Match Breakdown
                            </h3>
                            <span className="text-xs font-bold text-text-muted">
                                {matchedKeywords.length}/{totalKeywords} matched
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{
                                    width: `${totalKeywords > 0 ? (matchedKeywords.length / totalKeywords) * 100 : 0}%`,
                                    background: matchedKeywords.length / totalKeywords >= 0.7
                                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                                        : matchedKeywords.length / totalKeywords >= 0.4
                                            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                            : 'linear-gradient(90deg, #ef4444, #f87171)',
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Matched */}
                            {matchedKeywords.length > 0 && (
                                <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                                    <div className="text-[10px] font-black text-emerald-700 tracking-widest uppercase mb-3 flex items-center gap-2">
                                        <Check size={12} /> Present in Resume
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {matchedKeywords.map((kw, i) => (
                                            <span
                                                key={i}
                                                className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200"
                                            >
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Missing */}
                            {missingKeywords.length > 0 && (
                                <div className="p-5 rounded-2xl bg-red-50/50 border border-red-100">
                                    <div className="text-[10px] font-black text-red-700 tracking-widest uppercase mb-3 flex items-center gap-2">
                                        <X size={12} /> Missing from Resume
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {missingKeywords.map((kw, i) => (
                                            <span
                                                key={i}
                                                className="px-2.5 py-1 rounded-lg bg-red-100 text-red-800 text-xs font-bold border border-red-200"
                                            >
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
