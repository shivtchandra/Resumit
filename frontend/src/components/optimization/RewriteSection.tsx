import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, RefreshCw, Check } from 'lucide-react';

interface RewriteSectionProps {
    title: string;
    originalContent: string;
    onSave: (content: string) => void;
}

export const RewriteSection = ({ title, originalContent, onSave }: RewriteSectionProps) => {
    const [content, setContent] = useState(originalContent);
    const [isRewriting, setIsRewriting] = useState(false);
    const [suggestion, setSuggestion] = useState<string | null>(null);

    const handleAiRewrite = async () => {
        setIsRewriting(true);
        // Simulate AI delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSuggestion(
            "Experienced Senior DevOps Engineer with 7+ years of expertise in automating CI/CD pipelines, managing Kubernetes clusters, and optimizing cloud infrastructure on AWS. Proven track record of reducing deployment time by 40% and improving system reliability by 99.9%."
        );
        setIsRewriting(false);
    };

    const applySuggestion = () => {
        if (suggestion) {
            setContent(suggestion);
            setSuggestion(null);
        }
    };

    return (
        <Card className="card-base p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-heading font-bold text-lg text-primary">{title}</h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAiRewrite}
                    disabled={isRewriting}
                    className="text-brand-blue border-brand-blue/20 hover:bg-brand-blue/5"
                >
                    {isRewriting ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Wand2 className="w-4 h-4 mr-2" />
                    )}
                    AI Rewrite
                </Button>
            </div>

            <div className="space-y-4">
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[120px] font-sans text-sm resize-y"
                />

                {suggestion && (
                    <div className="bg-brand-blue-light/30 border border-brand-blue/20 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">
                                Tactical Suggestion
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-text-muted hover:text-primary"
                                    onClick={() => setSuggestion(null)}
                                >
                                    Dismiss
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-6 text-xs bg-brand-blue hover:bg-brand-blue/90 text-white"
                                    onClick={applySuggestion}
                                >
                                    <Check className="w-3 h-3 mr-1" />
                                    Apply
                                </Button>
                            </div>
                        </div>
                        <p className="text-sm text-text-primary">{suggestion}</p>
                    </div>
                )}

                <div className="flex justify-end">
                    <Button onClick={() => onSave(content)}>Save Changes</Button>
                </div>
            </div>
        </Card>
    );
};
