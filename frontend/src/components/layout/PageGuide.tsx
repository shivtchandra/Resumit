import { Link } from 'react-router-dom';
import { Sparkles, Target, Zap, Lightbulb, ArrowRight } from 'lucide-react';

type GuideAction = {
    label: string;
    to: string;
};

interface PageGuideProps {
    badge?: string;
    title: string;
    description: string;
    whatThisPageDoes: string;
    bestUseCase: string;
    howToUse: string[];
    makeMostOfIt: string[];
    primaryAction?: GuideAction;
    secondaryAction?: GuideAction;
}

export const PageGuide = ({
    badge = 'STRATEGY GUIDE',
    title,
    description,
    whatThisPageDoes,
    bestUseCase,
    howToUse,
    makeMostOfIt,
    primaryAction,
    secondaryAction,
}: PageGuideProps) => {
    return (
        <section className="relative overflow-hidden bg-white rounded-premium p-8 lg:p-10 border border-border-subtle mb-8 group hover:shadow-premium transition-shadow duration-300">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-3xl -mr-20 -mt-20 group-hover:bg-brand-primary/10 transition-colors duration-500" />

            <div className="relative z-10 space-y-8">
                <div className="space-y-4 max-w-3xl">
                    <div className="page-badge">
                        <Sparkles size={12} />
                        {badge}
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-heading font-black text-brand-secondary tracking-tight leading-tight">
                        {title}
                    </h2>
                    <p className="text-lg text-text-muted leading-relaxed font-medium">
                        {description}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-bg-muted p-5 rounded-xl border border-border-subtle space-y-3 hover:border-brand-primary/30 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                            <Target size={18} />
                        </div>
                        <h3 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.15em]">Mission Scope</h3>
                        <p className="text-xs text-text-muted leading-relaxed">{whatThisPageDoes}</p>
                    </div>

                    <div className="bg-bg-muted p-5 rounded-xl border border-border-subtle space-y-3 hover:border-brand-primary/30 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600">
                            <Lightbulb size={18} />
                        </div>
                        <h3 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.15em]">Best Use Case</h3>
                        <p className="text-xs text-text-muted leading-relaxed">{bestUseCase}</p>
                    </div>

                    <div className="bg-bg-muted p-5 rounded-xl border border-border-subtle space-y-3 hover:border-brand-primary/30 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Zap size={18} />
                        </div>
                        <h3 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.15em]">How To Use</h3>
                        <ol className="text-xs text-text-muted space-y-1.5 list-none p-0">
                            {howToUse.map((step, index) => (
                                <li key={index} className="flex gap-2">
                                    <span className="text-emerald-600 font-bold shrink-0">{index + 1}.</span>
                                    {step}
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="bg-bg-muted p-5 rounded-xl border border-border-subtle space-y-3 hover:border-brand-primary/30 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                            <Sparkles size={18} />
                        </div>
                        <h3 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.15em]">Pro Tips</h3>
                        <ul className="text-xs text-text-muted space-y-1.5 list-none p-0">
                            {makeMostOfIt.map((tip, index) => (
                                <li key={index} className="flex gap-2">
                                    <span className="text-brand-primary shrink-0">▸</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {(primaryAction || secondaryAction) && (
                    <div className="flex flex-wrap gap-3 pt-6 border-t border-border-subtle">
                        {primaryAction && (
                            <Link to={primaryAction.to} className="btn-primary py-2.5 px-6 text-sm">
                                {primaryAction.label}
                                <ArrowRight size={16} />
                            </Link>
                        )}
                        {secondaryAction && (
                            <Link to={secondaryAction.to} className="btn-secondary py-2.5 px-6 text-sm">
                                {secondaryAction.label}
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};
