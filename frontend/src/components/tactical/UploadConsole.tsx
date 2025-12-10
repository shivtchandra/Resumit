import { useState, useCallback, useEffect } from 'react';
import { Upload, Scan } from 'lucide-react';

interface UploadConsoleProps {
    onFileSelect: (file: File) => void;
    isAnalyzing?: boolean;
    onJdChange?: (jd: string) => void;
}

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
        height: '0.375rem',
        overflow: 'hidden',
        background: 'var(--bg-page)'
    },
    progressFill: (progress: number) => ({
        height: '100%',
        transition: 'all 0.3s',
        width: `${progress}%`,
        background: 'var(--accent-primary)',
        boxShadow: '0 0 10px rgba(27, 142, 242, 0.5)',
        position: 'relative' as const
    }),
    progressText: {
        fontSize: '0.875rem',
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        minWidth: '3rem',
        textAlign: 'right' as const,
        color: 'var(--accent-primary)'
    },
    statusText: {
        fontSize: '0.75rem',
        fontFamily: "var(--font-mono)",
        color: 'var(--accent-primary)',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    }
};

export const UploadConsole = ({ onFileSelect, isAnalyzing = false, onJdChange }: UploadConsoleProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showJdInput, setShowJdInput] = useState(false);

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

    // Simulate progress when analyzing
    useEffect(() => {
        if (isAnalyzing) {
            setProgress(0);
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) {
                        return 95; // Hold at 95% until done
                    }
                    return prev + 5;
                });
            }, 100);
            return () => clearInterval(interval);
        } else {
            setProgress(0);
        }
    }, [isAnalyzing]);

    return (
        <div style={styles.card(isDragging)}>
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
                                <Scan style={{ ...styles.icon(isDragging, isAnalyzing), animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                            ) : (
                                <Upload style={styles.icon(isDragging, isAnalyzing)} />
                            )}
                        </div>

                        <div style={styles.textContainer}>
                            <p style={styles.title}>
                                {isAnalyzing ? 'SCANNING_DOCUMENT...' : selectedFile ? 'File Selected' : 'Initiate Analysis'}
                            </p>
                            <p style={styles.description}>
                                {selectedFile ? selectedFile.name : 'Drag and drop your resume to begin the deep scan protocol.'}
                            </p>
                            {!selectedFile && (
                                <p style={styles.formatLabel}>
                                    SUPPORTED_FORMATS: PDF, DOCX
                                </p>
                            )}
                        </div>

                        {isAnalyzing && (
                            <div style={styles.progressContainer}>
                                <div style={styles.progressBar}>
                                    <div style={styles.progressTrack}>
                                        <div style={styles.progressFill(progress)} />
                                    </div>
                                    <span style={styles.progressText}>
                                        {progress}%
                                    </span>
                                </div>
                                <p style={styles.statusText}>
                                    PARSING_STRUCTURE_DATA...
                                </p>
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
