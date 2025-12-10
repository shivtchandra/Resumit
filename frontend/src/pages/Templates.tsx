import { useState, useEffect } from 'react';
import { MaterialIcon } from '../components/ui/MaterialIcon';
import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';
import { TemplateCard } from '../components/templates/TemplateCard';
import { PDFPreviewModal } from '../components/templates/PDFPreviewModal';
import { LoadingSpinner } from '../components/ui/Loading';
import { getProductionTemplates } from '../data/allTemplates';
import type { ResumeTemplate } from '../data/realisticTemplates';

const styles = {
    container: {
        display: 'flex',
        minHeight: 'calc(100vh - 4rem)',
        background: 'var(--bg-page)'
    },
    sidebar: {
        width: '18rem',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-subtle)',
        padding: '2rem 1.5rem',
        overflowY: 'auto' as const,
        position: 'sticky' as const,
        top: '4rem',
        height: 'calc(100vh - 4rem)'
    },
    sidebarHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '2rem'
    },
    sidebarTitle: {
        fontFamily: "var(--font-heading)",
        fontSize: '1.25rem',
        fontWeight: 700,
        color: 'var(--text-main)'
    },
    filterGroup: {
        marginBottom: '2rem'
    },
    filterLabel: {
        fontSize: '0.75rem',
        fontWeight: 600,
        color: 'var(--text-subtle)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        marginBottom: '1rem'
    },
    filterOptions: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0.5rem'
    },
    filterOption: (active: boolean) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.625rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: active ? 'var(--bg-surface)' : 'transparent',
        border: `1px solid ${active ? 'var(--border-subtle)' : 'transparent'}`,
        color: active ? 'var(--text-main)' : 'var(--text-muted)',
        fontWeight: active ? 600 : 400
    }),
    checkbox: (checked: boolean) => ({
        width: '1.125rem',
        height: '1.125rem',
        borderRadius: '4px',
        border: `1px solid ${checked ? 'var(--text-main)' : 'var(--text-subtle)'}`,
        background: checked ? 'var(--text-main)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: '#ffffff'
    }),
    main: {
        flex: 1,
        padding: '2rem 3rem',
        overflowY: 'auto' as const
    },
    header: {
        marginBottom: '2.5rem'
    },
    title: {
        fontFamily: "var(--font-heading)",
        fontSize: '2.5rem',
        fontWeight: 700,
        color: 'var(--text-main)',
        marginBottom: '0.5rem',
        letterSpacing: '-0.02em'
    },
    subtitle: {
        fontSize: '1.125rem',
        color: 'var(--text-muted)'
    },
    searchContainer: {
        position: 'relative' as const,
        marginBottom: '2rem',
        maxWidth: '40rem'
    },
    searchIcon: {
        position: 'absolute' as const,
        left: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--text-subtle)',
        pointerEvents: 'none' as const
    },
    searchInput: {
        width: '100%',
        padding: '1rem 1rem 1rem 3rem',
        background: 'white',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-main)',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.2s'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(22rem, 1fr))',
        gap: '2rem'
    },
    loadingContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '20rem'
    },
    resultsCount: {
        fontSize: '0.875rem',
        color: 'var(--text-subtle)',
        marginBottom: '1.5rem',
        fontWeight: 500
    }
};

export const Templates = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [selectedLevel, setSelectedLevel] = useState<string>('');
    const [selectedATS, setSelectedATS] = useState<string[]>([]);
    const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
    const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load all 20 templates
        setLoading(true);
        try {
            const allTemplates = getProductionTemplates();
            console.log('Loaded templates:', allTemplates.length); // Debug log
            setTemplates(allTemplates);
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Filter templates
    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.content.personalInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.metadata.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.metadata.template_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = !selectedRole || template.metadata.role === selectedRole;
        const matchesLevel = !selectedLevel || template.metadata.experience_level === selectedLevel;
        const matchesATS = selectedATS.length === 0 ||
            selectedATS.some(ats => template.metadata.ats_compatibility.includes(ats));

        return matchesSearch && matchesRole && matchesLevel && matchesATS;
    });

    const handleATSToggle = (ats: string) => {
        setSelectedATS(prev =>
            prev.includes(ats) ? prev.filter(a => a !== ats) : [...prev, ats]
        );
    };

    const handlePreview = (templateId: string) => {
        const template = templates.find(t => t.metadata.template_id === templateId);
        if (template) {
            setPreviewTemplate(template);
        }
    };

    return (
        <PageLayout header={<Navbar />} maxWidth="full">
            <div style={styles.container}>
                {/* Sidebar Filter */}
                <aside style={styles.sidebar}>
                    <div style={styles.sidebarHeader}>
                        <MaterialIcon icon="filter_list" size={20} style={{ color: 'var(--accent-primary)' }} />
                        <h2 style={styles.sidebarTitle}>
                            Filter Templates
                        </h2>
                    </div>

                    {/* Role Filter */}
                    <div style={styles.filterGroup}>
                        <h3 style={styles.filterLabel}>
                            Role
                        </h3>
                        <div style={styles.filterOptions}>
                            {['Software Engineer', 'Product Manager', 'Data Scientist', 'Designer', 'Marketing'].map((role) => (
                                <div
                                    key={role}
                                    style={styles.filterOption(selectedRole === role)}
                                    onClick={() => setSelectedRole(selectedRole === role ? '' : role)}
                                >
                                    <div style={styles.checkbox(selectedRole === role)}>
                                        {selectedRole === role && <MaterialIcon icon="check" size={12} style={{ color: '#ffffff' }} />}
                                    </div>
                                    <span>{role}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Experience Level Filter */}
                    <div style={styles.filterGroup}>
                        <h3 style={styles.filterLabel}>
                            Experience Level
                        </h3>
                        <div style={styles.filterOptions}>
                            {['Entry', 'Mid', 'Senior', 'Executive'].map((level) => (
                                <div
                                    key={level}
                                    style={styles.filterOption(selectedLevel === level)}
                                    onClick={() => setSelectedLevel(selectedLevel === level ? '' : level)}
                                >
                                    <div style={styles.checkbox(selectedLevel === level)}>
                                        {selectedLevel === level && <MaterialIcon icon="check" size={12} style={{ color: '#ffffff' }} />}
                                    </div>
                                    <span>{level}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ATS Compatibility Filter */}
                    <div style={styles.filterGroup}>
                        <h3 style={styles.filterLabel}>
                            ATS System
                        </h3>
                        <div style={styles.filterOptions}>
                            {['taleo', 'workday', 'greenhouse', 'icims'].map((ats) => (
                                <div
                                    key={ats}
                                    style={styles.filterOption(selectedATS.includes(ats))}
                                    onClick={() => handleATSToggle(ats)}
                                >
                                    <div style={styles.checkbox(selectedATS.includes(ats))}>
                                        {selectedATS.includes(ats) && <MaterialIcon icon="check" size={12} style={{ color: '#ffffff' }} />}
                                    </div>
                                    <span style={{ textTransform: 'capitalize' }}>{ats}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main style={styles.main}>
                    <div style={styles.header}>
                        <h1 style={styles.title}>
                            Resume Templates
                        </h1>
                        <p style={styles.subtitle}>
                            {templates.length} production-ready, ATS-optimized templates
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div style={styles.searchContainer}>
                        <div style={styles.searchIcon}>
                            <MaterialIcon icon="search" size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, role, or keyword..."
                            style={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Results Count */}
                    <div style={styles.resultsCount}>
                        Showing {filteredTemplates.length} of {templates.length} templates
                    </div>

                    {loading ? (
                        <div style={styles.loadingContainer}>
                            <LoadingSpinner size="lg" message="Loading templates..." />
                        </div>
                    ) : (
                        <div style={styles.grid}>
                            {filteredTemplates.map((template) => (
                                <TemplateCard
                                    key={template.metadata.template_id}
                                    template={{
                                        template_id: template.metadata.template_id,
                                        name: template.metadata.template_name,
                                        role: template.metadata.role,
                                        experience_level: template.metadata.experience_level,
                                        ats_compatibility: template.metadata.ats_compatibility,
                                        ats_success_rate: template.metadata.ats_success_rate,
                                        description: template.metadata.description
                                    }}
                                    onPreview={() => handlePreview(template.metadata.template_id)}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {previewTemplate && (
                <PDFPreviewModal
                    template={previewTemplate}
                    onClose={() => setPreviewTemplate(null)}
                />
            )}
        </PageLayout>
    );
};
