import { X, CheckCircle2, FileText, ExternalLink } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-brand-secondary/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-premium border border-white/20 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-bg-surface/50 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-inner bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="font-heading font-extrabold text-2xl text-brand-secondary leading-none mb-1">
                                {template.name}
                            </h2>
                            <p className="text-sm text-text-muted">
                                {template.description || `${template.experience_level} level template for ${template.role}`}
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
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Info Grid */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-text-subtle uppercase tracking-widest mb-2">Primary Role</h3>
                                <p className="text-lg font-bold text-brand-secondary capitalize flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-brand-primary" />
                                    {template.role.replace(/-/g, ' ')}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-text-subtle uppercase tracking-widest mb-2">Target Experience</h3>
                                <div className="inline-flex px-3 py-1 bg-bg-surface rounded-full text-sm font-bold text-text-muted border border-border-subtle capitalize">
                                    {template.experience_level}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-text-subtle uppercase tracking-widest mb-3">ATS Compatibility Scan</h3>
                            <div className="flex flex-wrap gap-2">
                                {template.ats_compatibility.map((vendor) => (
                                    <span
                                        key={vendor}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200"
                                    >
                                        <CheckCircle2 size={12} />
                                        {vendor.charAt(0).toUpperCase() + vendor.slice(1)} Verified
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-text-subtle uppercase tracking-widest">Document Blueprint</h3>
                            <span className="text-[10px] text-brand-primary font-bold px-2 py-0.5 bg-brand-primary/5 rounded border border-brand-primary/10">High Scannability</span>
                        </div>

                        <div className="rounded-premium overflow-hidden bg-bg-surface border border-border-subtle shadow-inner">
                            {template.preview_image_url ? (
                                template.preview_image_url.endsWith('.pdf') ? (
                                    <object
                                        data={template.preview_image_url}
                                        type="application/pdf"
                                        className="w-full h-[600px]"
                                    >
                                        <div className="flex flex-col items-center justify-center p-16 text-center">
                                            <p className="text-sm text-text-muted mb-6">PDF preview not supported in your browser</p>
                                            <a
                                                href={template.preview_image_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-secondary flex items-center gap-2"
                                            >
                                                Open PDF in New Tab <ExternalLink size={16} />
                                            </a>
                                        </div>
                                    </object>
                                ) : (
                                    <img
                                        src={template.preview_image_url}
                                        alt={template.name}
                                        className="w-full h-auto"
                                    />
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center p-24 text-center">
                                    <FileText size={64} className="text-text-subtle/20 mb-4" />
                                    <p className="text-sm font-bold text-text-subtle uppercase tracking-widest">Preview generation pending</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-border-subtle bg-bg-surface/30 backdrop-blur-md flex gap-4">
                    <button
                        onClick={onClose}
                        className="btn-secondary flex-1 py-3"
                    >
                        Back to Browser
                    </button>
                    <button
                        onClick={() => {
                            navigate(`/editor/${template.template_id}`);
                            onClose();
                        }}
                        className="btn-primary flex-1 py-3"
                    >
                        Use This Logic & Style
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
