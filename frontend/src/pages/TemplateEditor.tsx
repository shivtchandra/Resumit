import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MaterialIcon } from '../components/ui/MaterialIcon';
import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';
import { getProductionTemplates } from '../data/allTemplates';

// Editable resume data interface
interface EditableResumeData {
    personalInfo: {
        name: string;
        email: string;
        phone: string;
        location: string;
        linkedin: string;
        github?: string;
        portfolio?: string;
    };
    summary: string;
    skills: Array<{
        category: string;
        items: string[];
    }>;
    experience: Array<{
        title: string;
        company: string;
        location: string;
        startDate: string;
        endDate: string;
        bullets: string[];
    }>;
    projects?: Array<{
        name: string;
        description: string;
        technologies: string[];
    }>;
    education: Array<{
        degree: string;
        school: string;
        location: string;
        graduationDate: string;
        gpa?: string;
        coursework?: string;
    }>;
    certifications?: string[];
}

const styles = {
    container: {
        display: 'flex',
        height: 'calc(100vh - 4rem)',
        background: 'var(--bg-page)'
    },
    editorPanel: {
        width: '40%',
        overflowY: 'auto' as const,
        padding: '2rem',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-subtle)'
    },
    previewPanel: {
        width: '60%',
        overflowY: 'auto' as const,
        padding: '3rem',
        background: 'var(--bg-elevated)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start'
    },
    header: {
        marginBottom: '2rem'
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: 700,
        color: 'var(--text-main)',
        marginBottom: '0.5rem',
        fontFamily: 'var(--font-heading)'
    },
    subtitle: {
        color: 'var(--text-muted)',
        fontSize: '0.875rem'
    },
    downloadButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        background: 'var(--text-main)',
        color: '#ffffff',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.95rem',
        fontWeight: 600,
        cursor: 'pointer',
        marginBottom: '1.5rem',
        transition: 'background 0.2s',
        width: '100%'
    },
    addButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.625rem 1rem',
        background: 'transparent',
        color: 'var(--text-main)',
        border: '1px dashed var(--text-main)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
        marginTop: '0.75rem',
        transition: 'all 0.2s',
        width: '100%'
    },
    deleteButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.375rem',
        padding: '0.5rem 1rem',
        background: 'transparent',
        color: '#ef4444',
        border: '1px solid #ef4444',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.75rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginTop: '0.5rem',
        width: '100%'
    },
    section: {
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid var(--border-subtle)'
    },
    sectionTitle: {
        fontSize: '1rem',
        fontWeight: 600,
        color: 'var(--text-main)',
        marginBottom: '0.5rem'
    },
    sectionHint: {
        fontSize: '0.75rem',
        color: 'var(--text-subtle)',
        marginBottom: '1rem',
        lineHeight: 1.4
    },
    label: {
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        display: 'block',
        marginBottom: '0.375rem',
        fontWeight: 500
    },
    input: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.875rem',
        marginBottom: '1rem',
        background: 'var(--bg-surface)',
        color: 'var(--text-main)',
        fontFamily: 'var(--font-body)'
    },
    textarea: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.875rem',
        minHeight: '5rem',
        resize: 'vertical' as const,
        marginBottom: '1rem',
        background: 'var(--bg-surface)',
        color: 'var(--text-main)',
        fontFamily: 'var(--font-body)',
        lineHeight: 1.5
    },
    card: {
        marginBottom: '1.25rem',
        padding: '1.25rem',
        background: 'white',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
    },
    gridTwo: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem'
    },
    // PDF Preview Styles - WHITE BACKGROUND
    pdfContainer: {
        background: '#ffffff',
        borderRadius: 'var(--radius-sm)',
        padding: '3rem',
        maxWidth: '50rem',
        margin: '0 auto',
        boxShadow: 'var(--shadow-soft)',
        fontFamily: "'Arial', sans-serif",
        color: '#000'
    },
    resumeHeader: {
        textAlign: 'center' as const,
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #000'
    },
    name: {
        fontSize: '2rem',
        fontWeight: 700,
        marginBottom: '0.5rem',
        color: '#000'
    },
    contact: {
        fontSize: '0.875rem',
        color: '#333',
        display: 'flex',
        flexWrap: 'wrap' as const,
        justifyContent: 'center',
        gap: '0.5rem 1rem'
    },
    pdfSection: {
        marginBottom: '1.5rem'
    },
    pdfSectionTitle: {
        fontSize: '1.125rem',
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        marginBottom: '0.75rem',
        borderBottom: '1px solid #000',
        paddingBottom: '0.25rem',
        color: '#000'
    },
    text: {
        fontSize: '0.875rem',
        lineHeight: '1.6',
        color: '#222'
    },
    bullet: {
        fontSize: '0.875rem',
        lineHeight: '1.6',
        color: '#222',
        marginBottom: '0.5rem',
        paddingLeft: '1.5rem',
        position: 'relative' as const
    },
    skillCategory: {
        marginBottom: '0.5rem'
    },
    skillCategoryName: {
        fontWeight: 600,
        fontSize: '0.875rem',
        marginRight: '0.5rem',
        color: '#000'
    },
    expTitle: {
        fontWeight: 700,
        fontSize: '0.9375rem',
        marginBottom: '0.25rem',
        color: '#000'
    },
    expMeta: {
        fontSize: '0.875rem',
        color: '#555',
        marginBottom: '0.5rem'
    }
};

export const TemplateEditor = () => {
    const { id } = useParams();
    const [resumeData, setResumeData] = useState<EditableResumeData | null>(null);

    useEffect(() => {
        const loadTemplate = async () => {
            const templates = await getProductionTemplates();
            const template = templates.find(t => t.metadata.template_id === id);

            if (template && template.content) {
                setResumeData({
                    personalInfo: template.content.personalInfo,
                    summary: template.content.summary,
                    skills: template.content.skills,
                    experience: template.content.experience,
                    projects: template.content.projects,
                    education: template.content.education.map(edu => ({
                        ...edu,
                        gpa: edu.gpa,
                        coursework: edu.coursework
                    })),
                    certifications: template.content.certifications
                });
            }
        };

        if (id) {
            loadTemplate();
        }
    }, [id]);

    const handleDownloadPDF = () => {
        window.print();
    };

    // Add new experience
    const addExperience = () => {
        if (!resumeData) return;
        setResumeData({
            ...resumeData,
            experience: [...resumeData.experience, {
                title: 'New Position',
                company: 'Company Name',
                location: 'City, State',
                startDate: 'Month Year',
                endDate: 'Present',
                bullets: ['Achievement or responsibility']
            }]
        });
    };

    // Delete experience
    const deleteExperience = (index: number) => {
        if (!resumeData) return;
        const updated = resumeData.experience.filter((_, idx) => idx !== index);
        setResumeData({ ...resumeData, experience: updated });
    };

    // Add new project
    const addProject = () => {
        if (!resumeData) return;
        setResumeData({
            ...resumeData,
            projects: [...(resumeData.projects || []), {
                name: 'New Project',
                description: 'Project description',
                technologies: ['Technology 1', 'Technology 2']
            }]
        });
    };

    // Delete project
    const deleteProject = (index: number) => {
        if (!resumeData) return;
        const updated = (resumeData.projects || []).filter((_, idx) => idx !== index);
        setResumeData({ ...resumeData, projects: updated });
    };

    // Add new education
    const addEducation = () => {
        if (!resumeData) return;
        setResumeData({
            ...resumeData,
            education: [...resumeData.education, {
                degree: 'Degree Name',
                school: 'University Name',
                location: 'City, State',
                graduationDate: 'Month Year'
            }]
        });
    };

    // Delete education
    const deleteEducation = (index: number) => {
        if (!resumeData) return;
        const updated = resumeData.education.filter((_, idx) => idx !== index);
        setResumeData({ ...resumeData, education: updated });
    };

    // Add new certification
    const addCertification = () => {
        if (!resumeData) return;
        setResumeData({
            ...resumeData,
            certifications: [...(resumeData.certifications || []), 'New Certification (Year)']
        });
    };

    // Delete certification
    const deleteCertification = (index: number) => {
        if (!resumeData) return;
        const updated = (resumeData.certifications || []).filter((_, idx) => idx !== index);
        setResumeData({ ...resumeData, certifications: updated });
    };

    // Update handlers
    const updatePersonalInfo = (field: string, value: string) => {
        if (!resumeData) return;
        setResumeData({
            ...resumeData,
            personalInfo: { ...resumeData.personalInfo, [field]: value }
        });
    };

    const updateExperience = (index: number, field: string, value: string) => {
        if (!resumeData) return;
        const updated = [...resumeData.experience];
        updated[index] = { ...updated[index], [field]: value };
        setResumeData({ ...resumeData, experience: updated });
    };

    const updateExperienceBullet = (expIndex: number, bulletIndex: number, value: string) => {
        if (!resumeData) return;
        const updated = [...resumeData.experience];
        updated[expIndex].bullets[bulletIndex] = value;
        setResumeData({ ...resumeData, experience: updated });
    };

    if (!resumeData) {
        return (
            <PageLayout header={<Navbar />} maxWidth="full">
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading template...
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout header={<Navbar />} maxWidth="full">
            <div style={styles.container}>
                {/* Editor Panel */}
                <div style={styles.editorPanel}>
                    <div style={styles.header}>
                        <h1 style={styles.title}>Edit Resume</h1>
                        <p style={styles.subtitle}>Edit each section below to customize your resume</p>
                    </div>

                    <button onClick={handleDownloadPDF} style={styles.downloadButton}>
                        <MaterialIcon icon="download" size={18} />
                        Download PDF
                    </button>

                    {/* Personal Information */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>Personal Information</h3>
                        <input
                            type="text"
                            value={resumeData.personalInfo.name}
                            onChange={(e) => updatePersonalInfo('name', e.target.value)}
                            placeholder="Full Name"
                            style={styles.input}
                        />
                        <input
                            type="email"
                            value={resumeData.personalInfo.email}
                            onChange={(e) => updatePersonalInfo('email', e.target.value)}
                            placeholder="Email"
                            style={styles.input}
                        />
                        <input
                            type="tel"
                            value={resumeData.personalInfo.phone}
                            onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                            placeholder="Phone"
                            style={styles.input}
                        />
                        <input
                            type="text"
                            value={resumeData.personalInfo.location}
                            onChange={(e) => updatePersonalInfo('location', e.target.value)}
                            placeholder="Location"
                            style={styles.input}
                        />
                    </div>

                    {/* Summary */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>Professional Summary</h3>
                        <p style={styles.sectionHint}>
                            Write a compelling 2-3 sentence summary
                        </p>
                        <textarea
                            value={resumeData.summary}
                            onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                            placeholder="Professional summary"
                            style={styles.textarea}
                        />
                    </div>

                    {/* Experience */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>Professional Experience</h3>
                        <p style={styles.sectionHint}>
                            List your work experience with quantifiable achievements
                        </p>
                        {resumeData.experience.map((exp, idx) => (
                            <div key={idx} style={styles.card}>
                                <input
                                    type="text"
                                    value={exp.title}
                                    onChange={(e) => updateExperience(idx, 'title', e.target.value)}
                                    placeholder="Job Title"
                                    style={styles.input}
                                />
                                <input
                                    type="text"
                                    value={exp.company}
                                    onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                                    placeholder="Company"
                                    style={styles.input}
                                />
                                <div style={styles.gridTwo}>
                                    <input
                                        type="text"
                                        value={exp.location}
                                        onChange={(e) => updateExperience(idx, 'location', e.target.value)}
                                        placeholder="Location"
                                        style={styles.input}
                                    />
                                    <input
                                        type="text"
                                        value={`${exp.startDate} - ${exp.endDate}`}
                                        placeholder="Dates"
                                        style={styles.input}
                                        readOnly
                                    />
                                </div>
                                <label style={styles.label}>Achievements</label>
                                {exp.bullets.map((bullet, bidx) => (
                                    <textarea
                                        key={bidx}
                                        value={bullet}
                                        onChange={(e) => updateExperienceBullet(idx, bidx, e.target.value)}
                                        placeholder="Achievement"
                                        style={{ ...styles.textarea, minHeight: '3rem' }}
                                    />
                                ))}
                                <button
                                    onClick={() => deleteExperience(idx)}
                                    style={styles.deleteButton}
                                >
                                    <MaterialIcon icon="delete" size={14} />
                                    Delete
                                </button>
                            </div>
                        ))}
                        <button onClick={addExperience} style={styles.addButton}>
                            <MaterialIcon icon="add" size={16} />
                            Add Experience
                        </button>
                    </div>

                    {/* Projects */}
                    {resumeData.projects && resumeData.projects.length > 0 && (
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>Projects</h3>
                            <p style={styles.sectionHint}>
                                Showcase relevant projects with technologies used
                            </p>
                            {resumeData.projects.map((project, idx) => (
                                <div key={idx} style={styles.card}>
                                    <input
                                        type="text"
                                        value={project.name}
                                        onChange={(e) => {
                                            const updated = [...resumeData.projects!];
                                            updated[idx].name = e.target.value;
                                            setResumeData({ ...resumeData, projects: updated });
                                        }}
                                        placeholder="Project Name"
                                        style={styles.input}
                                    />
                                    <textarea
                                        value={project.description}
                                        onChange={(e) => {
                                            const updated = [...resumeData.projects!];
                                            updated[idx].description = e.target.value;
                                            setResumeData({ ...resumeData, projects: updated });
                                        }}
                                        placeholder="Project description"
                                        style={{ ...styles.textarea, minHeight: '3rem' }}
                                    />
                                    <input
                                        type="text"
                                        value={project.technologies.join(', ')}
                                        onChange={(e) => {
                                            const updated = [...resumeData.projects!];
                                            updated[idx].technologies = e.target.value.split(',').map(t => t.trim());
                                            setResumeData({ ...resumeData, projects: updated });
                                        }}
                                        placeholder="React, Node.js, MongoDB"
                                        style={styles.input}
                                    />
                                    <button
                                        onClick={() => deleteProject(idx)}
                                        style={styles.deleteButton}
                                    >
                                        <MaterialIcon icon="delete" size={14} />
                                        Delete
                                    </button>
                                </div>
                            ))}
                            <button onClick={addProject} style={styles.addButton}>
                                <MaterialIcon icon="add" size={16} />
                                Add Project
                            </button>
                        </div>
                    )}

                    {/* Education */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>Education</h3>
                        {resumeData.education.map((edu, idx) => (
                            <div key={idx} style={styles.card}>
                                <input
                                    type="text"
                                    value={edu.degree}
                                    onChange={(e) => {
                                        const updated = [...resumeData.education];
                                        updated[idx].degree = e.target.value;
                                        setResumeData({ ...resumeData, education: updated });
                                    }}
                                    placeholder="Bachelor of Science in Computer Science"
                                    style={styles.input}
                                />
                                <input
                                    type="text"
                                    value={edu.school}
                                    onChange={(e) => {
                                        const updated = [...resumeData.education];
                                        updated[idx].school = e.target.value;
                                        setResumeData({ ...resumeData, education: updated });
                                    }}
                                    placeholder="University Name"
                                    style={styles.input}
                                />
                                <div style={styles.gridTwo}>
                                    <input
                                        type="text"
                                        value={edu.location}
                                        onChange={(e) => {
                                            const updated = [...resumeData.education];
                                            updated[idx].location = e.target.value;
                                            setResumeData({ ...resumeData, education: updated });
                                        }}
                                        placeholder="City, State"
                                        style={styles.input}
                                    />
                                    <input
                                        type="text"
                                        value={edu.graduationDate}
                                        onChange={(e) => {
                                            const updated = [...resumeData.education];
                                            updated[idx].graduationDate = e.target.value;
                                            setResumeData({ ...resumeData, education: updated });
                                        }}
                                        placeholder="May 2023"
                                        style={styles.input}
                                    />
                                </div>
                                {edu.gpa && (
                                    <input
                                        type="text"
                                        value={edu.gpa}
                                        onChange={(e) => {
                                            const updated = [...resumeData.education];
                                            updated[idx].gpa = e.target.value;
                                            setResumeData({ ...resumeData, education: updated });
                                        }}
                                        placeholder="3.7/4.0"
                                        style={styles.input}
                                    />
                                )}
                                {edu.coursework && (
                                    <input
                                        type="text"
                                        value={edu.coursework}
                                        onChange={(e) => {
                                            const updated = [...resumeData.education];
                                            updated[idx].coursework = e.target.value;
                                            setResumeData({ ...resumeData, education: updated });
                                        }}
                                        placeholder="Data Structures, Algorithms, Web Development"
                                        style={styles.input}
                                    />
                                )}
                                <button
                                    onClick={() => deleteEducation(idx)}
                                    style={styles.deleteButton}
                                >
                                    <MaterialIcon icon="delete" size={14} />
                                    Delete
                                </button>
                            </div>
                        ))}
                        <button onClick={addEducation} style={styles.addButton}>
                            <MaterialIcon icon="add" size={16} />
                            Add Education
                        </button>
                    </div>

                    {/* Certifications */}
                    {resumeData.certifications && resumeData.certifications.length > 0 && (
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>Certifications</h3>
                            <p style={styles.sectionHint}>
                                List professional certifications and their year
                            </p>
                            {resumeData.certifications.map((cert, idx) => (
                                <div key={idx} style={{ marginBottom: '0.75rem' }}>
                                    <input
                                        type="text"
                                        value={cert}
                                        onChange={(e) => {
                                            const updated = [...resumeData.certifications!];
                                            updated[idx] = e.target.value;
                                            setResumeData({ ...resumeData, certifications: updated });
                                        }}
                                        placeholder="AWS Certified Cloud Practitioner (2023)"
                                        style={styles.input}
                                    />
                                    <button
                                        onClick={() => deleteCertification(idx)}
                                        style={styles.deleteButton}
                                    >
                                        <MaterialIcon icon="delete" size={14} />
                                        Delete
                                    </button>
                                </div>
                            ))}
                            <button onClick={addCertification} style={styles.addButton}>
                                <MaterialIcon icon="add" size={16} />
                                Add Certification
                            </button>
                        </div>
                    )}
                </div>

                {/* Preview Panel */}
                <div style={styles.previewPanel}>
                    <div id="resume-preview" style={styles.pdfContainer}>
                        {/* Header */}
                        <div style={styles.resumeHeader}>
                            <h1 style={styles.name}>{resumeData.personalInfo.name}</h1>
                            <div style={styles.contact}>
                                <span>{resumeData.personalInfo.location}</span>
                                <span>•</span>
                                <span>{resumeData.personalInfo.phone}</span>
                                <span>•</span>
                                <span>{resumeData.personalInfo.email}</span>
                            </div>
                        </div>

                        {/* Summary */}
                        <div style={styles.pdfSection}>
                            <h2 style={styles.pdfSectionTitle}>Professional Summary</h2>
                            <p style={styles.text}>{resumeData.summary}</p>
                        </div>

                        {/* Skills */}
                        <div style={styles.pdfSection}>
                            <h2 style={styles.pdfSectionTitle}>Core Skills</h2>
                            {resumeData.skills.map((skillGroup, idx) => (
                                <div key={idx} style={styles.skillCategory}>
                                    <span style={styles.skillCategoryName}>{skillGroup.category}:</span>
                                    <span style={styles.text}>{skillGroup.items.join(', ')}</span>
                                </div>
                            ))}
                        </div>

                        {/* Experience */}
                        <div style={styles.pdfSection}>
                            <h2 style={styles.pdfSectionTitle}>Professional Experience</h2>
                            {resumeData.experience.map((exp, idx) => (
                                <div key={idx} style={{ marginBottom: '1.25rem' }}>
                                    <div style={styles.expTitle}>{exp.title}</div>
                                    <div style={styles.expMeta}>
                                        {exp.company} • {exp.location} • {exp.startDate} - {exp.endDate}
                                    </div>
                                    {exp.bullets.map((bullet, bidx) => (
                                        <div key={bidx} style={styles.bullet}>
                                            <span style={{ position: 'absolute', left: 0 }}>•</span>
                                            {bullet}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* Projects */}
                        {resumeData.projects && resumeData.projects.length > 0 && (
                            <div style={styles.pdfSection}>
                                <h2 style={styles.pdfSectionTitle}>Projects</h2>
                                {resumeData.projects.map((project, idx) => (
                                    <div key={idx} style={{ marginBottom: '1rem' }}>
                                        <div style={styles.expTitle}>{project.name}</div>
                                        <p style={styles.text}>{project.description}</p>
                                        <p style={{ ...styles.text, marginTop: '0.25rem' }}>
                                            Technologies: {project.technologies.join(', ')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Education */}
                        <div style={styles.pdfSection}>
                            <h2 style={styles.pdfSectionTitle}>Education</h2>
                            {resumeData.education.map((edu, idx) => (
                                <div key={idx} style={{ marginBottom: '1rem' }}>
                                    <div style={styles.expTitle}>{edu.school}</div>
                                    <div style={styles.text}>{edu.degree}</div>
                                    <div style={styles.text}>{edu.location} • {edu.graduationDate}</div>
                                </div>
                            ))}
                        </div>

                        {/* Certifications */}
                        {resumeData.certifications && resumeData.certifications.length > 0 && (
                            <div style={styles.pdfSection}>
                                <h2 style={styles.pdfSectionTitle}>Certifications</h2>
                                {resumeData.certifications.map((cert, idx) => (
                                    <div key={idx} style={styles.bullet}>
                                        <span style={{ position: 'absolute', left: 0 }}>•</span>
                                        {cert}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #resume-preview, #resume-preview * {
                        visibility: visible;
                    }
                    #resume-preview {
                        position: absolute;
                        left: 0;
                        top: 0;
                    }
                }
                button:hover {
                    opacity: 0.8;
                }
            `}</style>
        </PageLayout>
    );
};
