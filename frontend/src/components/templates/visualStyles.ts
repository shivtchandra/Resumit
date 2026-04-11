/**
 * Visual Style System for Resume Templates
 * Defines 3 distinct visual styles inspired by Resume-Now templates
 */

export type VisualStyleType = 'classic' | 'modern' | 'contemporary';

interface StyleConfig {
    // Container
    pdfContainer: React.CSSProperties;
    // Header
    resumeHeader: React.CSSProperties;
    name: React.CSSProperties;
    contact: React.CSSProperties;
    // Sections
    section: React.CSSProperties;
    sectionTitle: React.CSSProperties;
    // Content
    text: React.CSSProperties;
    bullet: React.CSSProperties;
    skillCategory: React.CSSProperties;
    skillCategoryName: React.CSSProperties;
    // Experience
    jobTitle: React.CSSProperties;
    jobMeta: React.CSSProperties;
    // Projects
    projectTitle: React.CSSProperties;
    // Education
    degreeTitle: React.CSSProperties;
}

export const visualStyles: Record<VisualStyleType, StyleConfig> = {
    // Style 1: Classic - Centered, serif font, traditional (David Perez style)
    classic: {
        pdfContainer: {
            background: '#ffffff',
            padding: '3rem',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            color: '#000',
            lineHeight: '1.5'
        },
        resumeHeader: {
            textAlign: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '0.75rem',
            borderBottom: '2px solid #000'
        },
        name: {
            fontSize: '2.25rem',
            fontWeight: 400,
            marginBottom: '0.5rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
        },
        contact: {
            fontSize: '0.875rem',
            color: '#333',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.5rem 1.5rem'
        },
        section: {
            marginBottom: '1.5rem'
        },
        sectionTitle: {
            fontSize: '1rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem',
            borderBottom: '1.5px solid #000',
            paddingBottom: '0.25rem',
            textAlign: 'center'
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
            position: 'relative'
        },
        skillCategory: {
            marginBottom: '0.5rem'
        },
        skillCategoryName: {
            fontWeight: 600,
            fontSize: '0.875rem',
            marginRight: '0.5rem'
        },
        jobTitle: {
            fontWeight: 700,
            fontSize: '0.9375rem',
            marginBottom: '0.25rem'
        },
        jobMeta: {
            fontSize: '0.875rem',
            color: '#555',
            marginBottom: '0.5rem',
            fontStyle: 'italic'
        },
        projectTitle: {
            fontWeight: 700,
            fontSize: '0.9375rem',
            marginBottom: '0.25rem'
        },
        degreeTitle: {
            fontWeight: 700,
            fontSize: '0.9375rem'
        }
    },

    // Style 2: Modern - Left-aligned, sans-serif, clean (Rebecca Miller style)
    modern: {
        pdfContainer: {
            background: '#ffffff',
            padding: '2.5rem 3rem',
            fontFamily: "'Calibri', 'Arial', sans-serif",
            color: '#000',
            lineHeight: '1.4'
        },
        resumeHeader: {
            textAlign: 'left',
            marginBottom: '1.5rem',
            paddingBottom: '0',
            borderBottom: 'none'
        },
        name: {
            fontSize: '2.5rem',
            fontWeight: 700,
            marginBottom: '0.25rem',
            letterSpacing: '0',
            color: '#000'
        },
        contact: {
            fontSize: '0.8125rem',
            color: '#333',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            gap: '0.25rem 1rem'
        },
        section: {
            marginBottom: '1.25rem'
        },
        sectionTitle: {
            fontSize: '1.125rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0',
            marginBottom: '0.75rem',
            borderBottom: 'none',
            paddingBottom: '0',
            textAlign: 'left',
            color: '#000'
        },
        text: {
            fontSize: '0.875rem',
            lineHeight: '1.5',
            color: '#000'
        },
        bullet: {
            fontSize: '0.875rem',
            lineHeight: '1.5',
            color: '#000',
            marginBottom: '0.375rem',
            paddingLeft: '1.25rem',
            position: 'relative'
        },
        skillCategory: {
            marginBottom: '0.375rem'
        },
        skillCategoryName: {
            fontWeight: 700,
            fontSize: '0.875rem',
            marginRight: '0.5rem'
        },
        jobTitle: {
            fontWeight: 700,
            fontSize: '1rem',
            marginBottom: '0.125rem'
        },
        jobMeta: {
            fontSize: '0.875rem',
            color: '#333',
            marginBottom: '0.5rem',
            fontStyle: 'normal'
        },
        projectTitle: {
            fontWeight: 700,
            fontSize: '1rem',
            marginBottom: '0.125rem'
        },
        degreeTitle: {
            fontWeight: 700,
            fontSize: '1rem'
        }
    },

    // Style 3: Contemporary - Modern header, blue accents (Muriel Saunders / Blue style)
    contemporary: {
        pdfContainer: {
            background: '#ffffff',
            backgroundColor: '#ffffff',
            padding: '0 0 3rem',
            fontFamily: "'Arial', 'Helvetica', sans-serif",
            color: '#000',
            lineHeight: '1.5',
        },
        resumeHeader: {
            textAlign: 'left',
            paddingBottom: '0',
            borderBottom: 'none',
            background: '#2563eb',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '2rem 3rem',
            margin: 0,
            marginBottom: '2rem',
        },
        name: {
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            letterSpacing: '0.05em',
            color: '#ffffff',
            textTransform: 'uppercase'
        },
        contact: {
            fontSize: '0.8125rem',
            color: '#e2e8f0',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            gap: '0.25rem 1rem'
        },
        section: {
            marginBottom: '1.5rem',
            paddingLeft: '3rem',
            paddingRight: '3rem',
        },
        sectionTitle: {
            fontSize: '1rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem',
            borderBottom: 'none',
            paddingBottom: '0',
            textAlign: 'left',
            color: '#2563eb'
        },
        text: {
            fontSize: '0.875rem',
            lineHeight: '1.6',
            color: '#1a202c'
        },
        bullet: {
            fontSize: '0.875rem',
            lineHeight: '1.6',
            color: '#1a202c',
            marginBottom: '0.5rem',
            paddingLeft: '1.5rem',
            position: 'relative'
        },
        skillCategory: {
            marginBottom: '0.5rem'
        },
        skillCategoryName: {
            fontWeight: 700,
            fontSize: '0.875rem',
            marginRight: '0.5rem',
            color: '#2563eb'
        },
        jobTitle: {
            fontWeight: 700,
            fontSize: '0.9375rem',
            marginBottom: '0.25rem',
            color: '#1a202c'
        },
        jobMeta: {
            fontSize: '0.8125rem',
            color: '#4a5568',
            marginBottom: '0.5rem',
            fontStyle: 'normal'
        },
        projectTitle: {
            fontWeight: 700,
            fontSize: '0.9375rem',
            marginBottom: '0.25rem',
            color: '#1a202c'
        },
        degreeTitle: {
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: '#1a202c'
        }
    }
};

/**
 * Pick classic | modern | contemporary from `template_id`.
 * Previously used substring checks like `includes('001')`, which matched unrelated ids
 * and sent almost everything to the same default style. FNV-1a gives stable variety per id.
 */
export const getVisualStyleForTemplate = (templateId: string): VisualStyleType => {
    const styles: VisualStyleType[] = ['modern', 'classic', 'contemporary'];
    const s = String(templateId || 'default');
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return styles[h % 3];
};
