import { Shell } from '@/components/layout/Shell';
import { ScoreGauge } from '@/components/analysis/ScoreGauge';
import { MatchBar } from '@/components/analysis/MatchBar';
import { IssueAccordion } from '@/components/analysis/IssueAccordion';
import { TimelineChart } from '@/components/analysis/TimelineChart';
import { EntityHighlighter } from '@/components/analysis/EntityHighlighter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, ArrowLeft, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { AnalysisResult } from '@/types';
import { useNavigate } from 'react-router-dom';

interface AnalysisReportProps {
    result: AnalysisResult;
    onReset: () => void;
}

export const AnalysisReport = ({ result, onReset }: AnalysisReportProps) => {
    const navigate = useNavigate();
    // Mock data for visualization (replace with real data from result)
    const timelineData = [
        { year: '2024', duration: 6, role: 'Senior Dev', company: 'Tech Corp', gap: false },
        { year: '2023', duration: 12, role: 'Senior Dev', company: 'Tech Corp', gap: false },
        { year: '2022', duration: 3, role: 'Gap', company: 'Unemployed', gap: true },
        { year: '2021', duration: 12, role: 'Developer', company: 'StartUp Inc', gap: false },
    ];

    const entities = [
        { category: 'Skills', items: ['Python', 'React', 'TypeScript', 'AWS', 'Docker', 'Kubernetes'] },
        { category: 'Job Titles', items: ['Senior Developer', 'Software Engineer', 'Frontend Lead'] },
        { category: 'Education', items: ['B.S. Computer Science', 'M.S. Software Engineering'] },
    ];

    const issues = [
        {
            id: '1',
            severity: 'critical' as const,
            title: 'Taleo Parsing Risk',
            description: 'Tables detected in Work Experience section. Taleo often fails to parse table content correctly.',
            fix: 'Convert table layout to standard list format.'
        },
        {
            id: '2',
            severity: 'warning' as const,
            title: 'Missing Keywords',
            description: 'Your resume is missing 3 critical keywords found in the job description: "CI/CD", "GraphQL", "Agile".',
            fix: 'Incorporate these keywords into your Skills or Experience sections.'
        },
        {
            id: '3',
            severity: 'info' as const,
            title: 'Email Format',
            description: 'Professional email address detected. Good job.',
        }
    ];

    return (
        <Shell>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <Button
                            variant="ghost"
                            onClick={onReset}
                            className="pl-0 hover:bg-transparent hover:text-primary text-text-secondary mb-2"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Simulator
                        </Button>
                        <h1 className="text-3xl font-heading font-bold text-primary">
                            Mission Control: Analysis Report
                        </h1>
                        <p className="text-text-secondary">
                            Tactical analysis of your resume's performance against ATS algorithms.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="border-border-subtle">
                            <Download className="w-4 h-4 mr-2" />
                            Export PDF
                        </Button>
                        <Button
                            className="bg-primary hover:bg-primary-hover text-white"
                            onClick={() => navigate('/optimize')}
                        >
                            Optimize Resume
                        </Button>
                    </div>
                </div>

                {/* Top Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="card-base p-6 flex items-center justify-center">
                        <ScoreGauge
                            score={result.friendliness_score}
                            label="ATS Friendliness"
                            subLabel="Pass Rate Probability"
                        />
                    </Card>
                    <Card className="card-base p-6 flex items-center justify-center">
                        <ScoreGauge
                            score={result.relevance_score}
                            label="Role Match"
                            subLabel="Semantic Relevance"
                            color="var(--color-signal-success)"
                        />
                    </Card>
                    <Card className="card-base p-6">
                        <h3 className="font-heading font-bold text-lg text-primary mb-4">Vendor Compatibility</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="w-5 h-5 text-signal-success" />
                                    <span className="text-sm font-medium">Workday</span>
                                </div>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Compatible</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <AlertTriangle className="w-5 h-5 text-signal-warning" />
                                    <span className="text-sm font-medium">Taleo</span>
                                </div>
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">Parsing Risk</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <XCircle className="w-5 h-5 text-signal-danger" />
                                    <span className="text-sm font-medium">Greenhouse</span>
                                </div>
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Incompatible</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="issues" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px] mb-6">
                        <TabsTrigger value="issues">Critical Issues</TabsTrigger>
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        <TabsTrigger value="extraction">AI Extraction</TabsTrigger>
                    </TabsList>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Tab Content */}
                        <div className="lg:col-span-2">
                            <TabsContent value="issues" className="mt-0">
                                <Card className="card-base p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-heading font-bold text-xl text-primary">
                                            Detected Risks & Blockers
                                        </h3>
                                        <span className="bg-red-100 text-signal-danger text-xs font-bold px-3 py-1 rounded-full">
                                            3 Critical
                                        </span>
                                    </div>
                                    <IssueAccordion issues={issues} />
                                </Card>
                            </TabsContent>

                            <TabsContent value="timeline" className="mt-0">
                                <Card className="card-base p-6">
                                    <h3 className="font-heading font-bold text-xl text-primary mb-6">
                                        Employment Timeline Analysis
                                    </h3>
                                    <TimelineChart data={timelineData} />
                                    <div className="mt-6 p-4 bg-slate-50 rounded border border-border-subtle">
                                        <p className="text-sm text-text-secondary">
                                            <span className="font-bold text-primary">Analysis:</span> A 3-month gap was detected in 2022.
                                            ATS systems may flag this. Consider adding a "Sabbatical" or "Freelance" entry to bridge the gap.
                                        </p>
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="extraction" className="mt-0">
                                <Card className="card-base p-6">
                                    <h3 className="font-heading font-bold text-xl text-primary mb-6">
                                        What the ATS Sees (NER Extraction)
                                    </h3>
                                    <EntityHighlighter entities={entities} />
                                </Card>
                            </TabsContent>
                        </div>

                        {/* Right Column: Match Analysis */}
                        <div className="space-y-6">
                            <Card className="card-base p-6">
                                <h3 className="font-heading font-bold text-lg text-primary mb-4">
                                    Keyword Gap Analysis
                                </h3>
                                <ScrollArea className="h-[300px] pr-4">
                                    <div className="space-y-4">
                                        <MatchBar score={85} label="Hard Skills" role="DevOps" />
                                        <MatchBar score={60} label="Soft Skills" role="DevOps" />
                                        <MatchBar score={40} label="Tools" role="DevOps" />
                                    </div>

                                    <div className="mt-6">
                                        <h4 className="text-sm font-bold text-text-secondary mb-3">MISSING KEYWORDS</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {['Kubernetes', 'Terraform', 'Azure', 'Agile', 'Scrum'].map(kw => (
                                                <span key={kw} className="text-xs border border-signal-danger text-signal-danger px-2 py-1 rounded bg-red-50">
                                                    {kw}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </ScrollArea>
                            </Card>
                        </div>
                    </div>
                </Tabs>
            </div>
        </Shell>
    );
};
