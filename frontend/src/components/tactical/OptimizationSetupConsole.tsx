import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Scan, CheckCircle2, Loader2, Clock3, Target, Zap, Sparkles, Search, RotateCcw } from 'lucide-react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { jdTemplates, getJDTemplateById } from '../../data/jdTemplates';

interface OptimizationSetupConsoleProps {
    onStartFix: (file: File) => void;
    isFixing: boolean;
    onJdChange: (jd: string) => void;
    onRoleChange: (role: string) => void;
    onCompanyChange: (company: string) => void;
    initialData: {
        targetRole: string;
        companyName: string;
        jobDescription: string;
    };
}

const REWRITE_STAGES = [
    { minProgress: 0, label: 'PARSE RESUME', hint: 'Reading structure and extracting ATS-visible text.' },
    { minProgress: 18, label: 'MATCH JD', hint: 'Mapping your content against job requirements.' },
    { minProgress: 38, label: 'ROAST DIAGNOSTIC', hint: 'Generating blunt strengths, gaps, and fixes.' },
    { minProgress: 62, label: 'REWRITE PASS', hint: 'Refactoring bullets for impact and truthfulness.' },
    { minProgress: 84, label: 'INTERVIEW PREP', hint: 'Building likely interview questions and prep plan.' },
    { minProgress: 94, label: 'FINAL ASSEMBLY', hint: 'Compiling the final report and resume-fix output.' },
] as const;

const LIVE_SIGNALS = [
    'PARSING_LAYOUT',
    'SCANNING_KEYWORDS',
    'CALIBRATING_TONE',
    'SCORING_BULLETS',
    'BUILDING_REPORT',
] as const;

export const OptimizationSetupConsole = ({
    onStartFix,
    isFixing,
    onJdChange,
    onRoleChange,
    onCompanyChange,
    initialData
}: OptimizationSetupConsoleProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activeStage, setActiveStage] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [signalCursor, setSignalCursor] = useState(0);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');

    const handleFileSelect = useCallback((file: File) => {
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a PDF or DOCX file');
            return;
        }
        setSelectedFile(file);
    }, []);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave' || e.type === 'drop') {
            setIsDragging(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        handleDrag(e);
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFileSelect(files[0]);
        }
    };

    // Simulation logic (mirrored from FullRewrite)
    useEffect(() => {
        if (!isFixing) {
            setProgress(0);
            setActiveStage(0);
            setElapsedSeconds(0);
            setSignalCursor(0);
            return;
        }

        setProgress(4);
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsedFloat = (Date.now() - startTime) / 1000;
            const elapsed = Math.floor(elapsedFloat);
            setElapsedSeconds(elapsed);

            // Smoothly increases toward 99.6 over time without freezing at a fixed value.
            const dynamicCap = Math.min(99.6, 90 + (9.7 * (1 - Math.exp(-elapsedFloat / 22))));

            setProgress((prev) => {
                const headroom = Math.max(dynamicCap - prev, 0);
                if (headroom <= 0.03) {
                    return Number(dynamicCap.toFixed(1));
                }

                let step = 0.4;
                if (prev < 22) step = 2.2 + Math.random() * 1.5;
                else if (prev < 48) step = 1.3 + Math.random() * 0.9;
                else if (prev < 76) step = 0.8 + Math.random() * 0.7;
                else if (prev < 92) step = 0.35 + Math.random() * 0.45;
                else step = 0.08 + Math.random() * 0.18;

                const next = Math.min(dynamicCap, prev + step);
                return Number(next.toFixed(1));
            });
        }, 260);

        const signalInterval = setInterval(() => {
            setSignalCursor((prev) => (prev + 1) % LIVE_SIGNALS.length);
        }, 1500);

        return () => {
            clearInterval(interval);
            clearInterval(signalInterval);
        };
    }, [isFixing]);

    useEffect(() => {
        let stageIndex = 0;
        for (let idx = 0; idx < REWRITE_STAGES.length; idx += 1) {
            if (progress >= REWRITE_STAGES[idx].minProgress) {
                stageIndex = idx;
            }
        }
        setActiveStage(stageIndex);
    }, [progress]);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes loaderShift { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
                @keyframes loaderBlink { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
            `}</style>

            <div className={`zen-card overflow-hidden transition-all duration-300 ${isDragging ? 'border-brand-primary scale-[1.01] shadow-xl' : 'border-border-subtle'}`}>
                {/* Upload Section */}
                <div
                    className={`relative p-10 text-center border-b border-dashed border-border-subtle transition-colors ${isFixing ? 'bg-bg-surface/30' : 'bg-white hover:bg-bg-surface/10'}`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        id="optimization-file-upload"
                        className="hidden"
                        accept=".pdf,.docx"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        disabled={isFixing}
                    />

                    <label htmlFor="optimization-file-upload" className={`cursor-pointer flex flex-col items-center gap-6 ${isFixing ? 'pointer-events-none' : ''}`}>
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all ${isFixing ? 'bg-brand-primary/10 text-brand-primary' : 'bg-bg-page border border-border-subtle group-hover:scale-110'}`}>
                            {isFixing ? (
                                <Loader2 className="animate-spin" size={36} />
                            ) : (
                                <Upload size={36} className={selectedFile ? 'text-brand-primary' : 'text-text-subtle'} />
                            )}
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-heading font-black text-brand-secondary uppercase tracking-tight">
                                {isFixing ? 'ALIGNMENT ENGINE ACTIVE' : selectedFile ? 'RESUME PREPARED' : 'Match & Fix Intelligence'}
                            </h3>
                            <p className="text-text-muted max-w-xl mx-auto font-medium">
                                {selectedFile
                                    ? `${selectedFile.name} ready for deep alignment analysis.`
                                    : 'Upload your resume to calibrate it against a specific job description.'}
                            </p>
                            {!selectedFile && !isFixing && (
                                <div className="flex flex-col items-center gap-2 mt-4">
                                    <span className="inline-block px-4 py-1.5 rounded-lg border border-border-subtle bg-bg-page text-[10px] font-black tracking-widest text-text-subtle">
                                        SUPPORTED: PDF, DOCX
                                    </span>
                                </div>
                            )}
                        </div>
                    </label>

                    {/* Analyzing View */}
                    <AnimatePresence>
                        {isFixing && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-10 space-y-8"
                            >
                                <div className="space-y-4 max-w-lg mx-auto">
                                    <div className="flex justify-between items-center text-[10px] font-black tracking-[0.2em] text-brand-primary">
                                        <div className="flex items-center gap-2">
                                            <Clock3 size={14} />
                                            ANALYZING {String(elapsedSeconds).padStart(2, '0')}s
                                        </div>
                                        <div className="animate-pulse">{LIVE_SIGNALS[signalCursor]}...</div>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden relative shadow-inner">
                                        <motion.div
                                            className="absolute top-0 left-0 h-full bg-brand-primary"
                                            animate={{ width: `${progress}%` }}
                                            style={{ boxShadow: '0 0 10px var(--brand-primary)' }}
                                        />
                                    </div>
                                    <div className="text-right text-xs font-black text-brand-secondary">{Math.round(progress)}% ALIGNED</div>
                                    {elapsedSeconds >= 20 && (
                                        <div className="text-[10px] text-amber-700 font-bold text-left">
                                            Deep matching in progress. Comparing skills, tone, and experience gaps...
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                                    {REWRITE_STAGES.map((stage, idx) => {
                                        const isComplete = idx < activeStage;
                                        const isActive = idx === activeStage;
                                        return (
                                            <div key={idx} className={`p-3 rounded-xl border text-left transition-all ${isComplete ? 'bg-emerald-50 border-emerald-100' : isActive ? 'bg-brand-primary/10 border-brand-primary/20' : 'bg-white border-border-subtle opacity-40'}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {isComplete ? <CheckCircle2 size={12} className="text-emerald-500" /> : <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-brand-primary animate-ping' : 'bg-slate-300'}`} />}
                                                    <span className={`text-[9px] font-black tracking-widest ${isComplete ? 'text-emerald-700' : isActive ? 'text-brand-primary' : 'text-slate-500'}`}>{stage.label}</span>
                                                </div>
                                                {isActive && <div className="text-[8px] text-text-muted leading-tight font-medium">{stage.hint}</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Configuration Panel */}
                <div className="p-10 space-y-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-brand-primary/10 text-brand-primary">
                            <Target size={20} />
                        </div>
                        <h3 className="text-sm font-black text-brand-secondary tracking-[0.2em] uppercase">Target Alignment Config</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-text-subtle uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Search size={14} className="text-brand-primary" />
                                    Target Role
                                </label>
                                <select
                                    value={initialData.targetRole}
                                    onChange={(e) => onRoleChange(e.target.value)}
                                    className="soft-input font-bold text-sm h-12"
                                    disabled={isFixing}
                                >
                                    <option value="software-engineer">Software Engineer</option>
                                    <option value="frontend-developer">Frontend Developer</option>
                                    <option value="backend-developer">Backend Developer</option>
                                    <option value="full-stack-developer">Full Stack Developer</option>
                                    <option value="data-scientist">Data Scientist</option>
                                    <option value="product-manager">Product Manager</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-text-subtle uppercase tracking-[0.2em] flex items-center gap-2">
                                    <MaterialIcon icon="business" size={14} className="text-brand-primary" />
                                    Company (Optional)
                                </label>
                                <input
                                    value={initialData.companyName}
                                    onChange={(e) => onCompanyChange(e.target.value)}
                                    placeholder="e.g., Stripe, Google"
                                    className="soft-input text-sm h-12"
                                    disabled={isFixing}
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                        <MaterialIcon icon="description" size={14} />
                                        Job Description (COMPULSORY) *
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedTemplateId}
                                            onChange={(e) => {
                                                const id = e.target.value;
                                                setSelectedTemplateId(id);
                                                const template = getJDTemplateById(id);
                                                if (template) {
                                                    onJdChange(template.jd);
                                                    onCompanyChange(template.company);
                                                }
                                            }}
                                            className="text-[10px] font-bold border-none bg-bg-surface px-3 py-1 rounded-full outline-none"
                                            disabled={isFixing}
                                        >
                                            <option value="">JD Template...</option>
                                            {jdTemplates.map(t => <option key={t.id} value={t.id}>{t.company}</option>)}
                                        </select>
                                        <button
                                            onClick={() => {
                                                setSelectedTemplateId('');
                                                onJdChange('');
                                            }}
                                            className="p-1 text-text-subtle hover:text-brand-primary transition-colors"
                                            disabled={isFixing}
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    value={initialData.jobDescription}
                                    onChange={(e) => onJdChange(e.target.value)}
                                    placeholder="Paste target JD here for match-up..."
                                    className="soft-input min-h-[160px] text-sm leading-relaxed p-5"
                                    disabled={isFixing}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-border-subtle/50">
                        <div className="p-6 bg-brand-secondary rounded-2xl text-white space-y-4 shadow-lg shadow-brand-secondary/20">
                            <div className="flex items-center gap-3">
                                <Sparkles className="text-brand-primary" size={24} />
                                <div>
                                    <div className="text-[9px] font-black tracking-widest uppercase text-slate-400">Alignment Protocol Ready</div>
                                    <div className="text-sm font-black italic">READY_FOR_MATCH_UP</div>
                                </div>
                            </div>
                            <button
                                onClick={() => selectedFile && onStartFix(selectedFile)}
                                disabled={!selectedFile || !initialData.jobDescription.trim() || isFixing}
                                className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black tracking-widest uppercase transition-all ${(!selectedFile || !initialData.jobDescription.trim()) ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-brand-primary text-white hover:scale-[1.02] active:scale-95 shadow-lg shadow-brand-primary/20'}`}
                            >
                                <Scan size={20} />
                                {isFixing ? 'Analyzing...' : 'Initiate Match & Fix'}
                            </button>
                            {(!selectedFile || !initialData.jobDescription.trim()) && (
                                <div className="text-[10px] text-center text-slate-400 font-medium">
                                    Please upload a resume and job description to unlock fix protocol.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
