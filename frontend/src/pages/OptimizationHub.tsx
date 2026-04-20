import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';
import { PageGuide } from '../components/layout/PageGuide';
import { WorkflowMap } from '../components/layout/WorkflowMap';
// import { TemplateSelector } from '../components/optimization/TemplateSelector';
import { FullRewrite } from '../components/optimization/FullRewrite';
// import { PromptKit } from '../components/optimization/PromptKit';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Check, Clock3, ChevronDown } from 'lucide-react';
// import { FileText, Terminal } from 'lucide-react';

export const OptimizationHub = () => {
    return (
        <PageLayout header={<Navbar />} maxWidth="xl">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-6 sm:space-y-12">
                <div className="text-center space-y-6 pt-10">
                    <h1 className="page-hero-title text-6xl md:text-8xl leading-[0.9] tracking-tighter">
                        Resume <span className="text-brand-primary">Match & Fix.</span>
                    </h1>
                    <p className="text-xl text-text-muted max-w-2xl mx-auto font-medium">
                        A structured fix workflow: upload your resume, add a target JD (or URL), and get interview-ready coaching.
                    </p>
                    <p className="text-sm text-text-muted max-w-xl mx-auto flex items-start justify-center gap-2 text-left sm:text-center">
                        <Clock3 size={16} className="text-brand-primary shrink-0 mt-0.5 sm:mt-0" />
                        <span>
                            Takes about <strong className="text-brand-secondary">1 minute on average</strong> — stay on this page and{' '}
                            <strong className="text-brand-secondary">don&apos;t refresh</strong>. Long JDs or slow networks can take a few minutes.
                        </span>
                    </p>
                </div>

                <div className="hidden md:block">
                    <PageGuide
                        badge="RESUME MATCH & FIX GUIDE"
                        title="Turn Diagnostics Into Final Resume Output"
                        description="This page is execution mode. Use it to rewrite weak content, apply sharper language, and practice interview answers."
                        whatThisPageDoes="Runs the Match & Fix engine on your resume and a target job so you leave with practical, job-ready fixes."
                        bestUseCase="Best after Analysis identifies gaps and you need to transform feedback into an improved resume."
                        howToUse={[
                            'Upload resume + add JD (paste or posting URL) + set role/company.',
                            'Review matches, gaps, rewrite suggestions, and interview prep.',
                            'Apply changes to your resume and re-run Analysis if needed.'
                        ]}
                        makeMostOfIt={[
                            'Use one real target JD per run to avoid generic output.',
                            'Focus on quantified bullets and business impact, not buzzwords.',
                            'Re-run Analysis after changes to confirm ATS and risk improvements.'
                        ]}
                        primaryAction={{ label: 'Run Analysis First', to: '/analysis' }}
                    />
                </div>

                <p className="max-w-3xl mx-auto text-center text-sm text-text-muted leading-relaxed rounded-2xl border border-border-subtle bg-white px-5 py-4 shadow-sm">
                    <strong className="text-brand-secondary">How it works:</strong> upload your resume → add the job (paste or URL) → run once. You get
                    gaps, copy-paste edits, keywords, and interview prep in one report.
                </p>

                <div className="hidden md:block">
                    <WorkflowMap currentStep="fix" />
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-border-subtle overflow-hidden md:p-8">
                    {/*
                    <Tabs defaultValue="rewrite" className="w-full">
                        <TabsList className="inline-flex gap-2 p-2 mb-8 bg-bg-page rounded-xl border border-border-subtle">
                            <TabsTrigger value="templates" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest rounded-lg transition-all">
                                <FileText size={16} />
                                Templates
                            </TabsTrigger>
                            <TabsTrigger value="rewrite" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest rounded-lg transition-all">
                                <Sparkles size={16} />
                                Match & Fix
                            </TabsTrigger>
                            <TabsTrigger value="prompt-kit" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest rounded-lg transition-all">
                                <Terminal size={16} />
                                Prompt Kit
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="templates" className="mt-0 space-y-8">…</TabsContent>
                        <TabsContent value="prompt-kit" className="mt-0 space-y-8">…</TabsContent>
                    </Tabs>
                    */}

                    <div className="mt-0 space-y-6 md:space-y-8">
                        <div className="space-y-3 border-b border-border-subtle pb-6">
                            <h2 className="text-2xl font-black tracking-tight text-brand-secondary md:text-3xl">Set up your Match &amp; Fix run</h2>
                            <p className="text-sm text-text-muted leading-relaxed md:text-base max-w-2xl">
                                Follow the three steps in the box below — start with your resume file, then the job, then run.
                            </p>
                            <details className="group rounded-xl border border-border-subtle bg-slate-50/60 px-4 py-3 text-sm open:bg-white">
                                <summary className="cursor-pointer font-semibold text-brand-secondary list-none [&::-webkit-details-marker]:hidden flex items-center gap-2">
                                    <Check size={16} className="text-brand-primary shrink-0" />
                                    What&apos;s included in the report
                                    <ChevronDown
                                        size={18}
                                        className="ml-auto shrink-0 text-text-subtle transition-transform group-open:rotate-180"
                                        aria-hidden
                                    />
                                </summary>
                                <ul className="mt-3 grid gap-2 text-text-muted sm:grid-cols-2 pt-3 border-t border-border-subtle">
                                    {[
                                        'Fit overview and blockers',
                                        'JD matches vs. gaps',
                                        'Copy-paste resume edits',
                                        'Projects, certs, keyword map',
                                        'Inferred company context (not official)',
                                        'Action plan, coaching, interview prep',
                                    ].map((line) => (
                                        <li key={line} className="flex gap-2">
                                            <Check size={14} className="text-brand-primary shrink-0 mt-0.5" />
                                            {line}
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        </div>
                        <FullRewrite />
                    </div>
                </div>
            </main>
        </PageLayout>
    );
};
