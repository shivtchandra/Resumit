import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Sparkles, RotateCcw, Filter, LayoutGrid, CheckCircle2, Rocket, TrendingUp, Crown, ChevronRight } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';
import { PageGuide } from '../components/layout/PageGuide';
import { WorkflowMap } from '../components/layout/WorkflowMap';
import { TemplateCard } from '../components/templates/TemplateCard';
import { PDFPreviewModal } from '../components/templates/PDFPreviewModal';
import { LoadingSpinner } from '../components/ui/Loading';
import { getProductionTemplates } from '../data/allTemplates';
import type { ResumeTemplate } from '../data/realisticTemplates';
import { motion, AnimatePresence } from 'framer-motion';

type SortMode = 'recommended' | 'ats_desc' | 'name_asc';

const LEVEL_OPTIONS: Array<'Entry' | 'Mid' | 'Senior' | 'Executive'> = ['Entry', 'Mid', 'Senior', 'Executive'];

export const Templates = () => {
    const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [selectedLevel, setSelectedLevel] = useState('all');
    const [selectedATS, setSelectedATS] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<SortMode>('recommended');
    const [preset, setPreset] = useState<'none' | 'entry' | 'mid' | 'senior'>('none');
    const [trendingOnly, setTrendingOnly] = useState(false);

    const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null);

    useEffect(() => {
        setLoading(true);
        try {
            setTemplates(getProductionTemplates());
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const roleOptions = useMemo(
        () => ['all', ...Array.from(new Set(templates.map((t) => t.metadata.role))).sort()],
        [templates]
    );

    const atsOptions = useMemo(
        () => Array.from(new Set(templates.flatMap((t) => t.metadata.ats_compatibility))).sort(),
        [templates]
    );

    const filteredTemplates = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        const filtered = templates.filter((template) => {
            const searchable = [
                template.metadata.template_name,
                template.metadata.role,
                template.metadata.description,
                template.content.personalInfo.name,
            ].join(' ').toLowerCase();

            const matchesSearch = !q || searchable.includes(q);
            const matchesRole = selectedRole === 'all' || template.metadata.role === selectedRole;
            const matchesLevel = selectedLevel === 'all' || template.metadata.experience_level === selectedLevel;
            const matchesATS =
                selectedATS.length === 0 ||
                selectedATS.some((vendor) => template.metadata.ats_compatibility.includes(vendor));
            const matchesTrending =
                !trendingOnly || (template.metadata.tags?.includes('trending') ?? false);

            return matchesSearch && matchesRole && matchesLevel && matchesATS && matchesTrending;
        });

        if (sortBy === 'name_asc') {
            return [...filtered].sort((a, b) => a.metadata.template_name.localeCompare(b.metadata.template_name));
        }
        if (sortBy === 'ats_desc') {
            return [...filtered].sort((a, b) => b.metadata.ats_success_rate - a.metadata.ats_success_rate);
        }
        return [...filtered].sort((a, b) => {
            if (b.metadata.ats_success_rate !== a.metadata.ats_success_rate) {
                return b.metadata.ats_success_rate - a.metadata.ats_success_rate;
            }
            return a.metadata.template_name.localeCompare(b.metadata.template_name);
        });
    }, [templates, searchQuery, selectedRole, selectedLevel, selectedATS, sortBy, trendingOnly]);

    const applyPreset = (value: 'entry' | 'mid' | 'senior') => {
        setPreset(value);
        setTrendingOnly(false);
        if (value === 'entry') {
            setSelectedLevel('Entry');
            setSortBy('recommended');
            return;
        }
        if (value === 'mid') {
            setSelectedLevel('Mid');
            setSortBy('ats_desc');
            return;
        }
        setSelectedLevel('Senior');
        setSortBy('ats_desc');
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedRole('all');
        setSelectedLevel('all');
        setSelectedATS([]);
        setSortBy('recommended');
        setPreset('none');
        setTrendingOnly(false);
    };

    const toggleATS = (vendor: string) => {
        setPreset('none');
        setTrendingOnly(false);
        setSelectedATS((prev) =>
            prev.includes(vendor) ? prev.filter((item) => item !== vendor) : [...prev, vendor]
        );
    };

    return (
        <PageLayout header={<Navbar />} maxWidth="full">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-10">
                {/* Header Section */}
                <motion.section
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative p-8 lg:p-12 rounded-premium border border-border-subtle overflow-hidden bg-white"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5 animate-float pointer-events-none">
                        <LayoutGrid size={160} />
                    </div>

                    <div className="relative z-10 space-y-4 max-w-3xl">
                        <div className="page-badge">
                            <Sparkles size={14} />
                            Professional Library
                        </div>
                        <h1 className="page-hero-title">
                            The Architect's <span className="text-brand-primary">Collection.</span>
                        </h1>
                        <p className="text-lg text-text-muted leading-relaxed font-medium">
                            Clean, high-performance resumes designed for clarity and impact. Every template is verified against major ATS parsers to ensure your content actually gets read.
                        </p>
                    </div>
                </motion.section>

                <div className="hidden md:block">
                    <PageGuide
                        badge="STRATEGY"
                        title="Structure Wins Interviews"
                        description="While aesthetics matter, information density and section hierarchy are what satisfy both human recruiters and AI algorithms."
                        whatThisPageDoes="Explore verified blueprints for every stage of your career."
                        bestUseCase="Best used after you've refined your content in the Analysis tool and need a professional container."
                        howToUse={[
                            'Filter by your current career seniority level.',
                            'Select templates compatible with your target ATS (e.g., Workday).',
                            'Compare 2-3 visual styles before committing.',
                            'Focus on the section arrangement that best highlights your strengths.'
                        ]}
                        makeMostOfIt={[
                            'Stick to one primary template to maintain consistency.',
                            'Avoid complex multi-column layouts if applying to legacy companies.',
                            'Ensure your most important skills appear in the top 30% of the page.'
                        ]}
                        primaryAction={{ label: 'Go to Match & Fix', to: '/resume-fix-lab' }}
                        secondaryAction={{ label: 'Back to Analysis', to: '/analysis' }}
                    />
                </div>

                <div className="hidden md:block">
                    <WorkflowMap currentStep="templates" />
                </div>

                <section className="bg-white rounded-premium border border-border-subtle p-5 shadow-sm">
                    <div className="text-xs font-black tracking-widest uppercase text-brand-secondary mb-2">Template Safety Check</div>
                    <p className="text-sm text-text-muted leading-relaxed">
                        Technical templates now include both LinkedIn and GitHub header slots by default, so users do not miss critical profile links.
                    </p>
                </section>

                {/* Filter & Tools Panel */}
                <section className="bg-white rounded-premium border border-border-subtle shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border-subtle bg-bg-surface/30 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-brand-secondary font-bold">
                            <Filter size={18} className="text-brand-primary" />
                            <span>Refine Library</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-brand-secondary transition-colors px-3 py-1.5 rounded-full hover:bg-bg-surface"
                            >
                                <RotateCcw size={14} />
                                Clear All
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Presets Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: 'entry', title: 'Starter Pack', desc: 'Optimized for rapid growth and entry-level impact.', Icon: Rocket, gradient: 'from-emerald-50 to-teal-50', iconBg: 'bg-emerald-100 text-emerald-600', activeBorder: 'border-emerald-400' },
                                { id: 'mid', title: 'Professional', desc: 'Balanced layouts for mid-career storytellers.', Icon: TrendingUp, gradient: 'from-blue-50 to-indigo-50', iconBg: 'bg-blue-100 text-blue-600', activeBorder: 'border-blue-400' },
                                { id: 'senior', title: 'Executive', desc: 'Ownership and strategy emphasis for leaders.', Icon: Crown, gradient: 'from-amber-50 to-orange-50', iconBg: 'bg-amber-100 text-amber-600', activeBorder: 'border-amber-400' },
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => applyPreset(p.id as any)}
                                    className={`text-left p-6 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden ${preset === p.id
                                        ? `${p.activeBorder} bg-gradient-to-br ${p.gradient} shadow-md`
                                        : 'border-border-subtle bg-white hover:border-brand-primary/30 hover:shadow-lg hover:-translate-y-0.5'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`w-10 h-10 rounded-xl ${p.iconBg} flex items-center justify-center`}>
                                            <p.Icon size={20} />
                                        </div>
                                        <ChevronRight size={16} className={`transition-transform ${preset === p.id ? 'text-brand-primary translate-x-0' : 'text-text-subtle -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                                    </div>
                                    <h3 className={`font-extrabold text-sm mb-1 ${preset === p.id ? 'text-brand-secondary' : 'text-text-muted group-hover:text-brand-secondary'}`}>
                                        {p.title}
                                    </h3>
                                    <p className="text-xs text-text-muted leading-relaxed">{p.desc}</p>
                                </button>
                            ))}
                        </div>

                        {/* Search & Sort Row */}
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle group-focus-within:text-brand-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by role, style, or specific name..."
                                    className="w-full bg-slate-50 border border-border-subtle rounded-inner py-3 pl-12 pr-4 text-sm focus:bg-white focus:border-brand-primary transition-all outline-none"
                                />
                            </div>
                            <div className="w-full lg:w-64">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortMode)}
                                    className="w-full bg-white border border-border-subtle rounded-inner py-3 px-4 text-sm font-bold text-brand-secondary outline-none focus:border-brand-primary"
                                >
                                    <option value="recommended">Recommended Sort</option>
                                    <option value="ats_desc">Highest ATS Score</option>
                                    <option value="name_asc">Name (A-Z)</option>
                                </select>
                            </div>
                        </div>

                        {/* Chips Filters */}
                        <div className="space-y-4">
                            {/* Role Chips */}
                            <div className="flex flex-wrap gap-2 pb-2 border-b border-dashed border-border-subtle">
                                <span className="text-[10px] font-bold text-text-subtle uppercase tracking-widest w-full mb-1">Target Cluster</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPreset('none');
                                        setTrendingOnly((v) => !v);
                                    }}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${trendingOnly
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                                        : 'bg-white text-text-muted border-border-subtle hover:border-amber-400/60'
                                        }`}
                                >
                                    <TrendingUp size={14} aria-hidden />
                                    Trending stacks
                                </button>
                                {roleOptions.map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => { setPreset('none'); setTrendingOnly(false); setSelectedRole(role); }}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedRole === role
                                            ? 'bg-brand-primary text-white border-brand-primary shadow-glow-cyan'
                                            : 'bg-white text-text-muted border-border-subtle hover:border-brand-primary/50'
                                            }`}
                                    >
                                        {role === 'all' ? 'All Roles' : role}
                                    </button>
                                ))}
                            </div>

                            {/* Level & ATS Chips */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <span className="text-[10px] font-bold text-text-subtle uppercase tracking-widest flex items-center gap-2">
                                        Seniority Depth
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => { setPreset('none'); setTrendingOnly(false); setSelectedLevel('all'); }}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedLevel === 'all'
                                                ? 'bg-brand-secondary text-white border-brand-secondary'
                                                : 'bg-white text-text-muted border-border-subtle hover:border-brand-primary/50'
                                                }`}
                                        >
                                            All Levels
                                        </button>
                                        {LEVEL_OPTIONS.map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => { setPreset('none'); setTrendingOnly(false); setSelectedLevel(level); }}
                                                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedLevel === level
                                                    ? 'bg-brand-secondary text-white border-brand-secondary'
                                                    : 'bg-white text-text-muted border-border-subtle hover:border-brand-primary/50'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <span className="text-[10px] font-bold text-text-subtle uppercase tracking-widest flex items-center gap-2">
                                        ATS Engine Verification
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {atsOptions.map((vendor) => (
                                            <button
                                                key={vendor}
                                                onClick={() => toggleATS(vendor)}
                                                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${selectedATS.includes(vendor)
                                                    ? 'bg-teal-600 text-white border-teal-600'
                                                    : 'bg-white text-text-muted border-border-subtle hover:border-teal-500/50'
                                                    }`}
                                            >
                                                {selectedATS.includes(vendor) && <CheckCircle2 size={12} />}
                                                {vendor.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Result Meta */}
                        <div className="flex items-center justify-between text-xs py-2 px-1 border-t border-slate-50">
                            <div className="text-text-muted">
                                Discovering <strong className="text-brand-secondary">{filteredTemplates.length}</strong> industry blueprints
                            </div>
                            <div className="hidden sm:block text-text-subtle font-medium italic">
                                Advice: High success rates indicate superior semantic structure.
                            </div>
                        </div>
                    </div>
                </section>

                {/* Templates Grid Content */}
                <div className="relative min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center p-20"
                            >
                                <LoadingSpinner size="lg" message="Calibrating library..." />
                            </motion.div>
                        ) : filteredTemplates.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-premium border border-border-subtle p-20 text-center space-y-4"
                            >
                                <LayoutGrid size={48} className="mx-auto text-text-subtle/30" />
                                <div>
                                    <h3 className="text-xl font-bold text-brand-secondary">No exact matches found</h3>
                                    <p className="text-text-muted mt-1">Try broadening your search or resetting filters to explore more styles.</p>
                                </div>
                                <button
                                    onClick={resetFilters}
                                    className="btn-secondary px-8 py-2.5"
                                >
                                    Reset Discovery Tools
                                </button>
                            </motion.div>
                        ) : (
                            <motion.section
                                key="grid"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {filteredTemplates.map((template) => (
                                    <TemplateCard
                                        key={template.metadata.template_id}
                                        template={{
                                            template_id: template.metadata.template_id,
                                            name: template.metadata.template_name,
                                            role: template.metadata.role,
                                            experience_level: template.metadata.experience_level,
                                            ats_compatibility: template.metadata.ats_compatibility,
                                            ats_success_rate: template.metadata.ats_success_rate,
                                            description: template.metadata.description,
                                            tags: template.metadata.tags,
                                        }}
                                        onPreview={(id) => {
                                            const chosen = templates.find((item) => item.metadata.template_id === id);
                                            if (chosen) setPreviewTemplate(chosen);
                                        }}
                                    />
                                ))}
                            </motion.section>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {previewTemplate && (
                <PDFPreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />
            )}
        </PageLayout>
    );
};
