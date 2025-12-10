import { Card } from '@/components/ui/card';

interface JobDescriptionCardProps {
    value: string;
    onChange: (value: string) => void;
}

export const JobDescriptionCard = ({ value, onChange }: JobDescriptionCardProps) => {
    return (
        <Card className="card-base h-full flex flex-col">
            <div className="p-6 border-b border-border-subtle">
                <h3 className="font-heading font-bold text-lg text-primary">
                    Target Job Description
                </h3>
                <p className="text-sm text-text-secondary">
                    Paste the JD to enable semantic matching and keyword gap analysis
                </p>
            </div>
            <div className="flex-grow p-0">
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Paste job description here..."
                    className="w-full h-full min-h-[220px] p-6 resize-none focus:outline-none text-sm text-text-primary placeholder:text-text-muted bg-transparent font-mono"
                />
            </div>
        </Card>
    );
};
