import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Scan, CheckCircle2, Loader2, Clock3, Target, Sparkles, Search, RotateCcw, Link2, Circle } from 'lucide-react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { getJDTemplatesByRole, getJDTemplateById } from '../../data/jdTemplates';

function isSingleHttpUrl(value: string): boolean {
    try {
        const u = new URL(value.trim());
        return (u.protocol === 'http:' || u.protocol === 'https:') && Boolean(u.host);
    } catch {
        return false;
    }
}

interface OptimizationSetupConsoleProps {
    onStartFix: (file: File) => void;
    isFixing: boolean;
    onJdChange: (jd: string) => void;
    onJdInputModeChange?: (mode: 'paste' | 'url') => void;
    onRoleChange: (role: string) => void;
    onCompanyChange: (company: string) => void;
    initialData: {
        targetRole: string;
        companyName: string;
        jobDescription: string;
        jdInputMode?: 'paste' | 'url';
    };
}

const MATCH_FIX_STAGES = [
    { minProgress: 0, label: 'READ INPUTS', hint: 'Sending resume + JD to the alignment engine.' },
    { minProgress: 14, label: 'EXTRACT JD', hint: 'Pulling must-haves, tools, and seniority signals from the posting.' },
    { minProgress: 32, label: 'READ RESUME', hint: 'Grounding bullets, skills, and proof in your actual text.' },
    { minProgress: 52, label: 'MATCH & GAP', hint: 'Cross-checking requirements vs evidence line by line.' },
    { minProgress: 72, label: 'BUILD REPORT', hint: 'Structuring fixes, projects, certs, and interview prep.' },
    { minProgress: 90, label: 'FINALIZE', hint: 'Scoring ATS / JD fit and assembling the response.' },
] as const;

const LIVE_SIGNALS = [
    'ROUTING_MODEL',
    'TOKENIZING_JD',
    'CROSSWALKING_SKILLS',
    'DRAFTING_FIXES',
    'PACKAGING_REPORT',
] as const;

function formatElapsedClock(totalSeconds: number): string {
    const s = Math.max(0, Math.floor(totalSeconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export const OptimizationSetupConsole = ({
    onStartFix,
    isFixing,
    onJdChange,
    onJdInputModeChange,
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

    // Filtered templates matching the currently selected role
    const roleTemplates = getJDTemplatesByRole(initialData.targetRole);

    // Auto-swap JD when role changes and a template is already selected
    useEffect(() => {
        if (!selectedTemplateId) return;
        const current = getJDTemplateById(selectedTemplateId);
        if (!current) return;
        const replacement = roleTemplates.find((t) => t.company === current.company);
        if (replacement && replacement.id !== selectedTemplateId) {
            setSelectedTemplateId(replacement.id);
            onJdInputModeChange?.('paste');
            onJdChange(replacement.jd);
            onCompanyChange(replacement.company);
        } else if (!replacement) {
            setSelectedTemplateId('');
            onJdChange('');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData.targetRole]);

    const jdInputMode = initialData.jdInputMode === 'url' ? 'url' : 'paste';
    const jdReady =
        jdInputMode === 'paste'
            ? initialData.jobDescription.trim().length > 0
            : isSingleHttpUrl(initialData.jobDescription);

    const canRunMatchFix = Boolean(selectedFile && jdReady && !isFixing);

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

    // Estimated progress + wall-clock while Match & Fix request is in flight (bar is illustrative, not real JD %).
    useEffect(() => {
        if (!isFixing) {
            setProgress(0);
            setActiveStage(0);
            setElapsedSeconds(0);
            setSignalCursor(0);
            return;
        }

        setProgress(3);
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsedFloat = (Date.now() - startTime) / 1000;
            const elapsed = Math.floor(elapsedFloat);
            setElapsedSeconds(elapsed);

            // Synthetic bar tuned for long OpenAI runs (~60–120s): eases toward 99% without sitting at 100% early.
            const dynamicCap = Math.min(
                99.2,
                88 + 10.5 * (1 - Math.exp(-elapsedFloat / 42)) + 2.2 * (1 - Math.exp(-elapsedFloat / 95))
            );

            setProgress((prev) => {
                const headroom = Math.max(dynamicCap - prev, 0);
                if (headroom <= 0.03) {
                    return Number(dynamicCap.toFixed(1));
                }

                let step = 0.35;
                if (prev < 18) step = 1.8 + Math.random() * 1.2;
                else if (prev < 40) step = 1.1 + Math.random() * 0.75;
                else if (prev < 62) step = 0.75 + Math.random() * 0.55;
                else if (prev < 82) step = 0.4 + Math.random() * 0.4;
                else if (prev < 94) step = 0.2 + Math.random() * 0.25;
                else step = 0.06 + Math.random() * 0.12;

                const next = Math.min(dynamicCap, prev + step);
                return Number(next.toFixed(1));
            });
        }, 200);

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
        for (let idx = 0; idx < MATCH_FIX_STAGES.length; idx += 1) {
            if (progress >= MATCH_FIX_STAGES[idx].minProgress) {
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
                                        <div className="flex items-center gap-2 tabular-nums">
                                            <Clock3 size={14} />
                                            <span>ELAPSED {formatElapsedClock(elapsedSeconds)}</span>
                                        </div>
                                        <div className="animate-pulse truncate max-w-[10rem] sm:max-w-none text-right">
                                            {LIVE_SIGNALS[signalCursor]}…
                                        </div>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden relative shadow-inner">
                                        <motion.div
                                            className="absolute top-0 left-0 h-full bg-brand-primary"
                                            animate={{ width: `${progress}%` }}
                                            style={{ boxShadow: '0 0 10px var(--brand-primary)' }}
                                        />
                                    </div>
                                    <div className="text-right text-xs font-black text-brand-secondary tabular-nums">
                                        {Math.round(progress)}% EST. PROGRESS
                                    </div>
                                    {elapsedSeconds >= 45 && elapsedSeconds < 75 && (
                                        <div className="text-[10px] text-amber-800/90 font-bold text-left">
                                            Still working — large reports can take around a minute. Timer keeps counting.
                                        </div>
                                    )}
                                    {elapsedSeconds >= 75 && (
                                        <div className="text-[10px] text-amber-900 font-bold text-left">
                                            Almost there. If this exceeds a few minutes, check your connection or try again.
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                                    {MATCH_FIX_STAGES.map((stage, idx) => {
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
                                <div className="flex justify-between items-center gap-2 flex-wrap">
                                    <label className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                        <MaterialIcon icon="description" size={14} />
                                        Job Description (COMPULSORY) *
                                    </label>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex rounded-full border border-border-subtle overflow-hidden text-[10px] font-black uppercase">
                                            <button
                                                type="button"
                                                onClick={() => onJdInputModeChange?.('paste')}
                                                disabled={isFixing}
                                                className={`px-3 py-1.5 transition-colors ${jdInputMode === 'paste' ? 'bg-brand-primary text-white' : 'bg-bg-surface text-text-muted hover:text-brand-secondary'}`}
                                            >
                                                Paste text
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onJdInputModeChange?.('url')}
                                                disabled={isFixing}
                                                className={`px-3 py-1.5 transition-colors flex items-center gap-1 ${jdInputMode === 'url' ? 'bg-brand-primary text-white' : 'bg-bg-surface text-text-muted hover:text-brand-secondary'}`}
                                            >
                                                <Link2 size={12} />
                                                Posting URL
                                            </button>
                                        </div>
                                        <select
                                            value={selectedTemplateId}
                                            onChange={(e) => {
                                                const id = e.target.value;
                                                setSelectedTemplateId(id);
                                                const template = getJDTemplateById(id);
                                                if (template) {
                                                    onJdInputModeChange?.('paste');
                                                    onJdChange(template.jd);
                                                    onCompanyChange(template.company);
                                                } else {
                                                    onJdChange('');
                                                }
                                            }}
                                            className="text-[10px] font-bold border-none bg-bg-surface px-3 py-1 rounded-full outline-none"
                                            disabled={isFixing || jdInputMode === 'url'}
                                        >
                                            <option value="">JD Template...</option>
                                            {roleTemplates.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.company} — {t.title}
                                                </option>
                                            ))}
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
                                {jdInputMode === 'url' ? (
                                    <div className="space-y-2">
                                        <input
                                            type="url"
                                            inputMode="url"
                                            value={initialData.jobDescription}
                                            onChange={(e) => onJdChange(e.target.value)}
                                            placeholder="https://careers.example.com/jobs/12345"
                                            className="soft-input text-sm h-12 w-full"
                                            disabled={isFixing}
                                            autoComplete="off"
                                        />
                                        <p className="text-[10px] text-text-muted leading-relaxed">
                                            Paste the public link to the posting. The server fetches the page (best with{' '}
                                            <span className="font-bold text-brand-secondary">FIRECRAWL_API_KEY</span> set); login-only pages need the text pasted instead.
                                        </p>
                                    </div>
                                ) : (
                                    <textarea
                                        value={initialData.jobDescription}
                                        onChange={(e) => onJdChange(e.target.value)}
                                        placeholder="Paste the full job description here, or use Posting URL…"
                                        className="soft-input min-h-[160px] text-sm leading-relaxed p-5"
                                        disabled={isFixing}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-border-subtle/50">
                        <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-br from-white via-bg-surface/40 to-brand-primary/[0.04] p-8 shadow-sm">
                            <div
                                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-primary/[0.07] blur-2xl"
                                aria-hidden
                            />
                            <div className="relative space-y-6">
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/15">
                                            <Sparkles size={22} strokeWidth={2} />
                                        </div>
                                        <div>
                                            <h4 className="font-heading text-lg font-bold tracking-tight text-brand-secondary">
                                                {isFixing ? 'Running alignment…' : 'Run Match & Fix'}
                                            </h4>
                                            <p className="mt-1 max-w-xl text-sm leading-relaxed text-text-muted">
                                                {isFixing
                                                    ? 'Hold tight — we are scoring your resume against the job and building the report.'
                                                    : 'Compare your resume to this job, surface gaps, and get concrete edits plus interview prep.'}
                                            </p>
                                        </div>
                                    </div>
                                    {canRunMatchFix && (
                                        <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                                            <CheckCircle2 size={14} className="text-emerald-600" aria-hidden />
                                            Ready to go
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => selectedFile && onStartFix(selectedFile)}
                                    disabled={!selectedFile || !jdReady || isFixing}
                                    className={`relative w-full rounded-xl px-5 py-4 text-sm font-semibold tracking-wide shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
                                        !selectedFile || !jdReady || isFixing
                                            ? 'cursor-not-allowed border border-slate-200/80 bg-slate-100/90 text-slate-400'
                                            : 'border border-brand-primary/20 bg-brand-primary text-white shadow-md hover:bg-brand-primary/95 hover:shadow-lg active:scale-[0.99]'
                                    }`}
                                >
                                    <span className="flex items-center justify-center gap-2.5">
                                        {isFixing ? (
                                            <Loader2 size={20} className="animate-spin shrink-0" aria-hidden />
                                        ) : (
                                            <Scan size={20} className="shrink-0 opacity-95" aria-hidden />
                                        )}
                                        {isFixing ? 'Analyzing…' : 'Run Match & Fix'}
                                    </span>
                                </button>

                                {!isFixing && (!selectedFile || !jdReady) && (
                                    <div className="rounded-xl border border-dashed border-border-subtle bg-white/60 px-4 py-4 sm:px-5">
                                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                            Still needed
                                        </p>
                                        <ul className="space-y-2.5 text-sm text-text-secondary">
                                            <li className="flex items-start gap-3">
                                                {selectedFile ? (
                                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
                                                ) : (
                                                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" strokeWidth={1.75} aria-hidden />
                                                )}
                                                <span>
                                                    <span className="font-medium text-brand-secondary">Resume</span>
                                                    <span className="text-text-muted"> — PDF or DOCX from the upload area above.</span>
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                {jdReady ? (
                                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
                                                ) : (
                                                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" strokeWidth={1.75} aria-hidden />
                                                )}
                                                <span>
                                                    <span className="font-medium text-brand-secondary">
                                                        {jdInputMode === 'url' ? 'Posting link' : 'Job description'}
                                                    </span>
                                                    <span className="text-text-muted">
                                                        {jdInputMode === 'url'
                                                            ? ' — Paste a full https:// link to the public listing.'
                                                            : ' — Paste the listing text (or switch to Posting URL).'}
                                                    </span>
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
