import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';
import { PageGuide } from '../components/layout/PageGuide';
import { WorkflowMap } from '../components/layout/WorkflowMap';
import { TemplateSelector } from '../components/optimization/TemplateSelector';
import { FullRewrite } from '../components/optimization/FullRewrite';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Sparkles, FileText } from 'lucide-react';

export const OptimizationHub = () => {
    return (
        <PageLayout header={<Navbar />} maxWidth="xl">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-6 sm:space-y-12">
                <div className="text-center space-y-6 pt-10">
                    <h1 className="page-hero-title text-6xl md:text-8xl leading-[0.9] tracking-tighter">
                        Resume <span className="text-brand-primary">Match & Fix.</span>
                    </h1>
                    <p className="text-xl text-text-muted max-w-2xl mx-auto font-medium">
                        A structured fix workflow: choose a template, run guided rewrite, and get interview-ready coaching.
                    </p>
                </div>

                <div className="hidden md:block">
                    <PageGuide
                        badge="RESUME MATCH & FIX GUIDE"
                        title="Turn Diagnostics Into Final Resume Output"
                        description="This page is execution mode. Use it to rewrite weak content, apply sharper language, and practice interview answers."
                        whatThisPageDoes="Combines template selection, resume rewrite workflow, and answer scoring so you leave with practical, job-ready content."
                        bestUseCase="Best after Analysis identifies gaps and you need to transform feedback into an improved resume."
                        howToUse={[
                            'Pick or confirm a template strategy for your target role.',
                            'Upload resume + add JD + set role/company to run the fix engine.',
                            'Review keep/rewrite/remove outputs and update your final resume draft.',
                            'Practice expected interview questions and improve low-scoring answers.'
                        ]}
                        makeMostOfIt={[
                            'Use one real target JD per run to avoid generic rewrites.',
                            'Focus on quantified bullets and business impact, not buzzwords.',
                            'Re-run Analysis after changes to confirm ATS and risk improvements.'
                        ]}
                        primaryAction={{ label: 'Run Analysis First', to: '/analysis' }}
                        secondaryAction={{ label: 'Browse Templates', to: '/templates' }}
                    />
                </div>

                <div className="zen-card p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="p-5 rounded-xl border border-border-subtle bg-bg-muted">
                        <h3 className="text-xs font-black tracking-widest uppercase text-brand-secondary mb-2">When To Use This Page</h3>
                        <p className="text-sm text-text-muted leading-relaxed">
                            Use after Analysis when you need actual rewritten lines, cleaner bullet wording, and interview practice with score feedback.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50">
                        <h3 className="text-xs font-black tracking-widest uppercase text-brand-secondary mb-2">Expected Outcome</h3>
                        <p className="text-sm text-text-muted leading-relaxed">
                            You leave with a concrete fix draft: what changed, why it changed, what to keep, and how to answer likely interview questions.
                        </p>
                    </div>
                </div>

                <div className="hidden md:block">
                    <WorkflowMap currentStep="fix" />
                </div>

                <div className="bg-white rounded-premium p-8 shadow-zen border border-border-subtle overflow-hidden">
                    <Tabs defaultValue="rewrite" className="w-full">
                        <TabsList className="inline-flex gap-2 p-2 mb-8 bg-bg-page rounded-xl border border-border-subtle">
                            <TabsTrigger
                                value="templates"
                                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest rounded-lg transition-all"
                            >
                                <FileText size={16} />
                                Templates
                            </TabsTrigger>
                            <TabsTrigger
                                value="rewrite"
                                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest rounded-lg transition-all"
                            >
                                <Sparkles size={16} />
                                Match & Fix
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="templates" className="mt-0 space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-black text-brand-secondary flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-secondary flex items-center justify-center">
                                        <FileText size={20} />
                                    </div>
                                    Strategic Templates
                                </h2>
                                <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
                                    Professional, ATS-optimized templates selected based on your target role and industry. Each template is tested against major ATS systems like Workday, Taleo, and Greenhouse.
                                </p>
                            </div>
                            <TemplateSelector role="DevOps" onSelect={(id) => console.log('Selected:', id)} />
                        </TabsContent>

                        <TabsContent value="rewrite" className="mt-0 space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-black text-brand-secondary flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-secondary flex items-center justify-center">
                                        <Sparkles size={20} />
                                    </div>
                                    Match & Fix
                                </h2>
                                <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
                                    Upload resume + JD, then get a practical rewrite with what-to-keep, what-to-cut, and interview preparation.
                                </p>
                            </div>
                            <FullRewrite />
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </PageLayout>
    );
};
