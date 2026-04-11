import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';
import { PageGuide } from '../components/layout/PageGuide';
import { WorkflowMap } from '../components/layout/WorkflowMap';
// import { TemplateSelector } from '../components/optimization/TemplateSelector';
import { FullRewrite } from '../components/optimization/FullRewrite';
// import { PromptKit } from '../components/optimization/PromptKit';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Sparkles } from 'lucide-react';
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

                <div className="zen-card p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="p-5 rounded-xl border border-border-subtle bg-bg-muted">
                        <h3 className="text-xs font-black tracking-widest uppercase text-brand-secondary mb-2">When To Use This Page</h3>
                        <p className="text-sm text-text-muted leading-relaxed">
                            Use after Analysis when you need actual rewritten lines, cleaner bullet wording, and interview practice guidance.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50">
                        <h3 className="text-xs font-black tracking-widest uppercase text-brand-secondary mb-2">Expected Outcome</h3>
                        <p className="text-sm text-text-muted leading-relaxed">
                            You leave with a concrete fix report: what matches, what is missing, what to change, and how to prep for likely questions.
                        </p>
                    </div>
                </div>

                <div className="hidden md:block">
                    <WorkflowMap currentStep="fix" />
                </div>

                <div className="bg-white rounded-premium p-8 shadow-zen border border-border-subtle overflow-hidden">
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

                    <div className="mt-0 space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black text-brand-secondary flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-secondary flex items-center justify-center">
                                    <Sparkles size={20} />
                                </div>
                                Match & Fix
                            </h2>
                            <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
                                Upload resume + JD (or posting URL), then get alignment analysis, gaps, rewrites, and interview preparation.
                            </p>
                        </div>
                        <FullRewrite />
                    </div>
                </div>
            </main>
        </PageLayout>
    );
};
