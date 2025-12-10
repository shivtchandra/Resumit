import { useState } from 'react';
import { X, Download, ExternalLink, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { ResumeTemplate } from '../../data/realisticTemplates';
import { visualStyles, getVisualStyleForTemplate } from './visualStyles';

interface PDFPreviewModalProps {
    template: ResumeTemplate;
    onClose: () => void;
}

const styles = {
    overlay: {
        position: 'fixed' as const,
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '2rem'
    },
    modal: {
        background: 'var(--bg-page)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        maxWidth: '60rem',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column' as const,
        boxShadow: 'var(--shadow-soft)'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.5rem 2rem',
        borderBottom: '1px solid var(--border-subtle)'
    },
    title: {
        fontFamily: 'var(--font-heading)',
        fontSize: '1.25rem',
        fontWeight: 600,
        color: 'var(--text-main)'
    },
    subtitle: {
        fontSize: '0.875rem',
        color: 'var(--text-muted)',
        marginTop: '0.25rem'
    },
    closeButton: {
        padding: '0.5rem',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: 'var(--bg-card)',
        color: 'var(--text-main)',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    content: {
        flex: 1,
        overflow: 'auto',
        padding: '2rem',
        background: 'var(--bg-elevated)'
    },
    footer: {
        display: 'flex',
        gap: '1rem',
        padding: '1.5rem 2rem',
        borderTop: '1px solid rgba(255,255,255,0.06)'
    },
    button: {
        flex: 1,
        padding: '0.75rem 1.5rem',
        borderRadius: '0.5rem',
        border: 'none',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
    },
    downloadButton: {
        background: '#60f2e3',
        color: '#0f110d'
    },
    useButton: {
        background: 'rgba(96,242,227,0.1)',
        color: '#60f2e3',
        border: '1px solid rgba(96,242,227,0.3)'
    }
};

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
        try {
            const canvas = await html2canvas(element, {
                scale: 2, // Higher quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Handle multi-page resumes
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${metadata.template_name.replace(/\s+/g, '_')}_Resume.pdf`);
        } catch (error) {
            console.error('PDF generation failed:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleUseTemplate = () => {
        window.location.href = `/editor/${metadata.template_id}`;
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <div>
                        <h2 style={styles.title}>{metadata.template_name}</h2>
                        <p style={styles.subtitle}>
                            {metadata.role} • {metadata.experience_level} Level • {Math.round(metadata.ats_success_rate * 100)}% ATS Score
                        </p>
                    </div>
                    <button style={styles.closeButton} onClick={onClose}>
                        <X style={{ width: '1.25rem', height: '1.25rem' }} />
                    </button>
                </div>

                <div style={styles.content}>
                    <div id="resume-preview-content" style={{ ...resumeStyles.pdfContainer, borderRadius: 'var(--radius-sm)', maxWidth: '50rem', margin: '0 auto', boxShadow: 'var(--shadow-soft)' }}>
                        {/* Resume Header */}
                        <div style={resumeStyles.resumeHeader}>
                            <h1 style={resumeStyles.name}>{content.personalInfo.name}</h1>
                            <div style={resumeStyles.contact}>
                                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '0.25rem' }}>
                                    <span>{content.personalInfo.location}</span>
                                    <span>{content.personalInfo.phone}</span>
                                    <span>{content.personalInfo.email}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
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
                                <div key={idx} style={{ marginBottom: '1.25rem' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
                                        {exp.title}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#555', marginBottom: '0.5rem' }}>
                                        {exp.company} • {exp.location} • {exp.startDate} - {exp.endDate}
                                    </div>
                                    {exp.bullets.map((bullet, bidx) => (
                                        <div key={bidx} style={resumeStyles.bullet}>
                                            <span style={{ position: 'absolute', left: 0 }}>•</span>
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
                                    <div key={idx} style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
                                            {project.name}
                                        </div>
                                        <p style={resumeStyles.text}>{project.description}</p>
                                        <div style={{ fontSize: '0.8125rem', color: '#555', fontStyle: 'italic' }}>
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
                                <div key={idx} style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                                        {edu.degree}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#555' }}>
                                        {edu.school} • {edu.location} • {edu.graduationDate}
                                    </div>
                                    {edu.details && (
                                        <div style={{ fontSize: '0.8125rem', color: '#666', marginTop: '0.25rem' }}>
                                            {edu.details}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Certifications */}
                        {content.certifications && content.certifications.length > 0 && (
                            <div style={resumeStyles.section}>
                                <h2 style={resumeStyles.sectionTitle}>Certifications</h2>
                                {content.certifications.map((cert, idx) => (
                                    <div key={idx} style={resumeStyles.bullet}>
                                        <span style={{ position: 'absolute', left: 0 }}>•</span>
                                        {cert}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div style={styles.footer}>
                    <button
                        style={{ ...styles.button, ...styles.downloadButton }}
                        onClick={handleDownload}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <>
                                <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                                Generating PDF...
                            </>
                        ) : (
                            <>
                                <Download style={{ width: '1rem', height: '1rem' }} />
                                Download PDF
                            </>
                        )}
                    </button>
                    <button
                        style={{ ...styles.button, ...styles.useButton }}
                        onClick={handleUseTemplate}
                    >
                        <ExternalLink style={{ width: '1rem', height: '1rem' }} />
                        Use This Template
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
