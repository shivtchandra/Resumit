import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import { getTemplates } from '@/services/api';

interface Template {
    id: string;
    name: string;
    description: string;
    tags: string[];
    recommended?: boolean;
    atsCompatible: string[];
}

interface TemplateSelectorProps {
    role: string;
    onSelect: (templateId: string) => void;
}

export const TemplateSelector = ({ role, onSelect }: TemplateSelectorProps) => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    useEffect(() => {
        const roleMap: Record<string, string> = {
            'software engineer': 'software-engineer',
            'frontend developer': 'frontend-developer',
            'backend developer': 'backend-developer',
            'data scientist': 'data-scientist',
            'product manager': 'product-manager',
            'designer': 'designer',
            'devops': 'devops-engineer'
        };
        const normalizedRole = roleMap[role.toLowerCase()] || 'software-engineer';

        const loadTemplates = async () => {
            const response = await getTemplates({ role: normalizedRole });
            const mapped: Template[] = response.map((item, index) => ({
                id: item.template_id,
                name: item.name,
                description: item.description || 'ATS-optimized layout with recruiter-friendly hierarchy.',
                tags: [item.role, item.experience_level, ...item.ats_compatibility.slice(0, 1)].map(tag => tag.replace(/-/g, ' ')),
                recommended: index === 0,
                atsCompatible: item.ats_compatibility.map(v => v.toUpperCase())
            }));
            setTemplates(mapped);
        };

        void loadTemplates();
    }, [role]);

    const hasTemplates = useMemo(() => templates.length > 0, [templates]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!hasTemplates && (
                <Card className="card-base p-6">
                    <p className="text-sm text-text-secondary">Loading templates...</p>
                </Card>
            )}
            {templates.map((template) => (
                <Card
                    key={template.id}
                    className={`card-base p-0 overflow-hidden flex flex-col transition-all hover:shadow-float ${template.recommended ? 'ring-2 ring-brand-blue' : ''
                        } ${selectedTemplateId === template.id ? 'border-brand-blue' : ''
                        }`}
                >
                    {/* Preview Placeholder */}
                    <div className="h-48 bg-slate-100 border-b border-border-subtle relative group">
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 backdrop-blur-[1px]">
                            <Button variant="secondary" size="sm" onClick={() => onSelect(template.id)}>
                                Preview Template
                            </Button>
                        </div>
                        {template.recommended && (
                            <div className="absolute top-2 right-2">
                                <Badge className="bg-brand-blue text-white hover:bg-brand-blue">
                                    <Star className="w-3 h-3 mr-1 fill-current" />
                                    Recommended
                                </Badge>
                            </div>
                        )}
                    </div>

                    <div className="p-5 flex-grow flex flex-col">
                        <div className="mb-4">
                            <h3 className="font-heading font-bold text-lg text-primary mb-1">{template.name}</h3>
                            <p className="text-sm text-text-secondary line-clamp-2">{template.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {template.tags.map(tag => (
                                <span key={tag} className="text-xs bg-slate-100 text-text-secondary px-2 py-1 rounded">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="mt-auto pt-4 border-t border-border-subtle">
                            <p className="text-xs font-bold text-text-muted uppercase mb-2">ATS Compatibility</p>
                            <div className="flex flex-wrap gap-2">
                                {template.atsCompatible.map(ats => (
                                    <div key={ats} className="flex items-center text-xs text-signal-success">
                                        <Check className="w-3 h-3 mr-1" />
                                        {ats}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button className="w-full mt-4" onClick={() => onSelect(template.id)}>
                            Use Template
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => {
                                setSelectedTemplateId(template.id);
                                onSelect(template.id);
                            }}
                        >
                            Select This Template
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
};
