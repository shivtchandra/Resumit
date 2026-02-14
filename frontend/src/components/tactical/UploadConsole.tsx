import { useState, useCallback, useEffect } from 'react';
import { Upload, Scan, CheckCircle2, Loader2, Clock3 } from 'lucide-react';

interface UploadConsoleProps {
    onFileSelect: (file: File) => void;
    isAnalyzing?: boolean;
    onJdChange?: (jd: string) => void;
}

const ANALYSIS_STAGES = [
    { minProgress: 0, label: 'FILE LOCKED', hint: 'Securing uploaded document and validating format.' },
    { minProgress: 14, label: 'LAYOUT PARSE', hint: 'Parsing sections, dates, and structure blocks.' },
    { minProgress: 32, label: 'ENTITY SCAN', hint: 'Extracting skills, titles, and contact entities.' },
    { minProgress: 54, label: 'JD MATCH', hint: 'Comparing resume language against role requirements.' },
    { minProgress: 76, label: 'ROAST ENGINE', hint: 'Generating practical feedback and red flags.' },
    { minProgress: 91, label: 'REPORT BUILD', hint: 'Finalizing timeline, actions, and interview prep.' },
] as const;

const LIVE_SIGNALS = [
    'INDEXING_BULLETS',
    'DETECTING_SKILL_DENSITY',
    'SCORING_ATS_RISK',
    'MAPPING_GAP_TIMELINE',
    'SYNTHESIZING_FEEDBACK',
] as const;

const styles = {
    card: (isDragging: boolean) => ({
        position: 'relative' as const,
        overflow: 'hidden',
        transition: 'all 0.3s',
        background: 'var(--bg-surface)',
        border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
        boxShadow: isDragging ? 'var(--shadow-hover)' : 'var(--shadow-soft)',
        borderRadius: 'var(--radius-lg)'
    }),
    dropZone: (isDragging: boolean) => ({
        position: 'relative' as const,
        padding: '4rem',
        textAlign: 'center' as const,
        transition: 'all 0.3s',
        background: isDragging ? 'rgba(27, 142, 242, 0.05)' : 'transparent'
    }),
    input: {
        display: 'none'
    },
    label: {
        cursor: 'pointer',
        display: 'block'
    },
    contentContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '2rem'
    },
    iconContainer: (isDragging: boolean) => ({
        position: 'relative' as const,
        padding: '2rem',
        borderRadius: 'var(--radius-md)',
        transition: 'all 0.3s',
        background: 'var(--bg-page)',
        border: '1px solid var(--border-subtle)',
        boxShadow: isDragging ? '0 0 20px rgba(27, 142, 242, 0.2)' : 'none'
    }),
    icon: (isDragging: boolean, isAnalyzing: boolean) => ({
        width: '4rem',
        height: '4rem',
        transition: 'transform 0.3s',
        color: isAnalyzing ? 'var(--accent-primary)' : isDragging ? 'var(--accent-primary)' : 'var(--text-subtle)'
    }),
    iconHover: {
        transform: 'scale(1.1) translateY(-0.25rem)'
    },
    textContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center'
    },
    title: {
        fontSize: '1.5rem',
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        marginBottom: '0.75rem',
        color: 'var(--text-main)'
    },
    description: {
        fontSize: '1rem',
        color: 'var(--text-muted)',
        maxWidth: '28rem',
        margin: '0 auto'
    },
    formatLabel: {
        fontSize: '0.75rem',
        marginTop: '1rem',
        fontFamily: "var(--font-mono)",
        color: 'var(--text-subtle)',
        border: '1px solid var(--border-subtle)',
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-page)'
    },
    progressContainer: {
        width: '100%',
        maxWidth: '28rem',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem'
    },
    progressBar: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
    },
    progressTrack: {
        flex: 1,
        borderRadius: '9999px',
        height: '0.5rem',
        overflow: 'hidden',
        background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.14))'
    },
    progressFill: (progress: number) => ({
        height: '100%',
        transition: 'width 0.35s ease-out',
        width: `${progress}%`,
        background: 'linear-gradient(90deg, #1b8ef2 0%, #62b6ff 60%, #1b8ef2 100%)',
        backgroundSize: '200% 100%',
        animation: 'loaderShift 1.3s linear infinite',
        boxShadow: '0 0 14px rgba(27, 142, 242, 0.45)',
        position: 'relative' as const,
        borderRadius: '9999px'
    }),
    progressText: {
        fontSize: '0.875rem',
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        minWidth: '3rem',
        textAlign: 'right' as const,
        color: 'var(--accent-primary)'
    },
    elapsedRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem'
    },
    elapsedBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.25rem 0.5rem',
        borderRadius: '999px',
        border: '1px solid rgba(27, 142, 242, 0.25)',
        background: 'rgba(27, 142, 242, 0.08)',
        color: 'var(--accent-primary)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.68rem',
        fontWeight: 700
    },
    statusText: {
        fontSize: '0.72rem',
        fontFamily: "var(--font-mono)",
        color: 'var(--accent-primary)',
        letterSpacing: '0.04em',
        animation: 'loaderBlink 1.8s ease-in-out infinite'
    },
    stageGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '0.55rem'
    },
    stageCard: (active: boolean, complete: boolean) => ({
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.45rem',
        border: '1px solid',
        borderColor: complete ? 'rgba(16, 185, 129, 0.45)' : active ? 'rgba(27, 142, 242, 0.35)' : 'var(--border-subtle)',
        background: complete ? 'rgba(16, 185, 129, 0.08)' : active ? 'rgba(27, 142, 242, 0.08)' : 'var(--bg-page)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.55rem 0.6rem',
        transition: 'all 0.25s ease'
    }),
    stageLabel: (active: boolean, complete: boolean) => ({
        fontSize: '0.66rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        fontFamily: 'var(--font-mono)',
        color: complete ? '#047857' : active ? 'var(--accent-primary)' : 'var(--text-subtle)'
    }),
    stageHint: {
        marginTop: '0.12rem',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        lineHeight: 1.35
    },
    signalGrid: {
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: '0.4rem',
    },
    signalChip: (active: boolean) => ({
        fontFamily: 'var(--font-mono)',
        fontSize: '0.62rem',
        letterSpacing: '0.04em',
        padding: '0.2rem 0.45rem',
        borderRadius: '999px',
        border: '1px solid',
        borderColor: active ? 'rgba(27, 142, 242, 0.45)' : 'var(--border-subtle)',
        background: active ? 'rgba(27, 142, 242, 0.12)' : 'var(--bg-page)',
        color: active ? 'var(--accent-primary)' : 'var(--text-subtle)',
        transition: 'all 0.2s ease',
        transform: active ? 'translateY(-1px)' : 'translateY(0)'
    })
};

export const UploadConsole = ({ onFileSelect, isAnalyzing = false, onJdChange }: UploadConsoleProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showJdInput, setShowJdInput] = useState(false);
    const [activeStage, setActiveStage] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [signalCursor, setSignalCursor] = useState(0);

    const processFile = useCallback((file: File) => {
        // Validate file type
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a PDF or DOCX file');
            return;
        }

        setSelectedFile(file);
    }, []);

    const handleStartAnalysis = () => {
        if (selectedFile) {
            onFileSelect(selectedFile);
        }
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragOut = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            processFile(files[0]);
        }
    }, [processFile]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            processFile(files[0]);
        }
    };

    // Simulate progress + stage transitions while analyzing
    useEffect(() => {
        if (isAnalyzing) {
            setProgress(3);
            setActiveStage(0);
            setElapsedSeconds(0);
            setSignalCursor(0);
            const startTime = Date.now();

            const interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                setElapsedSeconds(elapsed);
                setProgress(prev => {
                    if (prev >= 96) {
                        return 96;
                    }
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
        } else {
            setProgress(0);
            setElapsedSeconds(0);
            setActiveStage(0);
            setSignalCursor(0);
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

    const stageHint = ANALYSIS_STAGES[activeStage]?.hint || 'Preparing analysis...';

    return (
        <div style={styles.card(isDragging)}>
            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes loaderShift {
                        0% { background-position: 0% 50%; }
                        100% { background-position: 200% 50%; }
                    }
                    @keyframes loaderBlink {
                        0%, 100% { opacity: 0.55; }
                        50% { opacity: 1; }
                    }
                `}
            </style>
            <div
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={styles.dropZone(isDragging)}
            >
                <input
                    type="file"
                    id="file-upload"
                    style={styles.input}
                    accept=".pdf,.docx"
                    onChange={handleFileInput}
                    disabled={isAnalyzing}
                />

                <label htmlFor="file-upload" style={{ ...styles.label, cursor: isAnalyzing ? 'default' : 'pointer' }}>
                    <div style={styles.contentContainer}>
                        <div style={styles.iconContainer(isDragging)}>
                            {isAnalyzing ? (
                                <Loader2 style={{ ...styles.icon(isDragging, isAnalyzing), animation: 'spin 1.1s linear infinite' }} />
                            ) : (
                                <Upload style={styles.icon(isDragging, isAnalyzing)} />
                            )}
                        </div>

                        <div style={styles.textContainer}>
                            <p style={styles.title}>
                                {isAnalyzing ? 'LIVE ANALYSIS IN PROGRESS...' : selectedFile ? 'File Selected' : 'Initiate Analysis'}
                            </p>
                            <p style={styles.description}>
                                {selectedFile
                                    ? `${selectedFile.name}${isAnalyzing ? ' is being processed with stage-by-stage ATS diagnostics.' : ''}`
                                    : 'Drag and drop your resume to begin the deep scan protocol.'}
                            </p>
                            {!selectedFile && (
                                <p style={styles.formatLabel}>
                                    SUPPORTED_FORMATS: PDF, DOCX
                                </p>
                            )}
                        </div>

                        {isAnalyzing && (
                            <div style={styles.progressContainer}>
                                <div style={styles.elapsedRow}>
                                    <div style={styles.elapsedBadge}>
                                        <Clock3 size={12} />
                                        ELAPSED {String(elapsedSeconds).padStart(2, '0')}s
                                    </div>
                                    <p style={styles.statusText}>
                                        {LIVE_SIGNALS[signalCursor]}...
                                    </p>
                                </div>
                                <div style={styles.progressBar}>
                                    <div style={styles.progressTrack}>
                                        <div style={styles.progressFill(progress)} />
                                    </div>
                                    <span style={styles.progressText}>
                                        {Math.round(progress)}%
                                    </span>
                                </div>
                                <p style={styles.statusText}>
                                    {stageHint}
                                </p>
                                <div style={styles.stageGrid}>
                                    {ANALYSIS_STAGES.map((stage, idx) => {
                                        const complete = idx < activeStage;
                                        const active = idx === activeStage;
                                        return (
                                            <div key={stage.label} style={styles.stageCard(active, complete)}>
                                                {complete ? (
                                                    <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0, marginTop: '1px' }} />
                                                ) : active ? (
                                                    <Loader2 size={14} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '1px', animation: 'spin 1.1s linear infinite' }} />
                                                ) : (
                                                    <Scan size={14} color="var(--text-subtle)" style={{ flexShrink: 0, marginTop: '1px' }} />
                                                )}
                                                <div style={{ textAlign: 'left' as const }}>
                                                    <div style={styles.stageLabel(active, complete)}>{stage.label}</div>
                                                    {(active || complete) && (
                                                        <div style={styles.stageHint}>{stage.hint}</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={styles.signalGrid}>
                                    {LIVE_SIGNALS.map((signal, idx) => (
                                        <span key={signal} style={styles.signalChip(idx === signalCursor)}>
                                            {signal}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </label>
            </div>

            {/* JD Input Section */}
            {!isAnalyzing && (
                <div style={{
                    padding: '0 2rem 2rem',
                    borderTop: '1px solid var(--border-subtle)',
                    marginTop: '1rem',
                    paddingTop: '1rem'
                }}>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setShowJdInput(!showJdInput);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            margin: '0 auto',
                            padding: '0.5rem'
                        }}
                    >
                        {showJdInput ? '− Remove Job Description' : '+ Add Target Job Description'}
                    </button>

                    {showJdInput && (
                        <div style={{ marginTop: '1rem' }}>
                            <textarea
                                placeholder="Paste the job description here to analyze relevance and keyword matching..."
                                style={{
                                    width: '100%',
                                    minHeight: '150px',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-subtle)',
                                    background: 'var(--bg-page)',
                                    color: 'var(--text-main)',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '0.875rem',
                                    resize: 'vertical'
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => onJdChange?.(e.target.value)}
                            />
                        </div>
                    )}

                    {selectedFile && (
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={handleStartAnalysis}
                                style={{
                                    padding: '0.75rem 2rem',
                                    background: 'var(--text-main)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    boxShadow: 'var(--shadow-soft)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Scan size={18} />
                                Start Analysis
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
