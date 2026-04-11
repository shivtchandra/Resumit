import { useState } from 'react';
import { X, Download, ExternalLink, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { ResumeTemplate } from '../../data/realisticTemplates';
import { visualStyles, getVisualStyleForTemplate } from './visualStyles';
import { motion, AnimatePresence } from 'framer-motion';

interface PDFPreviewModalProps {
    template: ResumeTemplate;
    onClose: () => void;
}

/** Clone resume node off-screen so Framer Motion / scroll parents do not distort html2canvas bounds. */
function cloneResumeNodeForCapture(source: HTMLElement): { clone: HTMLElement; cleanup: () => void } {
    const clone = source.cloneNode(true) as HTMLElement;
    const w = Math.ceil(source.getBoundingClientRect().width);
    clone.style.boxSizing = 'border-box';
    clone.style.position = 'fixed';
    clone.style.left = '-10000px';
    clone.style.top = '0';
    clone.style.zIndex = '0';
    clone.style.pointerEvents = 'none';
    clone.style.width = `${w}px`;
    clone.style.height = 'auto';
    clone.style.maxHeight = 'none';
    clone.style.overflow = 'visible';
    clone.style.transform = 'none';
    clone.style.margin = '0';
    document.body.appendChild(clone);
    return {
        clone,
        cleanup: () => {
            clone.remove();
        },
    };
}

/** Build PDF from one tall canvas by slicing into A4-height strips (avoids float drift + phantom pages). */
function appendCanvasSlicedToPdf(
    pdf: import('jspdf').jsPDF,
    fullCanvas: HTMLCanvasElement,
    pageWidthMm: number,
    pageHeightMm: number
): void {
    const imgWidthMm = pageWidthMm;
    const imgHeightMm = (fullCanvas.height * imgWidthMm) / fullCanvas.width;
    const pxPerMm = fullCanvas.width / imgWidthMm;
    const pageHeightPx = pageHeightMm * pxPerMm;
    const totalPages = Math.max(1, Math.ceil(fullCanvas.height / pageHeightPx - 1e-6));

    for (let p = 0; p < totalPages; p++) {
        if (p > 0) {
            pdf.addPage();
        }
        const sy = Math.round(p * pageHeightPx);
        const sh = Math.min(Math.round(pageHeightPx), fullCanvas.height - sy);
        if (sh <= 0) break;

        const slice = document.createElement('canvas');
        slice.width = fullCanvas.width;
        slice.height = sh;
        const ctx = slice.getContext('2d');
        if (!ctx) continue;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(fullCanvas, 0, sy, fullCanvas.width, sh, 0, 0, fullCanvas.width, sh);

        const sliceMmH = (sh * imgWidthMm) / fullCanvas.width;
        const data = slice.toDataURL('image/png');
        pdf.addImage(data, 'PNG', 0, 0, imgWidthMm, sliceMmH);
    }
}

export const PDFPreviewModal = ({ template, onClose }: PDFPreviewModalProps) => {
    const { content, metadata } = template;
    const [isDownloading, setIsDownloading] = useState(false);

    // Get the visual style for this template
    const visualStyleType = getVisualStyleForTemplate(metadata.template_id);
    const resumeStyles = visualStyles[visualStyleType];

    const handleDownload = async () => {
        const element = document.getElementById('resume-preview-content');
        if (!element) return;

        setIsDownloading(true);
        const { clone, cleanup } = cloneResumeNodeForCapture(element);
        try {
            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    const s = clonedDoc.createElement('style');
                    s.textContent = `
                        *, *::before, *::after {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    `;
                    clonedDoc.head.appendChild(s);
                },
            });

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            appendCanvasSlicedToPdf(pdf, canvas, pageWidth, pageHeight);

            pdf.save(`${metadata.template_name.replace(/\s+/g, '_')}_Resume.pdf`);
        } catch (error) {
            console.error('PDF generation failed:', error);
        } finally {
            cleanup();
            setIsDownloading(false);
        }
    };

    const handleUseTemplate = () => {
        window.location.href = `/editor/${metadata.template_id}`;
    };

    return (
        <div
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-brand-secondary/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative max-w-6xl w-full max-h-[95vh] flex flex-col bg-white rounded-premium border border-white/20 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-bg-surface/50 backdrop-blur-md">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-inner bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                            <Sparkles size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="font-heading font-extrabold text-2xl text-brand-secondary leading-none">
                                    {metadata.template_name}
                                </h2>
                                <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-[10px] font-bold border border-green-100 flex items-center gap-1">
                                    <ShieldCheck size={10} />
                                    ATS {Math.round(metadata.ats_success_rate * 100)}%
                                </span>
                            </div>
                            <p className="text-sm text-text-muted">
                                {metadata.role} • <span className="capitalize">{metadata.experience_level}</span> Level
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-full bg-white border border-border-subtle text-text-muted hover:text-brand-secondary hover:border-brand-secondary transition-all hover:scale-110 active:scale-95 shadow-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    <div
                        id="resume-preview-content"
                        className="mx-auto bg-white shadow-premium rounded-sm overflow-visible"
                        style={{ ...resumeStyles.pdfContainer, maxWidth: '210mm' }}
                    >
                        {/* Resume Header */}
                        <div style={resumeStyles.resumeHeader}>
                            <h1 style={resumeStyles.name}>{content.personalInfo.name}</h1>
                            <div style={resumeStyles.contact}>
                                <div className="flex flex-wrap gap-x-6 gap-y-1 justify-center mb-1">
                                    <span>{content.personalInfo.location}</span>
                                    <span>{content.personalInfo.phone}</span>
                                    <span>{content.personalInfo.email}</span>
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-1 justify-center">
                                    <span>{content.personalInfo.linkedin}</span>
                                    {content.personalInfo.github && <span>{content.personalInfo.github}</span>}
                                    {content.personalInfo.portfolio && <span>{content.personalInfo.portfolio}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div style={resumeStyles.section}>
                            <h2 style={resumeStyles.sectionTitle}>Professional Summary</h2>
                            <p style={resumeStyles.text}>{content.summary}</p>
                        </div>

                        {/* Skills */}
                        <div style={resumeStyles.section}>
                            <h2 style={resumeStyles.sectionTitle}>Core Skills</h2>
                            {content.skills.map((skillGroup, idx) => (
                                <div key={idx} style={resumeStyles.skillCategory}>
                                    <span style={resumeStyles.skillCategoryName}>{skillGroup.category}:</span>
                                    <span style={resumeStyles.text}>{skillGroup.items.join(', ')}</span>
                                </div>
                            ))}
                        </div>

                        {/* Experience */}
                        <div style={resumeStyles.section}>
                            <h2 style={resumeStyles.sectionTitle}>Professional Experience</h2>
                            {content.experience.map((exp, idx) => (
                                <div key={idx} className="mb-5 last:mb-0">
                                    <div className="font-bold text-[0.9375rem] mb-1 text-slate-900">
                                        {exp.title}
                                    </div>
                                    <div className="text-[0.875rem] text-slate-500 mb-2 font-medium">
                                        {exp.company} • {exp.location} • {exp.startDate} - {exp.endDate}
                                    </div>
                                    {exp.bullets.map((bullet, bidx) => (
                                        <div key={bidx} style={resumeStyles.bullet}>
                                            <span className="absolute left-0">•</span>
                                            {bullet}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* Projects */}
                        {content.projects && content.projects.length > 0 && (
                            <div style={resumeStyles.section}>
                                <h2 style={resumeStyles.sectionTitle}>Projects</h2>
                                {content.projects.map((project, idx) => (
                                    <div key={idx} className="mb-4 last:mb-0">
                                        <div className="font-bold text-[0.9375rem] mb-1 text-slate-900">
                                            {project.name}
                                        </div>
                                        <p style={resumeStyles.text}>{project.description}</p>
                                        <div className="text-[0.8125rem] text-slate-400 italic">
                                            Technologies: {project.technologies.join(', ')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Education */}
                        <div style={resumeStyles.section}>
                            <h2 style={resumeStyles.sectionTitle}>Education</h2>
                            {content.education.map((edu, idx) => (
                                <div key={idx} className="mb-3 last:mb-0">
                                    <div className="font-bold text-[0.9375rem] text-slate-900">
                                        {edu.degree}
                                    </div>
                                    <div className="text-[0.875rem] text-slate-500 font-medium">
                                        {edu.school} • {edu.location} • {edu.graduationDate}
                                    </div>
                                    {edu.details && (
                                        <div className="text-[0.8125rem] text-slate-400 mt-1">
                                            {edu.details}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Certifications */}
                        {content.certifications && content.certifications.length > 0 && (
                            <div style={resumeStyles.section} className="border-none">
                                <h2 style={resumeStyles.sectionTitle}>Certifications</h2>
                                <div className="grid grid-cols-2 gap-x-8">
                                    {content.certifications.map((cert, idx) => (
                                        <div key={idx} style={resumeStyles.bullet}>
                                            <span className="absolute left-0">•</span>
                                            {cert}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border-subtle bg-bg-surface/30 backdrop-blur-md flex gap-4">
                    <button
                        className="btn-secondary flex-1 py-3 group"
                        onClick={handleDownload}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
                                <span className="ml-2">Synthesizing PDF...</span>
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="ml-2 text-brand-secondary">Export to PDF</span>
                            </>
                        )}
                    </button>
                    <button
                        className="btn-primary flex-1 py-3 group"
                        onClick={handleUseTemplate}
                    >
                        <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="ml-2">Deploy to Editor</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
