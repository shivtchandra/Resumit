import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MaterialIcon } from '../components/ui/MaterialIcon';
import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';
import { PageGuide } from '../components/layout/PageGuide';
import { WorkflowMap } from '../components/layout/WorkflowMap';
import { getProductionTemplates } from '../data/allTemplates';

const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 1024;

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

// PDF Preview Styles – kept as inline since they mimic a printed document
const pdfStyles = {
    pdfContainer: {
        background: '#ffffff',
        borderRadius: 'var(--radius-sm)',
        padding: isMobile() ? '1.25rem' : '3rem',
        maxWidth: '50rem',
        width: '100%',
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
    contactLinks: {
        marginTop: '0.5rem',
        fontSize: '0.8125rem',
        color: '#444',
        display: 'flex',
        flexWrap: 'wrap' as const,
        justifyContent: 'center',
        gap: '0.35rem 0.75rem'
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

    // Skills handlers
    const addSkillGroup = () => {
        if (!resumeData) return;
        setResumeData({
            ...resumeData,
            skills: [...resumeData.skills, { category: 'New Category', items: ['Skill'] }]
        });
    };

    const deleteSkillGroup = (index: number) => {
        if (!resumeData) return;
        const updated = resumeData.skills.filter((_, idx) => idx !== index);
        setResumeData({ ...resumeData, skills: updated });
    };

    const updateSkillGroup = (index: number, field: 'category' | 'items', value: string) => {
        if (!resumeData) return;
        const updated = [...resumeData.skills];
        if (field === 'category') {
            updated[index] = { ...updated[index], category: value };
        } else {
            updated[index] = { ...updated[index], items: value.split(',').map(s => s.trim()) };
        }
        setResumeData({ ...resumeData, skills: updated });
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
                <div className="p-12 text-center text-text-muted">Loading template...</div>
            </PageLayout>
        );
    }

    const profileLinks = [
        resumeData.personalInfo.linkedin,
        resumeData.personalInfo.github,
        resumeData.personalInfo.portfolio
    ]
        .map((link) => (link || '').trim())
        .filter((link) => Boolean(link));

    return (
        <PageLayout header={<Navbar />} maxWidth="full">
            <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-4rem)] bg-bg-page">
                {/* Editor Panel */}
                <div className="w-full lg:w-[40%] lg:max-h-[calc(100vh-4rem)] overflow-y-auto p-4 lg:p-8 bg-bg-surface border-b lg:border-b-0 lg:border-r border-border-subtle">
                    <WorkflowMap currentStep="templates" title="Template Finalization Workflow" />

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-text-main font-heading mb-2">Edit Resume</h1>
                        <p className="text-sm text-text-muted">Edit each section below to customize your resume</p>
                    </div>

                    <button onClick={handleDownloadPDF} className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-brand-secondary text-white rounded-xl text-base font-bold uppercase tracking-widest mb-8 transition-all hover:bg-slate-800 shadow-lg">
                        <MaterialIcon icon="download" size={18} />
                        Download PDF
                    </button>

                    {/* Personal Information */}
                    <div className="mb-8 pb-6 border-b border-border-subtle">
                        <h3 className="text-base font-semibold text-text-main mb-2">Personal Information</h3>
                        <p className="text-xs text-text-subtle mb-4 leading-snug">
                            Add complete contact + profile links. For tech roles, LinkedIn and GitHub are must-have.
                        </p>
                        <input type="text" value={resumeData.personalInfo.name} onChange={(e) => updatePersonalInfo('name', e.target.value)} placeholder="Full Name" className="soft-input text-sm mb-3" />
                        <input type="email" value={resumeData.personalInfo.email} onChange={(e) => updatePersonalInfo('email', e.target.value)} placeholder="Email" className="soft-input text-sm mb-3" />
                        <input type="tel" value={resumeData.personalInfo.phone} onChange={(e) => updatePersonalInfo('phone', e.target.value)} placeholder="Phone" className="soft-input text-sm mb-3" />
                        <input type="text" value={resumeData.personalInfo.location} onChange={(e) => updatePersonalInfo('location', e.target.value)} placeholder="Location" className="soft-input text-sm mb-3" />
                        <input type="text" value={resumeData.personalInfo.linkedin} onChange={(e) => updatePersonalInfo('linkedin', e.target.value)} placeholder="LinkedIn URL (required for recruiter verification)" className="soft-input text-sm mb-3" />
                        <input type="text" value={resumeData.personalInfo.github || ''} onChange={(e) => updatePersonalInfo('github', e.target.value)} placeholder="GitHub URL (recommended for technical roles)" className="soft-input text-sm mb-3" />
                        <input type="text" value={resumeData.personalInfo.portfolio || ''} onChange={(e) => updatePersonalInfo('portfolio', e.target.value)} placeholder="Portfolio URL (optional)" className="soft-input text-sm mb-3" />
                    </div>

                    {/* Summary */}
                    <div className="mb-8 pb-6 border-b border-border-subtle">
                        <h3 className="text-base font-semibold text-text-main mb-2">Professional Summary</h3>
                        <p className="text-xs text-text-subtle mb-4 leading-snug">Write a compelling 2-3 sentence summary</p>
                        <textarea value={resumeData.summary} onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })} placeholder="Professional summary" className="soft-input text-sm min-h-[5rem]" />
                    </div>

                    {/* Skills */}
                    <div className="mb-8 pb-6 border-b border-border-subtle">
                        <h3 className="text-base font-semibold text-text-main mb-2">Core Skills</h3>
                        <p className="text-xs text-text-subtle mb-4 leading-snug">Group skills by category (e.g. Technical Skills, Soft Skills)</p>
                        {resumeData.skills.map((skill, idx) => (
                            <div key={idx} className="mb-4 p-5 bg-white rounded-xl border border-border-subtle shadow-sm">
                                <input type="text" value={skill.category} onChange={(e) => updateSkillGroup(idx, 'category', e.target.value)} placeholder="Category Name" className="soft-input text-sm mb-3" />
                                <textarea value={skill.items.join(', ')} onChange={(e) => updateSkillGroup(idx, 'items', e.target.value)} placeholder="Skill 1, Skill 2, Skill 3" className="soft-input text-sm min-h-[4rem]" />
                                <button onClick={() => deleteSkillGroup(idx)} className="flex items-center justify-center gap-1.5 w-full mt-2 py-2 px-4 text-xs font-medium text-red-500 border border-red-500 rounded-lg bg-transparent hover:bg-red-50 transition-colors">
                                    <MaterialIcon icon="delete" size={14} /> Delete Category
                                </button>
                            </div>
                        ))}
                        <button onClick={addSkillGroup} className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 px-4 text-sm font-medium text-text-main border border-dashed border-text-main rounded-lg hover:bg-bg-muted transition-colors">
                            <MaterialIcon icon="add" size={16} /> Add Skill Category
                        </button>
                    </div>

                    {/* Experience */}
                    <div className="mb-8 pb-6 border-b border-border-subtle">
                        <h3 className="text-base font-semibold text-text-main mb-2">Professional Experience</h3>
                        <p className="text-xs text-text-subtle mb-4 leading-snug">List your work experience with quantifiable achievements</p>
                        {resumeData.experience.map((exp, idx) => (
                            <div key={idx} className="mb-4 p-5 bg-white rounded-xl border border-border-subtle shadow-sm">
                                <input type="text" value={exp.title} onChange={(e) => updateExperience(idx, 'title', e.target.value)} placeholder="Job Title" className="soft-input text-sm mb-3" />
                                <input type="text" value={exp.company} onChange={(e) => updateExperience(idx, 'company', e.target.value)} placeholder="Company" className="soft-input text-sm mb-3" />
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" value={exp.location} onChange={(e) => updateExperience(idx, 'location', e.target.value)} placeholder="Location" className="soft-input text-sm mb-3" />
                                    <input type="text" value={`${exp.startDate} - ${exp.endDate}`} placeholder="Dates" className="soft-input text-sm mb-3" readOnly />
                                </div>
                                <label className="block text-xs text-text-muted font-medium mb-1.5">Achievements</label>
                                {exp.bullets.map((bullet, bidx) => (
                                    <textarea key={bidx} value={bullet} onChange={(e) => updateExperienceBullet(idx, bidx, e.target.value)} placeholder="Achievement" className="soft-input text-sm min-h-[3rem] mb-2" />
                                ))}
                                <button onClick={() => deleteExperience(idx)} className="flex items-center justify-center gap-1.5 w-full mt-2 py-2 px-4 text-xs font-medium text-red-500 border border-red-500 rounded-lg bg-transparent hover:bg-red-50 transition-colors">
                                    <MaterialIcon icon="delete" size={14} /> Delete
                                </button>
                            </div>
                        ))}
                        <button onClick={addExperience} className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 px-4 text-sm font-medium text-text-main border border-dashed border-text-main rounded-lg hover:bg-bg-muted transition-colors">
                            <MaterialIcon icon="add" size={16} /> Add Experience
                        </button>
                    </div>

                    {/* Projects */}
                    {resumeData.projects && resumeData.projects.length > 0 && (
                        <div className="mb-8 pb-6 border-b border-border-subtle">
                            <h3 className="text-base font-semibold text-text-main mb-2">Projects</h3>
                            <p className="text-xs text-text-subtle mb-4 leading-snug">Showcase relevant projects with technologies used</p>
                            {resumeData.projects.map((project, idx) => (
                                <div key={idx} className="mb-4 p-5 bg-white rounded-xl border border-border-subtle shadow-sm">
                                    <input type="text" value={project.name} onChange={(e) => { const updated = [...resumeData.projects!]; updated[idx].name = e.target.value; setResumeData({ ...resumeData, projects: updated }); }} placeholder="Project Name" className="soft-input text-sm mb-3" />
                                    <textarea value={project.description} onChange={(e) => { const updated = [...resumeData.projects!]; updated[idx].description = e.target.value; setResumeData({ ...resumeData, projects: updated }); }} placeholder="Project description" className="soft-input text-sm min-h-[3rem] mb-3" />
                                    <input type="text" value={project.technologies.join(', ')} onChange={(e) => { const updated = [...resumeData.projects!]; updated[idx].technologies = e.target.value.split(',').map(t => t.trim()); setResumeData({ ...resumeData, projects: updated }); }} placeholder="React, Node.js, MongoDB" className="soft-input text-sm mb-3" />
                                    <button onClick={() => deleteProject(idx)} className="flex items-center justify-center gap-1.5 w-full mt-2 py-2 px-4 text-xs font-medium text-red-500 border border-red-500 rounded-lg bg-transparent hover:bg-red-50 transition-colors">
                                        <MaterialIcon icon="delete" size={14} /> Delete
                                    </button>
                                </div>
                            ))}
                            <button onClick={addProject} className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 px-4 text-sm font-medium text-text-main border border-dashed border-text-main rounded-lg hover:bg-bg-muted transition-colors">
                                <MaterialIcon icon="add" size={16} /> Add Project
                            </button>
                        </div>
                    )}

                    {/* Education */}
                    <div className="mb-8 pb-6 border-b border-border-subtle">
                        <h3 className="text-base font-semibold text-text-main mb-2">Education</h3>
                        {resumeData.education.map((edu, idx) => (
                            <div key={idx} className="mb-4 p-5 bg-white rounded-xl border border-border-subtle shadow-sm">
                                <input type="text" value={edu.degree} onChange={(e) => { const updated = [...resumeData.education]; updated[idx].degree = e.target.value; setResumeData({ ...resumeData, education: updated }); }} placeholder="Bachelor of Science in Computer Science" className="soft-input text-sm mb-3" />
                                <input type="text" value={edu.school} onChange={(e) => { const updated = [...resumeData.education]; updated[idx].school = e.target.value; setResumeData({ ...resumeData, education: updated }); }} placeholder="University Name" className="soft-input text-sm mb-3" />
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" value={edu.location} onChange={(e) => { const updated = [...resumeData.education]; updated[idx].location = e.target.value; setResumeData({ ...resumeData, education: updated }); }} placeholder="City, State" className="soft-input text-sm mb-3" />
                                    <input type="text" value={edu.graduationDate} onChange={(e) => { const updated = [...resumeData.education]; updated[idx].graduationDate = e.target.value; setResumeData({ ...resumeData, education: updated }); }} placeholder="May 2023" className="soft-input text-sm mb-3" />
                                </div>
                                {edu.gpa && (
                                    <input type="text" value={edu.gpa} onChange={(e) => { const updated = [...resumeData.education]; updated[idx].gpa = e.target.value; setResumeData({ ...resumeData, education: updated }); }} placeholder="3.7/4.0" className="soft-input text-sm mb-3" />
                                )}
                                {edu.coursework && (
                                    <input type="text" value={edu.coursework} onChange={(e) => { const updated = [...resumeData.education]; updated[idx].coursework = e.target.value; setResumeData({ ...resumeData, education: updated }); }} placeholder="Data Structures, Algorithms, Web Development" className="soft-input text-sm mb-3" />
                                )}
                                <button onClick={() => deleteEducation(idx)} className="flex items-center justify-center gap-1.5 w-full mt-2 py-2 px-4 text-xs font-medium text-red-500 border border-red-500 rounded-lg bg-transparent hover:bg-red-50 transition-colors">
                                    <MaterialIcon icon="delete" size={14} /> Delete
                                </button>
                            </div>
                        ))}
                        <button onClick={addEducation} className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 px-4 text-sm font-medium text-text-main border border-dashed border-text-main rounded-lg hover:bg-bg-muted transition-colors">
                            <MaterialIcon icon="add" size={16} /> Add Education
                        </button>
                    </div>

                    {/* Certifications */}
                    {resumeData.certifications && resumeData.certifications.length > 0 && (
                        <div className="mb-8 pb-6 border-b border-border-subtle">
                            <h3 className="text-base font-semibold text-text-main mb-2">Certifications</h3>
                            <p className="text-xs text-text-subtle mb-4 leading-snug">List professional certifications and their year</p>
                            {resumeData.certifications.map((cert, idx) => (
                                <div key={idx} className="mb-3">
                                    <input type="text" value={cert} onChange={(e) => { const updated = [...resumeData.certifications!]; updated[idx] = e.target.value; setResumeData({ ...resumeData, certifications: updated }); }} placeholder="AWS Certified Cloud Practitioner (2023)" className="soft-input text-sm mb-2" />
                                    <button onClick={() => deleteCertification(idx)} className="flex items-center justify-center gap-1.5 w-full py-2 px-4 text-xs font-medium text-red-500 border border-red-500 rounded-lg bg-transparent hover:bg-red-50 transition-colors">
                                        <MaterialIcon icon="delete" size={14} /> Delete
                                    </button>
                                </div>
                            ))}
                            <button onClick={addCertification} className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 px-4 text-sm font-medium text-text-main border border-dashed border-text-main rounded-lg hover:bg-bg-muted transition-colors">
                                <MaterialIcon icon="add" size={16} /> Add Certification
                            </button>
                        </div>
                    )}
                </div>

                {/* Preview Panel */}
                <div className="w-full lg:w-[60%] overflow-y-auto p-4 lg:p-12 bg-bg-page flex justify-center items-start">
                    <div id="resume-preview" style={pdfStyles.pdfContainer}>
                        {/* Header */}
                        <div style={pdfStyles.resumeHeader}>
                            <h1 style={pdfStyles.name}>{resumeData.personalInfo.name}</h1>
                            <div style={pdfStyles.contact}>
                                <span>{resumeData.personalInfo.location}</span>
                                <span>•</span>
                                <span>{resumeData.personalInfo.phone}</span>
                                <span>•</span>
                                <span>{resumeData.personalInfo.email}</span>
                            </div>
                            {profileLinks.length > 0 && (
                                <div style={pdfStyles.contactLinks}>
                                    {profileLinks.map((link, idx) => (
                                        <span key={`${link}-${idx}`}>
                                            {idx > 0 ? '• ' : ''}
                                            {link}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Summary */}
                        <div style={pdfStyles.pdfSection}>
                            <h2 style={pdfStyles.pdfSectionTitle}>Professional Summary</h2>
                            <p style={pdfStyles.text}>{resumeData.summary}</p>
                        </div>

                        {/* Skills */}
                        <div style={pdfStyles.pdfSection}>
                            <h2 style={pdfStyles.pdfSectionTitle}>Core Skills</h2>
                            {resumeData.skills.map((skillGroup, idx) => (
                                <div key={idx} style={pdfStyles.skillCategory}>
                                    <span style={pdfStyles.skillCategoryName}>{skillGroup.category}:</span>
                                    <span style={pdfStyles.text}>{skillGroup.items.join(', ')}</span>
                                </div>
                            ))}
                        </div>

                        {/* Experience */}
                        <div style={pdfStyles.pdfSection}>
                            <h2 style={pdfStyles.pdfSectionTitle}>Professional Experience</h2>
                            {resumeData.experience.map((exp, idx) => (
                                <div key={idx} style={{ marginBottom: '1.25rem' }}>
                                    <div style={pdfStyles.expTitle}>{exp.title}</div>
                                    <div style={pdfStyles.expMeta}>
                                        {exp.company} • {exp.location} • {exp.startDate} - {exp.endDate}
                                    </div>
                                    {exp.bullets.map((bullet, bidx) => (
                                        <div key={bidx} style={pdfStyles.bullet}>
                                            <span style={{ position: 'absolute', left: 0 }}>•</span>
                                            {bullet}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* Projects */}
                        {resumeData.projects && resumeData.projects.length > 0 && (
                            <div style={pdfStyles.pdfSection}>
                                <h2 style={pdfStyles.pdfSectionTitle}>Projects</h2>
                                {resumeData.projects.map((project, idx) => (
                                    <div key={idx} style={{ marginBottom: '1rem' }}>
                                        <div style={pdfStyles.expTitle}>{project.name}</div>
                                        <p style={pdfStyles.text}>{project.description}</p>
                                        <p style={{ ...pdfStyles.text, marginTop: '0.25rem' }}>
                                            Technologies: {project.technologies.join(', ')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Education */}
                        <div style={pdfStyles.pdfSection}>
                            <h2 style={pdfStyles.pdfSectionTitle}>Education</h2>
                            {resumeData.education.map((edu, idx) => (
                                <div key={idx} style={{ marginBottom: '1rem' }}>
                                    <div style={pdfStyles.expTitle}>{edu.school}</div>
                                    <div style={pdfStyles.text}>{edu.degree}</div>
                                    <div style={pdfStyles.text}>{edu.location} • {edu.graduationDate}</div>
                                </div>
                            ))}
                        </div>

                        {/* Certifications */}
                        {resumeData.certifications && resumeData.certifications.length > 0 && (
                            <div style={pdfStyles.pdfSection}>
                                <h2 style={pdfStyles.pdfSectionTitle}>Certifications</h2>
                                {resumeData.certifications.map((cert, idx) => (
                                    <div key={idx} style={pdfStyles.bullet}>
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
