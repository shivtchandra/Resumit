import { MaterialIcon } from '../components/ui/MaterialIcon';
import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';

const styles = {
    container: {
        padding: '4rem 1rem',
        maxWidth: '1200px',
        margin: '0 auto'
    },
    header: {
        textAlign: 'center' as const,
        marginBottom: '4rem'
    },
    title: {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '3.5rem',
        fontWeight: 700,
        color: 'var(--text-main)',
        marginBottom: '1rem',
        lineHeight: 1.1,
        letterSpacing: '-0.02em'
    },
    subtitle: {
        fontSize: '1.25rem',
        color: 'var(--text-muted)',
        maxWidth: '600px',
        margin: '0 auto',
        fontFamily: "'Inter', sans-serif",
        lineHeight: 1.6
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        alignItems: 'start'
    },
    card: (highlighted: boolean) => ({
        background: 'var(--bg-card)',
        borderRadius: '1rem',
        border: highlighted ? '2px solid var(--text-main)' : '1px solid var(--border-subtle)',
        padding: '2.5rem',
        position: 'relative' as const,
        boxShadow: highlighted ? '0 20px 40px rgba(0, 0, 0, 0.05)' : 'var(--shadow-soft)',
        transform: highlighted ? 'scale(1.02)' : 'none',
        zIndex: highlighted ? 10 : 1,
        transition: 'all 0.3s'
    }),
    badgeContainer: {
        position: 'absolute' as const,
        top: '-1rem',
        left: '50%',
        transform: 'translateX(-50%)'
    },
    badge: {
        background: 'var(--text-main)',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        fontFamily: "'Space Grotesk', sans-serif",
        letterSpacing: '0.05em',
        textTransform: 'uppercase' as const
    },
    planName: {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '1.5rem',
        fontWeight: 700,
        color: 'var(--text-main)',
        marginBottom: '0.5rem'
    },
    priceContainer: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.25rem',
        marginBottom: '2rem'
    },
    currency: {
        fontSize: '1.5rem',
        color: 'var(--text-subtle)',
        fontWeight: 500
    },
    price: {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '3.5rem',
        fontWeight: 700,
        color: 'var(--text-main)'
    },
    period: {
        color: 'var(--text-subtle)',
        fontSize: '1rem',
        fontFamily: "'Inter', sans-serif"
    },
    featuresList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem',
        marginBottom: '2.5rem'
    },
    featureItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        color: 'var(--text-muted)',
        fontSize: '0.95rem',
        fontFamily: "'Inter', sans-serif"
    },
    checkIcon: {
        color: 'var(--text-main)',
    },
    button: (highlighted: boolean) => ({
        width: '100%',
        padding: '1rem',
        borderRadius: '0.5rem',
        border: highlighted ? 'none' : '1px solid var(--border-subtle)',
        background: highlighted ? 'var(--text-main)' : 'transparent',
        color: highlighted ? 'white' : 'var(--text-main)',
        fontSize: '1rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontFamily: "'Inter', sans-serif"
    })
};

const plans = [
    {
        name: 'Starter',
        price: '0',
        features: [
            'Basic Resume Analysis',
            '1 Resume Template',
            'PDF Export (Watermarked)',
            'Standard Support'
        ],
        highlighted: false,
        cta: 'Start Free'
    },
    {
        name: 'Professional',
        price: '19',
        features: [
            'Advanced AI Analysis',
            'All 20+ Premium Templates',
            'Unlimited PDF Exports',
            'Keyword Optimization',
            'Priority Support'
        ],
        highlighted: true,
        badge: 'MOST POPULAR',
        cta: 'Get Started'
    },
    {
        name: 'Enterprise',
        price: '49',
        features: [
            'Everything in Professional',
            'LinkedIn Profile Optimization',
            'Cover Letter Generator',
            '1-on-1 Career Coaching',
            '24/7 Dedicated Support'
        ],
        highlighted: false,
        cta: 'Contact Sales'
    }
];

export const PricingPage = () => {
    return (
        <PageLayout header={<Navbar />}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Simple, Transparent Pricing</h1>
                    <p style={styles.subtitle}>
                        Choose the plan that fits your career goals. No hidden fees.
                    </p>
                </div>

                <div style={styles.grid}>
                    {plans.map((plan) => (
                        <div key={plan.name} style={styles.card(plan.highlighted)}>
                            {plan.badge && (
                                <div style={styles.badgeContainer}>
                                    <span style={styles.badge}>{plan.badge}</span>
                                </div>
                            )}
                            <h3 style={styles.planName}>{plan.name}</h3>
                            <div style={styles.priceContainer}>
                                <span style={styles.currency}>$</span>
                                <span style={styles.price}>{plan.price}</span>
                                <span style={styles.period}>/mo</span>
                            </div>

                            <div style={styles.featuresList}>
                                {plan.features.map((feature, index) => (
                                    <div key={index} style={styles.featureItem}>
                                        <MaterialIcon icon="check" size={20} style={styles.checkIcon} />
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            <button style={styles.button(plan.highlighted)}>
                                {plan.cta}
                                {plan.highlighted && <MaterialIcon icon="bolt" size={18} />}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </PageLayout>
    );
};
