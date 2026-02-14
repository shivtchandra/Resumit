import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail } from 'lucide-react';
import { MaterialIcon } from '../ui/MaterialIcon';

export const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="mt-20 border-t border-border-subtle bg-bg-muted">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-12 lg:gap-8">
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
                            <a href="#" className="w-9 h-9 rounded-lg border border-border-subtle flex items-center justify-center text-text-subtle hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all" aria-label="GitHub">
                                <Github size={16} />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-lg border border-border-subtle flex items-center justify-center text-text-subtle hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all" aria-label="LinkedIn">
                                <Linkedin size={16} />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-lg border border-border-subtle flex items-center justify-center text-text-subtle hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all" aria-label="Mail">
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
                            <li><Link to="/resume-fix-lab" className="text-sm text-text-muted hover:text-brand-primary no-underline font-medium transition-colors">Fix Lab</Link></li>
                            <li><Link to="/github" className="text-sm text-text-muted hover:text-brand-primary no-underline font-medium transition-colors">GitHub Audit</Link></li>
                        </ul>
                    </div>

                    {/* Support links */}
                    <div>
                        <h4 className="text-xs font-black tracking-widest text-brand-secondary uppercase mb-5">Support</h4>
                        <ul className="space-y-3">
                            <li><Link to="/pricing" className="text-sm text-text-muted hover:text-brand-primary no-underline font-medium transition-colors">Pricing</Link></li>
                            <li><a href="#" className="text-sm text-text-muted hover:text-brand-primary no-underline font-medium transition-colors">Docs</a></li>
                            <li><a href="#" className="text-sm text-text-muted hover:text-brand-primary no-underline font-medium transition-colors">Contact</a></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="lg:col-span-2 p-6 bg-white rounded-xl border border-border-subtle space-y-4">
                        <h4 className="text-xs font-black tracking-widest text-brand-secondary uppercase">Newsletter</h4>
                        <p className="text-xs text-text-muted leading-relaxed">Get job hunting tips and resume ROI signals every Tuesday.</p>
                        <div className="flex gap-2">
                            <input type="email" placeholder="email@example.com" className="soft-input text-xs py-2" />
                            <button className="btn-primary py-2 px-4 text-xs whitespace-nowrap">Join</button>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-16 pt-6 border-t border-border-subtle flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-text-subtle font-medium">© {year} Resumit. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="text-[10px] font-bold tracking-widest text-text-subtle uppercase hover:text-brand-primary no-underline transition-colors">Privacy</a>
                        <a href="#" className="text-[10px] font-bold tracking-widest text-text-subtle uppercase hover:text-brand-primary no-underline transition-colors">Terms</a>
                        <a href="#" className="text-[10px] font-bold tracking-widest text-text-subtle uppercase hover:text-brand-primary no-underline transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
