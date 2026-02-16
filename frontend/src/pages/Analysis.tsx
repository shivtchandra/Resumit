import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';
import { PageGuide } from '../components/layout/PageGuide';
import { WorkflowMap } from '../components/layout/WorkflowMap';
import { AnalysisSetupConsole } from '../components/tactical/AnalysisSetupConsole';
import { MaterialIcon } from '../components/ui/MaterialIcon';
import { analyzeResume } from '../services/api';
import type { AnalysisResult } from '../types';

const TONE_CONFIG = {
    default: {
        border: 'border-emerald-200/60',
        leftAccent: 'border-l-emerald-400',
        headerBg: 'bg-emerald-50',
        iconBg: 'bg-emerald-100 text-emerald-600',
        bullet: 'text-emerald-500',
        badge: 'bg-emerald-100 text-emerald-700',
        topGradient: 'from-emerald-400 to-teal-500',
    },
    warn: {
        border: 'border-amber-200/60',
        leftAccent: 'border-l-amber-400',
        headerBg: 'bg-amber-50',
        iconBg: 'bg-amber-100 text-amber-600',
        bullet: 'text-amber-500',
        badge: 'bg-amber-100 text-amber-700',
        topGradient: 'from-amber-400 to-orange-500',
    },
    hard: {
        border: 'border-red-200/60',
        leftAccent: 'border-l-red-400',
        headerBg: 'bg-red-50',
        iconBg: 'bg-red-100 text-red-600',
        bullet: 'text-red-500',
        badge: 'bg-red-100 text-red-700',
        topGradient: 'from-red-400 to-rose-500',
    },
    accent: {
        border: 'border-brand-primary/30',
        leftAccent: 'border-l-brand-primary',
        headerBg: 'bg-brand-primary/5',
        iconBg: 'bg-brand-primary/15 text-brand-primary',
        bullet: 'text-brand-primary',
        badge: 'bg-brand-primary/10 text-brand-primary',
        topGradient: 'from-brand-primary to-teal-600',
    },
} as const;

const RoastColumn = ({
    title,
    icon,
    items,
    tone = 'default',
}: {
    title: string;
    icon: string;
    items: string[];
    tone?: 'default' | 'warn' | 'hard' | 'accent';
}) => {
    const t = TONE_CONFIG[tone];
    const count = (items || []).length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: tone === 'default' ? 0 : tone === 'warn' ? 0.1 : tone === 'hard' ? 0.2 : 0.3 }}
            className={`rounded-2xl border ${t.border} ${t.leftAccent} border-l-[3px] bg-white overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group`}
        >
            {/* Gradient top accent */}
            <div className={`h-1 bg-gradient-to-r ${t.topGradient}`} />

            {/* Header */}
            <div className={`px-6 pt-5 pb-4 ${t.headerBg} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${t.iconBg} flex items-center justify-center`}>
                        <MaterialIcon icon={icon} size={18} />
                    </div>
                    <h3 className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-secondary">
                        {title}
                    </h3>
                </div>
                {count > 0 && (
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${t.badge}`}>
                        {count}
                    </span>
                )}
            </div>

            {/* Items */}
            <ul className="p-6 space-y-3 list-none m-0">
                {(items || []).slice(0, 8).map((item, idx) => (
                    <li key={idx} className="text-sm text-text-muted leading-relaxed flex gap-2.5">
                        <span className={`${t.bullet} text-[8px] mt-1.5 shrink-0`}>●</span>
                        <span>{item}</span>
                    </li>
                ))}
                {count === 0 && (
                    <li className="text-sm text-text-muted italic">No items available for this section.</li>
                )}
            </ul>
        </motion.div>
    );
};

export const Analysis = () => {
    const SESSION_KEY = 'resumit_analysis_result';

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(() => {
        try {
            const stored = sessionStorage.getItem(SESSION_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [error, setError] = useState<string | null>(null);
    const [targetRole, setTargetRole] = useState('software-engineer');
    const [feedbackTone, setFeedbackTone] = useState<'brutal' | 'professional'>('brutal');
    const [githubUsername, setGithubUsername] = useState('');
    const [linkedinText, setLinkedinText] = useState('');

    // Persist result to sessionStorage whenever it changes
    useEffect(() => {
        if (result) {
            try {
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(result));
            } catch {
                // sessionStorage full or unavailable — silently ignore
            }
        }
    }, [result]);

    const clearResult = useCallback(() => {
        setResult(null);
        sessionStorage.removeItem(SESSION_KEY);
    }, []);

    const handleUpload = async (file: File) => {
        setIsAnalyzing(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            const data = await analyzeResume(file, undefined, {
                targetRole,
                analysisMode: 'general_only',
                feedbackTone,
                githubUsername: githubUsername.trim() || undefined,
                linkedinText: linkedinText.trim() || undefined,
            });
            setResult(data);
        } catch (analysisError) {
            setError(analysisError instanceof Error ? analysisError.message : 'Analysis failed. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const certRecs = result?.comprehensive_analysis?.certification_recommendations || [];
    const certActions = result?.comprehensive_analysis?.actionable_recommendations || [];
    const githubBest = result?.external_profile_intel?.github_best_projects || [];
    const githubDrop = result?.external_profile_intel?.github_drop_projects || [];
    const linkedinKeep = result?.external_profile_intel?.linkedin_must_include || [];
    const linkedinDrop = result?.external_profile_intel?.linkedin_remove || [];
    const extractedProfileUrls = result?.external_profile_intel?.extracted_profile_urls || [];
    const actionPlan = result?.comprehensive_analysis?.action_plan || [];
    const sampleUpgrades = result?.comprehensive_analysis?.sample_resume_upgrades || [];

    return (
        <PageLayout header={<Navbar />} maxWidth="xl">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
                <div className="text-center space-y-5">
                    <div className="page-badge">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-60" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary" />
                        </span>
                        Roast Mode Active
                    </div>
                    <h1 className="page-hero-title">
                        Analyze <span className="text-brand-primary">Resume</span>
                    </h1>
                    <p className="text-lg text-text-muted max-w-3xl mx-auto font-medium">
                        Pure diagnostic mode: brutal roast, GitHub/LinkedIn signal review, and certification guidance.
                    </p>
                </div>

                <PageGuide
                    badge="ANALYZE GUIDE"
                    title="Roast + Profile Signal Check"
                    description="Use this page only to understand what is weak, what proofs are missing, and what credentials improve trust."
                    whatThisPageDoes="Runs practical roast feedback and validates external proof from GitHub/LinkedIn extracted from your resume."
                    bestUseCase="Best as first step when you want clear feedback before editing your resume."
                    howToUse={[
                        'Upload your resume; no JD needed here.',
                        'Keep tone as Brutal for no-fluff feedback.',
                        'Review roast, GitHub/LinkedIn proof, and certification guidance.',
                        'Move to Match & Fix to actually rewrite and prep interview answers.',
                    ]}
                    makeMostOfIt={[
                        'Ensure your resume header has real LinkedIn and GitHub URLs.',
                        'Use target role selection for relevant certification guidance.',
                        'Treat recommendations as execution tasks for Match & Fix.',
                    ]}
                    primaryAction={{ label: 'Go to Match & Fix', to: '/resume-fix-lab' }}
                    secondaryAction={{ label: 'Browse Templates', to: '/templates' }}
                />

                <WorkflowMap currentStep="analysis" />

                {error && (
                    <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {!result ? (
                    <AnalysisSetupConsole
                        onStartAnalysis={handleUpload}
                        isAnalyzing={isAnalyzing}
                        onRoleChange={setTargetRole}
                        onToneChange={setFeedbackTone}
                        onGithubChange={setGithubUsername}
                        onLinkedinChange={setLinkedinText}
                        variant="analysis"
                        initialData={{
                            targetRole,
                            feedbackTone,
                            githubUsername,
                            linkedinText,
                        }}
                    />
                ) : (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                        {result.analysis_summary?.generation_mode && (
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase border ${result.analysis_summary.generation_mode === 'ai'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                <MaterialIcon icon="memory" size={14} />
                                Engine: {result.analysis_summary.generation_mode === 'ai' ? 'AI Roast' : 'Fallback Roast'}
                            </div>
                        )}

                        {result.roast_report && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                <RoastColumn title="What Is Good" icon="check_circle" items={result.roast_report.strengths} />
                                <RoastColumn title="What Is Bad" icon="warning" items={result.roast_report.weaknesses} tone="warn" />
                                <RoastColumn title="Hard Truths" icon="report" items={result.roast_report.hard_truths} tone="hard" />
                                <RoastColumn title="Priority Fixes" icon="bolt" items={result.roast_report.priority_fixes} tone="accent" />
                            </div>
                        )}

                        {/* Resume Loopholes */}
                        {result.roast_report?.resume_loopholes && result.roast_report.resume_loopholes.length > 0 && (
                            <div className="zen-card p-6 border-l-4 border-l-amber-400" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
                                <h3 className="text-xs font-black tracking-[0.2em] uppercase text-amber-700 flex items-center gap-2 mb-4">
                                    <MaterialIcon icon="policy" size={16} className="text-amber-600" />
                                    Resume Loopholes Detected
                                </h3>
                                <p className="text-[11px] text-amber-600 mb-4 font-medium">
                                    These are inconsistencies, red flags, or gaps that a recruiter would catch instantly.
                                </p>
                                <ul className="space-y-3 list-none p-0 m-0">
                                    {result.roast_report?.resume_loopholes?.map((loophole, idx) => (
                                        <li key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-amber-200">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[11px] font-black mt-0.5">
                                                {idx + 1}
                                            </span>
                                            <span className="text-sm text-amber-900 leading-relaxed">{loophole}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Cut These Lines */}
                        {result.roast_report?.should_remove && result.roast_report.should_remove.length > 0 && (
                            <div className="zen-card p-6 border-l-4 border-l-red-400" style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' }}>
                                <h3 className="text-xs font-black tracking-[0.2em] uppercase text-red-700 flex items-center gap-2 mb-4">
                                    <MaterialIcon icon="delete_sweep" size={16} className="text-red-500" />
                                    Cut These From Your Resume
                                </h3>
                                <p className="text-[11px] text-red-500 mb-4 font-medium">
                                    These phrases, lines, or sections are actively hurting your resume. Remove them.
                                </p>
                                <ul className="space-y-3 list-none p-0 m-0">
                                    {result.roast_report?.should_remove?.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-red-200">
                                            <MaterialIcon icon="remove_circle" size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-red-900 leading-relaxed" style={{ textDecorationColor: '#fca5a5' }}>
                                                {item}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Role Fit Verdict */}
                        {result.roast_report?.role_fit_verdict && (
                            <div className="zen-card p-6 border-l-4 border-l-indigo-400" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' }}>
                                <h3 className="text-xs font-black tracking-[0.2em] uppercase text-indigo-700 flex items-center gap-2 mb-4">
                                    <MaterialIcon icon="gavel" size={16} className="text-indigo-500" />
                                    Role Fit Verdict
                                </h3>

                                <div className="p-4 rounded-xl bg-white/80 border border-indigo-200 mb-5">
                                    <p className="text-sm font-semibold text-indigo-900 italic leading-relaxed">
                                        "{result.roast_report?.role_fit_verdict?.verdict}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5">
                                            <MaterialIcon icon="thumb_up" size={12} />
                                            This Resume Works For
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {result.roast_report?.role_fit_verdict?.best_fit_roles?.map((role, idx) => (
                                                <span key={idx} className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1.5">
                                            <MaterialIcon icon="thumb_down" size={12} />
                                            Would Struggle For
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {result.roast_report?.role_fit_verdict?.weak_fit_roles?.map((role, idx) => (
                                                <span key={idx} className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="zen-card p-8 space-y-8">
                            <h3 className="text-xs font-black tracking-[0.2em] uppercase text-brand-secondary flex items-center gap-2">
                                <MaterialIcon icon="travel_explore" size={16} className="text-brand-primary" />
                                External Proof Signals
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-border-subtle bg-bg-page">
                                    <div className="text-[10px] font-black text-text-subtle uppercase tracking-widest mb-1">Detected GitHub</div>
                                    <div className="text-sm font-bold text-brand-secondary break-all">
                                        {result.external_profile_intel?.detected_github_url || 'Not found in resume'}
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl border border-border-subtle bg-bg-page">
                                    <div className="text-[10px] font-black text-text-subtle uppercase tracking-widest mb-1">Detected LinkedIn</div>
                                    <div className="text-sm font-bold text-brand-secondary break-all">
                                        {result.external_profile_intel?.detected_linkedin_url || 'Not found in resume'}
                                    </div>
                                </div>
                            </div>

                            {extractedProfileUrls.length > 0 && (
                                <div className="p-4 rounded-xl border border-border-subtle bg-bg-page">
                                    <div className="text-[10px] font-black text-text-subtle uppercase tracking-widest mb-2">
                                        Links Extracted From File Hyperlinks
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {extractedProfileUrls.map((url, idx) => (
                                            <span key={idx} className="px-2 py-1 rounded-lg border border-border-subtle bg-white text-[11px] text-text-muted break-all">
                                                {url}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <div className="p-5 rounded-2xl border border-border-subtle space-y-4">
                                    <h4 className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-secondary">GitHub Suggestions</h4>
                                    <p className="text-xs text-text-muted">{result.external_profile_intel?.github_summary || 'No GitHub summary available.'}</p>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2">Keep / Promote</div>
                                            <ul className="space-y-2 list-none p-0 m-0">
                                                {githubBest.length > 0 ? githubBest.map((repo, idx) => (
                                                    <li key={idx} className="text-sm text-text-muted">
                                                        <span className="font-bold text-brand-secondary">{repo.name}</span> - {repo.reason}
                                                    </li>
                                                )) : <li className="text-sm text-text-muted italic">No strong repositories identified yet.</li>}
                                            </ul>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Drop / Deprioritize</div>
                                            <ul className="space-y-2 list-none p-0 m-0">
                                                {githubDrop.length > 0 ? githubDrop.map((repo, idx) => (
                                                    <li key={idx} className="text-sm text-text-muted">
                                                        <span className="font-bold text-brand-secondary">{repo.name}</span> - {repo.reason}
                                                    </li>
                                                )) : <li className="text-sm text-text-muted italic">No deprioritized repositories listed.</li>}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl border border-border-subtle space-y-4">
                                    <h4 className="text-[11px] font-black tracking-[0.2em] uppercase text-brand-secondary">LinkedIn Suggestions</h4>
                                    <p className="text-xs text-text-muted">{result.external_profile_intel?.linkedin_summary || 'No LinkedIn summary available.'}</p>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2">Must Keep / Add</div>
                                            <ul className="space-y-2 list-none p-0 m-0">
                                                {linkedinKeep.length > 0 ? linkedinKeep.map((line, idx) => (
                                                    <li key={idx} className="text-sm text-text-muted">{line}</li>
                                                )) : <li className="text-sm text-text-muted italic">No LinkedIn keep suggestions yet.</li>}
                                            </ul>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Remove / Deprioritize</div>
                                            <ul className="space-y-2 list-none p-0 m-0">
                                                {linkedinDrop.length > 0 ? linkedinDrop.map((line, idx) => (
                                                    <li key={idx} className="text-sm text-text-muted">{line}</li>
                                                )) : <li className="text-sm text-text-muted italic">No LinkedIn removal suggestions yet.</li>}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="zen-card p-8 space-y-6">
                            <h3 className="text-xs font-black tracking-[0.2em] uppercase text-brand-secondary flex items-center gap-2">
                                <MaterialIcon icon="workspace_premium" size={16} className="text-brand-primary" />
                                Certification Suggestions
                            </h3>
                            {certRecs.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {certRecs.map((cert, idx) => {
                                        const isSpecialist = cert.relevance?.includes('Domain') || cert.relevance?.includes('High');
                                        const isSupporting = cert.relevance?.includes('Supporting') || cert.relevance?.includes('Infrastructure');
                                        const badgeClass = isSpecialist
                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                            : isSupporting
                                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                                : 'bg-slate-100 text-slate-600 border-slate-200';
                                        const borderClass = isSpecialist
                                            ? 'border-emerald-200/60 hover:border-emerald-400'
                                            : 'border-border-subtle hover:border-brand-primary/30';

                                        return (
                                            <div key={idx} className={`p-5 rounded-2xl border ${borderClass} bg-white space-y-3 transition-all hover:shadow-md group`}>
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="text-sm font-black text-brand-secondary leading-snug">{cert.name}</div>
                                                    {isSpecialist && (
                                                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                            <MaterialIcon icon="verified" size={12} className="text-emerald-600" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-xs text-text-subtle font-semibold">{cert.provider}</div>

                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full border ${badgeClass}`}>
                                                        {cert.relevance}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 pt-1">
                                                    <MaterialIcon icon="trending_up" size={14} className="text-brand-primary" />
                                                    <span className="text-xs font-bold text-brand-primary">{cert.impact}</span>
                                                </div>

                                                {cert.url && (
                                                    <a
                                                        href={cert.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline mt-1"
                                                    >
                                                        <MaterialIcon icon="open_in_new" size={12} />
                                                        View certification →
                                                    </a>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-sm text-text-muted italic">
                                    No strong certification recommendations for the current role/JD context.
                                </div>
                            )}

                            {certActions.length > 0 && (
                                <div className="pt-4 border-t border-border-subtle space-y-2">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">How to use these recommendations</div>
                                    <ul className="space-y-2 list-none p-0 m-0">
                                        {certActions.map((action, idx) => (
                                            <li key={idx} className="text-sm text-text-muted flex gap-2">
                                                <span className="text-brand-primary font-black">→</span>
                                                {action}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {actionPlan.length > 0 && (
                            <div className="zen-card p-8 space-y-6">
                                <h3 className="text-xs font-black tracking-[0.2em] uppercase text-brand-secondary flex items-center gap-2">
                                    <MaterialIcon icon="checklist" size={16} className="text-brand-primary" />
                                    Detailed Action Blueprint
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {actionPlan.map((item, idx) => (
                                        <div key={idx} className="p-5 rounded-2xl border border-border-subtle bg-white space-y-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="text-sm font-black text-brand-secondary">{item.title}</div>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                                                    {item.priority}
                                                </span>
                                            </div>
                                            <div className="text-xs text-text-muted"><span className="font-bold">Effort:</span> {item.effort}</div>
                                            <div className="text-xs text-text-muted leading-relaxed"><span className="font-bold">Why:</span> {item.why}</div>
                                            <ul className="space-y-1 list-none p-0 m-0">
                                                {item.steps.map((step, stepIdx) => (
                                                    <li key={stepIdx} className="text-xs text-text-muted flex gap-2">
                                                        <span className="text-brand-primary font-black">{stepIdx + 1}.</span>
                                                        {step}
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="text-xs text-brand-secondary bg-bg-page border border-border-subtle rounded-lg p-2">
                                                <span className="font-bold">Example:</span> {item.example}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {sampleUpgrades.length > 0 && (
                            <div className="zen-card p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black tracking-[0.2em] uppercase text-brand-secondary flex items-center gap-2">
                                        <MaterialIcon icon="edit_note" size={16} className="text-brand-primary" />
                                        Resume Rewrite Guide
                                    </h3>
                                    <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                                        {sampleUpgrades.length} Fix{sampleUpgrades.length > 1 ? 'es' : ''}
                                    </span>
                                </div>

                                <p className="text-sm text-text-muted leading-relaxed -mt-2">
                                    Below are specific lines in your resume that need rewriting. Each shows exactly <strong>what to remove</strong>, <strong>what to write instead</strong>, and <strong>where it goes</strong> in your document.
                                </p>

                                <div className="space-y-5">
                                    {sampleUpgrades.map((item, idx) => {
                                        const placementMap: Record<string, string> = {
                                            'summary': '📄 Summary / Objective Section',
                                            'experience bullet': '💼 Experience → Bullet Points',
                                            'experience': '💼 Experience Section',
                                            'skills': '🛠 Skills Section',
                                            'skills to project link': '🔗 Skills → Project Evidence',
                                            'projects': '🚀 Projects Section',
                                            'education': '🎓 Education Section',
                                            'certifications': '📜 Certifications Section',
                                        };
                                        const placement = item.placement
                                            || placementMap[item.area.toLowerCase()]
                                            || `📄 ${item.area} Section`;

                                        return (
                                            <div
                                                key={idx}
                                                className="rounded-2xl border border-border-subtle overflow-hidden bg-white hover:shadow-lg transition-shadow duration-300 group"
                                            >
                                                {/* Header bar */}
                                                <div className="px-6 py-4 bg-slate-50 border-b border-border-subtle flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-lg bg-brand-secondary text-white flex items-center justify-center text-xs font-black">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-brand-secondary">{item.area}</div>
                                                            <div className="text-[10px] font-bold text-text-subtle tracking-wider uppercase mt-0.5">
                                                                {placement}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                                                        <MaterialIcon icon="auto_fix_high" size={12} />
                                                        <span className="text-[10px] font-black tracking-widest uppercase">Rewrite</span>
                                                    </div>
                                                </div>

                                                {/* Simulated resume diff */}
                                                <div className="px-6 py-5 space-y-4">
                                                    {/* Current resume line (struck out) */}
                                                    <div className="relative">
                                                        <div className="text-[10px] font-black tracking-widest uppercase text-red-500 mb-2 flex items-center gap-1.5">
                                                            <MaterialIcon icon="remove_circle" size={12} />
                                                            CURRENT (REMOVE)
                                                        </div>
                                                        <div className="font-mono text-sm leading-relaxed p-4 rounded-xl bg-red-50/70 border border-red-200/60 text-red-800 relative">
                                                            <span className="line-through decoration-red-400 decoration-2 opacity-80">{item.before}</span>
                                                            <div className="absolute top-2 right-2">
                                                                <MaterialIcon icon="close" size={14} className="text-red-400" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Arrow */}
                                                    <div className="flex justify-center">
                                                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                                                            <MaterialIcon icon="arrow_downward" size={16} className="text-brand-primary" />
                                                        </div>
                                                    </div>

                                                    {/* Recommended replacement */}
                                                    <div className="relative">
                                                        <div className="text-[10px] font-black tracking-widest uppercase text-emerald-600 mb-2 flex items-center gap-1.5">
                                                            <MaterialIcon icon="add_circle" size={12} />
                                                            REPLACE WITH
                                                        </div>
                                                        <div className="font-mono text-sm leading-relaxed p-4 rounded-xl bg-emerald-50/70 border-2 border-emerald-300/60 text-emerald-900 relative shadow-sm shadow-emerald-100">
                                                            <span className="font-semibold">{item.after}</span>
                                                            <div className="absolute top-2 right-2">
                                                                <MaterialIcon icon="check_circle" size={14} className="text-emerald-500" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Why this works - rationale */}
                                                <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border-t border-border-subtle">
                                                    <div className="flex gap-3">
                                                        <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                                            <MaterialIcon icon="lightbulb" size={14} />
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-black tracking-widest uppercase text-blue-700 mb-1">Why This Is Better</div>
                                                            <p className="text-sm text-slate-700 leading-relaxed">{item.reason}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Copy-to-resume instructions */}
                                <div className="p-5 rounded-xl bg-brand-secondary/5 border border-brand-secondary/10 flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-brand-primary/15 flex items-center justify-center shrink-0">
                                        <MaterialIcon icon="content_paste" size={20} className="text-brand-primary" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-brand-secondary mb-1">How to Apply These Fixes</div>
                                        <ol className="text-sm text-text-muted leading-relaxed space-y-1 list-decimal pl-4">
                                            <li>Open your resume in your editor (Google Docs, Word, etc.)</li>
                                            <li>Find the <strong>exact section</strong> indicated by the placement tag above each fix</li>
                                            <li>Replace the <span className="text-red-600 font-semibold line-through">red strikethrough text</span> with the <span className="text-emerald-600 font-semibold">green replacement text</span></li>
                                            <li>Re-run analysis to verify your score improves</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={() => (window.location.href = '/resume-fix-lab')}
                                className="btn-primary py-3 text-sm"
                            >
                                Go to Match & Fix
                            </button>
                            <button
                                onClick={() => (window.location.href = '/templates')}
                                className="btn-secondary py-3 text-sm"
                            >
                                Browse Templates
                            </button>
                            <button
                                onClick={clearResult}
                                className="btn-secondary py-3 text-sm"
                            >
                                Run New Roast
                            </button>
                        </div>
                    </motion.div>
                )}
            </main>
        </PageLayout >
    );
};
