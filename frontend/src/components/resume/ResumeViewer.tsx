import { useState } from 'react';
import { Download, ExternalLink, FileText } from 'lucide-react';

interface ResumeViewerProps {
    resumeUrl: string;
    filename: string;
    fileType: 'pdf' | 'docx';
}

export const ResumeViewer = ({ resumeUrl, filename, fileType }: ResumeViewerProps) => {
    const [viewMode, setViewMode] = useState<'embed' | 'download'>('embed');

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = resumeUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleOpenNew = () => {
        window.open(resumeUrl, '_blank');
    };

    return (
        <div
            className="h-full flex flex-col rounded-xl overflow-hidden"
            style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border-subtle)',
            }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 border-b"
                style={{ borderColor: 'var(--color-border-subtle)' }}
            >
                <div className="flex items-center gap-3">
                    <FileText
                        className="w-5 h-5"
                        style={{ color: 'var(--color-accent-cyan)' }}
                    />
                    <div>
                        <h3
                            className="font-heading font-semibold text-sm"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            {filename}
                        </h3>
                        <p
                            className="text-xs"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            {fileType.toUpperCase()} Document
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleOpenNew}
                        className="p-2 rounded-lg transition-all hover:scale-110"
                        style={{
                            background: 'var(--color-bg-elevated)',
                            color: 'var(--color-text-primary)',
                        }}
                        title="Open in new tab"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="p-2 rounded-lg transition-all hover:scale-110"
                        style={{
                            background: 'var(--color-accent-cyan)',
                            color: 'var(--color-bg-dark)',
                        }}
                        title="Download"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Viewer */}
            <div className="flex-1 overflow-auto">
                {fileType === 'pdf' && viewMode === 'embed' ? (
                    <object
                        data={resumeUrl}
                        type="application/pdf"
                        className="w-full h-full min-h-[600px]"
                    >
                        <div
                            className="flex flex-col items-center justify-center h-full p-8 text-center"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            <FileText className="w-16 h-16 mb-4 opacity-50" />
                            <p className="mb-4">
                                Your browser doesn't support PDF viewing.
                            </p>
                            <button
                                onClick={handleDownload}
                                className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                                style={{
                                    background: 'var(--color-accent-cyan)',
                                    color: 'var(--color-bg-dark)',
                                }}
                            >
                                Download PDF
                            </button>
                        </div>
                    </object>
                ) : (
                    <div
                        className="flex flex-col items-center justify-center h-full p-8 text-center"
                        style={{ color: 'var(--color-text-secondary)' }}
                    >
                        <FileText className="w-16 h-16 mb-4 opacity-50" />
                        <p className="mb-2 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {fileType === 'docx' ? 'DOCX Preview Not Available' : 'Preview Not Available'}
                        </p>
                        <p className="mb-6 max-w-md">
                            {fileType === 'docx'
                                ? 'DOCX files cannot be previewed in the browser. Download the file to view it.'
                                : 'Download or open in a new tab to view this document.'}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDownload}
                                className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 flex items-center gap-2"
                                style={{
                                    background: 'var(--color-accent-cyan)',
                                    color: 'var(--color-bg-dark)',
                                }}
                            >
                                <Download className="w-4 h-4" />
                                Download File
                            </button>
                            <button
                                onClick={handleOpenNew}
                                className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 flex items-center gap-2"
                                style={{
                                    background: 'var(--color-bg-elevated)',
                                    color: 'var(--color-text-primary)',
                                    border: '1px solid var(--color-border-subtle)',
                                }}
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open in New Tab
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
