import { ExternalLink, Download, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TemplateCardProps {
    template: {
        template_id: string;
        name: string;
        role: string;
        experience_level: string;
        ats_compatibility: string[];
        ats_success_rate: number;
        description?: string;
        preview_image_url?: string;
    };
    onSelect?: (templateId: string) => void;
    onPreview?: (templateId: string) => void;
}

const styles = {
    card: {
        overflow: 'hidden',
        transition: 'all 0.3s',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-soft)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100%'
    },
    cardHover: {
        transform: 'translateY(-4px)',
        boxShadow: 'var(--shadow-hover)'
    },
    imageContainer: {
        position: 'relative' as const,
        height: '12rem',
        overflow: 'hidden',
        background: 'var(--bg-subtle)',
        borderBottom: '1px solid var(--border-subtle)'
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
        transition: 'transform 0.5s ease'
    },
    imageHover: {
        transform: 'scale(1.05)'
    },
    placeholder: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-subtle)'
    },
    placeholderContent: {
        textAlign: 'center' as const,
        padding: '1.5rem',
        color: 'var(--text-muted)'
    },
    placeholderIcon: {
        width: '4rem',
        height: '5rem',
        margin: '0 auto 0.5rem',
        borderRadius: '2px',
        border: '2px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        opacity: 0.8
    },
    badge: {
        position: 'absolute' as const,
        top: '0.75rem',
        right: '0.75rem',
        padding: '0.25rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.75rem',
        fontWeight: 600,
        backdropFilter: 'blur(8px)',
        background: 'rgba(255, 255, 255, 0.9)',
        color: 'var(--accent-secondary)',
        border: '1px solid var(--accent-secondary)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    content: {
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem',
        flex: 1
    },
    title: {
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        fontSize: '1.25rem',
        marginBottom: '0.25rem',
        color: 'var(--text-main)',
        lineHeight: 1.3
    },
    description: {
        fontSize: '0.875rem',
        color: 'var(--text-muted)',
        lineHeight: 1.5
    },
    badgesContainer: {
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: '0.5rem'
    },
    compatibilityBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.6rem',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: 'rgba(27, 142, 242, 0.08)',
        color: 'var(--accent-primary)',
        border: '1px solid rgba(27, 142, 242, 0.2)'
    },
    meta: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.75rem',
        color: 'var(--text-subtle)',
        fontWeight: 500,
        marginTop: 'auto',
        paddingTop: '0.5rem'
    },
    metaItem: {
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em'
    },
    actions: {
        display: 'flex',
        gap: '0.75rem',
        paddingTop: '0.5rem',
        marginTop: '0.5rem',
        borderTop: '1px solid var(--border-subtle)'
    },
    previewButton: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.6rem 1rem',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.875rem',
        fontWeight: 600,
        transition: 'all 0.2s',
        background: 'transparent',
        color: 'var(--text-main)',
        border: '1px solid var(--border-subtle)',
        cursor: 'pointer'
    },
    selectButton: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.6rem 1rem',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.875rem',
        fontWeight: 600,
        transition: 'all 0.2s',
        background: 'var(--accent-primary)',
        color: '#ffffff',
        boxShadow: '0 4px 12px rgba(27, 142, 242, 0.2)',
        border: 'none',
        cursor: 'pointer'
    },
    selectButtonHover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 16px rgba(27, 142, 242, 0.3)'
    }
};

export const TemplateCard = ({ template, onSelect, onPreview }: TemplateCardProps) => {
    const navigate = useNavigate();

    const handleSelect = () => {
        if (onSelect) {
            onSelect(template.template_id);
        }
        navigate(`/editor/${template.template_id}`);
    };

    return (
        <div style={styles.card}>
            {/* Preview Image */}
            <div style={styles.imageContainer}>
                {template.preview_image_url ? (
                    <img
                        src={template.preview_image_url}
                        alt={template.name}
                        style={styles.image}
                    />
                ) : (
                    <div style={styles.placeholder}>
                        <div style={styles.placeholderContent}>
                            <div style={styles.placeholderIcon} />
                            <p style={{ fontSize: '0.75rem' }}>Template Preview</p>
                        </div>
                    </div>
                )}

                {/* Success Rate Badge */}
                <div style={styles.badge}>
                    {Math.round(template.ats_success_rate * 100)}% ATS Success
                </div>
            </div>

            {/* Content */}
            <div style={styles.content}>
                <div>
                    <h3 style={styles.title}>
                        {template.name}
                    </h3>
                    <p style={styles.description}>
                        {template.description || `${template.experience_level} level template for ${template.role}`}
                    </p>
                </div>

                {/* ATS Compatibility Badges */}
                <div style={styles.badgesContainer}>
                    {template.ats_compatibility.map((vendor) => (
                        <span key={vendor} style={styles.compatibilityBadge}>
                            <Check style={{ width: '0.75rem', height: '0.75rem' }} />
                            {vendor.charAt(0).toUpperCase() + vendor.slice(1)}
                        </span>
                    ))}
                </div>

                {/* Meta Info */}
                <div style={styles.meta}>
                    <span style={styles.metaItem}>{template.experience_level}</span>
                    <span>•</span>
                    <span style={styles.metaItem}>{template.role.replace(/-/g, ' ')}</span>
                </div>

                {/* Actions */}
                <div style={styles.actions}>
                    <button
                        onClick={() => onPreview?.(template.template_id)}
                        style={styles.previewButton}
                    >
                        <ExternalLink style={{ width: '1rem', height: '1rem' }} />
                        Preview
                    </button>
                    <button
                        onClick={handleSelect}
                        style={styles.selectButton}
                    >
                        <Download style={{ width: '1rem', height: '1rem' }} />
                        Use Template
                    </button>
                </div>
            </div>
        </div>
    );
};
