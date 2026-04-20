import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail } from 'lucide-react';
import { MaterialIcon } from '../ui/MaterialIcon';

export const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="mt-20 border-t border-border-subtle bg-bg-muted">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-12 lg:gap-8">
                    {/* Brand column */}
                    <div className="lg:col-span-2 space-y-5">
                        <Link to="/" className="flex items-center gap-2 text-brand-secondary font-heading font-black text-xl tracking-tight no-underline">
                            <MaterialIcon icon="description" size={24} className="text-brand-primary" />
                            Resumit
                        </Link>
                        <p className="text-sm text-text-muted leading-relaxed pr-8">
                            Dedicated to helping career-focused individuals navigate the professional landscape with data-driven workflows.
                        </p>
                        <div className="flex gap-3">
                            <a
                                href="https://github.com/shivtchandra"
                                target="_blank"
                                rel="noreferrer"
                                className="w-9 h-9 rounded-lg border border-border-subtle flex items-center justify-center text-text-subtle hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all"
                                aria-label="GitHub"
                            >
                                <Github size={16} />
                            </a>
                            <a
                                href="https://www.linkedin.com/in/shiva-chandra-takkelapati-10ba3032b/"
                                target="_blank"
                                rel="noreferrer"
                                className="w-9 h-9 rounded-lg border border-border-subtle flex items-center justify-center text-text-subtle hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all"
                                aria-label="LinkedIn"
                            >
                                <Linkedin size={16} />
                            </a>
                            <a
                                href="mailto:tekkdevv@gmail.com"
                                className="w-9 h-9 rounded-lg border border-border-subtle flex items-center justify-center text-text-subtle hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all"
                                aria-label="Mail"
                            >
                                <Mail size={16} />
                            </a>
                        </div>
                    </div>

                    {/* Product links */}
                    <div>
                        <h4 className="text-xs font-black tracking-widest text-brand-secondary uppercase mb-5">Product</h4>
                        <ul className="space-y-3">
                            <li><Link to="/analysis" className="text-sm text-text-muted hover:text-brand-primary no-underline font-medium transition-colors">Resume Analysis</Link></li>
                            <li><Link to="/templates" className="text-sm text-text-muted hover:text-brand-primary no-underline font-medium transition-colors">ATS Templates</Link></li>
                        </ul>
                    </div>

                    {/* Support links */}
                    <div>
                        <h4 className="text-xs font-black tracking-widest text-brand-secondary uppercase mb-5">Support</h4>
                        <ul className="space-y-3">
                            <li><a href="https://resumit.onrender.com/docs" target="_blank" rel="noreferrer" className="text-sm text-text-muted hover:text-brand-primary no-underline font-medium transition-colors">Docs</a></li>
                            <li><a href="mailto:tekkdevv@gmail.com" className="text-sm text-text-muted hover:text-brand-primary no-underline font-medium transition-colors">Contact</a></li>
                        </ul>
                        <p className="mt-4 text-xs text-text-subtle leading-relaxed">
                            Feedback &amp; ideas:{' '}
                            <a href="mailto:tekkdevv@gmail.com" className="font-medium text-brand-primary no-underline hover:underline">
                                tekkdevv@gmail.com
                            </a>
                        </p>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-16 pt-6 border-t border-border-subtle flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-text-subtle font-medium">© {year} Resumit. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link to="/privacy" className="text-[10px] font-bold tracking-widest text-text-subtle uppercase hover:text-brand-primary no-underline transition-colors">Privacy</Link>
                        <Link to="/terms" className="text-[10px] font-bold tracking-widest text-text-subtle uppercase hover:text-brand-primary no-underline transition-colors">Terms</Link>
                        <Link to="/privacy#cookies" className="text-[10px] font-bold tracking-widest text-text-subtle uppercase hover:text-brand-primary no-underline transition-colors">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

