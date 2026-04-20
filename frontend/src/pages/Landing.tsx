import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Sparkles,
    ShieldCheck,
    Github,
    ChevronDown,
    Rocket,
    Target,
    Zap,
    Search,
    MessageSquare,
    Circle,
    Check,
    FileSearch,
    Mail,
} from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

const revealUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.45 },
};

const stagger = {
    show: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

/** Official brand SVGs from Simple Icons (jsDelivr) — illustrative only; not endorsement. */
const SIMPLE_ICONS_VER = '11';
const employerBrandMarks: { name: string; slug: string }[] = [
    { name: 'Google', slug: 'google' },
    { name: 'Stripe', slug: 'stripe' },
    { name: 'Meta', slug: 'meta' },
    { name: 'Netflix', slug: 'netflix' },
    { name: 'Airbnb', slug: 'airbnb' },
    { name: 'Amazon', slug: 'amazon' },
];
const brandMarkSrc = (slug: string) =>
    `https://cdn.jsdelivr.net/npm/simple-icons@${SIMPLE_ICONS_VER}/icons/${slug}.svg`;

const failureCards = [
    {
        title: 'ATS Parsing Breaks',
        text: 'Complex layouts and visual-heavy formats hide key skills from parser bots.',
        icon: FileSearch,
    },
    {
        title: 'Weak Achievement Bullets',
        text: 'Generic lines miss business impact, so your profile blends in immediately.',
        icon: Zap,
    },
    {
        title: 'Job Mismatch',
        text: 'Most resumes are never tuned to one target role and one specific JD.',
        icon: Target,
    },
];

const demoStages = [
    {
        id: 'scan',
        title: 'Scan',
        subtitle: 'Find blockers in seconds',
        before: 64,
        after: 88,
        insight: 'Missing keyword cluster: "Distributed Systems", "Observability", "SLO"',
        bullets: [
            'Detected 4 ATS parse risks in contact + heading block.',
            'Keyword relevance improved from 52% to 84%.',
            'Readability score moved from C- to A.',
        ],
        to: '/analysis',
    },
    {
        id: 'rewrite',
        title: 'Rewrite',
        subtitle: 'Upgrade bullets with outcomes',
        before: 70,
        after: 92,
        insight: 'Converted passive bullets into quantified impact statements.',
        bullets: [
            'Reframed 7 lines into metric-driven achievements.',
            'Aligned language to hiring-manager intent.',
            'Reduced filler and repetition by 38%.',
        ],
        to: '/resume-fix-lab',
    },
    {
        id: 'ship',
        title: 'Ship',
        subtitle: 'Apply with confidence',
        before: 78,
        after: 95,
        insight: 'Final format now passes modern ATS + recruiter skim tests.',
        bullets: [
            'Template structure optimized for parser consistency.',
            'Role-specific vocabulary mapped to target JD.',
            'Interview prep prompts generated from identified gaps.',
        ],
        to: '/templates',
    },
];

const features = [
    {
        title: 'JD-Aware Resume Analysis',
        text: 'Upload resume + job description and get exact mismatch diagnostics.',
        icon: Search,
    },
    {
        title: 'Bullet Rewrite Engine',
        text: 'Transform weak lines into sharp, quantified, role-specific impact bullets.',
        icon: Sparkles,
    },
    {
        title: 'ATS-Safe Templates',
        text: 'Use recruiter-friendly structures designed for parser reliability.',
        icon: ShieldCheck,
    },
    {
        title: 'GitHub Proof Layer',
        text: 'Connect project evidence directly to claims on your resume.',
        icon: Github,
    },
    {
        title: 'Interview Angle Builder',
        text: 'Generate talking points based on your strongest resume signals.',
        icon: MessageSquare,
    },
    {
        title: 'Role-Fit Scoring',
        text: 'Track fit improvements as you iterate before each application.',
        icon: Target,
    },
];

const phases = [
    {
        step: '01',
        title: 'Diagnose',
        text: 'Scan resume + JD to find formatting, relevance, and impact gaps.',
        to: '/analysis',
        icon: Search,
    },
    {
        step: '02',
        title: 'Rebuild',
        text: 'Fix weak bullets, tighten structure, and align language to target role.',
        to: '/resume-fix-lab',
        icon: Sparkles,
    },
    {
        step: '03',
        title: 'Launch',
        text: 'Export and apply with an ATS-safe resume plus interview prep support.',
        to: '/templates',
        icon: Rocket,
    },
];

const matchFixWhatYouGet = [
    'Fit overview, score estimate, and biggest blockers',
    'JD requirements with evidence — what you match vs. clear gaps',
    'Copy-paste resume edits tied to specific JD signals',
    'Project and certification ideas aligned to gaps',
    'Keyword map: present vs. missing JD terms',
    'Company read (inferred from JD and public context — not employer-official)',
    'Action plan, student/pro coaching tracks, and interview prep (topics, resources, likely questions)',
];

const faqs = [
    {
        q: 'How long does Match & Fix take?',
        a: 'Most runs finish in about a minute on average. Large reports, slow networks, or a cold server can take longer — keep the tab open, do not refresh, and wait for the full report.',
    },
    {
        q: 'What is included in the Match & Fix report?',
        a: 'You get a structured report: overview and blockers, JD requirements with matches and misses, concrete resume change suggestions, project and certification ideas, a keyword map, inferred company insights (not verified by the employer), an action plan, two coaching tracks, and interview prep with resources and likely questions.',
    },
    {
        q: 'Is my resume data private?',
        a: 'Yes. Files are processed for analysis and not retained permanently unless you explicitly save related artifacts.',
    },
    {
        q: 'Can I use this for non-tech roles?',
        a: 'Yes. The optimization pipeline is role-agnostic, and works across tech, product, operations, and business jobs.',
    },
    {
        q: 'How is ATS fit evaluated?',
        a: 'The system checks structure, readability, and keyword-role alignment to estimate parser compatibility and recruiter relevance.',
    },
    {
        q: 'Do I need a perfect resume to start?',
        a: 'No. The flow is designed for raw drafts and older resumes, then upgrades them step by step.',
    },
];

export const Landing = () => {
    const [faqOpen, setFaqOpen] = useState<number | null>(null);
    const [activeDemo, setActiveDemo] = useState(demoStages[0].id);

    const currentDemo = useMemo(
        () => demoStages.find((stage) => stage.id === activeDemo) ?? demoStages[0],
        [activeDemo]
    );

    const improvement = currentDemo.after - currentDemo.before;

    return (
        <PageLayout header={<Navbar />} maxWidth="full">
            <main className="space-y-0">
                <section className="relative overflow-hidden pt-24 pb-20 md:pt-28 md:pb-28 bg-linear-to-b from-bg-surface via-white to-white">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-20 -left-20 w-80 h-80 bg-brand-primary/12 blur-[120px] rounded-full" />
                        <div className="absolute top-[40%] -right-10 w-72 h-72 bg-brand-accent/10 blur-[120px] rounded-full" />
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <motion.div
                            initial="hidden"
                            animate="show"
                            variants={stagger}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
                        >
                            <div className="lg:col-span-6 space-y-7">
                                <motion.div variants={fadeUp} className="page-badge">
                                    <Sparkles size={14} />
                                    Resume Intelligence System
                                </motion.div>

                                <motion.h1
                                    variants={fadeUp}
                                    className="text-5xl md:text-7xl font-black text-brand-secondary leading-[0.92] tracking-tight"
                                >
                                    Stop Sending
                                    <br />
                                    <span className="text-gradient">Generic Resumes.</span>
                                </motion.h1>

                                <motion.p
                                    variants={fadeUp}
                                    className="text-lg md:text-2xl text-text-muted leading-relaxed max-w-2xl"
                                >
                                    Analyze, rewrite, and ship role-specific resumes with a workflow built for real hiring filters.
                                </motion.p>

                                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
                                    <Link to="/analysis" className="btn-primary py-4 px-9 text-base md:text-lg group">
                                        Run Free Analysis
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <Link to="/resume-fix-lab" className="btn-secondary py-4 px-9 text-base md:text-lg group">
                                        Match &amp; Fix
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </motion.div>

                                <motion.p variants={fadeUp} className="text-sm text-text-muted max-w-2xl">
                                    <span className="font-semibold text-brand-secondary">Match &amp; Fix</span> usually takes{' '}
                                    <span className="font-semibold">about a minute</span> — stay on the page until the report finishes.
                                </motion.p>

                                <motion.div variants={fadeUp} className="flex flex-wrap gap-2.5 pt-2">
                                    {['ATS-aware checks', 'Full JD match report', 'Interview prep from gaps'].map((chip) => (
                                        <span
                                            key={chip}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-white px-4 py-1.5 text-xs font-bold text-text-muted"
                                        >
                                            <Check size={12} className="text-brand-primary" />
                                            {chip}
                                        </span>
                                    ))}
                                </motion.div>
                            </div>

                            <motion.div variants={fadeUp} className="lg:col-span-6">
                                <div className="rounded-[1.5rem] border border-border-subtle bg-white shadow-premium overflow-hidden">
                                    <div className="px-5 py-4 border-b border-border-subtle bg-slate-50 flex items-center justify-between">
                                        <div className="text-[11px] uppercase tracking-[0.22em] font-black text-text-subtle">
                                            Live Match Snapshot
                                        </div>
                                        <span className="text-[11px] font-bold text-brand-primary animate-float">Role: Senior SWE</span>
                                    </div>

                                    <div className="p-5 md:p-7 space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="sm:col-span-1 rounded-xl bg-bg-muted border border-border-subtle p-4 flex flex-col items-center justify-center">
                                                <div className="relative w-24 h-24">
                                                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 120 120">
                                                        <circle cx="60" cy="60" r="52" stroke="#e2e8f0" strokeWidth="10" fill="none" />
                                                        <circle
                                                            cx="60"
                                                            cy="60"
                                                            r="52"
                                                            stroke="#14b8a6"
                                                            strokeWidth="10"
                                                            fill="none"
                                                            strokeLinecap="round"
                                                            strokeDasharray="327"
                                                            strokeDashoffset="79"
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-3xl font-black text-brand-secondary">76</span>
                                                        <span className="text-[10px] font-black tracking-wider text-text-subtle uppercase">Match</span>
                                                    </div>
                                                </div>
                                                <span className="mt-2 text-[11px] font-bold text-brand-primary">Needs Targeted Fixes</span>
                                            </div>

                                            <div className="sm:col-span-2 space-y-3">
                                                <div className="text-[11px] uppercase tracking-[0.2em] font-black text-text-subtle">Keyword Coverage</div>
                                                {[
                                                    { label: 'Distributed Systems', pct: 40, color: 'bg-red-400' },
                                                    { label: 'TypeScript', pct: 88, color: 'bg-blue-500' },
                                                    { label: 'CI/CD', pct: 72, color: 'bg-amber-400' },
                                                    { label: 'Monitoring', pct: 35, color: 'bg-red-400' },
                                                ].map((item) => (
                                                    <div key={item.label} className="flex items-center gap-3">
                                                        <span className="text-xs font-semibold text-text-muted w-32 shrink-0">{item.label}</span>
                                                        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                                            <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.pct}%` }} />
                                                        </div>
                                                        <span className="text-xs font-bold text-text-muted w-8 text-right">{item.pct}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-border-subtle bg-bg-muted p-4 flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-brand-primary/15 text-brand-primary flex items-center justify-center shrink-0">
                                                <Zap size={15} />
                                            </div>
                                            <p className="text-sm text-text-muted font-medium">
                                                "Rewrote 6 bullets to include measurable impact. Added missing backend architecture terminology from JD."
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                <section className="py-10 md:py-16 bg-white border-y border-border-subtle">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.p
                            initial={revealUp.initial}
                            whileInView={revealUp.whileInView}
                            viewport={revealUp.viewport}
                            transition={revealUp.transition}
                            className="text-center text-[10px] font-black tracking-[0.4em] uppercase text-text-subtle mb-3"
                        >
                            Calibrate for the kinds of teams you apply to
                        </motion.p>
                        <p className="text-center text-xs text-text-muted max-w-xl mx-auto mb-10">
                            Marks are official Simple Icons assets for recognition only. Trademarks belong to their owners; no affiliation implied.
                        </p>
                        <motion.div
                            initial={revealUp.initial}
                            whileInView={revealUp.whileInView}
                            viewport={revealUp.viewport}
                            transition={{ ...revealUp.transition, delay: 0.08 }}
                            className="flex flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-10 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-[filter] duration-300 overflow-x-auto pb-4 md:pb-0 scrollbar-hide no-scrollbar"
                        >
                            {employerBrandMarks.map(({ name, slug }) => (
                                <img
                                    key={slug}
                                    src={brandMarkSrc(slug)}
                                    alt={name}
                                    width={96}
                                    height={24}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-6 md:h-7 w-auto max-w-[5.5rem] object-contain object-center shrink-0 select-none"
                                />
                            ))}
                        </motion.div>
                    </div>
                </section>

                <section className="py-24 md:py-32 bg-bg-muted relative overflow-hidden">
                    {/* Background decorations - subtler for light mode */}
                    <div className="absolute inset-0 pointer-events-none opacity-40">
                        <div className="absolute -top-24 left-1/4 w-[500px] h-[500px] bg-brand-primary/5 blur-[120px] rounded-full" />
                        <div className="absolute -bottom-24 right-1/4 w-[500px] h-[500px] bg-brand-accent/5 blur-[120px] rounded-full" />
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="text-center space-y-6 mb-16">
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="inline-flex items-center gap-2 rounded-full px-5 py-2 bg-white border border-border-subtle text-[11px] tracking-[0.3em] uppercase font-black text-brand-primary shadow-sm"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                                Why resumes fail
                            </motion.p>
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl md:text-6xl font-black text-brand-secondary tracking-tight leading-[1.1]"
                            >
                                Most applications die
                                <br />
                                <span className="text-text-subtle">before human review.</span>
                            </motion.h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                            {failureCards.map((card, i) => (
                                <motion.div
                                    key={card.title}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="group relative rounded-[2rem] border border-border-subtle bg-white p-8 md:p-10 hover:border-brand-primary/30 hover:shadow-premium transition-all duration-500 overflow-hidden"
                                >
                                    <div className="absolute -top-6 -right-6 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity rotate-12 group-hover:rotate-0 duration-700">
                                        <card.icon size={120} strokeWidth={1} />
                                    </div>

                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 text-brand-primary flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-md">
                                        <card.icon size={28} strokeWidth={2.5} />
                                    </div>

                                    <div className="space-y-4 relative z-10">
                                        <h3 className="text-2xl font-black text-brand-secondary tracking-tight group-hover:text-brand-primary transition-colors">
                                            {card.title}
                                        </h3>
                                        <p className="text-text-muted text-base leading-relaxed font-medium">
                                            {card.text}
                                        </p>
                                    </div>

                                    {/* Hover effect highlight */}
                                    <div className="absolute bottom-0 left-0 w-0 h-1 bg-linear-to-r from-brand-primary to-teal-400 group-hover:w-full transition-all duration-700" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-16 md:py-24 bg-bg-muted">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
                        <motion.div
                            initial={revealUp.initial}
                            whileInView={revealUp.whileInView}
                            viewport={revealUp.viewport}
                            transition={revealUp.transition}
                            className="lg:col-span-4 space-y-5"
                        >
                            <motion.p
                                initial={revealUp.initial}
                                whileInView={revealUp.whileInView}
                                viewport={revealUp.viewport}
                                transition={{ ...revealUp.transition, delay: 0.05 }}
                                className="page-badge"
                            >
                                <Sparkles size={14} />
                                Workflow Demo
                            </motion.p>
                            <motion.h2
                                initial={revealUp.initial}
                                whileInView={revealUp.whileInView}
                                viewport={revealUp.viewport}
                                transition={{ ...revealUp.transition, delay: 0.1 }}
                                className="section-heading text-4xl md:text-5xl"
                            >
                                One flow, three tactical phases.
                            </motion.h2>
                            <motion.p
                                initial={revealUp.initial}
                                whileInView={revealUp.whileInView}
                                viewport={revealUp.viewport}
                                transition={{ ...revealUp.transition, delay: 0.15 }}
                                className="text-text-muted text-lg leading-relaxed"
                            >
                                Move from diagnostic noise to clean positioning with stage-by-stage guidance.
                            </motion.p>
                            <motion.div
                                initial={revealUp.initial}
                                whileInView={revealUp.whileInView}
                                viewport={revealUp.viewport}
                                transition={{ ...revealUp.transition, delay: 0.2 }}
                                className="pt-1"
                            >
                                <Link to={currentDemo.to} className="btn-primary">
                                    Open {currentDemo.title}
                                    <ArrowRight size={17} />
                                </Link>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            initial={revealUp.initial}
                            whileInView={revealUp.whileInView}
                            viewport={revealUp.viewport}
                            transition={{ ...revealUp.transition, delay: 0.08 }}
                            className="lg:col-span-8 rounded-2xl border border-border-subtle bg-white shadow-premium overflow-hidden"
                        >
                            <div className="p-3 border-b border-border-subtle bg-slate-50 flex flex-wrap gap-2">
                                {demoStages.map((stage) => (
                                    <button
                                        key={stage.id}
                                        type="button"
                                        onClick={() => setActiveDemo(stage.id)}
                                        className={`px-4 py-2 rounded-full text-xs font-black tracking-wide cursor-pointer transition-colors ${activeDemo === stage.id
                                            ? 'bg-brand-primary text-white'
                                            : 'bg-white text-text-muted border border-border-subtle hover:text-brand-secondary'
                                            }`}
                                    >
                                        {stage.title}
                                    </button>
                                ))}
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentDemo.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.3 }}
                                    className="p-6 md:p-8 space-y-6"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-text-subtle">
                                                {currentDemo.subtitle}
                                            </p>
                                            <h3 className="text-2xl md:text-3xl font-black text-brand-secondary mt-1">{currentDemo.title} Stage</h3>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-xl bg-bg-muted border border-border-subtle p-3">
                                            <div className="text-center">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-subtle">Before</p>
                                                <p className="text-2xl font-black text-slate-500">{currentDemo.before}</p>
                                            </div>
                                            <ArrowRight size={18} className="text-brand-primary" />
                                            <div className="text-center">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-subtle">After</p>
                                                <p className="text-2xl font-black text-brand-primary">{currentDemo.after}</p>
                                            </div>
                                            <div className="text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                                +{improvement}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl bg-bg-muted border border-border-subtle p-4">
                                        <p className="text-sm text-text-muted font-semibold">{currentDemo.insight}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {currentDemo.bullets.map((point) => (
                                            <div key={point} className="rounded-xl border border-border-subtle p-4 flex gap-3">
                                                <div className="w-7 h-7 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                                                    <Check size={14} />
                                                </div>
                                                <p className="text-sm text-text-muted font-medium leading-relaxed">{point}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </section>

                <section className="py-16 md:py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                        <motion.div
                            initial={revealUp.initial}
                            whileInView={revealUp.whileInView}
                            viewport={revealUp.viewport}
                            transition={revealUp.transition}
                            className="text-center space-y-4"
                        >
                            <h2 className="section-heading">Everything you need to compete.</h2>
                            <p className="section-subheading">Purpose-built modules for diagnosis, rewriting, and confident applications.</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {features.map((feature, i) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 18 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.25 }}
                                    transition={{ duration: 0.4, delay: i * 0.03 }}
                                    className="zen-card p-7 space-y-4"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                                        <feature.icon size={21} />
                                    </div>
                                    <h3 className="text-xl font-black text-brand-secondary">{feature.title}</h3>
                                    <p className="text-sm text-text-muted leading-relaxed">{feature.text}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-16 md:py-24 bg-linear-to-b from-white to-bg-muted border-y border-border-subtle">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={revealUp.initial}
                            whileInView={revealUp.whileInView}
                            viewport={revealUp.viewport}
                            transition={revealUp.transition}
                            className="text-center space-y-4 mb-10"
                        >
                            <p className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-brand-primary/10 text-brand-primary text-[11px] font-black tracking-[0.2em] uppercase">
                                <Sparkles size={14} />
                                Match &amp; Fix
                            </p>
                            <h2 className="section-heading text-3xl md:text-5xl">What you get in the report</h2>
                            <p className="section-subheading max-w-2xl mx-auto">
                                One upload + one target job description (paste or public URL). The analysis is AI-generated and grounded in your resume text and the JD you provide.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            <motion.ul
                                initial={revealUp.initial}
                                whileInView={revealUp.whileInView}
                                viewport={revealUp.viewport}
                                transition={{ ...revealUp.transition, delay: 0.06 }}
                                className="space-y-3 rounded-2xl border border-border-subtle bg-white p-8 shadow-sm"
                            >
                                {matchFixWhatYouGet.map((item) => (
                                    <li key={item} className="flex gap-3 text-sm text-text-muted leading-relaxed">
                                        <Check size={18} className="text-brand-primary shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </motion.ul>
                            <motion.div
                                initial={revealUp.initial}
                                whileInView={revealUp.whileInView}
                                viewport={revealUp.viewport}
                                transition={{ ...revealUp.transition, delay: 0.1 }}
                                className="rounded-2xl border border-amber-200 bg-amber-50/80 p-8 space-y-4"
                            >
                                <h3 className="text-lg font-black text-brand-secondary">Timing</h3>
                                <p className="text-sm text-text-muted leading-relaxed">
                                    Most Match &amp; Fix runs finish in <strong className="text-brand-secondary">about one minute on average</strong>.
                                    Cold starts, long JDs, or heavy reports can take longer. Keep this tab open, do not refresh, and wait until you see the full report and scores.
                                </p>
                                <Link to="/resume-fix-lab" className="btn-primary inline-flex w-full sm:w-auto justify-center">
                                    Start Match &amp; Fix
                                    <ArrowRight size={17} />
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </section>

                <section className="py-16 md:py-24 bg-bg-muted">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
                        <motion.div
                            initial={revealUp.initial}
                            whileInView={revealUp.whileInView}
                            viewport={revealUp.viewport}
                            transition={revealUp.transition}
                            className="text-center space-y-4"
                        >
                            <h2 className="section-heading">How the system works.</h2>
                            <p className="section-subheading">A direct progression from insight to application-ready output.</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
                            <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-px bg-border-subtle" />
                            {phases.map((phase, i) => (
                                <motion.div
                                    key={phase.step}
                                    initial={{ opacity: 0, y: 18 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.4, delay: i * 0.06 }}
                                >
                                    <Link to={phase.to} className="relative z-10 no-underline group">
                                        <div className="bg-white rounded-2xl border border-border-subtle p-7 h-full transition-all duration-300 group-hover:shadow-premium group-hover:-translate-y-1">
                                            <div className="w-14 h-14 rounded-full border-2 border-brand-primary text-brand-primary flex items-center justify-center mb-5">
                                                <phase.icon size={24} />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-primary mb-2">Phase {phase.step}</p>
                                            <h3 className="text-2xl font-black text-brand-secondary mb-2.5">{phase.title}</h3>
                                            <p className="text-sm text-text-muted leading-relaxed">{phase.text}</p>
                                            <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary">
                                                Open Module
                                                <ArrowRight size={14} />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-16 md:py-24 bg-white border-t border-border-subtle">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={revealUp.initial}
                            whileInView={revealUp.whileInView}
                            viewport={revealUp.viewport}
                            transition={revealUp.transition}
                            className="zen-card p-8 md:p-10 text-center space-y-5"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto">
                                <Mail size={22} />
                            </div>
                            <h2 className="section-heading text-2xl md:text-3xl">Suggest improvements</h2>
                            <p className="text-text-muted leading-relaxed text-sm md:text-base">
                                This product is evolving. If something is confusing, missing, or broken — or you have feature ideas — send a note. We read every message.
                            </p>
                            <a
                                href="mailto:tekkdevv@gmail.com?subject=Resumit%20feedback"
                                className="btn-primary inline-flex items-center gap-2 justify-center w-full sm:w-auto"
                            >
                                <Mail size={18} />
                                tekkdevv@gmail.com
                            </a>
                        </motion.div>
                    </div>
                </section>

                <section className="py-16 md:py-24 bg-bg-muted">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                        <motion.div
                            initial={revealUp.initial}
                            whileInView={revealUp.whileInView}
                            viewport={revealUp.viewport}
                            transition={revealUp.transition}
                            className="text-center space-y-4"
                        >
                            <h2 className="section-heading text-3xl md:text-4xl">Frequently Asked Questions</h2>
                        </motion.div>

                        <div className="space-y-3">
                            {faqs.map((faq, i) => (
                                <motion.div
                                    key={faq.q}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.35, delay: i * 0.04 }}
                                    className="bg-white border border-border-subtle rounded-xl overflow-hidden"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                                        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-bg-muted/50 transition-colors cursor-pointer"
                                    >
                                        <span className="font-semibold text-brand-secondary">{faq.q}</span>
                                        <ChevronDown
                                            size={18}
                                            className={`text-text-subtle transition-transform duration-200 shrink-0 ml-4 ${faqOpen === i ? 'rotate-180' : ''
                                                }`}
                                        />
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
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={revealUp.initial}
                        whileInView={revealUp.whileInView}
                        viewport={revealUp.viewport}
                        transition={revealUp.transition}
                        className="max-w-7xl mx-auto rounded-3xl bg-brand-secondary p-10 md:p-14 lg:p-20 text-center relative overflow-hidden shadow-xl"
                    >
                        <div className="absolute inset-0 bg-linear-to-br from-brand-primary/20 via-transparent to-brand-accent/10" />
                        <div className="relative z-10 space-y-6">
                            <div className="w-14 h-14 rounded-2xl bg-brand-accent text-brand-secondary flex items-center justify-center mx-auto">
                                <Rocket size={28} />
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black text-white leading-[0.95] tracking-tight">
                                Build the Resume
                                <br />
                                That Gets Interviews.
                            </h2>
                            <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto">
                                Start with diagnostics, fix what matters, and apply with stronger positioning.
                            </p>
                            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
                                <Link
                                    to="/analysis"
                                    className="inline-flex items-center gap-2 py-4 px-10 rounded-full text-lg font-black bg-brand-primary text-white hover:bg-teal-400 transition-all active:scale-95 shadow-lg"
                                >
                                    Analyze Your Resume Now
                                </Link>
                                <Link
                                    to="/resume-fix-lab"
                                    className="inline-flex items-center gap-2 py-4 px-10 rounded-full text-lg font-black border-2 border-white/80 text-white hover:bg-white/10 transition-all active:scale-95"
                                >
                                    Match &amp; Fix
                                    <ArrowRight size={18} />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </section>
            </main>
        </PageLayout>
    );
};
