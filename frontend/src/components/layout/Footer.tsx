import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

const styles = {
    footer: {
        marginTop: '5rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: '#141611'
    },
    container: {
        maxWidth: '1536px',
        margin: '0 auto',
        padding: '3rem 1rem'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem'
    },
    gridMd: {
        gridTemplateColumns: 'repeat(4, 1fr)'
    },
    brandTitle: {
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: '1.25rem',
        marginBottom: '1rem',
        color: '#e5e3df'
    },
    brandText: {
        fontSize: '0.875rem',
        marginBottom: '1rem',
        color: '#a1a1aa'
    },
    socialContainer: {
        display: 'flex',
        gap: '0.75rem'
    },
    socialLink: {
        padding: '0.5rem',
        borderRadius: '0.5rem',
        transition: 'all 0.2s',
        background: '#1a1d14',
        color: '#a1a1aa',
        textDecoration: 'none'
    },
    socialLinkHover: {
        transform: 'scale(1.1)'
    },
    sectionTitle: {
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
        marginBottom: '1rem',
        color: '#e5e3df'
    },
    linkList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0.5rem',
        listStyle: 'none',
        padding: 0,
        margin: 0
    },
    link: {
        fontSize: '0.875rem',
        transition: 'color 0.2s',
        color: '#a1a1aa',
        textDecoration: 'none'
    },
    linkHover: {
        color: '#e5e3df'
    },
    bottom: {
        marginTop: '3rem',
        paddingTop: '2rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'center' as const
    },
    copyright: {
        fontSize: '0.875rem',
        color: '#71717a'
    }
};

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer style={styles.footer}>
            <div style={styles.container}>
                <div style={{ ...styles.grid, ...(window.innerWidth >= 768 ? styles.gridMd : {}) }}>
                    {/* Brand */}
                    <div>
                        <h3 style={styles.brandTitle}>
                            ATS Emulator V2
                        </h3>
                        <p style={styles.brandText}>
                            Build resumes that machines approve. Test against real ATS systems.
                        </p>
                        <div style={styles.socialContainer}>
                            {[
                                { icon: Github, href: '#' },
                                { icon: Twitter, href: '#' },
                                { icon: Linkedin, href: '#' },
                                { icon: Mail, href: '#' },
                            ].map((social, index) => {
                                const Icon = social.icon;
                                return (
                                    <a
                                        key={index}
                                        href={social.href}
                                        style={styles.socialLink}
                                    >
                                        <Icon style={{ width: '1rem', height: '1rem' }} />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 style={styles.sectionTitle}>
                            Product
                        </h4>
                        <ul style={styles.linkList}>
                            {[
                                { label: 'Analysis', path: '/analysis' },
                                { label: 'Templates', path: '/templates' },
                                { label: 'Pricing', path: '/pricing' },
                            ].map((link, index) => (
                                <li key={index}>
                                    <Link
                                        to={link.path}
                                        style={styles.link}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 style={styles.sectionTitle}>
                            Resources
                        </h4>
                        <ul style={styles.linkList}>
                            {[
                                'Documentation',
                                'API Reference',
                                'Blog',
                                'Support',
                            ].map((item, index) => (
                                <li key={index}>
                                    <a
                                        href="#"
                                        style={styles.link}
                                    >
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 style={styles.sectionTitle}>
                            Legal
                        </h4>
                        <ul style={styles.linkList}>
                            {[
                                'Privacy Policy',
                                'Terms of Service',
                                'Cookie Policy',
                            ].map((item, index) => (
                                <li key={index}>
                                    <a
                                        href="#"
                                        style={styles.link}
                                    >
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div style={styles.bottom}>
                    <p style={styles.copyright}>
                        © {currentYear} ATS Emulator V2. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};
