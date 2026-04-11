import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle } from 'lucide-react';
import { rewriteWithMatchFixStream } from '@/services/api';
import type { MatchFixResult } from '@/types';
import { AlignmentScoreCard } from './AlignmentScoreCard';
import { OptimizationSetupConsole } from '../tactical/OptimizationSetupConsole';
import { MaterialIcon } from '../ui/MaterialIcon';
import { MatchFixReportView } from './MatchFixReportView';

const SESSION_FORM_KEY = 'resumit_matchfix_form';

export const FullRewrite = () => {
    // Restore form state from sessionStorage
    const savedForm = (() => {
        try {
            const stored = sessionStorage.getItem(SESSION_FORM_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    })();

    const [jobDescription, setJobDescription] = useState(savedForm?.jobDescription || '');
    const [jdInputMode, setJdInputMode] = useState<'paste' | 'url'>(savedForm?.jdInputMode === 'url' ? 'url' : 'paste');
    const [companyName, setCompanyName] = useState(savedForm?.companyName || '');
    const [isRewriting, setIsRewriting] = useState(false);
    const [matchFixResult, setMatchFixResult] = useState<MatchFixResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [targetRole, setTargetRole] = useState(savedForm?.targetRole || 'software-engineer');
    const rewriteAbortRef = useRef<AbortController | null>(null);
    const cancelRequestedRef = useRef(false);

    // Results are NOT persisted to sessionStorage — prevents data leakage between users.

    // Persist form inputs to sessionStorage
    useEffect(() => {
        try {
            sessionStorage.setItem(SESSION_FORM_KEY, JSON.stringify({
                jobDescription, companyName, targetRole, jdInputMode
            }));
        } catch { /* ignore */ }
    }, [jobDescription, companyName, targetRole, jdInputMode]);

    const clearSession = useCallback(() => {
        setMatchFixResult(null);
    }, []);

    const handleRewrite = async (file: File) => {
        if (!file) return;
        if (jdInputMode === 'url') {
            try {
                const u = new URL(jobDescription.trim());
                if (u.protocol !== 'http:' && u.protocol !== 'https:') return;
            } catch {
                return;
            }
        } else if (!jobDescription.trim()) {
            return;
        }
        rewriteAbortRef.current?.abort();
        const controller = new AbortController();
        rewriteAbortRef.current = controller;
        cancelRequestedRef.current = false;
        setIsRewriting(true);
        setError(null);
        setMatchFixResult(null);

        try {
            const response = await rewriteWithMatchFixStream(
                file,
                jobDescription,
                targetRole,
                companyName.trim() || undefined,
                'anonymous',
                controller.signal
            );
            setMatchFixResult(response);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to analyze resume';
            if (cancelRequestedRef.current || /canceled/i.test(message)) {
                setError('Analysis canceled. You can adjust inputs and run again.');
            } else {
                setError(message);
            }
        } finally {
            if (rewriteAbortRef.current === controller) {
                rewriteAbortRef.current = null;
            }
            cancelRequestedRef.current = false;
            setIsRewriting(false);
        }
    };

    useEffect(() => {
        return () => {
            rewriteAbortRef.current?.abort();
        };
    }, []);

    // Render results view
    if (matchFixResult) {
        const report = matchFixResult.report;
        const alignment = matchFixResult.alignment_score ?? report.overview.fit_score_estimate ?? 0;
        const ats = matchFixResult.ats_score ?? alignment;
        const matchedKeywords = report.keyword_map?.present_in_resume || matchFixResult.matched_keywords || [];
        const missingKeywords = report.keyword_map?.missing_from_resume || matchFixResult.missing_keywords || [];

        return (
            <div className="max-w-5xl mx-auto space-y-12 pb-20">
                {/* Hero Success State */}
                <div className="zen-card p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-teal-300" />
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                        <CheckCircle size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-brand-secondary tracking-tight mb-3 uppercase">Alignment Analysis Complete</h1>
                    <p className="text-base text-text-muted max-w-xl mx-auto mb-6 leading-relaxed">
                        We've recalibrated your resume for the <span className="text-brand-primary font-bold">{companyName || 'target'}</span> {targetRole.replace('-', ' ')} role.
                    </p>

                    {report.overview.biggest_blockers?.length > 0 && (
                        <div className="grid gap-1 p-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-sm font-semibold mb-4 text-left">
                            {report.overview.biggest_blockers.map((warning, idx) => (
                                <div key={idx} className="flex gap-2 items-start">
                                    <span className="text-amber-500">•</span> {warning}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3 justify-center flex-wrap">
                        <button className="btn-secondary" onClick={clearSession}>Recalibrate New Target</button>
                    </div>
                </div>

                {/* JD Alignment & ATS Score */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 ml-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black">1</div>
                        <h2 className="text-sm font-black text-brand-secondary tracking-widest uppercase">JD Alignment & ATS Score</h2>
                    </div>
                    <AlignmentScoreCard
                        alignmentScore={alignment}
                        atsScore={ats}
                        matchedKeywords={matchedKeywords}
                        missingKeywords={missingKeywords}
                        companyName={companyName || undefined}
                    />
                </div>

                {/* Match & Fix Report */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 ml-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black">2</div>
                        <h2 className="text-sm font-black text-brand-secondary tracking-widest uppercase">Match & Fix Report</h2>
                    </div>
                    <MatchFixReportView result={matchFixResult} />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {error && (
                <div className="p-5 rounded-xl bg-red-50 border border-red-100 text-red-900 text-sm flex gap-4 animate-in fade-in slide-in-from-top-4">
                    <MaterialIcon icon="warning" className="text-red-500 shrink-0" size={20} />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            <OptimizationSetupConsole
                onStartFix={handleRewrite}
                isFixing={isRewriting}
                onJdChange={setJobDescription}
                onJdInputModeChange={setJdInputMode}
                onRoleChange={setTargetRole}
                onCompanyChange={setCompanyName}
                initialData={{
                    targetRole,
                    companyName,
                    jobDescription,
                    jdInputMode
                }}
            />
        </div>
    );
};
