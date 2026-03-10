import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';
import { PageGuide } from '../components/layout/PageGuide';
import { WorkflowMap } from '../components/layout/WorkflowMap';
import { AnalysisSetupConsole } from '../components/tactical/AnalysisSetupConsole';
import { MaterialIcon } from '../components/ui/MaterialIcon';
import { analyzeResume } from '../services/api';
import type { AnalysisResult } from '../types';

export const Analysis = () => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [rateLimitRetryAfter, setRateLimitRetryAfter] = useState(60);
    const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
    const [targetRole, setTargetRole] = useState('software-engineer');
    const [feedbackTone, setFeedbackTone] = useState<'brutal' | 'professional'>('brutal');
    const [githubUsername, setGithubUsername] = useState('');
    const [linkedinText, setLinkedinText] = useState('');
    const [activeTab, setActiveTab] = useState<'score' | 'roast' | 'certs' | 'signals'>('score');
    const [expandedCritiques, setExpandedCritiques] = useState<number[]>([]);

    const toggleCritique = (idx: number) => {
        setExpandedCritiques(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    const clearResult = useCallback(() => {
        setResult(null);
    }, []);

    const handleUpload = async (file: File) => {
        setIsAnalyzing(true);
        setError(null);
        setIsRateLimited(false);
        setRateLimitCountdown(0);
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
        } catch (analysisError: unknown) {
            const err = analysisError as { isRateLimit?: boolean; retryAfter?: number; message?: string };
            if (err?.isRateLimit) {
                const secs = err.retryAfter || 60;
                setIsRateLimited(true);
                setRateLimitRetryAfter(secs);
                setRateLimitCountdown(secs);
            } else {
                setError(analysisError instanceof Error ? analysisError.message : 'Analysis failed. Please try again.');
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        if (!isRateLimited || rateLimitCountdown <= 0) return;
        const timer = setInterval(() => {
            setRateLimitCountdown((c) => {
                if (c <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isRateLimited, rateLimitRetryAfter]);

    const roastMarkdown = (() => {
        const raw = result?.roast_markdown || '';
        if (!raw) return '';
        const lines = raw.split('\n');
        let counter = 0;
        return lines.map((line) => {
            if (/^\d+\.\s/.test(line)) {
                counter++;
                const content = line.replace(/^\d+\.\s*/, '');
                return `**${counter}.** ${content}`;
            }
            if (line.startsWith('#')) {
                counter = 0;
            }
            return line;
        }).join('\n');
    })();

    const certRecs = result?.comprehensive_analysis?.certification_recommendations || [];
    const candidateName = result?.analysis_summary?.candidate_name || 'Candidate';
    const firstName = candidateName.split(/\s+/)[0] || candidateName;
    const atsScore = Math.round(result?.friendliness_score || result?.analysis_summary?.ats_score || 0);
    const scoreBand = atsScore >= 85 ? 'Strong' : atsScore >= 70 ? 'Workable' : 'Needs Work';
    const generationMode = result?.analysis_summary?.generation_mode;

    const extIntel = result?.external_profile_intel;
    const githubBest = extIntel?.github_best_projects || [];
    const githubDrop = extIntel?.github_drop_projects || [];
    const githubSummary = extIntel?.github_summary || '';
    const detectedGithub = extIntel?.detected_github_url || '';
    const detectedLinkedin = extIntel?.detected_linkedin_url || '';
    const hasGithubIntel = githubBest.length > 0 || githubDrop.length > 0 || githubSummary;
    const hasLinkedinIntel = Boolean(detectedLinkedin || (extIntel?.linkedin_must_include || []).length || (extIntel?.linkedin_remove || []).length);

    return (
        <PageLayout header={<Navbar />} maxWidth="xl">
            {/* Background decorative elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-primary/5 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-indigo-500/5 blur-[100px] rounded-full" />
            </div>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-6 sm:space-y-12">
                <header className="text-center space-y-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="page-badge mx-auto"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-60" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary" />
                        </span>
                        Roast Mode Active
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="page-hero-title"
                    >
                        Resume <span className="text-gradient">Roast</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-base sm:text-lg text-text-muted max-w-3xl mx-auto font-medium"
                    >
                        Get a brutally honest breakdown of your resume with actionable certification recommendations.
                    </motion.p>
                </header>

                <AnimatePresence mode="wait">
                    {!result && !isAnalyzing && (
                        <motion.div
                            key="guide"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="hidden md:block">
                                <PageGuide
                                    badge="ROAST GUIDE"
                                    title="Free-Flow Resume Roast"
                                    description="Upload your resume for a conversational, no-BS critique with specific cert suggestions."
                                    whatThisPageDoes="AI reads your resume and writes a free-flowing roast — quoting exact lines, calling out problems, and recommending certifications."
                                    bestUseCase="Use this first to understand what's weak. The Rewrite Lab is shipping soon."
                                    howToUse={[
                                        'Upload your resume (PDF or DOCX).',
                                        'Select your target role and tone.',
                                        'Read the roast — each critique quotes your resume directly.',
                                        'Check the cert suggestions at the bottom.',
                                    ]}
                                    makeMostOfIt={[
                                        'Use Brutal tone for the most honest feedback.',
                                        'Pay attention to blockquoted lines — those are exact resume excerpts.',
                                        'Use this page alongside Templates while Match & Fix is in progress.',
                                    ]}
                                    secondaryAction={{ label: 'Browse Templates', to: '/templates' }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="hidden md:block">
                    <WorkflowMap currentStep="analysis" />
                </div>

                {/* Rate limit UI */}
                {isRateLimited && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-8 text-center"
                    >
                        <div className="flex flex-col items-center gap-6">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-5xl shadow-inner animate-pulse">
                                ⚡
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-brand-secondary">
                                    AI Engine Overloaded
                                </h3>
                                <p className="text-text-muted max-w-md mx-auto">
                                    Our analysis engine is processing too many resumes right now. No sweat — give it a moment and try again.
                                </p>
                            </div>
                            {rateLimitCountdown > 0 ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-6xl font-heading font-black text-brand-primary tabular-nums tracking-tighter">
                                        {rateLimitCountdown}s
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-subtle">
                                        Estimated wait
                                    </p>
                                    <div className="mt-4 h-2 w-64 rounded-full bg-slate-100 overflow-hidden">
                                        <motion.div
                                            className="h-full bg-brand-primary rounded-full shadow-[0_0_12px_rgba(20,184,166,0.4)]"
                                            initial={{ width: '100%' }}
                                            animate={{ width: `${(rateLimitCountdown / rateLimitRetryAfter) * 100}%` }}
                                            transition={{ duration: 1, ease: 'linear' }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm font-bold text-brand-primary">Engine cooled down. Ready to retry!</p>
                            )}
                            <button
                                onClick={() => {
                                    setIsRateLimited(false);
                                    setRateLimitCountdown(0);
                                    setError(null);
                                }}
                                disabled={rateLimitCountdown > 0}
                                className={`btn-primary px-10 ${rateLimitCountdown > 0 ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                            >
                                {rateLimitCountdown > 0 ? 'Wait for Engine…' : 'Re-engage Engine'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Generic error */}
                {error && !isRateLimited && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-5 rounded-premium border border-red-200 bg-red-50 flex gap-4 items-center"
                    >
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm shrink-0">
                            <MaterialIcon icon="error" size={20} />
                        </div>
                        <div className="text-sm font-medium text-red-900">{error}</div>
                    </motion.div>
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
                    <div className="space-y-6 md:space-y-10">
                        {/* MOBILE TABS */}
                        <div className="mobile-tabs-container">
                            <button
                                onClick={() => setActiveTab('score')}
                                className={`mobile-tab-btn ${activeTab === 'score' ? 'active' : ''}`}
                            >
                                <MaterialIcon icon="analytics" size={18} className="mobile-tab-icon" />
                                <span className="mobile-tab-label">Score</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('roast')}
                                className={`mobile-tab-btn ${activeTab === 'roast' ? 'active' : ''}`}
                            >
                                <MaterialIcon icon="local_fire_department" size={18} className="mobile-tab-icon" />
                                <span className="mobile-tab-label">Roast</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('certs')}
                                className={`mobile-tab-btn ${activeTab === 'certs' ? 'active' : ''}`}
                            >
                                <MaterialIcon icon="workspace_premium" size={18} className="mobile-tab-icon" />
                                <span className="mobile-tab-label">Certs</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('signals')}
                                className={`mobile-tab-btn ${activeTab === 'signals' ? 'active' : ''}`}
                            >
                                <MaterialIcon icon="travel_explore" size={18} className="mobile-tab-icon" />
                                <span className="mobile-tab-label">Signals</span>
                            </button>
                        </div>

                        {/* HERO SCORE SECTION */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`relative ${activeTab !== 'score' ? 'hide-on-mobile' : ''}`}
                        >
                            <div className="absolute inset-0 bg-brand-primary/10 blur-[60px] rounded-full -z-10 opacity-50" />
                            <div className="glass-card overflow-hidden">
                                <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-8 p-8 sm:p-10">
                                    <div className="space-y-6">
                                        <div className="flex flex-wrap items-center gap-3">
                                            {generationMode && (
                                                <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border flex items-center gap-1.5 ${generationMode === 'ai'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>
                                                    <MaterialIcon icon="memory" size={12} />
                                                    {generationMode === 'ai' ? 'AI Roasted' : 'Heuristic Roast'}
                                                </div>
                                            )}
                                            <div className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-indigo-200 bg-indigo-50 text-indigo-700 flex items-center gap-1.5">
                                                <MaterialIcon icon="person" size={12} />
                                                {candidateName}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h2 className="text-3xl sm:text-4xl font-black text-brand-secondary leading-tight">
                                                Hey {firstName}, your resume is <span className="text-brand-primary italic">{scoreBand}</span>.
                                            </h2>
                                            <p className="text-text-muted text-lg max-w-xl">
                                                We've analyzed your profile against modern standards. Read the roast below for the exact lines that are holding you back.
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-4 pt-4">
                                            <button
                                                onClick={() => {
                                                    const box = document.querySelector('.roast-box');
                                                    if (box) window.scrollTo({ top: box.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
                                                }}
                                                className="btn-primary"
                                            >
                                                View Critique
                                                <MaterialIcon icon="arrow_downward" size={18} />
                                            </button>
                                            <button onClick={clearResult} className="btn-secondary">
                                                Re-Scan
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-inner border border-white space-y-3">
                                        <div className="relative w-32 h-32 flex items-center justify-center">
                                            <svg className="w-full h-full -rotate-90">
                                                <circle
                                                    cx="64" cy="64" r="58"
                                                    className="stroke-slate-200 fill-none"
                                                    strokeWidth="8"
                                                />
                                                <motion.circle
                                                    cx="64" cy="64" r="58"
                                                    className="stroke-brand-primary fill-none"
                                                    strokeWidth="8"
                                                    strokeLinecap="round"
                                                    initial={{ strokeDasharray: "0, 364" }}
                                                    animate={{ strokeDasharray: `${(atsScore / 100) * 364}, 364` }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-4xl font-heading font-black text-brand-secondary">{atsScore}</span>
                                                <span className="text-[10px] font-black uppercase text-text-subtle tracking-widest">Score</span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-text-subtle text-center">
                                            ATS FRIENDLINESS
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* THE ROAST BOX */}
                        <motion.section
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className={`roast-box ${activeTab !== 'roast' ? 'hide-on-mobile' : ''}`}
                        >
                            <div className="p-8 sm:p-12">
                                {roastMarkdown ? (
                                    <div className="roast-markdown-body">
                                        <Markdown
                                            components={{
                                                h2: ({ children, ...props }) => (
                                                    <h2 {...props} className="text-4xl font-black text-brand-secondary mt-12 mb-6 first:mt-0 pb-4 border-b-2 border-slate-50 flex items-center gap-4">
                                                        <span className="w-2 h-8 bg-brand-primary rounded-full hidden sm:block" />
                                                        {children}
                                                    </h2>
                                                ),
                                                h3: ({ children, ...props }) => (
                                                    <h3 {...props} className="text-2xl font-bold text-brand-secondary mt-10 mb-4 flex items-center gap-2">
                                                        <MaterialIcon icon="label_important" size={24} className="text-brand-primary" />
                                                        {children}
                                                    </h3>
                                                ),
                                                p: ({ children, ...props }) => (
                                                    <p {...props} className="text-lg text-text-muted leading-relaxed mb-6">
                                                        {children}
                                                    </p>
                                                ),
                                                blockquote: ({ children, ...props }) => (
                                                    <div className="relative my-8 group text-left">
                                                        <div className="absolute inset-0 bg-red-50 -skew-x-2 -z-10 rounded-lg transform scale-[1.03] opacity-50 transition-transform group-hover:scale-[1.05]" />
                                                        <blockquote {...props} className="border-l-4 border-red-400 bg-white shadow-sm rounded-r-lg px-8 py-6 text-base text-red-900 italic font-medium">
                                                            <div className="absolute -top-3 -left-2 w-8 h-8 bg-red-400 text-white rounded-full flex items-center justify-center shadow-lg">
                                                                <MaterialIcon icon="format_quote" size={18} />
                                                            </div>
                                                            {children}
                                                        </blockquote>
                                                    </div>
                                                ),
                                                strong: ({ children, ...props }) => (
                                                    <strong {...props} className="font-extrabold text-brand-primary">
                                                        {children}
                                                    </strong>
                                                ),
                                                ol: ({ children, ...props }) => (
                                                    <ol {...props} className="space-y-4 mb-8">
                                                        {children}
                                                    </ol>
                                                ),
                                                ul: ({ children, ...props }) => (
                                                    <ul {...props} className="list-disc list-outside pl-6 space-y-3 mb-8 text-text-muted">
                                                        {children}
                                                    </ul>
                                                ),
                                                li: ({ children, ...props }) => {
                                                    const childrenArray = Array.isArray(children) ? children : [children];
                                                    const firstChild = childrenArray[0];
                                                    const isHeaderMatch = typeof firstChild === 'string' && /^\d+\./.test(firstChild);

                                                    if (isHeaderMatch) {
                                                        const [num, ...rest] = (firstChild as string).split('.');
                                                        const idx = parseInt(num);
                                                        const isExpanded = expandedCritiques.includes(idx);

                                                        return (
                                                            <li className="list-none flex flex-col gap-2 bg-slate-50/50 p-4 sm:p-5 rounded-inner border border-slate-100 hover:border-brand-primary/20 transition-colors cursor-pointer sm:cursor-default"
                                                                onClick={() => window.innerWidth < 640 && toggleCritique(idx)}
                                                            >
                                                                <div className="flex gap-4 items-start w-full">
                                                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-secondary text-white text-xs font-black shrink-0">
                                                                        {num}
                                                                    </span>
                                                                    <div className="text-base sm:text-lg text-text-main font-semibold leading-snug flex-1">
                                                                        {rest.join('.')}
                                                                    </div>
                                                                    <div className="show-on-mobile text-brand-primary">
                                                                        <MaterialIcon icon={isExpanded ? "expand_less" : "expand_more"} size={20} />
                                                                    </div>
                                                                </div>
                                                                <AnimatePresence>
                                                                    {(isExpanded || window.innerWidth >= 640) && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: "auto", opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            className="overflow-hidden pt-2 text-sm sm:text-base text-text-muted"
                                                                        >
                                                                            {childrenArray.slice(1)}
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </li>
                                                        );
                                                    }
                                                    return (
                                                        <li {...props} className="text-base sm:text-lg text-text-muted leading-relaxed">
                                                            {children}
                                                        </li>
                                                    );
                                                },
                                                a: ({ children, href, ...props }) => (
                                                    <a {...props} href={href} target="_blank" rel="noreferrer" className="text-brand-primary font-bold hover:underline decoration-2 underline-offset-4 decoration-brand-primary/30">
                                                        {children}
                                                    </a>
                                                ),
                                                hr: (props) => (
                                                    <hr {...props} className="my-12 border-slate-100" />
                                                ),
                                            }}
                                        >
                                            {roastMarkdown}
                                        </Markdown>
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-slate-50 rounded-premium border border-dashed border-slate-300">
                                        <div className="text-6xl mb-6">🏜️</div>
                                        <h3 className="text-2xl font-black text-brand-secondary">AI Roast Unavailable</h3>
                                        <p className="text-text-muted mt-2 max-w-md mx-auto mb-10">
                                            The intensive AI roast couldn't be generated. This usually happens with non-parseable PDFs or server timeouts.
                                        </p>
                                        {result.roast_report?.priority_fixes && result.roast_report.priority_fixes.length > 0 && (
                                            <div className="text-left max-w-lg mx-auto bg-white p-8 rounded-premium shadow-sm border border-slate-100">
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary mb-6">Quick Fixes (Fallback)</div>
                                                <ul className="space-y-4">
                                                    {result.roast_report.priority_fixes.slice(0, 5).map((fix, idx) => (
                                                        <li key={idx} className="flex gap-4 items-start text-text-main">
                                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-black shrink-0">{idx + 1}</span>
                                                            <span className="font-medium">{fix}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.section>

                        {/* CERTIFICATIONS SECTION */}
                        {certRecs.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className={`space-y-6 ${activeTab !== 'certs' ? 'hide-on-mobile' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                                        <MaterialIcon icon="workspace_premium" size={24} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h2 className="text-2xl font-black text-brand-secondary">Actionable Proof</h2>
                                        <p className="text-sm text-text-subtle font-medium">Industry-recognized paths to bridge your specific skill gaps.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {certRecs.map((cert, idx) => (
                                        <motion.div
                                            key={idx}
                                            whileHover={{ y: -5 }}
                                            className="glass-card group"
                                        >
                                            <div className="p-6 space-y-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="space-y-1">
                                                        <h3 className="text-lg font-black text-brand-secondary group-hover:text-brand-primary transition-colors">{cert.name}</h3>
                                                        <p className="text-xs font-bold text-text-subtle uppercase tracking-wider">{cert.provider}</p>
                                                    </div>
                                                    <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black tracking-widest uppercase border border-indigo-100">
                                                        Path
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-slate-50 p-3 rounded-inner flex items-center gap-3">
                                                        <MaterialIcon icon="payments" size={16} className="text-brand-primary opacity-60" />
                                                        <div className="text-xs font-black text-text-main">{cert.impact || 'Free/Varies'}</div>
                                                    </div>
                                                    <div className="bg-slate-50 p-3 rounded-inner flex items-center gap-3">
                                                        <MaterialIcon icon="schedule" size={16} className="text-brand-primary opacity-60" />
                                                        <div className="text-xs font-black text-text-main">{String((cert as Record<string, unknown>).time_to_complete || '4-8 weeks')}</div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 pt-2">
                                                    {cert.why_this_person_needs_it && (
                                                        <div className="flex gap-3">
                                                            <div className="w-1 h-auto bg-brand-primary/20 rounded-full shrink-0" />
                                                            <p className="text-xs text-text-muted leading-relaxed italic">{cert.why_this_person_needs_it}</p>
                                                        </div>
                                                    )}
                                                    {cert.gap_it_closes && (
                                                        <div className="text-[11px] font-medium text-text-main bg-emerald-50 text-emerald-800 p-2.5 rounded-inner border border-emerald-100">
                                                            <span className="font-black uppercase tracking-widest text-[9px] block mb-1">Gap Closed</span>
                                                            {cert.gap_it_closes}
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => window.open(cert.url, '_blank')}
                                                    className="w-full py-2.5 rounded-inner bg-slate-900 text-white text-xs font-black flex items-center justify-center gap-2 hover:bg-brand-primary transition-all shadow-md active:scale-95"
                                                >
                                                    Start Path
                                                    <MaterialIcon icon="open_in_new" size={14} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* EXTERNAL ANALYSIS SECTION */}
                        {(hasGithubIntel || hasLinkedinIntel) && (
                            <motion.section
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className={`space-y-6 ${activeTab !== 'signals' ? 'hide-on-mobile' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
                                        <MaterialIcon icon="travel_explore" size={24} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h2 className="text-2xl font-black text-brand-secondary">Signal Analysis</h2>
                                        <p className="text-sm text-text-subtle font-medium">How your online presence currently speaks to recruiters.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {hasGithubIntel && (
                                        <div className="glass-card relative group p-8 space-y-8 text-left">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <MaterialIcon icon="code" size={60} />
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                    <MaterialIcon icon="code" size={18} />
                                                </div>
                                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand-secondary">GitHub Repository Power</h3>
                                            </div>

                                            {githubSummary && (
                                                <p className="text-sm text-text-muted leading-relaxed font-medium bg-slate-50 p-4 rounded-inner border border-slate-100 italic">
                                                    "{githubSummary}"
                                                </p>
                                            )}

                                            {githubBest.length > 0 && (
                                                <div className="space-y-6">
                                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 border-b border-emerald-100 pb-2">Top Recommendation</div>
                                                    <div className="flex gap-4 items-start">
                                                        <div className="text-4xl font-heading font-black text-emerald-100 shrink-0">01</div>
                                                        <div className="space-y-2">
                                                            <div className="font-black text-brand-secondary bg-emerald-50/50 inline-block px-2 py-0.5 rounded text-lg italic">
                                                                {githubBest[0].name}
                                                            </div>
                                                            <p className="text-sm text-text-main leading-relaxed">{githubBest[0].reason}</p>
                                                            {githubBest[0].resume_keep_note && (
                                                                <div className="text-emerald-700 text-[11px] font-black uppercase tracking-widest mt-2">{githubBest[0].resume_keep_note}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {detectedGithub ? (
                                                <a href={detectedGithub} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 rounded-inner border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-brand-primary transition-all group/link">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                            <MaterialIcon icon="account_circle" size={18} className="text-brand-secondary" />
                                                        </div>
                                                        <span className="text-xs font-black text-brand-secondary">View Profile</span>
                                                    </div>
                                                    <MaterialIcon icon="chevron_right" size={20} className="text-text-subtle group-hover/link:text-brand-primary" />
                                                </a>
                                            ) : (
                                                <div className="p-4 rounded-inner bg-amber-50 border border-amber-100 text-xs text-amber-900 font-medium flex gap-3">
                                                    <MaterialIcon icon="warning" size={16} className="shrink-0" />
                                                    No GitHub detected. Add it to your header to prove your skills.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {hasLinkedinIntel && (
                                        <div className="glass-card p-8 space-y-8 relative group text-left">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <MaterialIcon icon="person" size={60} />
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <MaterialIcon icon="person" size={18} />
                                                </div>
                                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand-secondary">LinkedIn Strategy</h3>
                                            </div>

                                            {extIntel?.linkedin_summary && (
                                                <p className="text-sm text-text-muted leading-relaxed font-medium bg-slate-50 p-4 rounded-inner border border-slate-100 italic">
                                                    "{extIntel.linkedin_summary}"
                                                </p>
                                            )}

                                            <div className="space-y-6">
                                                {(extIntel?.linkedin_must_include || []).length > 0 && (
                                                    <div className="space-y-4">
                                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 border-b border-emerald-100 pb-2">Must Emphasize</div>
                                                        <ul className="space-y-4">
                                                            {(extIntel?.linkedin_must_include || []).slice(0, 3).map((item, idx) => (
                                                                <li key={idx} className="flex gap-4 items-start text-sm text-text-main">
                                                                    <div className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                                                                        <MaterialIcon icon="check" size={12} />
                                                                    </div>
                                                                    <span className="font-semibold">{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            {detectedLinkedin ? (
                                                <a href={detectedLinkedin} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 rounded-inner border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-brand-primary transition-all group/link">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                            <MaterialIcon icon="public" size={18} className="text-indigo-600" />
                                                        </div>
                                                        <span className="text-xs font-black text-brand-secondary">View Profile</span>
                                                    </div>
                                                    <MaterialIcon icon="chevron_right" size={20} className="text-text-subtle group-hover/link:text-brand-primary" />
                                                </a>
                                            ) : (
                                                <div className="p-4 rounded-inner bg-amber-50 border border-amber-100 text-xs text-amber-900 font-medium flex gap-3">
                                                    <MaterialIcon icon="warning" size={16} className="shrink-0" />
                                                    No LinkedIn URL detected. This is a red flag for 87% of recruiters.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.section>
                        )}

                        {/* FINAL ACTIONS */}
                        <motion.section
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-slate-900 rounded-premium p-8 sm:p-12 text-center space-y-8 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-brand-primary to-brand-accent opacity-50" />
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-white">Ready for the Next Phase?</h3>
                                <p className="text-slate-400 max-w-lg mx-auto">Analyze, rewrite, and practice. Move to the Rewrite Lab to apply these fixes.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    type="button"
                                    className="btn-secondary py-4 px-12 cursor-default opacity-70"
                                >
                                    Match &amp; Fix coming soon
                                </button>
                                <button
                                    onClick={() => (window.location.href = '/templates')}
                                    className="bg-white/10 text-white px-10 py-4 rounded-full font-black text-sm hover:bg-white/20 transition-all border border-white/10"
                                >
                                    Browse Templates
                                </button>
                                <button
                                    onClick={clearResult}
                                    className="text-slate-400 font-black text-sm px-6 hover:text-white transition-colors"
                                >
                                    Run New Scan
                                </button>
                            </div>
                        </motion.section>
                    </div>
                )}
            </main>
        </PageLayout>
    );
};
