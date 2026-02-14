import { useState } from 'react';
import { ExternalLink, PenSquare, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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

export const TemplateCard = ({ template, onSelect, onPreview }: TemplateCardProps) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    const handleSelect = () => {
        onSelect?.(template.template_id);
        navigate(`/editor/${template.template_id}`);
    };

    return (
        <motion.article
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex flex-col bg-white rounded-premium border border-border-subtle hover:border-brand-primary/30 transition-all shadow-sm hover:shadow-premium overflow-hidden h-full group"
        >
            {/* Visual Header */}
            <div className="relative h-44 overflow-hidden bg-slate-50 border-b border-border-subtle">
                {template.preview_image_url ? (
                    <img
                        src={template.preview_image_url}
                        alt={template.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-8">
                        <div className="w-16 h-20 bg-white border-2 border-slate-200 rounded-sm shadow-sm flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                            <PenSquare className="text-slate-200 group-hover:text-brand-primary transition-colors" size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-text-subtle uppercase tracking-widest">Structural Blueprint</span>
                    </div>
                )}

                {/* Float Badges */}
                <div className="absolute top-3 right-3">
                    <div className="px-2.5 py-1 rounded-full bg-brand-secondary text-white text-[10px] font-black items-center gap-1 shadow-lg flex">
                        <ShieldCheck size={10} className="text-brand-primary" />
                        {Math.round(template.ats_success_rate * 100)}% ATS
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <button
                        onClick={() => onPreview?.(template.template_id)}
                        className="w-full py-2 bg-white/95 backdrop-blur-sm rounded-inner text-[10px] font-bold text-brand-secondary flex items-center justify-center gap-2 shadow-sm hover:bg-white transition-colors"
                    >
                        <ExternalLink size={12} />
                        QUICK PREVIEW
                    </button>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1 flex flex-col space-y-4">
                <div className="space-y-1">
                    <h3 className="font-heading font-extrabold text-lg text-brand-secondary leading-tight line-clamp-1">
                        {template.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                        <span className="px-1.5 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20">
                            {template.experience_level}
                        </span>
                        <span className="text-text-subtle">•</span>
                        <span className="text-text-muted">{template.role}</span>
                    </div>
                </div>

                <p className="text-sm text-text-muted leading-relaxed line-clamp-2 italic">
                    {template.description || `${template.experience_level} level template for ${template.role} professionals.`}
                </p>

                <div className="flex flex-wrap gap-1.5">
                    {template.ats_compatibility.map((vendor) => (
                        <span
                            key={vendor}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-slate-50 border border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-tighter"
                        >
                            <Check size={9} className="text-teal-500" />
                            {vendor}
                        </span>
                    ))}
                </div>

                <div className="pt-4 border-t border-slate-50 mt-auto">
                    <button
                        onClick={handleSelect}
                        className="w-full btn-primary py-2.5 text-xs flex items-center justify-center gap-2 group-hover:shadow-glow-cyan transition-all"
                    >
                        <PenSquare size={14} className="group-hover:rotate-12 transition-transform" />
                        Deploy Template
                    </button>
                </div>
            </div>
        </motion.article>
    );
};
