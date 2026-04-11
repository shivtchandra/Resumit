import type { MatchFixResult } from '@/types';
import { ExternalLink, BookOpen, Code, Users, Cloud, Youtube, Map, List, Clock, MessageSquare, Target } from 'lucide-react';
import { resolveResource } from '@/config/interviewResources';
import { useState } from 'react';

interface MatchFixReportViewProps {
    result: MatchFixResult;
}

const priorityColor = (priority: string) => {
    if (priority === 'must_have') return 'text-red-700 bg-red-50 border-red-200';
    if (priority === 'important') return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-slate-700 bg-slate-50 border-slate-200';
};

const resourceIcon = (type: string) => {
    const size = 14;
    switch (type) {
        case 'youtube': return <Youtube size={size} />;
        case 'code': return <Code size={size} />;
        case 'users': return <Users size={size} />;
        case 'cloud': return <Cloud size={size} />;
        case 'book': return <BookOpen size={size} />;
        case 'map': return <Map size={size} />;
        case 'list': return <List size={size} />;
        default: return <ExternalLink size={size} />;
    }
};

const ResourceLink = ({ name }: { name: string }) => {
    const resolved = resolveResource(name);
    if (!resolved) return <span className="font-semibold text-text-main">{name}</span>;
    return (
        <a
            href={resolved.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-brand-primary hover:underline"
        >
            {resourceIcon(resolved.icon)}
            {name}
        </a>
    );
};

const questionTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
        coding: 'bg-violet-50 text-violet-700 border-violet-200',
        system_design: 'bg-sky-50 text-sky-700 border-sky-200',
        behavioral: 'bg-amber-50 text-amber-700 border-amber-200',
        technical: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return styles[type] || 'bg-slate-50 text-slate-700 border-slate-200';
};

const confidenceBadge = (confidence: string) => {
    if (confidence === 'high') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (confidence === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
};

export const MatchFixReportView = ({ result }: MatchFixReportViewProps) => {
    const report = result.report;
    const studentTrack = report.coaching_tracks?.student_track;
    const professionalTrack = report.coaching_tracks?.professional_track;
    const interviewPrep = report.interview_prep;
    const companyInsights = report.company_insights;
    const [expandedQ, setExpandedQ] = useState<number | null>(null);

    return (
        <div className="space-y-8">
            <div className="zen-card p-6">
                <h3 className="text-sm font-black tracking-widest uppercase text-brand-secondary mb-3">Fit Summary</h3>
                <p className="text-text-main leading-relaxed">{report.overview.fit_summary}</p>
                {report.overview.biggest_blockers.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {report.overview.biggest_blockers.map((b, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
                                {b}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="zen-card p-6">
                <h3 className="text-sm font-black tracking-widest uppercase text-brand-secondary mb-4">What JD Wants</h3>
                <div className="space-y-3">
                    {report.jd_requirements.map((req) => (
                        <div key={req.id} className="p-4 rounded-xl border border-border-subtle bg-white">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-widest ${priorityColor(req.priority)}`}>
                                    {req.priority.replace(/_/g, ' ')}
                                </span>
                                <span className="text-xs font-bold text-text-subtle">{req.id}</span>
                            </div>
                            <p className="font-semibold text-text-main">{req.requirement}</p>
                            <p className="text-xs text-text-muted mt-1">JD evidence: {req.jd_evidence}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="zen-card p-6">
                    <h3 className="text-sm font-black tracking-widest uppercase text-brand-secondary mb-4">What Matches</h3>
                    <div className="space-y-3">
                        {report.matches.length === 0 && <p className="text-sm text-text-muted">No strong matches detected yet.</p>}
                        {report.matches.map((m, idx) => (
                            <div key={`${m.requirement_id}-${idx}`} className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30">
                                <p className="font-semibold text-text-main">{m.requirement}</p>
                                <p className="text-sm text-text-muted mt-1">{m.why_it_matches}</p>
                                <p className="text-xs text-text-subtle mt-2">Resume evidence: {m.resume_evidence}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="zen-card p-6">
                    <h3 className="text-sm font-black tracking-widest uppercase text-brand-secondary mb-4">What Misses</h3>
                    <div className="space-y-3">
                        {report.misses.length === 0 && <p className="text-sm text-text-muted">No major misses found.</p>}
                        {report.misses.map((m, idx) => (
                            <div key={`${m.requirement_id}-${idx}`} className="p-4 rounded-xl border border-red-100 bg-red-50/30">
                                <p className="font-semibold text-text-main">{m.requirement}</p>
                                <p className="text-sm text-text-muted mt-1">{m.what_is_missing}</p>
                                <p className="text-xs text-text-subtle mt-2">Fix in: {m.where_to_fix}</p>
                                <p className="text-xs text-text-subtle">Proof to add: {m.proof_to_add}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {companyInsights && (
                <div className="zen-card p-6">
                    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                        <h3 className="text-sm font-black tracking-widest uppercase text-brand-secondary">Company Read</h3>
                        <span className={`px-2.5 py-1 rounded border text-[10px] font-black uppercase tracking-widest ${confidenceBadge(companyInsights.confidence)}`}>
                            {companyInsights.confidence} confidence
                        </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="p-4 rounded-xl border border-border-subtle bg-white space-y-2">
                                <p className="text-xs text-text-subtle">Hiring intensity</p>
                                <p className="font-semibold text-text-main">{companyInsights.hiring_intensity}</p>
                            </div>
                            <div className="p-4 rounded-xl border border-border-subtle bg-white space-y-2">
                                <p className="text-xs text-text-subtle">Hiring trend</p>
                                <p className="font-semibold text-text-main">{companyInsights.hiring_trend}</p>
                            </div>
                            <div className="p-4 rounded-xl border border-border-subtle bg-white space-y-2">
                                <p className="text-xs text-text-subtle">Hiring style</p>
                                <p className="font-semibold text-text-main">{companyInsights.hiring_style}</p>
                            </div>
                            <div className="p-4 rounded-xl border border-border-subtle bg-white space-y-2">
                                <p className="text-xs text-text-subtle">Getting in difficulty</p>
                                <p className="font-semibold text-text-main">{companyInsights.getting_in_difficulty}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {companyInsights.hiring_focus?.length > 0 && (
                                <div className="p-4 rounded-xl border border-border-subtle bg-white">
                                    <p className="text-xs text-text-subtle mb-2">Hiring focus</p>
                                    <div className="flex flex-wrap gap-2">
                                        {companyInsights.hiring_focus.map((focus, idx) => (
                                            <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                                                {focus}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {companyInsights.risk_signals?.length > 0 && (
                                <div className="p-4 rounded-xl border border-red-100 bg-red-50/30">
                                    <p className="text-xs text-red-700 font-black uppercase tracking-widest mb-2">Risk Signals</p>
                                    <div className="space-y-1.5">
                                        {companyInsights.risk_signals.map((signal, idx) => (
                                            <p key={idx} className="text-sm text-text-main">• {signal}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {companyInsights.strategy_signal && (
                                <div className="p-4 rounded-xl border border-border-subtle bg-white space-y-2">
                                    <p className="text-xs text-text-subtle">Strategy signal</p>
                                    <p className="text-sm text-text-main">{companyInsights.strategy_signal}</p>
                                </div>
                            )}
                            {companyInsights.candidate_advice && (
                                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 space-y-2">
                                    <p className="text-xs text-emerald-700 font-black uppercase tracking-widest">Candidate advice</p>
                                    <p className="text-sm text-text-main">{companyInsights.candidate_advice}</p>
                                </div>
                            )}
                            {companyInsights.note && (
                                <p className="text-xs text-text-muted">{companyInsights.note}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="zen-card p-6">
                <h3 className="text-sm font-black tracking-widest uppercase text-brand-secondary mb-4">Resume Changes</h3>
                <div className="space-y-3">
                    {report.resume_changes.map((c, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-border-subtle bg-white space-y-2">
                            <div className="text-[10px] font-black uppercase tracking-widest text-brand-primary">{c.section}</div>
                            <p className="text-xs text-text-subtle">Current: {c.current_line}</p>
                            <p className="text-sm text-text-main"><span className="font-bold">Change:</span> {c.recommended_change}</p>
                            <p className="text-xs text-text-muted">Why: {c.reason}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="zen-card p-6">
                    <h3 className="text-sm font-black tracking-widest uppercase text-brand-secondary mb-4">Project Suggestions</h3>
                    <div className="space-y-3">
                        {report.project_suggestions.map((p, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-border-subtle bg-white space-y-2">
                                <p className="font-semibold text-text-main">{p.project_name}</p>
                                <p className="text-sm text-text-muted">{p.why_this_project}</p>
                                <p className="text-xs text-text-subtle">Timeline: {p.timeline} · Scope: {p.scope}</p>
                                <p className="text-xs text-text-subtle">Resume bullet example: {p.resume_bullet_example}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="zen-card p-6">
                    <h3 className="text-sm font-black tracking-widest uppercase text-brand-secondary mb-4">Certification Suggestions</h3>
                    <div className="space-y-3">
                        {report.certification_suggestions.map((c, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-border-subtle bg-white space-y-2">
                                <p className="font-semibold text-text-main">{c.name}</p>
                                <p className="text-xs text-text-subtle">{c.provider}</p>
                                <p className="text-sm text-text-muted">{c.why_this_person_needs_it}</p>
                                <p className="text-xs text-text-subtle">Time: {c.time_to_complete} · Cost: {c.cost_estimate}</p>
                                {c.url && (
                                    <a
                                        href={c.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
                                    >
                                        Open certification <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="zen-card p-6">
                <h3 className="text-sm font-black tracking-widest uppercase text-brand-secondary mb-4">Action Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {report.action_plan.map((plan, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-border-subtle bg-white">
                            <div className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2">
                                {plan.horizon.replace('_', ' ')}
                            </div>
                            <div className="space-y-2">
                                {plan.actions.map((action, actionIdx) => (
                                    <p key={actionIdx} className="text-sm text-text-main">• {action}</p>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {(studentTrack || professionalTrack) && (
                <div className="zen-card p-6">
                    <h3 className="text-sm font-black tracking-widest uppercase text-brand-secondary mb-4">Instructor Tracks</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {studentTrack && (
                            <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/30 space-y-4">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-blue-700 mb-1">Student Track</div>
                                    <p className="text-sm text-text-main font-semibold">{studentTrack.who_for}</p>
                                    <p className="text-sm text-text-muted mt-1">{studentTrack.focus}</p>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-text-subtle mb-1">Next 14 Days</div>
                                    {(studentTrack.next_14_days || []).map((item, idx) => <p key={idx} className="text-sm text-text-main">• {item}</p>)}
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-text-subtle mb-1">Next 30 Days</div>
                                    {(studentTrack.next_30_days || []).map((item, idx) => <p key={idx} className="text-sm text-text-main">• {item}</p>)}
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-text-subtle mb-1">Portfolio Focus</div>
                                    {(studentTrack.portfolio_focus || []).map((item, idx) => <p key={idx} className="text-sm text-text-main">• {item}</p>)}
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-text-subtle mb-1">Interview Focus</div>
                                    {(studentTrack.interview_focus || []).map((item, idx) => <p key={idx} className="text-sm text-text-main">• {item}</p>)}
                                </div>
                            </div>
                        )}

                        {professionalTrack && (
                            <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/30 space-y-4">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1">Professional Track</div>
                                    <p className="text-sm text-text-main font-semibold">{professionalTrack.who_for}</p>
                                    <p className="text-sm text-text-muted mt-1">{professionalTrack.focus}</p>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-text-subtle mb-1">Next 14 Days</div>
                                    {(professionalTrack.next_14_days || []).map((item, idx) => <p key={idx} className="text-sm text-text-main">• {item}</p>)}
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-text-subtle mb-1">Next 30 Days</div>
                                    {(professionalTrack.next_30_days || []).map((item, idx) => <p key={idx} className="text-sm text-text-main">• {item}</p>)}
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-text-subtle mb-1">Portfolio Focus</div>
                                    {(professionalTrack.portfolio_focus || []).map((item, idx) => <p key={idx} className="text-sm text-text-main">• {item}</p>)}
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-text-subtle mb-1">Interview Focus</div>
                                    {(professionalTrack.interview_focus || []).map((item, idx) => <p key={idx} className="text-sm text-text-main">• {item}</p>)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ Interview Prep Section ═══ */}
            {interviewPrep && (interviewPrep.this_week?.length > 0 || interviewPrep.likely_interview_questions?.length > 0) && (
                <div className="zen-card p-6 border-2 border-brand-primary/20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                            <Target size={20} className="text-brand-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black tracking-widest uppercase text-brand-secondary">Interview Prep Guide</h3>
                            {interviewPrep.estimated_total_prep_time && (
                                <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                                    <Clock size={12} /> Estimated prep: {interviewPrep.estimated_total_prep_time}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* This Week */}
                    {interviewPrep.this_week?.length > 0 && (
                        <div className="mb-6">
                            <div className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-3 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                This Week — Start Here
                            </div>
                            <div className="space-y-3">
                                {interviewPrep.this_week.map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border border-orange-100 bg-orange-50/20">
                                        <p className="font-semibold text-text-main">{item.topic}</p>
                                        <p className="text-xs text-text-muted mt-1">{item.why_this_first}</p>
                                        {item.resources.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {item.resources.map((r, rIdx) => (
                                                    <div key={rIdx} className="flex items-start gap-2 text-sm">
                                                        <span className="text-text-subtle mt-0.5">→</span>
                                                        <div>
                                                            <ResourceLink name={r.name} />
                                                            <span className="text-text-muted ml-1">— {r.what_to_study}</span>
                                                            {r.time_needed && (
                                                                <span className="ml-2 text-xs text-text-subtle inline-flex items-center gap-0.5">
                                                                    <Clock size={10} /> {r.time_needed}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* This Month */}
                    {interviewPrep.this_month?.length > 0 && (
                        <div className="mb-6">
                            <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">
                                This Month — Deep Prep
                            </div>
                            <div className="space-y-3">
                                {interviewPrep.this_month.map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border border-blue-100 bg-blue-50/20">
                                        <p className="font-semibold text-text-main">{item.topic}</p>
                                        <p className="text-xs text-text-muted mt-1">{item.why}</p>
                                        {item.resources.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {item.resources.map((r, rIdx) => (
                                                    <div key={rIdx} className="flex items-start gap-2 text-sm">
                                                        <span className="text-text-subtle mt-0.5">→</span>
                                                        <div>
                                                            <ResourceLink name={r.name} />
                                                            <span className="text-text-muted ml-1">— {r.what_to_study}</span>
                                                            {r.time_needed && (
                                                                <span className="ml-2 text-xs text-text-subtle inline-flex items-center gap-0.5">
                                                                    <Clock size={10} /> {r.time_needed}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Likely Interview Questions */}
                    {interviewPrep.likely_interview_questions?.length > 0 && (
                        <div className="mb-6">
                            <div className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-3 flex items-center gap-1.5">
                                <MessageSquare size={12} />
                                Likely Interview Questions
                            </div>
                            <div className="space-y-2">
                                {interviewPrep.likely_interview_questions.map((q, idx) => (
                                    <div key={idx} className="rounded-xl border border-purple-100 bg-purple-50/20 overflow-hidden">
                                        <button
                                            onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}
                                            className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-purple-50/40 transition-colors"
                                        >
                                            <div className="flex items-start gap-3 min-w-0">
                                                <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest shrink-0 ${questionTypeBadge(q.type)}`}>
                                                    {q.type.replace(/_/g, ' ')}
                                                </span>
                                                <p className="font-semibold text-sm text-text-main">{q.question}</p>
                                            </div>
                                            <span className="text-text-subtle shrink-0 text-lg">{expandedQ === idx ? '−' : '+'}</span>
                                        </button>
                                        {expandedQ === idx && (
                                            <div className="px-4 pb-4 space-y-2 border-t border-purple-100/50 pt-3">
                                                <p className="text-xs text-text-muted"><span className="font-bold">Why they ask:</span> {q.why_they_ask_this}</p>
                                                <p className="text-sm text-text-main"><span className="font-bold">How to prepare:</span> {q.how_to_prepare}</p>
                                                {q.prep_resource && (
                                                    <div className="flex items-center gap-1.5 text-sm">
                                                        <span className="text-text-subtle">Study with:</span>
                                                        <ResourceLink name={q.prep_resource} />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mock Interview Plan */}
                    {interviewPrep.mock_interview_plan?.platform && (
                        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-2 flex items-center gap-1.5">
                                <Users size={12} />
                                Mock Interview Plan
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                <div>
                                    <span className="text-text-subtle">Platform: </span>
                                    <ResourceLink name={interviewPrep.mock_interview_plan.platform} />
                                </div>
                                <div>
                                    <span className="text-text-subtle">Schedule: </span>
                                    <span className="text-text-main font-medium">{interviewPrep.mock_interview_plan.schedule}</span>
                                </div>
                            </div>
                            {interviewPrep.mock_interview_plan.focus_areas?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {interviewPrep.mock_interview_plan.focus_areas.map((area, idx) => (
                                        <span key={idx} className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
                                            {area}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
