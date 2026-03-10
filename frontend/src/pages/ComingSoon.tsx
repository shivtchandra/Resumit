import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const ComingSoon = () => {
    return (
        <PageLayout header={<Navbar />} maxWidth="xl">
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="relative overflow-hidden rounded-3xl border border-border-subtle bg-white shadow-premium p-10 sm:p-14 text-center">
                    <div className="absolute inset-0 bg-linear-to-br from-brand-primary/10 via-transparent to-brand-accent/10 pointer-events-none" />
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="relative z-10 space-y-6"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-bg-muted border border-border-subtle text-[11px] font-black tracking-[0.28em] uppercase text-text-subtle">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                            Match &amp; Fix Lab
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-brand-secondary leading-tight">
                            This lab is <span className="text-gradient">coming soon.</span>
                        </h1>
                        <p className="text-sm sm:text-base text-text-muted max-w-xl mx-auto">
                            We&rsquo;re still wiring up the full Rewrite / Match &amp; Fix experience. For now, you can run a deep analysis
                            and explore templates while this module ships.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                            <Link to="/analysis" className="btn-primary px-8 py-3 text-sm">
                                Run Resume Analysis
                            </Link>
                            <Link to="/templates" className="btn-secondary px-8 py-3 text-sm">
                                Browse Templates
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </main>
        </PageLayout>
    );
};

