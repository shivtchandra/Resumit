import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MaterialIcon } from '../ui/MaterialIcon';

const styles = {
    nav: {
        position: 'sticky' as const,
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.8)',
        borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(12px)'
    },
    container: {
        maxWidth: '1240px',
        margin: '0',  // Left-aligned to match page content
        padding: '0 2.5rem 0 2rem',  // Match Landing page padding
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '4.5rem'
    },
    left: {
        display: 'flex',
        alignItems: 'center',
        gap: '2rem'
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        textDecoration: 'none'
    },
    logoIcon: {
        color: 'var(--text-main)'
    },
    logoText: {
        fontFamily: 'var(--font-heading)',
        fontSize: '1.25rem',
        fontWeight: 700,
        color: 'var(--text-main)',
        letterSpacing: '-0.02em'
    },
    logoAccent: {
        color: 'var(--text-subtle)',
        fontWeight: 400
    },
    navLinks: {
        display: 'none',
        gap: '2rem',
        alignItems: 'center'
    },
    navLinksDesktop: {
        display: 'flex'
    },
    navLink: {
        color: 'var(--text-muted)',
        textDecoration: 'none',
        fontSize: '0.95rem',
        fontWeight: 500,
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0',
        borderBottom: '2px solid transparent'
    },
    navLinkActive: {
        color: 'var(--text-main)',
        borderBottomColor: 'var(--text-main)'
    },
    ctaButton: {
        padding: '0.75rem 1.5rem',
        background: 'var(--text-main)',
        color: '#ffffff',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.9rem',
        fontWeight: 600,
        textDecoration: 'none',
        transition: 'all 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    mobileMenuButton: {
        display: 'block',
        background: 'none',
        border: 'none',
        color: 'var(--text-main)',
        cursor: 'pointer',
        padding: '0.5rem'
    },
    mobileMenuButtonDesktop: {
        display: 'none'
    },
    mobileMenu: {
        position: 'fixed' as const,
        top: '4.5rem',
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--bg-page)',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem',
        zIndex: 40
    }
};

export const Navbar = () => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navLinks = [
        { path: '/', label: 'Mission Control', icon: 'dashboard' },
        { path: '/templates', label: 'Templates', icon: 'grid_view' },
        { path: '/analysis', label: 'Analysis', icon: 'auto_awesome' },
        { path: '/pricing', label: 'Pricing', icon: 'payments' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav style={styles.nav}>
            <div style={styles.container}>
                {/* Logo */}
                <Link to="/" style={styles.logo}>
                    <MaterialIcon icon="description" size={28} style={styles.logoIcon} />
                    <span style={styles.logoText}>
                        ATS Emulator <span style={styles.logoAccent}>V2</span>
                    </span>
                </Link>

                {/* Desktop Nav Links */}
                <div style={{ ...styles.navLinks, ...(isDesktop ? styles.navLinksDesktop : {}) }}>
                    {navLinks.map((link) => {
                        const active = isActive(link.path);

                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                style={{
                                    ...styles.navLink,
                                    ...(active ? styles.navLinkActive : {})
                                }}
                            >
                                <MaterialIcon icon={link.icon} size={20} filled={active} />
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                {/* CTA Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/analysis" style={styles.ctaButton}>
                        Run Analysis
                    </Link>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        style={{ ...styles.mobileMenuButton, ...(isDesktop ? styles.mobileMenuButtonDesktop : {}) }}
                    >
                        <MaterialIcon icon={isMobileMenuOpen ? 'close' : 'menu'} size={24} />
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && !isDesktop && (
                <div style={styles.mobileMenu}>
                    {navLinks.map((link) => {
                        const active = isActive(link.path);

                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                style={{
                                    ...styles.navLink,
                                    ...(active ? styles.navLinkActive : {}),
                                    fontSize: '1.1rem',
                                    padding: '0.75rem'
                                }}
                            >
                                <MaterialIcon icon={link.icon} size={24} filled={active} />
                                {link.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </nav>
    );
};
