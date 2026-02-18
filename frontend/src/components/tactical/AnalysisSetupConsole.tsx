import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Scan, CheckCircle2, Loader2, Clock3, Target, Zap, Sparkles, Search, RotateCcw } from 'lucide-react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { getJDTemplatesByRole, getJDTemplateById } from '../../data/jdTemplates';

interface AnalysisSetupConsoleProps {
    onStartAnalysis: (file: File) => void;
    isAnalyzing: boolean;
    onRoleChange: (role: string) => void;
    onToneChange: (tone: 'brutal' | 'professional') => void;
    onGithubChange: (username: string) => void;
    onLinkedinChange: (text: string) => void;
    onJdChange?: (jd: string) => void;
    onModeChange?: (mode: 'jd_or_general' | 'jd_only' | 'general_only') => void;
    onCompanyChange?: (company: string) => void;
    variant?: 'analysis' | 'full';
    initialData: {
        targetRole: string;
        analysisMode?: 'jd_or_general' | 'jd_only' | 'general_only';
        feedbackTone: 'brutal' | 'professional';
        companyName?: string;
        jobDescription?: string;
        githubUsername?: string;
        linkedinText?: string;
    };
}

const ANALYSIS_STAGES = [
    { minProgress: 0, label: 'FILE LOCKED', hint: 'Securing uploaded document and validating format.' },
    { minProgress: 14, label: 'LAYOUT PARSE', hint: 'Parsing sections, dates, and structure blocks.' },
    { minProgress: 32, label: 'ENTITY SCAN', hint: 'Extracting skills, titles, and contact entities.' },
    { minProgress: 54, label: 'PROFILE SIGNALS', hint: 'Detecting GitHub and LinkedIn proof signals.' },
    { minProgress: 76, label: 'ROAST ENGINE', hint: 'Generating practical feedback and red flags.' },
    { minProgress: 91, label: 'CERT GUIDANCE', hint: 'Finalizing cert suggestions and next actions.' },
] as const;

const LIVE_SIGNALS = [
    'INDEXING_BULLETS',
    'DETECTING_SKILL_DENSITY',
    'SCORING_ATS_RISK',
    'CHECKING_PROFILE_PROOF',
    'SYNTHESIZING_ROAST',
] as const;

export const AnalysisSetupConsole = ({
    onStartAnalysis,
    isAnalyzing,
    onRoleChange,
    onToneChange,
    onGithubChange,
    onLinkedinChange,
    onJdChange,
    onModeChange,
    onCompanyChange,
    variant = 'analysis',
    initialData
}: AnalysisSetupConsoleProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activeStage, setActiveStage] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [signalCursor, setSignalCursor] = useState(0);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const isAnalysisOnly = variant === 'analysis';

    // Derive filtered templates from current target role
    const roleTemplates = getJDTemplatesByRole(initialData.targetRole);

    // When target role changes, auto-swap the JD template if one was already selected
    useEffect(() => {
        if (!selectedTemplateId) return;
        const current = getJDTemplateById(selectedTemplateId);
        if (!current) return;
        // Find the matching template for the same company in the new role
        const replacement = roleTemplates.find((t) => t.company === current.company);
        if (replacement && replacement.id !== selectedTemplateId) {
            setSelectedTemplateId(replacement.id);
            onJdChange?.(replacement.jd);
            onCompanyChange?.(replacement.company);
        } else if (!replacement) {
            // Company has no template for this role — clear the selection
            setSelectedTemplateId('');
            onJdChange?.('');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData.targetRole]);

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

    // Simulation logic (mirrored from UploadConsole)
    useEffect(() => {
        if (isAnalyzing) {
            setProgress(3);
            const startTime = Date.now();
            const interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                setElapsedSeconds(elapsed);
                setProgress(prev => {
                    if (prev >= 96) return 96;
                    let step = 0.5;
                    if (prev < 20) step = 2.6 + Math.random() * 1.9;
                    else if (prev < 46) step = 1.7 + Math.random() * 1.4;
                    else if (prev < 72) step = 1.0 + Math.random() * 1.0;
                    else if (prev < 88) step = 0.5 + Math.random() * 0.7;
                    else step = 0.18 + Math.random() * 0.35;
                    return Math.min(96, Number((prev + step).toFixed(1)));
                });
            }, 260);

            const signalInterval = setInterval(() => {
                setSignalCursor(prev => (prev + 1) % LIVE_SIGNALS.length);
            }, 1500);

            return () => {
                clearInterval(interval);
                clearInterval(signalInterval);
            };
        }
    }, [isAnalyzing]);

    useEffect(() => {
        let stageIndex = 0;
        for (let idx = 0; idx < ANALYSIS_STAGES.length; idx += 1) {
            if (progress >= ANALYSIS_STAGES[idx].minProgress) {
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
                    className={`relative p-10 text-center border-b border-dashed border-border-subtle transition-colors ${isAnalyzing ? 'bg-bg-surface/30' : 'bg-white hover:bg-bg-surface/10'}`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        id="setup-file-upload"
                        className="hidden"
                        accept=".pdf,.docx"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        disabled={isAnalyzing}
                    />

                    <label htmlFor="setup-file-upload" className={`cursor-pointer flex flex-col items-center gap-6 ${isAnalyzing ? 'pointer-events-none' : ''}`}>
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all ${isAnalyzing ? 'bg-brand-primary/10 text-brand-primary' : 'bg-bg-page border border-border-subtle group-hover:scale-110'}`}>
                            {isAnalyzing ? (
                                <Loader2 className="animate-spin" size={36} />
                            ) : (
                                <Upload size={36} className={selectedFile ? 'text-brand-primary' : 'text-text-subtle'} />
                            )}
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-heading font-black text-brand-secondary">
                                {isAnalyzing ? 'SCANNING PROTOCOL ACTIVE' : selectedFile ? 'FILE PREPARED' : (isAnalysisOnly ? 'INITIATE ROAST' : 'INITIATE ANALYSIS')}
                            </h3>
                            <p className="text-text-muted max-w-md mx-auto font-medium">
                                {selectedFile
                                    ? `${selectedFile.name} ready for deep scan.`
                                    : (isAnalysisOnly
                                        ? 'Drop your resume to run a roast + profile signal check.'
                                        : 'Drag and drop your resume to begin the deep scan protocol.')}
                            </p>
                            {!selectedFile && !isAnalyzing && (
                                <span className="inline-block mt-4 px-4 py-1.5 rounded-lg border border-border-subtle bg-bg-page text-[10px] font-black tracking-widest text-text-subtle">
                                    SUPPORTED: PDF, DOCX
                                </span>
                            )}
                        </div>
                    </label>

                    {/* Analyzing View */}
                    <AnimatePresence>
                        {isAnalyzing && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-10 space-y-8"
                            >
                                <div className="space-y-4 max-w-lg mx-auto">
                                    <div className="flex justify-between items-center text-[10px] font-black tracking-[0.2em] text-brand-primary">
                                        <div className="flex items-center gap-2">
                                            <Clock3 size={14} />
                                            ELAPSED {String(elapsedSeconds).padStart(2, '0')}s
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
                                    <div className="text-right text-xs font-black text-brand-secondary">{Math.round(progress)}% COMPLETE</div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                                    {ANALYSIS_STAGES.map((stage, idx) => {
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
                            <Zap size={20} />
                        </div>
                        <h3 className="text-sm font-black text-brand-secondary tracking-[0.2em] uppercase">
                            {isAnalysisOnly ? 'Roast Signal Inputs' : 'Advanced Resume Intel'}
                        </h3>
                    </div>

                    <div className={`grid grid-cols-1 gap-8 ${isAnalysisOnly ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-text-subtle uppercase tracking-[0.2em] flex items-center gap-2">
                                <Target size={14} className="text-brand-primary" />
                                Target Role
                            </label>
                            <select
                                value={initialData.targetRole}
                                onChange={(e) => onRoleChange(e.target.value)}
                                className="soft-input font-bold text-sm h-12"
                                disabled={isAnalyzing}
                            >
                                <option value="software-engineer">Software Engineer</option>
                                <option value="frontend-developer">Frontend Developer</option>
                                <option value="backend-developer">Backend Developer</option>
                                <option value="full-stack-developer">Full Stack Developer</option>
                                <option value="data-scientist">Data Scientist</option>
                                <option value="product-manager">Product Manager</option>
                            </select>
                        </div>

                        {!isAnalysisOnly && (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-text-subtle uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Search size={14} className="text-brand-primary" />
                                    Analysis Mode
                                </label>
                                <select
                                    value={initialData.analysisMode}
                                    onChange={(e) => onModeChange?.(e.target.value as any)}
                                    className="soft-input font-bold text-sm h-12"
                                    disabled={isAnalyzing}
                                >
                                    <option value="jd_or_general">JD + General</option>
                                    <option value="jd_only">JD only</option>
                                    <option value="general_only">General only</option>
                                </select>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-text-subtle uppercase tracking-[0.2em] flex items-center gap-2">
                                <Search size={14} className="text-brand-primary" />
                                Roast Level
                            </label>
                            <select
                                value={initialData.feedbackTone}
                                onChange={(e) => onToneChange(e.target.value as any)}
                                className="soft-input font-bold text-sm h-12"
                                disabled={isAnalyzing}
                            >
                                <option value="brutal">Brutal Roast</option>
                                <option value="professional">Professional</option>
                            </select>
                        </div>
                    </div>

                    <div className={`pt-8 border-t border-border-subtle/50 grid grid-cols-1 gap-8 ${isAnalysisOnly ? '' : 'md:grid-cols-2'}`}>
                        {!isAnalysisOnly && (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-text-subtle uppercase tracking-[0.2em]">Company Signal</label>
                                    <input
                                        value={initialData.companyName || ''}
                                        onChange={(e) => onCompanyChange?.(e.target.value)}
                                        placeholder="e.g., Stripe, Google"
                                        className="soft-input text-sm h-12"
                                        disabled={isAnalyzing}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-text-subtle uppercase tracking-[0.2em]">Job Description Intel</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={selectedTemplateId}
                                                onChange={(e) => {
                                                    const id = e.target.value;
                                                    setSelectedTemplateId(id);
                                                    const template = getJDTemplateById(id);
                                                    if (template) {
                                                        onJdChange?.(template.jd);
                                                        onCompanyChange?.(template.company);
                                                    } else {
                                                        onJdChange?.('');
                                                    }
                                                }}
                                                className="text-[10px] font-bold border-none bg-bg-surface px-3 py-1 rounded-full outline-none"
                                                disabled={isAnalyzing}
                                            >
                                                <option value="">Choose Template...</option>
                                                {roleTemplates.map(t => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.company} — {t.title}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => {
                                                    setSelectedTemplateId('');
                                                    onJdChange?.('');
                                                }}
                                                className="p-1 text-text-subtle hover:text-brand-primary transition-colors"
                                                disabled={isAnalyzing}
                                            >
                                                <RotateCcw size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        value={initialData.jobDescription || ''}
                                        onChange={(e) => onJdChange?.(e.target.value)}
                                        placeholder="Paste target JD here for match-up..."
                                        className="soft-input min-h-[160px] text-sm leading-relaxed p-5"
                                        disabled={isAnalyzing}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            {isAnalysisOnly && (
                                <div className="p-4 rounded-2xl border border-brand-primary/20 bg-brand-primary/5 text-sm text-text-muted leading-relaxed">
                                    <span className="font-black text-brand-secondary uppercase tracking-widest text-[10px] block mb-1">No JD Needed</span>
                                    Analyze mode intentionally skips JD input. It focuses on roast feedback, GitHub/LinkedIn proof, and certification guidance.
                                </div>
                            )}
                            <div className="p-6 rounded-2xl bg-bg-surface/50 border border-border-subtle space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-text-subtle uppercase tracking-[0.2em] flex items-center gap-2">
                                        <MaterialIcon icon="code" size={16} className="text-brand-primary" />
                                        GitHub Proof
                                    </label>
                                    <input
                                        value={initialData.githubUsername || ''}
                                        onChange={(e) => onGithubChange(e.target.value)}
                                        placeholder="Username or Repo URL"
                                        className="soft-input text-sm h-11"
                                        disabled={isAnalyzing}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-text-subtle uppercase tracking-[0.2em] flex items-center gap-2">
                                        <MaterialIcon icon="badge" size={16} className="text-brand-primary" />
                                        LinkedIn Depth
                                    </label>
                                    <input
                                        value={initialData.linkedinText || ''}
                                        onChange={(e) => onLinkedinChange(e.target.value)}
                                        placeholder="Paste Profile Overview..."
                                        className="soft-input text-sm h-11"
                                        disabled={isAnalyzing}
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-brand-secondary rounded-2xl text-white space-y-4 shadow-lg shadow-brand-secondary/20">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="text-brand-primary" size={24} />
                                    <div>
                                        <div className="text-[9px] font-black tracking-widest uppercase text-slate-400">{isAnalysisOnly ? 'Ready to Roast?' : 'Ready to Scan?'}</div>
                                        <div className="text-sm font-black italic">{isAnalysisOnly ? 'ROAST_MODE_READY' : 'PROTOCOL_LOADED'}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => selectedFile && onStartAnalysis(selectedFile)}
                                    disabled={!selectedFile || isAnalyzing}
                                    className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black tracking-widest uppercase transition-all ${!selectedFile ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-brand-primary text-white hover:scale-[1.02] active:scale-95 shadow-lg shadow-brand-primary/20'}`}
                                >
                                    <Scan size={20} />
                                    {isAnalyzing ? 'Analyzing...' : (isAnalysisOnly ? 'Run Roast Diagnostic' : 'Initiate Deep Scan')}
                                </button>
                                {!selectedFile && <div className="text-[10px] text-center text-slate-400 font-medium">{isAnalysisOnly ? 'Upload a resume to run roast diagnostics.' : 'Please upload a resume to unlock scan protocol.'}</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
