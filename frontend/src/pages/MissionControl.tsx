import { useState } from 'react';
import { UploadConsole } from '../components/tactical/UploadConsole';
import { analyzeResume } from '../services/api';
import type { AnalysisResult } from '../types';
import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';
import { FloatingResume } from '../components/visuals/FloatingResume';
import { RoboticBadge, TechIcon, MetricGauge } from '../components/ui/RoboticUI';
import { Briefcase } from 'lucide-react';

interface MissionControlProps {
    onAnalysisComplete: (result: AnalysisResult) => void;
}

export const MissionControl = ({ onAnalysisComplete }: MissionControlProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    // Job Description state removed for V2 initial design - can be re-added if needed

    const handleAnalyze = async () => {
        if (!file) return;

        setIsAnalyzing(true);
        try {
            const data = await analyzeResume(file);
            onAnalysisComplete(data);
        } catch (error) {
            console.error('Analysis failed:', error);
            alert('Analysis failed. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <PageLayout header={<Navbar />} maxWidth="full">
            <div className="relative min-h-[calc(100vh-4rem)] flex flex-col">
                {/* Hero Section */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 p-8 lg:p-16 items-center">
                    {/* Left: Content */}
                    <div className="space-y-8 max-w-2xl">
                        <div className="space-y-4">
                            <RoboticBadge variant="primary">ATS Emulator V2</RoboticBadge>
                            <h1 className="text-5xl lg:text-6xl font-bold text-[var(--text-main)] leading-tight font-[family-name:var(--font-heading)]">
                                Outsmart the Algorithm. <br />
                                <span className="text-[var(--accent-primary)]">Land the Interview.</span>
                            </h1>
                            <p className="text-xl text-[var(--text-muted)] max-w-lg">
                                Advanced resume analysis powered by AI. Optimize your CV for Taleo, Workday, and Greenhouse.
                            </p>
                        </div>

                        <div className="bg-[var(--bg-surface)] p-1 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-[var(--shadow-soft)]">
                            <UploadConsole onFileSelect={setFile} isAnalyzing={isAnalyzing} />
                        </div>

                        {file && !isAnalyzing && (
                            <div className="flex gap-4">
                                <button
                                    onClick={handleAnalyze}
                                    className="flex-1 bg-[var(--accent-primary)] text-white font-bold py-4 px-8 rounded-[var(--radius-md)] hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                                >
                                    Run Analysis
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: Floating Resume */}
                    <div className="hidden lg:flex justify-center items-center h-full min-h-[500px]">
                        <FloatingResume />
                    </div>
                </div>

                {/* Metrics Strip */}
                <div className="bg-[var(--bg-subtle)] border-t border-[var(--border-subtle)] p-8">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="bg-[var(--bg-surface)] p-6 rounded-[var(--radius-md)] border border-[var(--border-subtle)] shadow-sm flex items-center gap-6">
                            <MetricGauge value={92} label="ATS Score" />
                            <div>
                                <h3 className="font-bold text-[var(--text-main)] mb-1">Pass Rate</h3>
                                <p className="text-sm text-[var(--text-muted)]">Average success rate for optimized resumes.</p>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-[var(--bg-surface)] p-6 rounded-[var(--radius-md)] border border-[var(--border-subtle)] shadow-sm flex items-center gap-6">
                            <TechIcon icon={Briefcase} size="md" active />
                            <div>
                                <h3 className="font-bold text-[var(--text-main)] mb-1">Job Matching</h3>
                                <p className="text-sm text-[var(--text-muted)]">Semantic analysis against job descriptions.</p>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-[var(--bg-surface)] p-6 rounded-[var(--radius-md)] border border-[var(--border-subtle)] shadow-sm flex items-center gap-6">
                            <div className="flex -space-x-2">
                                <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-600">T</div>
                                <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-xs font-bold text-green-600">W</div>
                                <div className="w-10 h-10 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-xs font-bold text-purple-600">G</div>
                            </div>
                            <div>
                                <h3 className="font-bold text-[var(--text-main)] mb-1">Multi-Vendor</h3>
                                <p className="text-sm text-[var(--text-muted)]">Compatible with major ATS platforms.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};
