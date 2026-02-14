import { useState } from 'react';
import { UploadConsole } from '../components/tactical/UploadConsole';
import { analyzeResume } from '../services/api';
import type { AnalysisResult } from '../types';
import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';
import { FloatingResume } from '../components/visuals/FloatingResume';
import { RoboticBadge, TechIcon, MetricGauge } from '../components/ui/RoboticUI';
import { Briefcase, Zap, Shield, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface MissionControlProps {
    onAnalysisComplete: (result: AnalysisResult) => void;
}

export const MissionControl = ({ onAnalysisComplete }: MissionControlProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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
            <div className="relative min-h-[calc(100vh-4rem)] flex flex-col bg-bg-page overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-primary/5 to-transparent pointer-events-none" />

                {/* Hero Section */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 p-8 lg:p-16 items-center relative z-10">
                    {/* Left: Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-10 max-w-2xl"
                    >
                        <div className="space-y-6">
                            <RoboticBadge variant="primary" className="mb-2">System Status: Operational</RoboticBadge>
                            <h1 className="text-5xl lg:text-7xl font-extrabold text-brand-secondary leading-[1.05] tracking-tight">
                                Outsmart the <br />
                                <span className="text-brand-primary">Algorithm.</span>
                            </h1>
                            <p className="text-xl text-text-muted max-w-xl leading-relaxed">
                                Advanced resume analysis powered by AI. Optimize your CV for major ATS platforms like Taleo, Workday, and Greenhouse.
                            </p>
                        </div>

                        <div className="glass-card p-1 border-brand-primary/10 shadow-lg">
                            <UploadConsole onFileSelect={setFile} isAnalyzing={isAnalyzing} />
                        </div>

                        {file && !isAnalyzing && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-4"
                            >
                                <button
                                    onClick={handleAnalyze}
                                    className="btn-primary flex-1 py-4 text-lg shadow-glow-cyan"
                                >
                                    <Zap size={20} className="mr-2" />
                                    Launch Analysis
                                </button>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Right: Floating Resume */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="hidden lg:flex justify-center items-center h-full min-h-[500px]"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-brand-primary/10 blur-3xl rounded-full" />
                            <FloatingResume />
                        </div>
                    </motion.div>
                </div>

                {/* Metrics Strip */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/50 backdrop-blur-sm border-t border-border-subtle p-8 py-12"
                >
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="group glass-card p-6 border-white bg-white/40 hover:bg-white/60 transition-all flex items-center gap-6">
                            <MetricGauge value={92} label="Target Score" />
                            <div>
                                <h3 className="font-extrabold text-brand-secondary text-lg mb-1 group-hover:text-brand-primary transition-colors">Success Threshold</h3>
                                <p className="text-sm text-text-muted leading-snug">The benchmark score required to pass typical automated screening filters.</p>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="group glass-card p-6 border-white bg-white/40 hover:bg-white/60 transition-all flex items-center gap-6">
                            <div className="w-14 h-14 rounded-inner bg-brand-primary/10 text-brand-primary flex items-center justify-center transition-transform group-hover:scale-110">
                                <Briefcase size={28} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-brand-secondary text-lg mb-1 group-hover:text-brand-primary transition-colors">Semantic Match</h3>
                                <p className="text-sm text-text-muted leading-snug">AI-driven mapping of your skills against real-world job requirements.</p>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="group glass-card p-6 border-white bg-white/40 hover:bg-white/60 transition-all flex items-center gap-6">
                            <div className="flex -space-x-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-600 shadow-sm">T</div>
                                <div className="w-10 h-10 rounded-full bg-teal-100 border-2 border-white flex items-center justify-center text-xs font-bold text-teal-600 shadow-sm">W</div>
                                <div className="w-10 h-10 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-xs font-bold text-purple-600 shadow-sm">G</div>
                            </div>
                            <div>
                                <h3 className="font-extrabold text-brand-secondary text-lg mb-1 group-hover:text-brand-primary transition-colors">Universal Sync</h3>
                                <p className="text-sm text-text-muted leading-snug">Verified compatibility across Taleo, Workday, and Greenhouse systems.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </PageLayout>
    );
};
