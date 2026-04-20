import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Scan, CheckCircle2, Loader2, Clock3, Target, Search, RotateCcw, Link2, Circle } from 'lucide-react';
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
    const fileInputRef = useRef<HTMLInputElement>(null);
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

    const openFilePicker = () => {
        if (!isFixing) {
            fileInputRef.current?.click();
        }
    };

    const onDropZoneKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFilePicker();
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

    const stepBadge = (n: number, done: boolean) => (
        <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-black tabular-nums shadow-sm ${
                done ? 'bg-emerald-500 text-white' : 'bg-brand-primary text-white'
            }`}
            aria-hidden
        >
            {done ? <CheckCircle2 size={22} strokeWidth={2.5} /> : n}
        </span>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes loaderShift { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
                @keyframes loaderBlink { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
            `}</style>

            <div
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 ${
                    isDragging ? 'border-brand-primary ring-2 ring-brand-primary/20 shadow-md' : 'border-border-subtle'
                }`}
            >
                {/* Step 1 — Resume */}
                <div
                    className={`relative border-b border-border-subtle transition-colors ${
                        isFixing ? 'bg-slate-50/80' : isDragging ? 'bg-brand-primary/[0.04]' : 'bg-slate-50/40'
                    }`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="p-6 md:p-8">
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex gap-4">
                                {stepBadge(1, Boolean(selectedFile))}
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-primary">Step 1</p>
                                    <h3 className="mt-1 font-heading text-xl font-black tracking-tight text-brand-secondary md:text-2xl">
                                        Upload your resume
                                    </h3>
                                    <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-muted">
                                        Put your file here first. We use it only for this report — PDF or Word (.docx).
                                    </p>
                                </div>
                            </div>
                            {!isFixing && (
                                <button
                                    type="button"
                                    onClick={openFilePicker}
                                    className="btn-primary h-11 shrink-0 px-5 text-sm font-bold shadow-sm sm:self-start"
                                >
                                    Choose PDF or Word
                                </button>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            id="optimization-file-upload"
                            className="sr-only"
                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleFileSelect(f);
                                e.target.value = '';
                            }}
                            disabled={isFixing}
                            aria-label="Choose resume file"
                        />

                        <div
                            role="button"
                            tabIndex={isFixing ? -1 : 0}
                            onClick={openFilePicker}
                            onKeyDown={isFixing ? undefined : onDropZoneKeyDown}
                            className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors md:min-h-[160px] ${
                                isFixing
                                    ? 'cursor-not-allowed border-slate-200 bg-white/50 opacity-80'
                                    : selectedFile
                                      ? 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-400'
                                      : isDragging
                                        ? 'border-brand-primary bg-brand-primary/5'
                                        : 'border-slate-200 bg-white hover:border-brand-primary/40 hover:bg-slate-50/80'
                            }`}
                            aria-label="Drop resume file here or click to browse"
                        >
                            {isFixing ? (
                                <Loader2 className="animate-spin text-brand-primary" size={40} aria-hidden />
                            ) : (
                                <div
                                    className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
                                        selectedFile ? 'border-emerald-200 bg-white text-emerald-600' : 'border-slate-200 bg-white text-brand-primary'
                                    }`}
                                >
                                    <FileText size={28} strokeWidth={2} aria-hidden />
                                </div>
                            )}
                            <div>
                                <p className="font-semibold text-brand-secondary">
                                    {isFixing
                                        ? 'Running analysis…'
                                        : selectedFile
                                          ? selectedFile.name
                                          : 'Drop your file here, or tap the button above'}
                                </p>
                                {!isFixing && !selectedFile && (
                                    <p className="mt-1 text-xs text-text-muted">You can also drag and drop from your computer.</p>
                                )}
                            </div>
                            {!isFixing && selectedFile && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openFilePicker();
                                    }}
                                    className="text-sm font-semibold text-brand-primary underline-offset-2 hover:underline"
                                >
                                    Replace file
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Analyzing View */}
                    <AnimatePresence>
                        {isFixing && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-8 border-t border-border-subtle bg-white px-6 pb-8 pt-6 md:px-8"
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

                {/* Step 2 — Job context */}
                <div className="space-y-8 border-b border-border-subtle bg-white p-6 md:p-8">
                    <div className="flex gap-4">
                        {stepBadge(2, jdReady)}
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-primary">Step 2</p>
                            <h3 className="mt-1 font-heading text-xl font-black tracking-tight text-brand-secondary md:text-2xl">
                                Add the job you&apos;re targeting
                            </h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                                Pick a role label (for coaching tone), optionally name the company, then paste the full posting or a public URL.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-secondary">
                                    <Search size={15} className="text-brand-primary" aria-hidden />
                                    Role label
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
                                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-secondary">
                                    <MaterialIcon icon="business" size={15} className="text-brand-primary" />
                                    Company <span className="font-normal normal-case text-text-muted">(optional)</span>
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
                                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-secondary">
                                        <MaterialIcon icon="description" size={15} className="text-brand-primary" />
                                        Job description <span className="text-red-600">*</span>
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
                                            <option value="">Sample posting (optional)</option>
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
                </div>

                {/* Step 3 — Run */}
                <div className="bg-white p-6 md:p-8">
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-linear-to-br from-slate-50/90 via-white to-brand-primary/[0.06] p-6 shadow-sm md:p-8">
                        <div
                            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-primary/[0.08] blur-3xl"
                            aria-hidden
                        />
                        <div className="relative space-y-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                                <div className="flex gap-4">
                                    {stepBadge(3, false)}
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-primary">Step 3</p>
                                        <h4 className="mt-1 font-heading text-lg font-black tracking-tight text-brand-secondary md:text-xl">
                                            {isFixing ? 'Running Match & Fix…' : 'Run the analysis'}
                                        </h4>
                                        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-muted">
                                            {isFixing
                                                ? 'Scoring your resume against the job and building your report. Keep this tab open.'
                                                : 'When Step 1 and Step 2 are complete, press the button below.'}
                                        </p>
                                        <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                                            <Clock3 size={14} className="shrink-0 text-brand-primary" aria-hidden />
                                            <span>
                                                Usually <strong className="text-brand-secondary">~1 minute</strong>. Heavy jobs or slow networks can take{' '}
                                                <strong className="text-brand-secondary">a few minutes</strong> — don&apos;t refresh.
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                {canRunMatchFix && (
                                    <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                                        <CheckCircle2 size={14} className="text-emerald-600" aria-hidden />
                                        Ready to run
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
                                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-4 sm:px-5">
                                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-900/80">Complete the steps above</p>
                                        <ul className="space-y-2.5 text-sm text-text-secondary">
                                            <li className="flex items-start gap-3">
                                                {selectedFile ? (
                                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
                                                ) : (
                                                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" strokeWidth={1.75} aria-hidden />
                                                )}
                                                <span>
                                                    <span className="font-semibold text-brand-secondary">Step 1 — Resume</span>
                                                    <span className="text-text-muted"> Upload a PDF or Word file in the dashed box.</span>
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                {jdReady ? (
                                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
                                                ) : (
                                                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" strokeWidth={1.75} aria-hidden />
                                                )}
                                                <span>
                                                    <span className="font-semibold text-brand-secondary">
                                                        Step 2 — {jdInputMode === 'url' ? 'Posting URL' : 'Job description'}
                                                    </span>
                                                    <span className="text-text-muted">
                                                        {jdInputMode === 'url'
                                                            ? ' Paste a full https:// link to the public listing.'
                                                            : ' Paste the full listing text, or switch to Posting URL.'}
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
    );
};
