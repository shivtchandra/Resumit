import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';

type StepId = 'analysis' | 'templates' | 'fix' | 'github';

interface WorkflowMapProps {
    currentStep?: StepId;
    title?: string;
}

const WORKFLOW_STEPS: Array<{
    id: StepId;
    label: string;
    description: string;
    to: string;
}> = [
        {
            id: 'analysis',
            label: 'Analyze',
            description: 'Find issues and priorities',
            to: '/analysis',
        },
        {
            id: 'templates',
            label: 'Templates',
            description: 'Choose ATS-safe structure',
            to: '/templates',
        },
        {
            id: 'fix',
            label: 'Resume Fix Lab',
            description: 'Rewrite and practice answers',
            to: '/resume-fix-lab',
        },
        {
            id: 'github',
            label: 'GitHub',
            description: 'Pick strongest project proof',
            to: '/github',
        },
    ];

export const WorkflowMap = ({ currentStep, title = 'PRO-PHASE WORKFLOW' }: WorkflowMapProps) => {
    const currentIndex = currentStep
        ? WORKFLOW_STEPS.findIndex((step) => step.id === currentStep)
        : -1;

    return (
        <section className="bg-white rounded-premium border border-border-subtle p-6 mb-6 hover:shadow-premium transition-shadow duration-300">
            <h3 className="text-[10px] font-black tracking-[0.2em] text-brand-primary uppercase mb-4 flex items-center gap-2">
                <span className="w-8 h-[1px] bg-brand-primary/40" />
                {title}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {WORKFLOW_STEPS.map((step, index) => {
                    const isCurrent = currentIndex === index;
                    const isDone = currentIndex > index;

                    return (
                        <Link
                            key={step.id}
                            to={step.to}
                            className={`relative group transition-all duration-300 no-underline ${isCurrent
                                ? 'scale-[1.02] z-10'
                                : 'opacity-60 hover:opacity-100'
                                }`}
                        >
                            <motion.div
                                initial={false}
                                animate={{
                                    borderColor: isCurrent ? 'var(--color-brand-primary)' : 'var(--color-border-subtle)',
                                    backgroundColor: isCurrent ? '#ffffff' : 'var(--color-bg-muted)',
                                    boxShadow: isCurrent ? '0 8px 20px -4px rgba(20, 184, 166, 0.15)' : 'none'
                                }}
                                className={`h-full border rounded-xl p-4 flex flex-col gap-2 transition-all ${isCurrent ? 'border-brand-primary ring-2 ring-brand-primary/10' : ''
                                    } ${isDone ? 'bg-emerald-50/40 border-emerald-200' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] font-black tracking-widest ${isCurrent ? 'text-brand-primary' : isDone ? 'text-emerald-600' : 'text-text-subtle'
                                        }`}>
                                        PHASE 0{index + 1}
                                    </span>
                                    {isDone ? (
                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                    ) : isCurrent ? (
                                        <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                                    ) : (
                                        <Circle size={14} className="text-slate-200" />
                                    )}
                                </div>

                                <h4 className={`text-sm font-bold tracking-tight ${isCurrent ? 'text-brand-secondary' : 'text-text-muted'
                                    }`}>
                                    {step.label}
                                </h4>

                                <p className={`text-[11px] leading-relaxed ${isCurrent ? 'text-text-muted' : 'text-text-subtle'
                                    }`}>
                                    {step.description}
                                </p>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
};
