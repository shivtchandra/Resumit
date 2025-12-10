import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';

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
    const templates: Template[] = [
        {
            id: 'modern-tech',
            name: 'Modern Tech Professional',
            description: 'Clean, skills-focused layout optimized for engineering roles. High readability for both humans and ATS.',
            tags: ['DevOps', 'Engineering', 'Clean'],
            recommended: true,
            atsCompatible: ['Workday', 'Greenhouse', 'Lever']
        },
        {
            id: 'executive-brief',
            name: 'Executive Brief',
            description: 'Concise, impact-driven format for leadership positions. Emphasizes metrics and achievements.',
            tags: ['Management', 'Leadership', 'Minimal'],
            atsCompatible: ['Taleo', 'iCIMS']
        },
        {
            id: 'creative-portfolio',
            name: 'Creative Portfolio',
            description: 'Visual layout with subtle design elements. Best for design and frontend roles where aesthetics matter.',
            tags: ['Design', 'Frontend', 'Creative'],
            atsCompatible: ['Greenhouse', 'Lever']
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
                <Card
                    key={template.id}
                    className={`card-base p-0 overflow-hidden flex flex-col transition-all hover:shadow-float ${template.recommended ? 'ring-2 ring-brand-blue' : ''
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
                    </div>
                </Card>
            ))}
        </div>
    );
};
