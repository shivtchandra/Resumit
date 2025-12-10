import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Navbar } from '@/components/layout/Navbar';

export const Pricing = () => {
    const plans = [
        {
            name: 'Free',
            price: '$0',
            period: 'forever',
            description: 'Perfect for trying out the ATS emulator',
            features: [
                '3 resume analyses per month',
                'Basic ATS compatibility check',
                'Critical issues detection',
                'Access to free templates',
                'Community support',
            ],
            cta: 'Get Started',
            ctaLink: '/analysis',
            highlighted: false,
        },
        {
            name: 'Pro',
            price: '$19',
            period: 'per month',
            description: 'For serious job seekers',
            features: [
                'Unlimited resume analyses',
                'Advanced ATS compatibility',
                'AI-powered rewrite suggestions',
                'All premium templates',
                'Job match scoring',
                'Priority support',
                'Export to all formats',
            ],
            cta: 'Start Free Trial',
            ctaLink: '/analysis',
            highlighted: true,
        },
        {
            name: 'Team',
            price: '$49',
            period: 'per month',
            description: 'For recruitment teams and agencies',
            features: [
                'Everything in Pro',
                'Bulk resume processing',
                'Team collaboration',
                'Custom templates',
                'API access',
                'Dedicated support',
                'Analytics dashboard',
            ],
            cta: 'Contact Sales',
            ctaLink: '/analysis',
            highlighted: false,
        },
    ];

    return (
        <PageLayout header={<Navbar />} maxWidth="2xl">
            {/* Header */}
            <div className="text-center mb-16">
                <h1
                    className="font-heading font-bold text-4xl md:text-5xl mb-4"
                    style={{ color: 'var(--color-text-primary)' }}
                >
                    Simple, Transparent Pricing
                </h1>
                <p
                    className="text-xl max-w-2xl mx-auto"
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    Choose the plan that fits your needs. All plans include our core ATS analysis features.
                </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
                {plans.map((plan, index) => (
                    <div
                        key={index}
                        className={`relative p-8 rounded-2xl transition-all duration-300 ${plan.highlighted ? 'scale-105' : 'hover:scale-105'
                            }`}
                        style={{
                            background: plan.highlighted
                                ? 'linear-gradient(135deg, rgba(0, 217, 255, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)'
                                : 'var(--color-bg-card)',
                            border: plan.highlighted
                                ? '2px solid var(--color-accent-cyan)'
                                : '1px solid var(--color-border-subtle)',
                            boxShadow: plan.highlighted ? 'var(--shadow-glow-cyan)' : 'var(--shadow-card)',
                        }}
                    >
                        {plan.highlighted && (
                            <div
                                className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold"
                                style={{
                                    background: 'var(--color-accent-cyan)',
                                    color: 'var(--color-bg-dark)',
                                }}
                            >
                                Most Popular
                            </div>
                        )}

                        <div className="mb-6">
                            <h3
                                className="font-heading font-bold text-2xl mb-2"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                {plan.name}
                            </h3>
                            <p
                                className="text-sm"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                {plan.description}
                            </p>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-baseline gap-2">
                                <span
                                    className="font-heading font-bold text-5xl"
                                    style={{ color: 'var(--color-text-primary)' }}
                                >
                                    {plan.price}
                                </span>
                                <span
                                    className="text-sm"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                >
                                    {plan.period}
                                </span>
                            </div>
                        </div>

                        <ul className="space-y-3 mb-8">
                            {plan.features.map((feature, featureIndex) => (
                                <li
                                    key={featureIndex}
                                    className="flex items-start gap-3"
                                >
                                    <Check
                                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                                        style={{ color: 'var(--color-accent-green)' }}
                                    />
                                    <span
                                        style={{ color: 'var(--color-text-secondary)' }}
                                    >
                                        {feature}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <Link
                            to={plan.ctaLink}
                            className="block w-full py-3 rounded-lg font-heading font-semibold text-center transition-all duration-300 hover:scale-105"
                            style={{
                                background: plan.highlighted
                                    ? 'var(--color-accent-cyan)'
                                    : 'var(--color-bg-elevated)',
                                color: plan.highlighted
                                    ? 'var(--color-bg-dark)'
                                    : 'var(--color-text-primary)',
                                border: plan.highlighted
                                    ? 'none'
                                    : '1px solid var(--color-border-subtle)',
                                boxShadow: plan.highlighted ? 'var(--shadow-glow-cyan)' : 'none',
                            }}
                        >
                            {plan.cta}
                        </Link>
                    </div>
                ))}
            </div>

            {/* FAQ */}
            <div className="max-w-3xl mx-auto">
                <h2
                    className="font-heading font-bold text-3xl mb-8 text-center"
                    style={{ color: 'var(--color-text-primary)' }}
                >
                    Frequently Asked Questions
                </h2>
                <div className="space-y-6">
                    {[
                        {
                            q: 'What ATS systems do you support?',
                            a: 'We test against the 4 most popular ATS systems: Workday, Taleo, Greenhouse, and iCIMS, which cover over 80% of the market.',
                        },
                        {
                            q: 'Can I cancel anytime?',
                            a: 'Yes! All paid plans are month-to-month with no long-term commitment. Cancel anytime from your account settings.',
                        },
                        {
                            q: 'Do you offer refunds?',
                            a: 'We offer a 14-day money-back guarantee on all paid plans. If you\'re not satisfied, contact us for a full refund.',
                        },
                        {
                            q: 'How accurate is the ATS analysis?',
                            a: 'Our ML models are trained on thousands of real resumes and achieve 95%+ accuracy in predicting ATS parsing success.',
                        },
                    ].map((faq, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-xl"
                            style={{
                                background: 'var(--color-bg-card)',
                                border: '1px solid var(--color-border-subtle)',
                            }}
                        >
                            <h3
                                className="font-heading font-semibold text-lg mb-2"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                {faq.q}
                            </h3>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                {faq.a}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </PageLayout>
    );
};
