import { useState } from 'react';
import { Target, MessageSquare, Brain, CheckCircle2, ChevronRight, Sparkles, Send, Quote } from 'lucide-react';
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
        } catch (err) {
            console.error('Scoring failed:', err);
        } finally {
            setScoringIndex(null);
        }
    };

    return (
        <div className="space-y-10">
            {/* Coach Introduction */}
            <div className="flex flex-col md:flex-row gap-6 items-center p-8 bg-brand-secondary rounded-3xl text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
                <div className="w-16 h-16 rounded-2xl bg-brand-primary/20 flex items-center justify-center shrink-0 border border-brand-primary/30">
                    <Brain className="text-brand-primary" size={32} />
                </div>
                <div className="space-y-2 relative z-10">
                    <h3 className="text-xl font-black tracking-tight">AI Interview Coach Active</h3>
                    <p className="text-slate-400 text-sm max-w-2xl">
                        I've analyzed the <span className="text-brand-primary font-bold">{interviewPrep.company}</span> requirements.
                        Below are the high-probability questions they'll likely ask you. Practice your answers using the STAR method (Situation, Task, Action, Result) for maximum impact.
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
                                </div>
                                <h4 className="text-xl font-black text-brand-secondary leading-tight group-hover:text-brand-primary transition-colors">
                                    {item.question}
                                </h4>
                            </div>

                            {/* Tactical Intel */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-bg-muted border border-border-subtle space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-text-subtle uppercase tracking-widest">
                                        <Target size={12} className="text-brand-primary" />
                                        The Hiring Logic
                                    </div>
                                    <p className="text-xs text-text-main leading-relaxed italic">{item.why_asked}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                        <Sparkles size={12} className="text-emerald-600" />
                                        Pro Coach Tip
                                    </div>
                                    <p className="text-xs text-emerald-800 leading-relaxed">{item.prep_tip}</p>
                                </div>
                            </div>

                            {/* Frameworks */}
                            {(item.answer_framework || item.sample_answer) && (
                                <div className="space-y-4 pt-2">
                                    {item.answer_framework && (
                                        <div className="flex gap-3">
                                            <div className="shrink-0 mt-1">
                                                <ChevronRight size={16} className="text-brand-primary" />
                                            </div>
                                            <div className="text-sm">
                                                <span className="font-black text-brand-secondary text-[11px] uppercase tracking-wider block mb-1">Recommended Framework</span>
                                                <p className="text-text-muted leading-relaxed">{item.answer_framework}</p>
                                            </div>
                                        </div>
                                    )}
                                    {item.sample_answer && (
                                        <div className="flex gap-3">
                                            <div className="shrink-0 mt-1">
                                                <Quote size={16} className="text-brand-primary" />
                                            </div>
                                            <div className="text-sm">
                                                <span className="font-black text-brand-secondary text-[11px] uppercase tracking-wider block mb-1">Winning Direction</span>
                                                <p className="text-text-muted leading-relaxed">{item.sample_answer}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Interaction Area */}
                            <div className="space-y-4 pt-6 border-t border-border-subtle/50">
                                <div className="relative">
                                    <textarea
                                        value={answers[idx] || ''}
                                        onChange={(e) => setAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                                        placeholder="Type your response here... (Try to mention metrics & clear actions)"
                                        className="soft-input min-h-[140px] pt-4 pr-12 pb-4 pl-4"
                                    />
                                    <div className="absolute bottom-4 right-4 text-[10px] font-bold text-text-subtle">
                                        {(answers[idx] || '').length} characters
                                    </div>
                                </div>

                                <div className="flex justify-between items-center gap-4">
                                    <button
                                        onClick={() => handleScore(item.question, idx)}
                                        disabled={scoringIndex === idx || !(answers[idx] || '').trim()}
                                        className={`btn-primary !px-6 !py-2.5 text-xs ${scoringIndex === idx || !(answers[idx] || '').trim() ? 'opacity-50 grayscale cursor-not-allowed shadow-none' : ''}`}
                                    >
                                        {scoringIndex === idx ? (
                                            <>Evaluating...</>
                                        ) : (
                                            <>
                                                <Send size={14} /> Analyze My Answer
                                            </>
                                        )}
                                    </button>

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

                                {/* Feedback Display */}
                                {scores[idx] && (
                                    <div className="mt-6 p-6 bg-white rounded-2xl border border-border-subtle shadow-inner space-y-6 animate-in slide-in-from-top-4 duration-500">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                                    <CheckCircle2 size={12} /> Highlights
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
                                                    <MessageSquare size={12} /> Improvement Areas
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

                                        {scores[idx].improved_answer && (
                                            <div className="pt-6 border-t border-border-subtle/50">
                                                <div className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-3">Suggested Stronger Path</div>
                                                <div className="p-4 bg-bg-surface rounded-xl border border-brand-primary/10 text-xs text-brand-secondary leading-relaxed font-medium">
                                                    {scores[idx].improved_answer}
                                                </div>
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
