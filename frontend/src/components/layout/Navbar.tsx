import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MaterialIcon } from '../ui/MaterialIcon';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/analysis', label: 'Analyze', icon: 'auto_awesome' },
    { path: '/templates', label: 'Templates', icon: 'grid_view' },
    // { path: '/resume-fix-lab', label: 'Match & Fix', icon: 'edit_note' },
    // { path: '/github', label: 'GitHub', icon: 'code' },
    // { path: '/pricing', label: 'Pricing', icon: 'payments' },
];

export const Navbar = () => {
    const location = useLocation();
    const [isDesktop, setIsDesktop] = useState(
        typeof window === 'undefined' ? true : window.innerWidth >= 1024
    );
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        if (isDesktop) setOpen(false);
    }, [isDesktop]);

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="sticky top-0 z-50 border-b border-border-subtle bg-white/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 gap-4">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 text-brand-secondary font-heading font-extrabold text-xl tracking-tight no-underline">
                        <MaterialIcon icon="description" size={24} className="text-brand-primary" />
                        <span>Resumit</span>
                    </Link>

                    {/* Desktop nav */}
                    {isDesktop && (
                        <div className="hidden lg:flex items-center bg-bg-muted p-1 rounded-full border border-border-subtle">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`
                                        flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 no-underline
                                        ${isActive(link.path)
                                            ? 'bg-brand-primary text-white shadow-sm'
                                            : 'text-text-muted hover:text-brand-secondary hover:bg-white'}
                                    `}
                                >
                                    <MaterialIcon icon={link.icon} size={16} filled={isActive(link.path)} />
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Right actions */}
                    <div className="flex items-center gap-3">
                        <Link to="/analysis" className="btn-primary py-2 px-5 text-sm">
                            Run Analysis
                        </Link>
                        {!isDesktop && (
                            <button
                                className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border-subtle bg-white text-text-main cursor-pointer hover:bg-bg-muted transition-colors"
                                onClick={() => setOpen((v) => !v)}
                                aria-label="Toggle menu"
                            >
                                <MaterialIcon icon={open ? 'close' : 'menu'} size={24} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {!isDesktop && open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-16 left-0 right-0 p-4 bg-white border-b border-border-subtle shadow-lg lg:hidden"
                    >
                        <div className="grid gap-1.5">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`
                                        flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-all no-underline
                                        ${isActive(link.path)
                                            ? 'bg-brand-primary text-white'
                                            : 'text-text-main hover:bg-bg-muted'}
                                    `}
                                    onClick={() => setOpen(false)}
                                >
                                    <MaterialIcon icon={link.icon} size={20} filled={isActive(link.path)} />
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};
