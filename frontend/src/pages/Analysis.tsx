import { useState } from 'react';
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
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [targetRole, setTargetRole] = useState('software-engineer');
    const [feedbackTone, setFeedbackTone] = useState<'brutal' | 'professional'>('brutal');
    const [githubUsername, setGithubUsername] = useState('');
    const [linkedinText, setLinkedinText] = useState('');

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
                        'Move to Resume Fix Lab to actually rewrite and prep interview answers.',
                    ]}
                    makeMostOfIt={[
                        'Ensure your resume header has real LinkedIn and GitHub URLs.',
                        'Use target role selection for relevant certification guidance.',
                        'Treat recommendations as execution tasks for Resume Fix Lab.',
                    ]}
                    primaryAction={{ label: 'Go to Resume Fix Lab', to: '/resume-fix-lab' }}
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
                                    {certRecs.map((cert, idx) => (
                                        <div key={idx} className="p-4 rounded-xl border border-border-subtle bg-white space-y-2">
                                            <div className="text-sm font-black text-brand-secondary">{cert.name}</div>
                                            <div className="text-xs text-text-muted">{cert.provider}</div>
                                            <div className="text-xs text-text-muted">Relevance: {cert.relevance}</div>
                                            <div className="text-xs font-bold text-brand-primary">Impact: {cert.impact}</div>
                                            {cert.url && (
                                                <a
                                                    href={cert.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-block text-xs font-bold text-brand-primary hover:underline"
                                                >
                                                    View certification
                                                </a>
                                            )}
                                        </div>
                                    ))}
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
                                <h3 className="text-xs font-black tracking-[0.2em] uppercase text-brand-secondary flex items-center gap-2">
                                    <MaterialIcon icon="edit_note" size={16} className="text-brand-primary" />
                                    Practical Rewrite Examples
                                </h3>
                                <div className="space-y-4">
                                    {sampleUpgrades.map((item, idx) => (
                                        <div key={idx} className="p-4 rounded-xl border border-border-subtle bg-white space-y-2">
                                            <div className="text-[11px] font-black tracking-widest uppercase text-brand-secondary">{item.area}</div>
                                            <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg p-2">
                                                <span className="font-bold">Before:</span> {item.before}
                                            </div>
                                            <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg p-2">
                                                <span className="font-bold">After:</span> {item.after}
                                            </div>
                                            <div className="text-xs text-text-muted">
                                                <span className="font-bold">Why this works:</span> {item.reason}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={() => (window.location.href = '/resume-fix-lab')}
                                className="btn-primary py-3 text-sm"
                            >
                                Go to Resume Fix Lab
                            </button>
                            <button
                                onClick={() => (window.location.href = '/templates')}
                                className="btn-secondary py-3 text-sm"
                            >
                                Browse Templates
                            </button>
                            <button
                                onClick={() => setResult(null)}
                                className="btn-secondary py-3 text-sm"
                            >
                                Run New Roast
                            </button>
                        </div>
                    </motion.div>
                )}
            </main>
        </PageLayout>
    );
};
