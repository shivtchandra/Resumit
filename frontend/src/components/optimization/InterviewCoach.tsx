import { useState } from 'react';
import { Target, MessageSquare, Brain, CheckCircle2, Sparkles, Send, Eye, EyeOff, Award } from 'lucide-react';
import { scoreInterviewAnswer } from '@/services/api';
import type { InterviewAnswerScoreResult } from '@/types';

interface InterviewCoachProps {
    interviewPrep: {
        company: string;
        likely_questions: Array<{
            question: string;
            category: string;
            why_asked: string;
            prep_tip: string;
            answer_framework?: string;
            sample_answer?: string;
        }>;
        prep_plan: string[];
    };
    targetRole: string;
    jobDescription?: string;
}

export const InterviewCoach = ({ interviewPrep, targetRole, jobDescription }: InterviewCoachProps) => {
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [scores, setScores] = useState<Record<number, InterviewAnswerScoreResult>>({});
    const [scoringIndex, setScoringIndex] = useState<number | null>(null);
    const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());

    const handleScore = async (question: string, idx: number) => {
        const answer = (answers[idx] || '').trim();
        if (!answer) return;

        setScoringIndex(idx);
        try {
            const response = await scoreInterviewAnswer({
                question,
                answer,
                company_name: interviewPrep.company,
                target_role: targetRole,
                job_description: jobDescription,
            });
            setScores(prev => ({ ...prev, [idx]: response }));
            // Auto-reveal the AI answer after scoring
            setRevealedAnswers(prev => new Set(prev).add(idx));
        } catch (err) {
            console.error('Scoring failed:', err);
        } finally {
            setScoringIndex(null);
        }
    };

    const toggleReveal = (idx: number) => {
        setRevealedAnswers(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const hasSubmitted = (idx: number) => !!scores[idx];

    return (
        <div className="space-y-10">
            {/* Coach Introduction */}
            <div className="flex flex-col md:flex-row gap-6 items-center p-8 bg-brand-secondary rounded-3xl text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
                <div className="w-16 h-16 rounded-2xl bg-brand-primary/20 flex items-center justify-center shrink-0 border border-brand-primary/30">
                    <Brain className="text-brand-primary" size={32} />
                </div>
                <div className="space-y-2 relative z-10">
                    <h3 className="text-xl font-black tracking-tight">Interview Drill — Answer First, Then Compare</h3>
                    <p className="text-slate-400 text-sm max-w-2xl">
                        We've prepared likely questions for <span className="text-brand-primary font-bold">{interviewPrep.company}</span>.
                        Write your answer first, submit it for scoring, then see the AI model answer to learn what a strong response looks like.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {interviewPrep.likely_questions.map((item, idx) => (
                    <div key={idx} className="zen-card overflow-hidden flex flex-col group">
                        <div className="p-8 space-y-6">
                            {/* Question Header */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary text-[9px] font-black uppercase tracking-widest">
                                        {item.category.replace(/_/g, ' ')}
                                    </span>
                                    <div className="h-px flex-1 bg-border-subtle" />
                                    <span className="text-[9px] font-black text-text-subtle uppercase tracking-widest">
                                        Q{idx + 1}
                                    </span>
                                </div>
                                <h4 className="text-xl font-black text-brand-secondary leading-tight group-hover:text-brand-primary transition-colors">
                                    {item.question}
                                </h4>
                            </div>

                            {/* Tactical Intel — Always visible */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-bg-muted border border-border-subtle space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-text-subtle uppercase tracking-widest">
                                        <Target size={12} className="text-brand-primary" />
                                        Why They Ask This
                                    </div>
                                    <p className="text-xs text-text-main leading-relaxed italic">{item.why_asked}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                        <Sparkles size={12} className="text-emerald-600" />
                                        Prep Tip
                                    </div>
                                    <p className="text-xs text-emerald-800 leading-relaxed">{item.prep_tip}</p>
                                </div>
                            </div>

                            {/* Answer Area */}
                            <div className="space-y-4 pt-6 border-t border-border-subtle/50">
                                <div className="relative">
                                    <textarea
                                        value={answers[idx] || ''}
                                        onChange={(e) => setAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                                        placeholder={hasSubmitted(idx)
                                            ? "Your answer has been scored. See feedback below."
                                            : "Type your answer here before seeing the model answer... (Use STAR method: Situation, Task, Action, Result)"
                                        }
                                        disabled={hasSubmitted(idx)}
                                        className={`soft-input min-h-[140px] pt-4 pr-12 pb-4 pl-4 ${hasSubmitted(idx) ? 'opacity-60' : ''}`}
                                    />
                                    <div className="absolute bottom-4 right-4 text-[10px] font-bold text-text-subtle">
                                        {(answers[idx] || '').length} chars
                                    </div>
                                </div>

                                <div className="flex justify-between items-center gap-4">
                                    {!hasSubmitted(idx) ? (
                                        <button
                                            onClick={() => handleScore(item.question, idx)}
                                            disabled={scoringIndex === idx || !(answers[idx] || '').trim()}
                                            className={`btn-primary !px-6 !py-2.5 text-xs ${scoringIndex === idx || !(answers[idx] || '').trim() ? 'opacity-50 grayscale cursor-not-allowed shadow-none' : ''}`}
                                        >
                                            {scoringIndex === idx ? (
                                                <>Evaluating...</>
                                            ) : (
                                                <>
                                                    <Send size={14} /> Submit & Score My Answer
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <Award size={16} className="text-brand-primary" />
                                            <span className="text-xs font-bold text-text-muted">Answer submitted & scored</span>
                                        </div>
                                    )}

                                    {scores[idx] && (
                                        <div className={`px-4 py-2 rounded-xl border-2 flex items-center gap-3 transition-all animate-in zoom-in-95 duration-500 ${scores[idx].score >= 80 ? 'bg-emerald-50 border-emerald-500 text-emerald-700' :
                                            scores[idx].score >= 60 ? 'bg-amber-50 border-amber-500 text-amber-900' :
                                                'bg-red-50 border-red-500 text-red-900'
                                            }`}>
                                            <div className="text-xl font-black">{scores[idx].score}</div>
                                            <div className="h-6 w-px bg-current opacity-20" />
                                            <div className="text-[10px] font-black uppercase tracking-widest">{scores[idx].band} fit</div>
                                        </div>
                                    )}
                                </div>

                                {/* Feedback Display — Only after scoring */}
                                {scores[idx] && (
                                    <div className="mt-6 p-6 bg-white rounded-2xl border border-border-subtle shadow-inner space-y-6 animate-in slide-in-from-top-4 duration-500">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                                    <CheckCircle2 size={12} /> What You Did Well
                                                </div>
                                                <ul className="space-y-2">
                                                    {scores[idx].strengths.map((s, i) => (
                                                        <li key={i} className="text-xs text-text-main flex gap-2">
                                                            <span className="text-emerald-500 leading-none">•</span> {s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                                    <MessageSquare size={12} /> What To Improve
                                                </div>
                                                <ul className="space-y-2">
                                                    {scores[idx].improvements.map((imp, i) => (
                                                        <li key={i} className="text-xs text-text-main flex gap-2">
                                                            <span className="text-amber-500 leading-none">•</span> {imp}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Improved answer suggestion */}
                                        {scores[idx].improved_answer && (
                                            <div className="pt-6 border-t border-border-subtle/50">
                                                <div className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-3">Suggested Stronger Answer</div>
                                                <div className="p-4 bg-bg-surface rounded-xl border border-brand-primary/10 text-xs text-brand-secondary leading-relaxed font-medium">
                                                    {scores[idx].improved_answer}
                                                </div>
                                            </div>
                                        )}

                                        {/* Model Answer — Revealed after scoring */}
                                        {(item.sample_answer || item.answer_framework) && (
                                            <div className="pt-6 border-t border-border-subtle/50">
                                                <button
                                                    onClick={() => toggleReveal(idx)}
                                                    className="flex items-center gap-2 text-xs font-black text-brand-primary uppercase tracking-widest hover:text-brand-secondary transition-colors mb-3"
                                                >
                                                    {revealedAnswers.has(idx) ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    {revealedAnswers.has(idx) ? 'Hide' : 'Show'} AI Model Answer
                                                </button>

                                                {revealedAnswers.has(idx) && (
                                                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                                        {item.answer_framework && (
                                                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                                                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Answer Framework</div>
                                                                <p className="text-xs text-text-main leading-relaxed">{item.answer_framework}</p>
                                                            </div>
                                                        )}
                                                        {item.sample_answer && (
                                                            <div className="p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/10">
                                                                <div className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-2">Model Answer</div>
                                                                <p className="text-xs text-brand-secondary leading-relaxed font-medium">{item.sample_answer}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Prep Plan Summary */}
            <div className="zen-card p-10 bg-slate-50 border-slate-200">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 rounded-lg bg-white text-brand-secondary border border-border-subtle shadow-sm">
                        <CheckCircle2 size={20} />
                    </div>
                    <h3 className="text-sm font-black text-brand-secondary tracking-[0.2em] uppercase">Your Final Prep Protocol</h3>
                </div>
                <div className="space-y-4">
                    {interviewPrep.prep_plan.map((step, i) => (
                        <div key={i} className="flex gap-4 items-center">
                            <div className="w-8 h-8 rounded-full bg-white border border-border-subtle flex items-center justify-center font-black text-xs text-brand-secondary shrink-0 shadow-sm">
                                {i + 1}
                            </div>
                            <p className="text-sm text-text-main font-medium">{step}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
