import { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { rewriteWithBrutalFeedback, scoreInterviewAnswer } from '@/services/api';
import type { BrutalRewriteResult, InterviewAnswerScoreResult } from '@/types';
import { BrutalFitReview } from './BrutalFitReview';
import { HighlightedResume } from './HighlightedResume';
import { OptimizationSetupConsole } from '../tactical/OptimizationSetupConsole';
import { getJDTemplateById } from '@/data/jdTemplates';
import { MaterialIcon } from '../ui/MaterialIcon';




export const FullRewrite = () => {
    const [jobDescription, setJobDescription] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [isRewriting, setIsRewriting] = useState(false);
    const [brutalResult, setBrutalResult] = useState<BrutalRewriteResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [targetRole, setTargetRole] = useState('software-engineer');
    const [interviewAnswers, setInterviewAnswers] = useState<Record<number, string>>({});
    const [interviewScores, setInterviewScores] = useState<Record<number, InterviewAnswerScoreResult>>({});
    const [activeScoreIndex, setActiveScoreIndex] = useState<number | null>(null);
    const rewriteAbortRef = useRef<AbortController | null>(null);
    const cancelRequestedRef = useRef(false);


    const handleScoreInterviewAnswer = async (question: string, idx: number) => {
        const answer = (interviewAnswers[idx] || '').trim();
        if (!answer) return;
        setActiveScoreIndex(idx);
        try {
            const response = await scoreInterviewAnswer({
                question,
                answer,
                company_name: companyName.trim() || undefined,
                target_role: targetRole,
                job_description: jobDescription || undefined,
            });
            setInterviewScores((prev) => ({ ...prev, [idx]: response }));
        } catch (err) {
            setInterviewScores((prev) => ({
                ...prev,
                [idx]: {
                    score: 0,
                    band: 'weak',
                    strengths: [],
                    improvements: [err instanceof Error ? err.message : 'Could not score answer right now.'],
                    improved_answer: '',
                    evaluation_mode: 'heuristic',
                },
            }));
        } finally {
            setActiveScoreIndex(null);
        }
    };

    const handleRewrite = async (file: File) => {
        if (!file || !jobDescription.trim()) return;
        rewriteAbortRef.current?.abort();
        const controller = new AbortController();
        rewriteAbortRef.current = controller;
        cancelRequestedRef.current = false;
        setIsRewriting(true);
        setError(null);
        setBrutalResult(null);

        try {
            const response = await rewriteWithBrutalFeedback(
                file,
                jobDescription,
                companyName.trim() || undefined,
                'anonymous',
                controller.signal
            );
            setBrutalResult(response);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to analyze resume';
            if (cancelRequestedRef.current || /canceled/i.test(message)) {
                setError('Rewrite canceled. You can adjust inputs and run again.');
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

    const cancelRewriteRun = () => {
        cancelRequestedRef.current = true;
        rewriteAbortRef.current?.abort();
    };

    useEffect(() => {
        if (!isRewriting) return;
    }, [isRewriting]);


    useEffect(() => {
        return () => {
            rewriteAbortRef.current?.abort();
        };
    }, []);


    // Render brutal review results
    if (brutalResult) {
        return (
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Hero */}
                <div className="zen-card p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-teal-300" />
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                        <CheckCircle size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-brand-secondary tracking-tight mb-3">Resume Fix Complete</h1>
                    <p className="text-base text-text-muted max-w-xl mx-auto mb-6 leading-relaxed">
                        Your resume was rewritten with practical fixes and interview coaching.
                    </p>

                    {brutalResult.generation_mode && brutalResult.generation_mode !== 'ai' && (
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-amber-200 bg-amber-50 text-amber-800 text-xs font-bold mb-4">
                            Hybrid fallback mode: core fixes are applied even if full AI rewrite times out.
                        </div>
                    )}

                    {brutalResult.warnings && brutalResult.warnings.length > 0 && (
                        <div className="grid gap-1 p-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-sm font-semibold mb-4">
                            {brutalResult.warnings.map((warning, idx) => (
                                <div key={idx}>{warning}</div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3 justify-center flex-wrap">
                        <button className="btn-secondary" onClick={() => setBrutalResult(null)}>Start New Fix Session</button>
                    </div>
                </div>

                <HighlightedResume
                    markedUpText={brutalResult.marked_up_resume}
                    changes={brutalResult.changes}
                />

                <BrutalFitReview
                    companyExpectations={brutalResult.company_expectations}
                    harshReview={brutalResult.harsh_review}
                />

                {brutalResult.interview_prep && (
                    <div className="zen-card p-8 space-y-5">
                        <h3 className="text-xl font-black text-brand-secondary tracking-tight">Interview Drill and Scoring</h3>
                        <p className="text-sm text-text-muted">
                            Practice answers and score them instantly. Company context: {brutalResult.interview_prep.company}
                        </p>
                        <div className="grid gap-3">
                            {brutalResult.interview_prep.likely_questions.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-xl border border-border-subtle bg-bg-muted space-y-2">
                                    <div className="text-[10px] font-black tracking-widest uppercase text-text-subtle">
                                        {item.category.replace(/_/g, ' ')}
                                    </div>
                                    <div className="font-semibold text-brand-secondary">{item.question}</div>
                                    <div className="text-sm text-text-muted">Why asked: {item.why_asked}</div>
                                    <div className="text-sm text-brand-primary">Prep tip: {item.prep_tip}</div>

                                    {item.answer_framework && (
                                        <div className="mt-1 text-sm text-brand-secondary bg-indigo-50 border border-indigo-200 rounded-lg p-2">
                                            <strong>Answer framework:</strong> {item.answer_framework}
                                        </div>
                                    )}
                                    {item.sample_answer && (
                                        <div className="mt-1 text-sm text-text-main bg-bg-muted border border-border-subtle rounded-lg p-2">
                                            <strong>Sample answer direction:</strong> {item.sample_answer}
                                        </div>
                                    )}

                                    <div className="mt-2">
                                        <textarea
                                            value={interviewAnswers[idx] || ''}
                                            onChange={(e) => setInterviewAnswers((prev) => ({ ...prev, [idx]: e.target.value }))}
                                            placeholder="Write your mock answer here (STAR + metrics)"
                                            className="soft-input min-h-[92px] text-sm"
                                        />
                                        <div className="mt-2 flex justify-between items-center gap-2 flex-wrap">
                                            <button
                                                onClick={() => handleScoreInterviewAnswer(item.question, idx)}
                                                disabled={activeScoreIndex === idx || !(interviewAnswers[idx] || '').trim()}
                                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeScoreIndex === idx || !(interviewAnswers[idx] || '').trim()
                                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                        : 'bg-brand-secondary text-white hover:bg-slate-800 cursor-pointer'
                                                    }`}
                                            >
                                                {activeScoreIndex === idx ? 'Scoring...' : 'Score My Answer'}
                                            </button>
                                            {interviewScores[idx] && (
                                                <span className={`text-xs font-bold ${interviewScores[idx].score >= 80 ? 'text-emerald-700'
                                                        : interviewScores[idx].score >= 65 ? 'text-amber-700'
                                                            : 'text-red-700'
                                                    }`}>
                                                    Score: {interviewScores[idx].score}/100 ({interviewScores[idx].band})
                                                </span>
                                            )}
                                        </div>
                                        {interviewScores[idx] && (
                                            <div className="mt-2 border border-border-subtle rounded-lg p-3 bg-white space-y-1">
                                                <div className="text-xs font-bold text-brand-secondary">
                                                    Feedback ({interviewScores[idx].evaluation_mode})
                                                </div>
                                                <div className="text-xs text-brand-primary">
                                                    Strengths: {interviewScores[idx].strengths.join(' | ') || '—'}
                                                </div>
                                                <div className="text-xs text-amber-700">
                                                    Improve: {interviewScores[idx].improvements.join(' | ') || '—'}
                                                </div>
                                                {interviewScores[idx].improved_answer && (
                                                    <div className="text-xs text-text-muted">
                                                        Better answer draft: {interviewScores[idx].improved_answer}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <h4 className="text-base font-bold text-brand-secondary">Prep Plan</h4>
                        <ul className="list-disc pl-5 text-sm text-text-main space-y-1">
                            {brutalResult.interview_prep.prep_plan.map((step, i) => (
                                <li key={i}>{step}</li>
                            ))}
                        </ul>
                    </div>
                )}
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
                onRoleChange={setTargetRole}
                onCompanyChange={setCompanyName}
                initialData={{
                    targetRole,
                    companyName,
                    jobDescription
                }}
            />
        </div>
    );
};
