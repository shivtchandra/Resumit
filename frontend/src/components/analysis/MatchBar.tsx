import { Progress } from '@/components/ui/progress';

interface MatchBarProps {
    score: number;
    label: string;
    role: string;
}

export const MatchBar = ({ score, label, role }: MatchBarProps) => {
    return (
        <div className="w-full p-4">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h3 className="font-heading font-bold text-lg text-primary">{label}</h3>
                    <p className="text-sm text-text-secondary">Target: <span className="font-medium text-primary">{role}</span></p>
                </div>
                <span className="text-2xl font-heading font-bold text-brand-blue">{score}%</span>
            </div>
            <Progress value={score} className="h-3 bg-slate-100" indicatorClassName="bg-brand-blue" />
            <div className="flex justify-between mt-2 text-xs text-text-muted">
                <span>Low Match</span>
                <span>Strong Match</span>
            </div>
        </div>
    );
};
