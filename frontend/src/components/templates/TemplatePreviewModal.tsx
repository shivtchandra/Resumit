import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface TemplatePreviewModalProps {
    template: {
        template_id: string;
        name: string;
        role: string;
        experience_level: string;
        ats_compatibility: string[];
        preview_image_url?: string;
        description?: string;
    };
    onClose: () => void;
}

export const TemplatePreviewModal = ({ template, onClose }: TemplatePreviewModalProps) => {
    const navigate = useNavigate();

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ background: 'rgba(15, 20, 25, 0.9)' }}
            onClick={onClose}
        >
            <div
                className="relative max-w-4xl w-full max-h-[90vh] overflow-auto rounded-2xl"
                style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border-subtle)',
                    boxShadow: 'var(--shadow-float)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="sticky top-0 z-10 flex items-center justify-between p-6 border-b backdrop-blur-sm"
                    style={{
                        background: 'rgba(30, 36, 51, 0.95)',
                        borderColor: 'var(--color-border-subtle)',
                    }}
                >
                    <div>
                        <h2
                            className="font-heading font-bold text-2xl mb-1"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            {template.name}
                        </h2>
                        <p
                            className="text-sm"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            {template.description || `${template.experience_level} level template for ${template.role}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-all hover:scale-110"
                        style={{
                            background: 'var(--color-bg-elevated)',
                            color: 'var(--color-text-primary)',
                        }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Template Info */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3
                                className="font-heading font-semibold text-sm mb-2"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                Role
                            </h3>
                            <p
                                className="font-medium capitalize"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                {template.role.replace(/-/g, ' ')}
                            </p>
                        </div>
                        <div>
                            <h3
                                className="font-heading font-semibold text-sm mb-2"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                Experience Level
                            </h3>
                            <p
                                className="font-medium capitalize"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                {template.experience_level}
                            </p>
                        </div>
                    </div>

                    {/* ATS Compatibility */}
                    <div className="mb-6">
                        <h3
                            className="font-heading font-semibold text-sm mb-3"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            ATS Compatibility
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {template.ats_compatibility.map((vendor) => (
                                <span
                                    key={vendor}
                                    className="px-3 py-1 rounded-full text-sm font-medium"
                                    style={{
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        color: 'var(--color-accent-green)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                    }}
                                >
                                    ✓ {vendor.charAt(0).toUpperCase() + vendor.slice(1)}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Preview Image/PDF */}
                    <div>
                        <h3
                            className="font-heading font-semibold text-sm mb-3"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            Template Preview
                        </h3>
                        <div
                            className="rounded-lg overflow-hidden"
                            style={{
                                background: 'var(--color-bg-elevated)',
                                border: '1px solid var(--color-border-subtle)',
                            }}
                        >
                            {template.preview_image_url ? (
                                template.preview_image_url.endsWith('.pdf') ? (
                                    /* PDF Preview */
                                    <object
                                        data={template.preview_image_url}
                                        type="application/pdf"
                                        className="w-full h-[600px]"
                                    >
                                        <div className="flex flex-col items-center justify-center p-12 text-center">
                                            <p
                                                className="text-sm mb-4"
                                                style={{ color: 'var(--color-text-secondary)' }}
                                            >
                                                PDF preview not supported in your browser
                                            </p>
                                            <a
                                                href={template.preview_image_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                                                style={{
                                                    background: 'var(--color-accent-cyan)',
                                                    color: 'var(--color-bg-dark)',
                                                }}
                                            >
                                                Open PDF in New Tab
                                            </a>
                                        </div>
                                    </object>
                                ) : (
                                    /* Image Preview */
                                    <img
                                        src={template.preview_image_url}
                                        alt={template.name}
                                        className="w-full h-auto"
                                    />
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center p-12 text-center">
                                    <div
                                        className="w-24 h-32 mb-4 rounded border-2 border-dashed opacity-30"
                                        style={{ borderColor: 'var(--color-text-tertiary)' }}
                                    />
                                    <p
                                        className="text-sm"
                                        style={{ color: 'var(--color-text-tertiary)' }}
                                    >
                                        Preview not available
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                            style={{
                                background: 'var(--color-bg-elevated)',
                                color: 'var(--color-text-primary)',
                                border: '1px solid var(--color-border-subtle)',
                            }}
                        >
                            Close
                        </button>
                        <button
                            onClick={() => {
                                navigate(`/templates/${template.template_id}`);
                                onClose();
                            }}
                            className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                            style={{
                                background: 'var(--color-accent-cyan)',
                                color: 'var(--color-bg-dark)',
                                boxShadow: 'var(--shadow-glow-cyan)',
                            }}
                        >
                            Use This Template
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
