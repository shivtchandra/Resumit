import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';
import { AnalysisSetupConsole } from '../components/tactical/AnalysisSetupConsole';
import { analyzeResume } from '../services/api';
import type { AnalysisResult } from '../types';
import { PageGuide } from '../components/layout/PageGuide';

const StatusPulse = ({ status, color = 'emerald' }: { status: string; color?: 'emerald' | 'amber' | 'rose' }) => {
    const colorClasses = {
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        rose: 'bg-rose-500'
    };

    return (
        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-border-subtle rounded-full shadow-sm w-fit mx-auto">
            <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorClasses[color]} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${colorClasses[color]}`}></span>
            </span>
            <span className="text-[10px] font-black tracking-widest text-brand-secondary uppercase">{status.replace(/_/g, ' ')}</span>
        </div>
    );
};

export const SimulatorEntry = () => {
    const navigate = useNavigate();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);

    // Context states
    const [role, setRole] = useState('software-engineer');
    const [jd, setJd] = useState('');
    const [company, setCompany] = useState('');
    const [mode, setMode] = useState<'jd_or_general' | 'jd_only' | 'general_only'>('jd_or_general');
    const [tone, setTone] = useState<'brutal' | 'professional'>('brutal');
    const [github, setGithub] = useState('');
    const [linkedin, setLinkedin] = useState('');

    const handleStartAnalysis = async (file: File) => {
        setIsAnalyzing(true);
        try {
            const data = await analyzeResume(file, jd, {
                targetRole: role,
                companyName: company,
                feedbackTone: tone,
                analysisMode: mode,
                githubUsername: github,
                linkedinText: linkedin
            });
            setResult(data);
        } catch (error) {
            console.error('Analysis failed:', error);
            alert('Simulation failed. Please check inputs and retry.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <PageLayout header={<Navbar />} maxWidth="xl">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
                {/* Hero Area */}
                <div className="text-center space-y-6 pt-10">
                    <StatusPulse status="SYSTEMS_READY" color="emerald" />
                    <h1 className="text-6xl md:text-8xl font-black text-brand-secondary leading-[0.9] tracking-tighter">
                        Resume <span className="text-brand-primary">Simulator.</span>
                    </h1>
                    <p className="text-xl text-text-muted max-w-2xl mx-auto font-medium">
                        Run your resume through our advanced ATS simulation engine. Find the gaps before the recruiters do.
                    </p>
                </div>

                <PageGuide
                    badge="SIMULATOR GUIDE"
                    title="Simulation Protocol"
                    description="Run a full ATS simulation before you apply, then move to execution pages."
                    whatThisPageDoes="Performs a complete diagnostic simulation using resume, role, and job context."
                    bestUseCase="Best for pre-application checks when you want to catch blockers early."
                    howToUse={[
                        'Upload your latest resume in PDF or DOCX.',
                        'Add target JD and company context for accurate role matching.',
                        'Run simulation and review the report before rewriting.'
                    ]}
                    makeMostOfIt={[
                        'Always include a real JD for role-fit diagnostics.',
                        'Use the findings to prioritize fixes, not random edits.',
                        'Move to Resume Fix Lab after this for concrete rewrites.'
                    ]}
                    primaryAction={{ label: 'Open Analysis', to: '/analysis' }}
                    secondaryAction={{ label: 'Open Fix Lab', to: '/resume-fix-lab' }}
                />

                {!result ? (
                    <AnalysisSetupConsole
                        onStartAnalysis={handleStartAnalysis}
                        isAnalyzing={isAnalyzing}
                        variant="full"
                        onJdChange={setJd}
                        onRoleChange={setRole}
                        onModeChange={setMode}
                        onToneChange={setTone}
                        onCompanyChange={setCompany}
                        onGithubChange={setGithub}
                        onLinkedinChange={setLinkedin}
                        initialData={{
                            targetRole: role,
                            analysisMode: mode,
                            feedbackTone: tone,
                            companyName: company,
                            jobDescription: jd,
                            githubUsername: github,
                            linkedinText: linkedin
                        }}
                    />
                ) : (
                    <div className="zen-card p-12 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', damping: 12 }}
                            >
                                <StatusPulse status="SCAN_COMPLETE" color="emerald" />
                            </motion.div>
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black text-brand-secondary">Simulation Complete.</h2>
                            <p className="text-text-muted max-w-lg mx-auto">
                                The ATS emulator has finished processing your document. Reports are ready for review.
                            </p>
                        </div>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setResult(null)}
                                className="btn-secondary px-8 py-3"
                            >
                                Run New Simulation
                            </button>
                            <button
                                onClick={() => navigate('/analysis', { state: { result } })}
                                className="btn-primary px-8 py-3"
                            >
                                View Detailed Intel
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </PageLayout>
    );
};
