import { useState, useEffect, useCallback, type ReactNode } from 'react';
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

const ExpandableList = ({
    items,
    toneBullet,
    emptyText = 'No items available.',
    defaultVisible = 4,
}: {
    items: string[];
    toneBullet: string;
    emptyText?: string;
    defaultVisible?: number;
}) => {
    const [expanded, setExpanded] = useState(false);
    const list = items || [];
    const visible = expanded ? list : list.slice(0, defaultVisible);

    if (list.length === 0) {
        return <div className="text-sm text-text-muted italic">{emptyText}</div>;
    }

    return (
        <div className="space-y-3">
            <ul className="space-y-2.5 list-none p-0 m-0">
                {visible.map((item, idx) => (
                    <li key={idx} className="text-sm text-text-muted leading-relaxed flex gap-2.5">
                        <span className={`${toneBullet} text-[8px] mt-1.5 shrink-0`}>●</span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
            {list.length > defaultVisible && (
                <button
                    type="button"
                    className="text-xs font-black uppercase tracking-wider text-brand-primary hover:underline"
                    onClick={() => setExpanded((prev) => !prev)}
                >
                    {expanded ? 'Show less' : `Show ${list.length - defaultVisible} more`}
                </button>
            )}
        </div>
    );
};

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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border ${t.border} ${t.leftAccent} border-l-[3px] bg-white overflow-hidden`}
        >
            <div className={`h-1 bg-gradient-to-r ${t.topGradient}`} />
            <div className={`px-4 sm:px-5 pt-4 pb-3 ${t.headerBg} flex items-center justify-between`}>
                <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg ${t.iconBg} flex items-center justify-center`}>
                        <MaterialIcon icon={icon} size={16} />
                    </div>
                    <h3 className="text-[10px] sm:text-[11px] font-black tracking-[0.18em] uppercase text-brand-secondary">
                        {title}
                    </h3>
                </div>
                {count > 0 && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${t.badge}`}>
                        {count}
                    </span>
                )}
            </div>
            <div className="p-4 sm:p-5">
                <ExpandableList items={items} toneBullet={t.bullet} />
            </div>
        </motion.div>
    );
};

const CollapsibleSection = ({
    title,
    icon,
    defaultOpen = false,
    badge,
    children,
}: {
    title: string;
    icon: string;
    defaultOpen?: boolean;
    badge?: string;
    children: ReactNode;
}) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <section className="zen-card overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left border-b border-border-subtle/60"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                        <MaterialIcon icon={icon} size={16} />
                    </div>
                    <div className="text-[11px] sm:text-xs font-black tracking-[0.18em] uppercase text-brand-secondary">
                        {title}
                    </div>
                    {badge && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                            {badge}
                        </span>
                    )}
                </div>
                <MaterialIcon icon={open ? 'expand_less' : 'expand_more'} size={18} className="text-text-subtle" />
            </button>
            {open && <div className="p-4 sm:p-6">{children}</div>}
        </section>
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

    useEffect(() => {
        if (result) {
            try {
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(result));
            } catch {
                // ignore session write failures
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
            await new Promise((resolve) => setTimeout(resolve, 800));
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
    const projectDomains = result?.comprehensive_analysis?.project_domain_coverage || [];
    const candidateName = result?.analysis_summary?.candidate_name || 'Candidate';

    return (
        <PageLayout header={<Navbar />} maxWidth="xl">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
                <div className="text-center space-y-4">
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
                    <p className="text-base sm:text-lg text-text-muted max-w-3xl mx-auto font-medium">
                        Pure diagnostic mode: brutal roast, GitHub/LinkedIn signal review, and certification guidance.
                    </p>
                </div>

                <PageGuide
                    badge="ANALYZE GUIDE"
                    title="Roast + Profile Signal Check"
                    description="Use this page to identify what is weak, what proofs are missing, and what to fix next."
                    whatThisPageDoes="Runs roast feedback, validates external proof, and builds a practical action queue."
                    bestUseCase="Use this first, then go to Match & Fix for rewriting and interview prep."
                    howToUse={[
                        'Upload your resume. JD is optional here.',
                        'Use Brutal tone for direct feedback.',
                        'Review the top 3 fixes, then expand other sections as needed.',
                        'Move to Match & Fix for execution.',
                    ]}
                    makeMostOfIt={[
                        'Keep LinkedIn and GitHub URLs in your resume header.',
                        'Use one target role before running Analyze.',
                        'Treat priority fixes as a checklist, not a reading dump.',
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
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            {result.analysis_summary?.generation_mode && (
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase border ${result.analysis_summary.generation_mode === 'ai'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                    <MaterialIcon icon="memory" size={14} />
                                    {result.analysis_summary.generation_mode === 'ai' ? 'AI Roast' : 'Fallback Roast'}
                                </div>
                            )}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase border border-indigo-200 bg-indigo-50 text-indigo-700">
                                <MaterialIcon icon="person" size={14} />
                                {candidateName}
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase border border-slate-200 bg-slate-50 text-slate-700">
                                <MaterialIcon icon="speed" size={14} />
                                ATS {Math.round(result.friendliness_score || 0)}
                            </div>
                        </div>

                        {result.roast_report && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                <RoastColumn title="What Is Good" icon="check_circle" items={result.roast_report.strengths} />
                                <RoastColumn title="What Is Bad" icon="warning" items={result.roast_report.weaknesses} tone="warn" />
                                <RoastColumn title="Hard Truths" icon="report" items={result.roast_report.hard_truths} tone="hard" />
                                <RoastColumn title="Priority Fixes" icon="bolt" items={result.roast_report.priority_fixes} tone="accent" />
                            </div>
                        )}

                        <CollapsibleSection title="Role Fit Verdict" icon="gavel" defaultOpen>
                            <div className="space-y-4">
                                <div className="p-3 sm:p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 text-sm text-indigo-900 font-semibold italic">
                                    "{result.roast_report?.role_fit_verdict?.verdict || 'Role fit verdict unavailable.'}"
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">This Resume Works For</div>
                                        <div className="flex flex-wrap gap-2">
                                            {(result.roast_report?.role_fit_verdict?.best_fit_roles || []).map((role, idx) => (
                                                <span key={idx} className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-red-600">Would Struggle For</div>
                                        <div className="flex flex-wrap gap-2">
                                            {(result.roast_report?.role_fit_verdict?.weak_fit_roles || []).map((role, idx) => (
                                                <span key={idx} className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {result.roast_report?.resume_loopholes?.length ? (
                            <CollapsibleSection title="Resume Loopholes" icon="policy" badge={String(result.roast_report.resume_loopholes.length)} defaultOpen>
                                <ExpandableList
                                    items={result.roast_report.resume_loopholes}
                                    toneBullet="text-amber-500"
                                    defaultVisible={3}
                                />
                            </CollapsibleSection>
                        ) : null}

                        {result.roast_report?.should_remove?.length ? (
                            <CollapsibleSection title="Cut These Lines" icon="delete_sweep" badge={String(result.roast_report.should_remove.length)}>
                                <ExpandableList
                                    items={result.roast_report.should_remove}
                                    toneBullet="text-red-500"
                                    defaultVisible={3}
                                />
                            </CollapsibleSection>
                        ) : null}

                        {projectDomains.length > 0 && (
                            <CollapsibleSection title="Project Domain Coverage" icon="hub">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {projectDomains.map((item, idx) => (
                                        <div key={idx} className="p-4 rounded-xl border border-cyan-200 bg-cyan-50/40 space-y-2">
                                            <div className="text-sm font-black text-brand-secondary">{item.project}</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(item.domains || []).map((domain, dIdx) => (
                                                    <span key={dIdx} className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-700 border border-cyan-200">
                                                        {domain}
                                                    </span>
                                                ))}
                                            </div>
                                            {item.evidence && <p className="text-xs text-text-muted">{item.evidence}</p>}
                                            {item.positioning_tip && <p className="text-xs text-cyan-700 font-semibold">Tip: {item.positioning_tip}</p>}
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        )}

                        <CollapsibleSection title="External Proof Signals" icon="travel_explore" defaultOpen>
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl border border-border-subtle bg-bg-page">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-text-subtle mb-1">Detected GitHub</div>
                                        <div className="text-sm font-bold text-brand-secondary break-all">
                                            {result.external_profile_intel?.detected_github_url || 'Not found in resume'}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl border border-border-subtle bg-bg-page">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-text-subtle mb-1">Detected LinkedIn</div>
                                        <div className="text-sm font-bold text-brand-secondary break-all">
                                            {result.external_profile_intel?.detected_linkedin_url || 'Not found in resume'}
                                        </div>
                                    </div>
                                </div>

                                {extractedProfileUrls.length > 0 && (
                                    <div className="p-3 rounded-xl border border-border-subtle bg-bg-page">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-text-subtle mb-2">Links Extracted</div>
                                        <div className="flex flex-wrap gap-2">
                                            {extractedProfileUrls.map((url, idx) => (
                                                <span key={idx} className="px-2 py-1 rounded-md border border-border-subtle bg-white text-[11px] text-text-muted break-all">
                                                    {url}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl border border-border-subtle bg-white space-y-3">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">GitHub Suggestions</div>
                                        <p className="text-xs text-text-muted">{result.external_profile_intel?.github_summary || 'No GitHub summary available.'}</p>
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Keep / Promote</div>
                                            <ExpandableList
                                                items={githubBest.map((repo) => `${repo.name} - ${repo.reason}`)}
                                                toneBullet="text-brand-primary"
                                                defaultVisible={2}
                                                emptyText="No strong repositories identified yet."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-amber-600">Drop / Deprioritize</div>
                                            <ExpandableList
                                                items={githubDrop.map((repo) => `${repo.name} - ${repo.reason}`)}
                                                toneBullet="text-amber-500"
                                                defaultVisible={2}
                                                emptyText="No deprioritized repositories listed."
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl border border-border-subtle bg-white space-y-3">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">LinkedIn Suggestions</div>
                                        <p className="text-xs text-text-muted">{result.external_profile_intel?.linkedin_summary || 'No LinkedIn summary available.'}</p>
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Must Keep / Add</div>
                                            <ExpandableList
                                                items={linkedinKeep}
                                                toneBullet="text-brand-primary"
                                                defaultVisible={2}
                                                emptyText="No LinkedIn keep suggestions yet."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-amber-600">Remove / Deprioritize</div>
                                            <ExpandableList
                                                items={linkedinDrop}
                                                toneBullet="text-amber-500"
                                                defaultVisible={2}
                                                emptyText="No LinkedIn removal suggestions yet."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CollapsibleSection>

                        <CollapsibleSection title="Certification Suggestions" icon="workspace_premium" badge={String(certRecs.length)}>
                            {certRecs.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {certRecs.map((cert, idx) => (
                                        <div key={idx} className="p-4 rounded-xl border border-border-subtle bg-white space-y-2">
                                            <div className="text-sm font-black text-brand-secondary">{cert.name}</div>
                                            <div className="text-xs text-text-subtle font-semibold">{cert.provider}</div>
                                            <div className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                                                {cert.relevance}
                                            </div>
                                            <div className="text-xs font-bold text-brand-primary">{cert.impact}</div>
                                            {cert.url && (
                                                <a href={cert.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:underline">
                                                    <MaterialIcon icon="open_in_new" size={12} />
                                                    View certification
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-text-muted italic">
                                    No strong certification recommendations for the current role/context.
                                </div>
                            )}
                            {certActions.length > 0 && (
                                <div className="mt-5 pt-4 border-t border-border-subtle">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-brand-secondary mb-2">
                                        How to use these recommendations
                                    </div>
                                    <ExpandableList
                                        items={certActions}
                                        toneBullet="text-brand-primary"
                                        defaultVisible={3}
                                    />
                                </div>
                            )}
                        </CollapsibleSection>

                        {actionPlan.length > 0 && (
                            <CollapsibleSection title="Detailed Action Blueprint" icon="checklist" badge={String(actionPlan.length)}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {actionPlan.map((item, idx) => (
                                        <div key={idx} className="p-4 rounded-xl border border-border-subtle bg-white space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="text-sm font-black text-brand-secondary">{item.title}</div>
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                                                    {item.priority}
                                                </span>
                                            </div>
                                            <div className="text-xs text-text-muted"><span className="font-bold">Effort:</span> {item.effort}</div>
                                            <div className="text-xs text-text-muted"><span className="font-bold">Why:</span> {item.why}</div>
                                            <ul className="list-none p-0 m-0 space-y-1">
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
                            </CollapsibleSection>
                        )}

                        {sampleUpgrades.length > 0 && (
                            <CollapsibleSection title="Resume Rewrite Guide" icon="edit_note" badge={`${sampleUpgrades.length} fixes`} defaultOpen>
                                <div className="space-y-3">
                                    {sampleUpgrades.map((item, idx) => (
                                        <details key={idx} className="rounded-xl border border-border-subtle bg-white p-3 sm:p-4" open={idx === 0}>
                                            <summary className="cursor-pointer flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-md bg-brand-secondary text-white text-xs font-black flex items-center justify-center">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-sm font-black text-brand-secondary">{item.area}</span>
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                                                    Rewrite
                                                </span>
                                            </summary>
                                            <div className="mt-3 space-y-3">
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Current (remove)</div>
                                                    <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg p-3">
                                                        <span className="line-through decoration-red-400">{item.before}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Replace with</div>
                                                    <div className="text-sm text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg p-3 font-semibold">
                                                        {item.after}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-slate-700 bg-blue-50 border border-blue-100 rounded-lg p-2">
                                                    <span className="font-bold">Why this helps:</span> {item.reason}
                                                </div>
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button onClick={() => (window.location.href = '/resume-fix-lab')} className="btn-primary py-3 text-sm">
                                Go to Match & Fix
                            </button>
                            <button onClick={() => (window.location.href = '/templates')} className="btn-secondary py-3 text-sm">
                                Browse Templates
                            </button>
                            <button onClick={clearResult} className="btn-secondary py-3 text-sm">
                                Run New Roast
                            </button>
                        </div>
                    </motion.div>
                )}
            </main>
        </PageLayout>
    );
};
