import { Link } from 'react-router-dom';
import { MaterialIcon } from '../components/ui/MaterialIcon';
import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';

const styles = {
    hero: {
        position: 'relative' as const,
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-page)',
        overflow: 'hidden'
    },
    container: {
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 0.75rem',  // Reduced from 1.5rem to bring text closer to edge
        position: 'relative' as const,
        zIndex: 10
    },
    heroGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '4rem',
        alignItems: 'center'
    },
    heroGridLg: {
        gridTemplateColumns: '1.2fr 1fr'  // Give more space to left column (text)
    },
    heroLeft: {
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        alignItems: 'flex-start' as const
    },
    pill: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontFamily: 'var(--font-heading)',
        fontWeight: 600,
        marginBottom: '2rem',
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        color: 'var(--text-muted)',
        width: 'fit-content'
    },
    h1: {
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: '4rem',
        lineHeight: '0.95',
        letterSpacing: '-0.02em',
        marginBottom: '2rem',
        color: 'var(--text-main)',
        textAlign: 'left' as const
    },
    h1Accent: {
        color: 'var(--text-subtle)',
        fontStyle: 'italic'
    },
    subtext: {
        fontSize: '1.25rem',
        color: 'var(--text-muted)',
        maxWidth: '32rem',
        marginBottom: '2.5rem',
        fontWeight: 400,
        lineHeight: '1.75',
        textAlign: 'left' as const
    },
    ctaContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem',
        marginBottom: '3rem',
        alignItems: 'flex-start' as const
    },
    ctaContainerSm: {
        flexDirection: 'row' as const
    },
    btnPrimary: {
        padding: '1rem 2rem',
        borderRadius: '9999px',
        background: 'var(--text-main)',
        color: '#ffffff',
        fontWeight: 600,
        fontSize: '1.125rem',
        transition: 'all 0.3s',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        textAlign: 'center' as const,
        textDecoration: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    btnSecondary: {
        padding: '1rem 2rem',
        borderRadius: '9999px',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-main)',
        fontWeight: 500,
        fontSize: '1.125rem',
        transition: 'all 0.3s',
        textAlign: 'center' as const,
        textDecoration: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    stats: {
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '2rem'
    },
    statItem: {
        display: 'flex',
        flexDirection: 'column' as const
    },
    statNumber: {
        fontSize: '1.5rem',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        color: 'var(--text-main)'
    },
    statLabel: {
        fontSize: '0.875rem',
        color: 'var(--text-muted)'
    },
    heroRight: {
        position: 'relative' as const,
        height: '600px',
        display: 'none',
        background: 'var(--bg-elevated)',
        borderRadius: '1.5rem 0 0 1.5rem',
        marginRight: 'calc((100vw - 100%) / -2)',
        overflow: 'hidden',
        borderLeft: '1px solid var(--border-subtle)'
    },
    heroRightLg: {
        display: 'block'
    },
    featuresSection: {
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)'
    },
    featuresContainer: {
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '6rem 1.5rem'
    },
    featuresGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem'
    },
    featuresGridMd: {
        gridTemplateColumns: 'repeat(3, 1fr)'
    },
    featureCard: {
        position: 'relative' as const,
        padding: '2rem',
        background: 'white',
        borderRadius: '1rem',
        border: '1px solid var(--border-subtle)',
        transition: 'transform 0.3s, box-shadow 0.3s',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
    },
    featureIcon: {
        marginBottom: '1.5rem',
        color: 'var(--text-main)'
    },
    featureTitle: {
        color: 'var(--text-main)',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
        fontSize: '1.25rem',
        marginBottom: '0.75rem'
    },
    featureDesc: {
        color: 'var(--text-muted)',
        fontSize: '0.95rem',
        lineHeight: '1.6'
    },
    engineSection: {
        padding: '8rem 0',
        background: 'white'
    },
    engineGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '4rem',
        alignItems: 'center'
    },
    engineGridLg: {
        gridTemplateColumns: '1fr 1fr'
    },
    engineViz: {
        aspectRatio: '4/3',
        borderRadius: '1rem',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        padding: '2rem',
        position: 'relative' as const,
        overflow: 'hidden'
    },
    engineText: {
        order: 1
    },
    engineTextLg: {
        order: 2
    },
    h2: {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '3rem',
        fontWeight: 600,
        marginBottom: '1.5rem',
        color: 'var(--text-main)',
        lineHeight: 1.1
    },
    engineDesc: {
        color: 'var(--text-muted)',
        fontSize: '1.125rem',
        marginBottom: '2rem',
        lineHeight: '1.75'
    },
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '2rem',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '2rem'
    },
    metricNumber: {
        fontSize: '2.5rem',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        color: 'var(--text-main)'
    },
    metricLabel: {
        fontSize: '0.875rem',
        color: 'var(--text-muted)',
        marginTop: '0.25rem',
        fontWeight: 500
    },
    faqSection: {
        padding: '8rem 0',
        background: 'var(--bg-elevated)'
    },
    faqGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '4rem'
    },
    faqGridLg: {
        gridTemplateColumns: 'repeat(12, 1fr)'
    },
    faqLeft: {
        gridColumn: 'span 4'
    },
    faqRight: {
        gridColumn: 'span 8'
    },
    faqHeading: {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '2.5rem',
        fontWeight: 600,
        marginBottom: '1.5rem',
        color: 'var(--text-main)'
    },
    faqSubtext: {
        color: 'var(--text-muted)',
        lineHeight: '1.75'
    },
    testimonialsSection: {
        padding: '8rem 0',
        background: 'white',
        borderTop: '1px solid var(--border-subtle)'
    },
    testimonialsHeader: {
        textAlign: 'center' as const,
        marginBottom: '4rem'
    },
    testimonialsHeading: {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '2.5rem',
        fontWeight: 600,
        marginBottom: '1rem',
        color: 'var(--text-main)'
    },
    testimonialsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem'
    },
    testimonialsGridMd: {
        gridTemplateColumns: 'repeat(3, 1fr)'
    }
};

export const Landing = () => {
    return (
        <PageLayout header={<Navbar />} maxWidth="full">
            {/* Hero Section */}
            <section style={styles.hero}>
                <div style={styles.container}>
                    <div style={{ ...styles.heroGrid, ...(window.innerWidth >= 1024 ? styles.heroGridLg : {}) }}>
                        {/* Left Content */}
                        <div style={styles.heroLeft}>
                            <div style={styles.pill}>
                                <MaterialIcon icon="auto_awesome" size={16} />
                                AI-POWERED RESUME INTELLIGENCE
                            </div>

                            <h1 style={styles.h1}>
                                Beat The <br />
                                Algorithm. <br />
                                <span style={styles.h1Accent}>Not Just The Job.</span>
                            </h1>

                            <p style={styles.subtext}>
                                Our engine simulates enterprise ATS systems to show you exactly what they see, then rewrites your resume to pass their filters.
                            </p>

                            <div style={{ ...styles.ctaContainer, ...(window.innerWidth >= 640 ? styles.ctaContainerSm : {}) }}>
                                <Link to="/analysis" style={styles.btnPrimary}>
                                    Upload Resume
                                    <MaterialIcon icon="upload" size={20} />
                                </Link>
                                <Link to="/optimization-hub" style={{
                                    ...styles.btnSecondary,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                                }}>
                                    AI Rewrite
                                    <MaterialIcon icon="auto_awesome" size={20} />
                                </Link>
                                <Link to="/github" style={{
                                    ...styles.btnSecondary,
                                    background: 'linear-gradient(135deg, #24292e 0%, #1a1d21 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(36, 41, 46, 0.3)'
                                }}>
                                    GitHub Projects
                                    <MaterialIcon icon="code" size={20} />
                                </Link>
                                <Link to="/templates" style={styles.btnSecondary}>
                                    Explore Templates
                                    <MaterialIcon icon="arrow_forward" size={20} />
                                </Link>
                            </div>

                            <div style={styles.stats}>
                                <div style={styles.statItem}>
                                    <div style={styles.statNumber}>15k+</div>
                                    <div style={styles.statLabel}>Resumes Analyzed</div>
                                </div>
                                <div style={styles.statItem}>
                                    <div style={styles.statNumber}>4x</div>
                                    <div style={styles.statLabel}>Higher Interview Rate</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Visual - Floating Resume */}
                        <div style={{ ...styles.heroRight, ...(window.innerWidth >= 1024 ? styles.heroRightLg : {}) }}>
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '3rem'
                            }}>
                                {/* Floating Resume Card */}
                                <div style={{
                                    background: 'white',
                                    borderRadius: '8px',
                                    padding: '2.5rem 2rem',
                                    width: '100%',
                                    maxWidth: '450px',
                                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                                    animation: 'float 6s ease-in-out infinite',
                                    transform: 'rotate(-2deg)',
                                    border: '1px solid var(--border-subtle)'
                                }}>
                                    {/* Resume Header */}
                                    <div style={{
                                        marginBottom: '1.5rem',
                                        paddingBottom: '1rem',
                                        borderBottom: '2px solid var(--text-main)'
                                    }}>
                                        <h3 style={{
                                            fontFamily: "'Space Grotesk', sans-serif",
                                            fontSize: '1.75rem',
                                            fontWeight: 700,
                                            color: 'var(--text-main)',
                                            marginBottom: '0.5rem'
                                        }}>
                                            Sarah Johnson
                                        </h3>
                                        <p style={{
                                            color: 'var(--text-muted)',
                                            fontSize: '0.85rem',
                                            lineHeight: 1.6
                                        }}>
                                            sarah.j@email.com • (555) 123-4567<br />
                                            San Francisco, CA • linkedin.com/in/sarahj
                                        </p>
                                    </div>

                                    {/* Summary */}
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <h4 style={{
                                            fontFamily: "'Space Grotesk', sans-serif",
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            color: 'var(--text-main)',
                                            marginBottom: '0.5rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            Summary
                                        </h4>
                                        <p style={{
                                            color: 'var(--text-muted)',
                                            fontSize: '0.8rem',
                                            lineHeight: 1.6
                                        }}>
                                            Senior Software Engineer with 8+ years building scalable web applications. Expert in React, Node.js, and cloud architecture.
                                        </p>
                                    </div>

                                    {/* Skills */}
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <h4 style={{
                                            fontFamily: "'Space Grotesk', sans-serif",
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            color: 'var(--text-main)',
                                            marginBottom: '0.5rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            Skills
                                        </h4>
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '0.4rem'
                                        }}>
                                            {['React', 'TypeScript', 'Node.js', 'AWS', 'Docker', 'Python'].map((skill, i) => (
                                                <span key={i} style={{
                                                    padding: '0.3rem 0.75rem',
                                                    borderRadius: '15px',
                                                    background: 'var(--bg-surface)',
                                                    color: 'var(--text-main)',
                                                    border: '1px solid var(--border-subtle)',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 500
                                                }}>
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Experience */}
                                    <div>
                                        <h4 style={{
                                            fontFamily: "'Space Grotesk', sans-serif",
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            color: 'var(--text-main)',
                                            marginBottom: '0.5rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            Experience
                                        </h4>
                                        <div style={{ marginBottom: '0.75rem' }}>
                                            <h5 style={{
                                                fontWeight: 700,
                                                color: 'var(--text-main)',
                                                fontSize: '0.9rem',
                                                marginBottom: '0.25rem'
                                            }}>
                                                Senior Software Engineer
                                            </h5>
                                            <p style={{
                                                color: 'var(--text-subtle)',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                marginBottom: '0.25rem'
                                            }}>
                                                Tech Corp • 2020 - Present
                                            </p>
                                            <p style={{
                                                color: 'var(--text-muted)',
                                                fontSize: '0.75rem',
                                                lineHeight: 1.5
                                            }}>
                                                Led development of microservices architecture serving 2M+ users. Improved system performance by 45%.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Animation */}
                            <style>{`
                                @keyframes float {
                                    0%, 100% {
                                        transform: translateY(0px) rotate(-2deg);
                                    }
                                    50% {
                                        transform: translateY(-20px) rotate(-2deg);
                                    }
                                }
                            `}</style>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Band */}
            <section style={styles.featuresSection}>
                <div style={styles.featuresContainer}>
                    <div style={{ ...styles.featuresGrid, ...(window.innerWidth >= 768 ? styles.featuresGridMd : {}) }}>
                        {[
                            { icon: 'visibility', title: "Algorithm Transparency", desc: "See exactly how Workday, Taleo, and Greenhouse parse your resume." },
                            { icon: 'auto_fix_high', title: "AI Rewrite Engine", desc: "Instantly rephrase bullet points to match high-performing patterns." },
                            { icon: 'description', title: "ATS-Proof Templates", desc: "Clean, structure-first designs guaranteed to parse correctly." }
                        ].map((feature, i) => (
                            <div key={i} style={styles.featureCard}>
                                <div style={styles.featureIcon}>
                                    <MaterialIcon icon={feature.icon} size={32} />
                                </div>
                                <h3 style={styles.featureTitle}>{feature.title}</h3>
                                <p style={styles.featureDesc}>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Engine Section */}
            <section style={styles.engineSection}>
                <div style={styles.container}>
                    <div style={{ ...styles.engineGrid, ...(window.innerWidth >= 1024 ? styles.engineGridLg : {}) }}>
                        <div style={styles.engineViz}>
                            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(0,0,0,0.03), transparent 70%)' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', height: '100%' }}>
                                <div style={{ background: 'white', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)', padding: '1rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontFamily: "'JetBrains Mono', monospace" }}>PARSING_LOGIC</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {[85, 65, 90, 75].map((width, i) => (
                                            <div key={i} style={{ height: '0.375rem', background: 'var(--bg-surface)', borderRadius: '0.25rem', width: `${width}%` }} />
                                        ))}
                                    </div>
                                </div>
                                <div style={{ background: 'white', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)', padding: '1rem', marginTop: '2rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontFamily: "'JetBrains Mono', monospace" }}>ENTITY_EXTRACTION</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} style={{ height: '0.375rem', background: 'var(--bg-elevated)', borderRadius: '0.25rem', width: '100%' }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ ...styles.engineText, ...(window.innerWidth >= 1024 ? styles.engineTextLg : {}) }}>
                            <h2 style={styles.h2}>
                                Built To Beat <br />
                                Filters.
                            </h2>
                            <p style={styles.engineDesc}>
                                We reverse-engineered the parsing logic used by Fortune 500 companies. Our engine doesn't just check for keywords—it validates document structure, entity recognition, and semantic relevance.
                            </p>

                            <div style={styles.metricsGrid}>
                                <div>
                                    <div style={styles.metricNumber}>98%</div>
                                    <div style={styles.metricLabel}>Parsing Accuracy</div>
                                </div>
                                <div>
                                    <div style={styles.metricNumber}>4</div>
                                    <div style={styles.metricLabel}>Engines Simulated</div>
                                </div>
                                <div>
                                    <div style={styles.metricNumber}>15k+</div>
                                    <div style={styles.metricLabel}>Resumes Tested</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section style={styles.faqSection}>
                <div style={styles.container}>
                    <div style={{ ...styles.faqGrid, ...(window.innerWidth >= 1024 ? styles.faqGridLg : {}) }}>
                        <div style={window.innerWidth >= 1024 ? styles.faqLeft : {}}>
                            <h2 style={styles.faqHeading}>
                                Questions
                            </h2>
                            <p style={styles.faqSubtext}>
                                Everything you need to know about how we protect your data and help you get hired.
                            </p>
                        </div>

                        <div style={window.innerWidth >= 1024 ? styles.faqRight : {}}>
                            {/* Accordion would go here */}
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                FAQ content...
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section style={styles.testimonialsSection}>
                <div style={styles.container}>
                    <div style={styles.testimonialsHeader}>
                        <h2 style={styles.testimonialsHeading}>Trusted by Professionals</h2>
                    </div>
                    <div style={{ ...styles.testimonialsGrid, ...(window.innerWidth >= 768 ? styles.testimonialsGridMd : {}) }}>
                        {/* Testimonial cards would go here */}
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '0.75rem', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                            <p style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>"This tool completely changed my job search. I went from 0 callbacks to 5 in a week."</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>- Alex M., Software Engineer</p>
                        </div>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '0.75rem', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                            <p style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>"The analysis showed me exactly why my resume was getting rejected. The rewrite engine is magic."</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>- Sarah K., Product Manager</p>
                        </div>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '0.75rem', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                            <p style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>"Simple, clean, and effective. The templates are beautiful and actually parse correctly."</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>- James L., Data Scientist</p>
                        </div>
                    </div>
                </div>
            </section>
        </PageLayout>
    );
};
