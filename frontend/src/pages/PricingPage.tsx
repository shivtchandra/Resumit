import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';
import { PageGuide } from '../components/layout/PageGuide';
import { WorkflowMap } from '../components/layout/WorkflowMap';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const tiers = [
    {
        name: 'Free Tier',
        price: '$0',
        period: '/mo',
        featured: false,
        features: ['Basic Analysis', '1 Template', 'ATS Check'],
        cta: 'Get Started',
    },
    {
        name: 'Pro Mode',
        price: '$29',
        period: '/mo',
        featured: true,
        features: [
            'Full AI Roast Report',
            'All Pro Templates',
            'Interview Question Bank',
            'GitHub Strategic Audit',
            'Unlimited Analysis',
        ],
        cta: 'Go Pro Now',
    },
    {
        name: 'Deep Tech',
        price: '$99',
        period: '/mo',
        featured: false,
        features: ['Personalized Coaching', 'Custom AI Models', 'Video Prep', 'Job Referral Sync'],
        cta: 'Contact Support',
    },
];

export const PricingPage = () => {
    return (
        <PageLayout header={<Navbar />} maxWidth="xl">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
                {/* Hero */}
                <div className="text-center space-y-5 pt-8">
                    <div className="page-badge">
                        <Sparkles size={14} />
                        Simple & Transparent
                    </div>
                    <h1 className="page-hero-title">
                        Choose Your <span className="text-brand-primary">Plan.</span>
                    </h1>
                    <p className="text-lg text-text-muted max-w-2xl mx-auto font-medium">
                        Start for free, upgrade when you need the full arsenal for your job search.
                    </p>
                </div>

                <PageGuide
                    badge="PRICING GUIDE"
                    title="Select the Right Level for Your Stage"
                    description="Free gets the basics. Pro unlocks the full workflow. Deep Tech is for engineers who want everything automated."
                    whatThisPageDoes="Compares feature access, usage limits, and value across all tiers."
                    bestUseCase="When you need to decide which level matches your current job search intensity."
                    howToUse={[
                        'Start free to evaluate the analysis quality.',
                        'Upgrade to Pro when you want full rewrites and interview prep.',
                        'Use Deep Tech if you want dedicated coaching and custom models.',
                    ]}
                    makeMostOfIt={[
                        'Free tier is powerful enough for a quick diagnostic pass.',
                        'Pro pays for itself if it helps you land even one extra interview.',
                        'Teams can contact support for volume pricing.',
                    ]}
                    primaryAction={{ label: 'Try Free Analysis', to: '/analysis' }}
                    secondaryAction={{ label: 'Browse Templates', to: '/templates' }}
                />

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tiers.map((tier, i) => (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`rounded-premium flex flex-col justify-between transition-all duration-300 ${tier.featured
                                    ? 'bg-brand-secondary p-9 border-2 border-brand-primary shadow-premium scale-[1.03] relative'
                                    : 'bg-white p-9 border border-border-subtle hover:shadow-premium'
                                }`}
                        >
                            {tier.featured && (
                                <div className="absolute top-0 right-8 -translate-y-1/2 bg-brand-accent text-brand-secondary px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">
                                    Most Popular
                                </div>
                            )}
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <h3 className={`text-xs font-black tracking-widest uppercase ${tier.featured ? 'text-brand-primary' : 'text-text-subtle'}`}>
                                        {tier.name}
                                    </h3>
                                    <div className={`text-4xl font-black ${tier.featured ? 'text-white' : 'text-brand-secondary'}`}>
                                        {tier.price}
                                        <span className={`text-lg font-normal ${tier.featured ? 'text-slate-500' : 'text-text-subtle'}`}>{tier.period}</span>
                                    </div>
                                </div>
                                <ul className="space-y-3">
                                    {tier.features.map((f) => (
                                        <li key={f} className={`flex items-center gap-3 text-sm font-medium ${tier.featured ? 'text-slate-300' : 'text-text-muted'}`}>
                                            <Check size={16} className={`shrink-0 ${tier.featured ? 'text-brand-primary' : 'text-brand-primary'}`} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <button
                                className={`w-full mt-8 py-3 px-8 rounded-full font-bold transition-all active:scale-95 ${tier.featured
                                        ? 'bg-brand-primary text-white hover:bg-teal-400'
                                        : 'btn-secondary'
                                    }`}
                            >
                                {tier.cta}
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="text-center pt-8">
                    <p className="text-sm text-text-subtle mb-4">Not sure yet? Start with a free analysis.</p>
                    <Link to="/analysis" className="btn-primary py-3 px-8">
                        Analyze My Resume <ArrowRight size={18} />
                    </Link>
                </div>
            </main>
        </PageLayout>
    );
};
