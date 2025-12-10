import { Shell } from '@/components/layout/Shell';
import { TemplateSelector } from '@/components/optimization/TemplateSelector';
import { FullRewrite } from '@/components/optimization/FullRewrite';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Sparkles, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const styles = {
    container: {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '3rem 1.5rem',
        background: 'linear-gradient(to bottom, #fafafa 0%, #ffffff 100%)',
        minHeight: '100vh'
    },
    header: {
        marginBottom: '3rem',
        position: 'relative' as const,
        paddingBottom: '2rem',
        borderBottom: '2px solid #f0f0f0'
    },
    backButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        marginBottom: '1.5rem',
        color: '#6b7280',
        fontSize: '0.875rem',
        fontWeight: 500,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        borderRadius: '8px'
    },
    title: {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '3rem',
        fontWeight: 700,
        background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '0.75rem',
        letterSpacing: '-0.02em'
    },
    subtitle: {
        fontSize: '1.125rem',
        color: '#64748b',
        maxWidth: '600px',
        lineHeight: '1.6'
    },
    tabsContainer: {
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        border: '1px solid #f0f0f0'
    },
    tabsList: {
        display: 'inline-flex',
        gap: '0.5rem',
        padding: '0.5rem',
        background: '#f8fafc',
        borderRadius: '12px',
        marginBottom: '2rem',
        border: '1px solid #e2e8f0'
    },
    tabTrigger: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        fontSize: '0.95rem',
        fontWeight: 600,
        color: '#64748b',
        background: 'transparent',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: "'Space Grotesk', sans-serif"
    },
    tabTriggerActive: {
        background: 'white',
        color: '#1e293b',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
    },
    sectionHeader: {
        marginBottom: '2rem',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
    },
    sectionTitle: {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '1.5rem',
        fontWeight: 700,
        color: '#1e293b',
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
    },
    sectionDesc: {
        fontSize: '0.95rem',
        color: '#64748b',
        lineHeight: '1.6'
    },
    iconWrapper: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
    }
};

export const OptimizationHub = () => {
    const navigate = useNavigate();

    return (
        <Shell>
            <div style={styles.container}>
                <div style={styles.header}>
                    <button
                        style={styles.backButton}
                        onClick={() => navigate(-1)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.color = '#1e293b';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#6b7280';
                        }}
                    >
                        <ArrowLeft size={16} />
                        Back to Home
                    </button>
                    <h1 style={styles.title}>
                        Optimization Hub
                    </h1>
                    <p style={styles.subtitle}>
                        Transform your resume with AI-powered rewrites and professional templates designed to beat ATS systems.
                    </p>
                </div>

                <div style={styles.tabsContainer}>
                    <Tabs defaultValue="rewrite" className="w-full">
                        <TabsList className="inline-flex gap-2 p-2 mb-8" style={{
                            background: '#f8fafc',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <TabsTrigger
                                value="templates"
                                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg transition-all"
                                style={{
                                    fontFamily: "'Space Grotesk', sans-serif"
                                }}
                            >
                                <FileText size={18} />
                                Templates
                            </TabsTrigger>
                            <TabsTrigger
                                value="rewrite"
                                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg transition-all"
                                style={{
                                    fontFamily: "'Space Grotesk', sans-serif"
                                }}
                            >
                                <Sparkles size={18} />
                                AI Rewrite
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="templates" className="mt-0">
                            <div style={styles.sectionHeader}>
                                <h2 style={styles.sectionTitle}>
                                    <div style={styles.iconWrapper}>
                                        <FileText size={20} />
                                    </div>
                                    Strategic Templates
                                </h2>
                                <p style={styles.sectionDesc}>
                                    Professional, ATS-optimized templates selected based on your target role and industry. Each template is tested against major ATS systems like Workday, Taleo, and Greenhouse.
                                </p>
                            </div>
                            <TemplateSelector role="DevOps" onSelect={(id) => console.log('Selected:', id)} />
                        </TabsContent>

                        <TabsContent value="rewrite" className="mt-0">
                            <div style={styles.sectionHeader}>
                                <h2 style={styles.sectionTitle}>
                                    <div style={styles.iconWrapper}>
                                        <Sparkles size={20} />
                                    </div>
                                    Gemini AI Resume Rewriter
                                </h2>
                                <p style={styles.sectionDesc}>
                                    Upload your resume and job description. Our Gemini-powered AI will rewrite your content to maximize ATS compatibility while maintaining truthfulness and your unique voice.
                                </p>
                            </div>
                            <FullRewrite />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </Shell>
    );
};
