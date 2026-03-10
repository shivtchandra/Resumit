import { AlertTriangle, CheckCircle, XCircle, TrendingDown, Target, Lightbulb, Search, Clock, Zap, MessageSquareQuote, Skull, ThumbsDown } from 'lucide-react';
import type { HarshReview, CompanyExpectations } from '@/types';

interface BrutalFitReviewProps {
    companyExpectations: CompanyExpectations;
    harshReview: HarshReview;
}

export const BrutalFitReview = ({ companyExpectations, harshReview }: BrutalFitReviewProps) => {
    const verdictColor =
        harshReview.would_I_interview_you === 'yes' ? 'text-emerald-600' :
            harshReview.would_I_interview_you === 'no' ? 'text-red-600' : 'text-amber-600';

    const verdictBg =
        harshReview.would_I_interview_you === 'yes' ? 'bg-emerald-50' :
            harshReview.would_I_interview_you === 'no' ? 'bg-red-50' : 'bg-amber-50';

    const verdictBorder =
        harshReview.would_I_interview_you === 'yes' ? 'border-emerald-100' :
            harshReview.would_I_interview_you === 'no' ? 'border-red-100' : 'border-amber-100';

    const recruiterEmoji =
        harshReview.would_I_interview_you === 'yes' ? '✅' :
            harshReview.would_I_interview_you === 'no' ? '🚫' : '⚠️';

    const recruiterTagline =
        harshReview.would_I_interview_you === 'yes'
            ? "I'd move you to the phone screen pile."
            : harshReview.would_I_interview_you === 'no'
                ? "This resume would go straight to the rejection pile. No callback."
                : "I'd maybe glance twice, but you're not standing out. Borderline skip.";

    return (
        <div className="space-y-8">
            {/* Verdict Hero Card — Recruiter Persona */}
            <div className={`zen-card p-10 relative overflow-hidden ${verdictBorder} ${verdictBg}`}>
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                    <div className="shrink-0">
                        {harshReview.would_I_interview_you === 'yes' ? (
                            <div className="w-20 h-20 rounded-3xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <CheckCircle size={40} />
                            </div>
                        ) : harshReview.would_I_interview_you === 'no' ? (
                            <div className="w-20 h-20 rounded-3xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20">
                                <Skull size={40} />
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-3xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <AlertTriangle size={40} />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black text-brand-secondary tracking-tight">
                                {recruiterEmoji} Recruiter Verdict: {harshReview.would_I_interview_you.toUpperCase()}
                            </h2>
                            <p className={`font-bold tracking-widest text-[10px] uppercase ${verdictColor}`}>
                                Real Recruiter Simulation — No Sugar Coating
                            </p>
                        </div>
                        <p className="text-lg text-text-muted leading-relaxed font-bold italic">
                            "{recruiterTagline}"
                        </p>
                        <p className="text-base text-text-muted leading-relaxed font-medium italic">
                            "{harshReview.overall_verdict}"
                        </p>
                        <div className="p-5 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/60">
                            <p className="text-sm text-text-main leading-relaxed">
                                <strong>Why:</strong> {harshReview.rationale}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Strengths */}
                <div className="zen-card p-8 border-emerald-100 bg-emerald-50/20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                            <Zap size={20} />
                        </div>
                        <h3 className="text-sm font-black text-brand-secondary tracking-widest uppercase">What's Actually Working</h3>
                    </div>
                    <div className="space-y-4">
                        {harshReview.strengths.map((strength, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-xl bg-white border border-emerald-50 shadow-sm transition-all hover:border-emerald-200">
                                <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-1" />
                                <span className="text-sm text-text-main font-medium">{strength}</span>
                            </div>
                        ))}
                        {harshReview.strengths.length === 0 && (
                            <div className="flex gap-4 p-4 rounded-xl bg-white border border-red-100">
                                <ThumbsDown size={18} className="text-red-400 shrink-0 mt-1" />
                                <p className="text-sm text-red-700 font-medium italic">
                                    Nothing stood out. That's the problem — a recruiter with 200 resumes to review has zero reason to remember yours.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Weaknesses — Blunt */}
                <div className="zen-card p-8 border-red-100 bg-red-50/20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-red-100 text-red-600">
                            <TrendingDown size={20} />
                        </div>
                        <h3 className="text-sm font-black text-brand-secondary tracking-widest uppercase">What's Hurting You</h3>
                    </div>
                    <div className="space-y-4">
                        {harshReview.weaknesses.map((weakness, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-xl bg-white border border-red-50 shadow-sm transition-all hover:border-red-200">
                                <XCircle size={18} className="text-red-500 shrink-0 mt-1" />
                                <span className="text-sm text-text-main font-medium">{weakness}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Missing Skills Deep-Dive */}
            {harshReview.missing_or_weak_skills.length > 0 && (
                <div className="zen-card p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 rounded-lg bg-red-100 text-red-600">
                            <Lightbulb size={20} />
                        </div>
                        <h3 className="text-sm font-black text-brand-secondary tracking-widest uppercase">Skills You're Missing — A Recruiter Would Notice</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {harshReview.missing_or_weak_skills.map((skill, i) => (
                            <div key={i} className="p-6 rounded-2xl border border-border-subtle bg-bg-muted space-y-4 hover:border-red-300 transition-all group">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-black text-brand-secondary text-base group-hover:text-red-600 transition-colors">{skill.skill}</h4>
                                    <XCircle size={16} className="text-red-400" />
                                </div>
                                <div className="space-y-3">
                                    <div className="text-xs">
                                        <div className="text-text-subtle font-black uppercase tracking-widest text-[9px] mb-1">Why It Kills Your Chances</div>
                                        <p className="text-text-main">{skill.why_it_matters}</p>
                                    </div>
                                    <div className="text-xs">
                                        <div className="text-text-subtle font-black uppercase tracking-widest text-[9px] mb-1">How To Fix It</div>
                                        <p className="text-amber-700 font-medium">{skill.how_to_build_it}</p>
                                    </div>
                                    {skill.success_story && (
                                        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                <MessageSquareQuote size={12} className="text-emerald-600" />
                                                <div className="text-emerald-800 font-bold text-[9px] uppercase tracking-widest">What Works</div>
                                            </div>
                                            <p className="text-xs text-emerald-700 italic leading-relaxed">{skill.success_story}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Company Intel */}
            <div className="zen-card p-8 bg-brand-secondary text-white space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-brand-primary">
                        <Target size={20} />
                    </div>
                    <h3 className="text-sm font-black tracking-widest uppercase">What This Company Actually Wants</h3>
                </div>
                <div className="space-y-4">
                    <p className="text-slate-300 text-base leading-relaxed">
                        {companyExpectations.role_summary}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {companyExpectations.what_the_company_cares_about.map((item, i) => (
                            <span key={i} className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top 3 Strategic Fixes */}
            <div className="zen-card p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 rounded-lg bg-teal-100 text-teal-600">
                        <Search size={20} />
                    </div>
                    <h3 className="text-sm font-black text-brand-secondary tracking-widest uppercase">Fix These 3 Things Or Don't Even Apply</h3>
                </div>
                <div className="space-y-6">
                    {harshReview.top_3_actions.map((actionItem, i) => (
                        <div key={i} className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl border border-border-subtle bg-white relative hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-full bg-brand-secondary text-white flex items-center justify-center font-black text-xl shrink-0">
                                {i + 1}
                            </div>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h4 className="text-lg font-black text-brand-secondary mb-2">{actionItem.action}</h4>
                                    <p className="text-sm text-text-muted leading-relaxed">{actionItem.how_to_do_it}</p>
                                </div>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-bg-muted text-[10px] font-bold text-text-subtle uppercase tracking-widest">
                                        <Clock size={12} /> {actionItem.time_estimate}
                                    </div>
                                    {actionItem.what_helped_others && (
                                        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold italic">
                                            <Lightbulb size={14} /> {actionItem.what_helped_others}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
