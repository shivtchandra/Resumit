import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Issue {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    fix?: string;
}

interface IssueAccordionProps {
    issues: Issue[];
}

export const IssueAccordion = ({ issues }: IssueAccordionProps) => {
    const getIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertCircle className="w-5 h-5 text-signal-danger" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-signal-warning" />;
            case 'info': return <CheckCircle2 className="w-5 h-5 text-brand-blue" />;
            default: return null;
        }
    };

    return (
        <Accordion type="single" collapsible className="w-full space-y-2">
            {issues.map((issue) => (
                <AccordionItem
                    key={issue.id}
                    value={issue.id}
                    className="border border-border-subtle rounded-lg bg-surface px-4"
                >
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center space-x-3 text-left">
                            {getIcon(issue.severity)}
                            <div>
                                <span className="font-medium text-primary block">{issue.title}</span>
                                <span className="text-xs text-text-muted font-normal uppercase tracking-wider">
                                    {issue.severity} Priority
                                </span>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-0 pb-4 pl-8">
                        <p className="text-sm text-text-secondary mb-3">{issue.description}</p>
                        {issue.fix && (
                            <div className="bg-slate-50 p-3 rounded border border-border-subtle">
                                <p className="text-xs font-bold text-primary mb-1">TACTICAL FIX:</p>
                                <p className="text-sm text-text-secondary">{issue.fix}</p>
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
};
