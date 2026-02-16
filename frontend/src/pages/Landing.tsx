import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Github, Check, ChevronDown, Rocket, Target, Zap, Search, MessageSquare, Star, Circle } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { MaterialIcon } from '../components/ui/MaterialIcon';
import { useState } from 'react';

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

export const Landing = () => {
    const [faqOpen, setFaqOpen] = useState<number | null>(null);

    return (
        <PageLayout header={<Navbar />} maxWidth="full">
            <main className="space-y-0">
                {/* ── Hero ── */}
                <section className="relative pt-24 pb-32 overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/8 blur-[120px] rounded-full" />
                        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-brand-accent/6 blur-[100px] rounded-full" />
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <motion.div
                            initial="initial"
                            animate="animate"
                            variants={staggerContainer}
                            className="text-center space-y-8"
                        >
                            <motion.div variants={fadeInUp} className="page-badge">
                                <Sparkles size={14} />
                                10,000+ Resumes Optimized This Week
                            </motion.div>

                            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-8xl font-black text-brand-secondary leading-[0.95] tracking-tight max-w-5xl mx-auto">
                                The Resume Workflow <br />
                                <span className="text-brand-primary">Built for Humans.</span>
                            </motion.h1>

                            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-text-muted max-w-3xl mx-auto font-medium leading-relaxed">
                                Diagnose what's wrong, choose a clean template, and rewrite with practical AI feedback. Your path to a better job starts here.
                            </motion.p>

                            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                <Link to="/analysis" className="btn-primary py-4 px-10 text-lg group">
                                    Analyze My Resume <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link to="/templates" className="btn-secondary py-4 px-10 text-lg">
                                    Browse Templates
                                </Link>
                            </motion.div>

                            {/* Simulated Dashboard Preview */}
                            <motion.div
                                variants={fadeInUp}
                                className="mt-20 relative mx-auto max-w-5xl rounded-2xl border border-border-subtle shadow-premium overflow-hidden bg-white"
                            >
                                {/* Mock browser bar */}
                                <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-border-subtle">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400" />
                                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                    </div>
                                    <div className="flex-1 mx-4 h-7 rounded-lg bg-slate-100 flex items-center px-3">
                                        <span className="text-[10px] text-text-subtle font-mono">resumit.app/analysis</span>
                                    </div>
                                </div>

                                {/* Mock dashboard content */}
                                <div className="p-8 grid grid-cols-12 gap-6">
                                    {/* Score Ring */}
                                    <div className="col-span-4 flex flex-col items-center justify-center p-6 rounded-xl bg-slate-50">
                                        <div className="relative w-28 h-28">
                                            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                                                <circle cx="60" cy="60" r="52" stroke="#e2e8f0" strokeWidth="10" fill="none" />
                                                <circle cx="60" cy="60" r="52" stroke="#14b8a6" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray="327" strokeDashoffset="72" />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-3xl font-black text-brand-secondary">78</span>
                                                <span className="text-[9px] font-bold text-text-subtle uppercase tracking-wider">Score</span>
                                            </div>
                                        </div>
                                        <span className="mt-3 text-xs font-bold text-brand-primary">Good — Fixable</span>
                                    </div>

                                    {/* Keyword Matches */}
                                    <div className="col-span-8 space-y-4">
                                        <div className="text-[10px] font-black tracking-widest uppercase text-text-subtle">Keyword Coverage</div>
                                        {[
                                            { label: 'React', pct: 95, color: 'bg-emerald-400' },
                                            { label: 'TypeScript', pct: 80, color: 'bg-blue-400' },
                                            { label: 'CI/CD', pct: 40, color: 'bg-amber-400' },
                                            { label: 'System Design', pct: 20, color: 'bg-red-400' },
                                        ].map(k => (
                                            <div key={k.label} className="flex items-center gap-3">
                                                <span className="text-xs font-semibold text-text-muted w-24 shrink-0">{k.label}</span>
                                                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${k.color}`} style={{ width: `${k.pct}%` }} />
                                                </div>
                                                <span className="text-xs font-bold text-text-muted w-10 text-right">{k.pct}%</span>
                                            </div>
                                        ))}

                                        {/* ATS Status Row */}
                                        <div className="flex gap-2 pt-2">
                                            {['Greenhouse ✓', 'Workday ✓', 'Lever ✗'].map(tag => (
                                                <span key={tag} className={`text-[10px] font-bold px-3 py-1 rounded-full ${tag.includes('✓') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* ── Partners ── */}
                <section className="py-14 bg-white border-y border-border-subtle">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <p className="text-center text-[10px] font-black tracking-[0.3em] uppercase text-text-subtle mb-8">Trusted by Talent at Top Companies</p>
                        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-30 grayscale hover:grayscale-0 hover:opacity-50 transition-all duration-700">
                            {['Google', 'Stripe', 'Meta', 'Netflix', 'Airbnb', 'Amazon'].map(brand => (
                                <span key={brand} className="text-2xl font-black tracking-tighter text-brand-secondary select-none">{brand}</span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Benefits (Bento Grid) ── */}
                <section className="py-28 bg-bg-muted">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        <div className="text-center space-y-4">
                            <h2 className="section-heading">Focus on what matters.</h2>
                            <p className="section-subheading">We've built tools that help you solve the real reasons resumes fail.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-5">
                            {/* Card 1: Analysis */}
                            <div className="md:col-span-6 lg:col-span-8 zen-card p-9 flex flex-col justify-between group overflow-hidden relative">
                                <div className="space-y-4 relative z-10">
                                    <div className="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                        <Search size={22} />
                                    </div>
                                    <h3 className="text-2xl font-black text-brand-secondary">Find exactly what is broken.</h3>
                                    <p className="text-base text-text-muted leading-relaxed">Our AI analyzes your resume against target JDs to identify ATS flags, keyword gaps, and styling errors instantly.</p>
                                </div>
                                <div className="mt-10 p-3 bg-bg-muted rounded-xl border border-border-subtle flex items-center gap-4 translate-y-4 group-hover:translate-y-0 transition-transform">
                                    <div className="w-9 h-9 rounded-lg bg-brand-accent/15 flex items-center justify-center">
                                        <Zap size={16} className="text-brand-accent" />
                                    </div>
                                    <span className="text-sm font-semibold text-text-muted truncate">"Missing keyword: Microservices Architecture"</span>
                                </div>
                            </div>

                            {/* Card 2: Interview Prep */}
                            <div className="md:col-span-3 lg:col-span-4 bg-brand-secondary p-9 rounded-premium flex flex-col justify-between text-white group">
                                <div className="space-y-4">
                                    <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                                        <MessageSquare size={22} className="text-brand-accent" />
                                    </div>
                                    <h3 className="text-2xl font-black">Pre-empt any question.</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">Predict likely interview questions based on your gaps and generate high-impact answer frameworks.</p>
                                </div>
                                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                                    <span className="text-[10px] font-black tracking-widest uppercase text-brand-accent">Risk Mitigation</span>
                                    <MaterialIcon icon="psychology" size={28} />
                                </div>
                            </div>

                            {/* Card 3: Templates */}
                            <div className="md:col-span-3 lg:col-span-4 zen-card p-8 flex flex-col gap-5 group">
                                <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <ShieldCheck size={22} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-brand-secondary mb-2">ATS-Proof Templates</h3>
                                    <p className="text-sm text-text-muted">Role-specific structures that ensure parsing compatibility with 99% of HR software.</p>
                                </div>
                                {/* Mini template preview */}
                                <div className="mt-auto p-3 rounded-xl bg-slate-50 border border-border-subtle space-y-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <div className="h-2 w-20 bg-brand-secondary/20 rounded-full" />
                                    <div className="h-1.5 w-full bg-slate-200 rounded-full" />
                                    <div className="h-1.5 w-3/4 bg-slate-200 rounded-full" />
                                    <div className="h-px w-full bg-slate-200 my-1" />
                                    <div className="h-2 w-16 bg-brand-primary/20 rounded-full" />
                                    <div className="h-1.5 w-full bg-slate-200 rounded-full" />
                                    <div className="h-1.5 w-5/6 bg-slate-200 rounded-full" />
                                </div>
                            </div>

                            {/* Card 4: GitHub Hub */}
                            <div className="md:col-span-6 lg:col-span-8 zen-card p-8 flex flex-col md:flex-row gap-8 items-center group">
                                <div className="space-y-4 flex-1 text-center md:text-left">
                                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 mx-auto md:mx-0">
                                        <Github size={22} />
                                    </div>
                                    <h3 className="text-2xl font-black text-brand-secondary">GitHub Strategy</h3>
                                    <p className="text-sm text-text-muted">Don't just link your profile. We'll show you which repos act as "Proof" for your claims.</p>
                                </div>
                                {/* Mini repo cards */}
                                <div className="grid grid-cols-2 gap-2.5 w-full md:w-auto">
                                    {[
                                        { name: 'ml-pipeline', lang: 'Python', color: 'bg-blue-400', stars: 24 },
                                        { name: 'api-gateway', lang: 'Go', color: 'bg-cyan-400', stars: 18 },
                                        { name: 'design-sys', lang: 'TypeScript', color: 'bg-blue-500', stars: 42 },
                                        { name: 'infra-iac', lang: 'HCL', color: 'bg-violet-400', stars: 11 },
                                    ].map(repo => (
                                        <div key={repo.name} className="p-3 md:w-28 bg-slate-50 border border-border-subtle rounded-xl hover:border-brand-primary/30 transition-colors">
                                            <span className="text-[11px] font-bold text-brand-secondary block truncate">{repo.name}</span>
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <Circle size={6} className={`${repo.color} fill-current`} />
                                                <span className="text-[9px] text-text-subtle">{repo.lang}</span>
                                                <Star size={8} className="text-amber-400 fill-amber-400 ml-auto" />
                                                <span className="text-[9px] text-text-subtle">{repo.stars}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── How it works ── */}
                <section className="py-28 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
                        <div className="text-center space-y-4">
                            <h2 className="section-heading">The 3-Step Success Path.</h2>
                            <p className="section-subheading">We've simplified the entire job hunting prep into three clear phases.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                            {/* Connecting Line */}
                            <div className="hidden md:block absolute top-[52px] left-[15%] right-[15%] h-[2px] bg-border-subtle z-0" />

                            {[
                                { step: '01', title: 'Upload & Analyze', text: 'Diagnostic mode. Find out exactly why you\'re not getting calls.', icon: Search, to: '/analysis' },
                                { step: '02', title: 'Match & Fix', text: 'Rewrite weak bullet points and choose a pro template.', icon: Sparkles, to: '/resume-fix-lab' },
                                { step: '03', title: 'Practice & Apply', text: 'Generate answer frameworks and apply with confidence.', icon: Target, to: '/templates' },
                            ].map((item, i) => (
                                <Link key={i} to={item.to} className="relative z-10 space-y-6 group no-underline">
                                    <div className="w-[100px] h-[100px] rounded-full bg-white border-[3px] border-brand-primary flex items-center justify-center shadow-zen mx-auto group-hover:scale-110 group-hover:shadow-premium transition-all duration-300">
                                        <item.icon size={40} className="text-brand-primary" />
                                    </div>
                                    <div className="text-center space-y-3">
                                        <span className="text-[10px] font-black tracking-[0.3em] text-brand-primary uppercase">Phase {item.step}</span>
                                        <h3 className="text-2xl font-black text-brand-secondary">{item.title}</h3>
                                        <p className="text-sm text-text-muted leading-relaxed px-4">{item.text}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Pricing ── */}
                <section className="py-28 bg-bg-muted">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        <div className="text-center space-y-4">
                            <h2 className="section-heading">Simple Pricing.</h2>
                            <p className="section-subheading">Start for free, upgrade when you're ready for the big leagues.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Tier 1 */}
                            <div className="bg-white p-9 rounded-premium border border-border-subtle flex flex-col justify-between hover:shadow-premium transition-shadow">
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-black tracking-widest uppercase text-text-subtle">Free Tier</h3>
                                        <div className="text-4xl font-black text-brand-secondary">$0<span className="text-lg text-text-subtle font-normal">/mo</span></div>
                                    </div>
                                    <ul className="space-y-3">
                                        {['Basic Analysis', '1 Template', 'ATS Check'].map(f => (
                                            <li key={f} className="flex items-center gap-3 text-sm font-medium text-text-muted">
                                                <Check size={16} className="text-brand-primary shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button className="btn-secondary w-full mt-8">Get Started</button>
                            </div>

                            {/* Tier 2 (Featured) */}
                            <div className="bg-brand-secondary p-9 rounded-premium border-2 border-brand-primary shadow-premium flex flex-col justify-between scale-[1.03] relative">
                                <div className="absolute top-0 right-8 -translate-y-1/2 bg-brand-accent text-brand-secondary px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">Most Popular</div>
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-black tracking-widest uppercase text-brand-primary">Pro Mode</h3>
                                        <div className="text-4xl font-black text-white">$29<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                                    </div>
                                    <ul className="space-y-3">
                                        {[
                                            'Full AI Roast Report',
                                            'All Pro Templates',
                                            'Interview Question Bank',
                                            'GitHub Strategic Audit',
                                            'Unlimited Analysis'
                                        ].map(f => (
                                            <li key={f} className="flex items-center gap-3 text-sm font-medium text-slate-300">
                                                <Check size={16} className="text-brand-primary shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button className="w-full mt-8 py-3 px-8 rounded-full font-bold bg-brand-primary text-white hover:bg-teal-400 transition-all active:scale-95">Go Pro Now</button>
                            </div>

                            {/* Tier 3 */}
                            <div className="bg-white p-9 rounded-premium border border-border-subtle flex flex-col justify-between hover:shadow-premium transition-shadow">
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-black tracking-widest uppercase text-text-subtle">Deep Tech</h3>
                                        <div className="text-4xl font-black text-brand-secondary">$99<span className="text-lg text-text-subtle font-normal">/mo</span></div>
                                    </div>
                                    <ul className="space-y-3">
                                        {['Personalized Coaching', 'Custom AI Models', 'Video Prep', 'Job Referral Sync'].map(f => (
                                            <li key={f} className="flex items-center gap-3 text-sm font-medium text-text-muted">
                                                <Check size={16} className="text-brand-primary shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button className="btn-secondary w-full mt-8">Contact Support</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Testimonials ── */}
                <section className="py-28 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        <div className="text-center space-y-4">
                            <h2 className="section-heading">Loved by people worldwide.</h2>
                            <p className="section-subheading">Join the community of people actually landing offers.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { name: 'Alex Rivera', role: 'Software Engineer @ Stripe', text: 'The Roast Report caught issues my career coach missed for months. Landed the interview at Stripe 2 weeks later.' },
                                { name: 'Sarah Chen', role: 'Product Manager @ Meta', text: 'The interview frameworks are legendary. I felt like I had the cheat codes during the behavioral rounds.' },
                                { name: 'David Miller', role: 'Full Stack Dev', text: 'Cleanest templates I have ever used. Finally reached a 95% ATS score and the calls haven\'t stopped.' },
                            ].map((t, i) => (
                                <div key={i} className="zen-card p-7 space-y-5">
                                    <div className="flex gap-1 text-brand-accent">
                                        {[1, 2, 3, 4, 5].map(j => <MaterialIcon key={j} icon="star" size={16} />)}
                                    </div>
                                    <p className="text-text-main font-medium italic leading-relaxed">"{t.text}"</p>
                                    <div className="flex items-center gap-3 pt-4 border-t border-border-subtle">
                                        <div className="w-9 h-9 rounded-full bg-brand-primary/15 flex items-center justify-center text-brand-primary font-bold text-xs">
                                            {t.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <div className="font-bold text-brand-secondary text-sm">{t.name}</div>
                                            <div className="text-[10px] uppercase tracking-widest text-text-subtle font-bold">{t.role}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section className="py-28 bg-bg-muted">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                        <div className="text-center space-y-4">
                            <h2 className="section-heading text-3xl md:text-4xl">Frequently Asked Questions</h2>
                        </div>

                        <div className="space-y-3">
                            {[
                                { q: 'Is my data private?', a: 'Completely. We do not store your resumes on our servers permanently. They are analyzed in memory and deleted immediately after your session ends unless you explicitly choose to save a template.' },
                                { q: 'How does the ATS score work?', a: 'We use the same parsing libraries used by major vendors like Workday and Lever. We check for formatting errors, unreadable fonts, and keyword density mapping.' },
                                { q: 'Can I use this for non-tech roles?', a: 'Yes! While our "Pro" features are optimized for tech, our core analysis engine works for any professional role across all industries.' },
                                { q: 'What is the "Brutal Roast" mode?', a: 'It\'s our most honest feedback mode. If your resume is boring or confusing, we\'ll tell you exactly why, using direct, no-nonsense language.' }
                            ].map((faq, i) => (
                                <div key={i} className="bg-white border border-border-subtle rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                                        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-bg-muted/50 transition-colors cursor-pointer"
                                    >
                                        <span className="font-semibold text-brand-secondary">{faq.q}</span>
                                        <ChevronDown size={18} className={`text-text-subtle transition-transform duration-200 shrink-0 ml-4 ${faqOpen === i ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {faqOpen === i && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="px-6 pb-5 text-sm text-text-muted leading-relaxed"
                                            >
                                                {faq.a}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Big CTA ── */}
                <section className="py-28 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto bg-brand-secondary rounded-3xl p-12 lg:p-20 text-center space-y-8 relative overflow-hidden shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent" />
                        <div className="relative z-10 space-y-6">
                            <div className="w-14 h-14 rounded-2xl bg-brand-accent flex items-center justify-center mx-auto text-brand-secondary">
                                <Rocket size={28} />
                            </div>
                            <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tight">Stop Guessing. <br />Start Winning.</h2>
                            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Get the resume data you need to bypass original filters and get straight to the hiring manager.</p>
                            <div className="pt-4">
                                <Link to="/analysis" className="inline-flex items-center gap-2 py-4 px-10 rounded-full text-lg font-black bg-brand-primary text-white hover:bg-teal-400 transition-all active:scale-95 shadow-lg">
                                    Analyze Your Resume Now
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </PageLayout>
    );
};
