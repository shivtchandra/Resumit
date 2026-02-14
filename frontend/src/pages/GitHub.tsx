import { GitHubAnalyzer } from '@/components/github/GitHubAnalyzer';
import { PageLayout } from '@/components/layout/PageLayout';
import { Navbar } from '@/components/layout/Navbar';
import { PageGuide } from '@/components/layout/PageGuide';
import { WorkflowMap } from '@/components/layout/WorkflowMap';
import { Github } from 'lucide-react';

export const GitHubPage = () => {
    return (
        <PageLayout header={<Navbar />} maxWidth="xl">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
                {/* Hero */}
                <div className="text-center space-y-5 pt-8">
                    <div className="page-badge">
                        <Github size={14} />
                        Proof Layer
                    </div>
                    <h1 className="page-hero-title">
                        GitHub <span className="text-brand-primary">Strategy.</span>
                    </h1>
                    <p className="text-lg text-text-muted max-w-3xl mx-auto font-medium">
                        Convert your repositories into concrete resume proof. Know exactly what to keep, what to hide, and what to improve.
                    </p>
                </div>

                <PageGuide
                    badge="GITHUB GUIDE"
                    title="Convert Repositories Into Resume Proof"
                    description="Use this page to decide which repos deserve resume space and how to talk about them in interviews."
                    whatThisPageDoes="Scores repository relevance for your target role, flags weak repos, and suggests resume-friendly evidence."
                    bestUseCase="Best when you have multiple projects but are unsure what to keep, what to hide, and what to improve."
                    howToUse={[
                        'Enter your GitHub username/URL and select the role you are applying for.',
                        'Focus on top recommended repositories and suggested resume bullets.',
                        'Fix red flags in weak repos: missing README, low clarity, unclear impact.',
                        'Use the interview questions section to prepare project deep-dive answers.'
                    ]}
                    makeMostOfIt={[
                        'Prioritize 2-4 strong repositories instead of listing everything.',
                        'Update READMEs with problem, architecture, setup, and outcomes.',
                        'Mirror important GitHub wins inside your resume Experience/Projects sections.'
                    ]}
                    primaryAction={{ label: 'Run Resume Analysis', to: '/analysis' }}
                    secondaryAction={{ label: 'Go to Resume Fix Lab', to: '/resume-fix-lab' }}
                />

                <WorkflowMap currentStep="github" title="Workflow With GitHub As Proof Layer" />

                <GitHubAnalyzer />
            </main>
        </PageLayout>
    );
};
