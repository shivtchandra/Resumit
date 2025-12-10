import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { UploadCard } from '@/components/dashboard/UploadCard';
import { JobDescriptionCard } from '@/components/dashboard/JobDescriptionCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { analyzeResume } from '@/services/api';
import { Loader2 } from 'lucide-react';
import type { AnalysisResult } from '@/types';

interface SimulatorEntryProps {
    onAnalysisComplete: (result: AnalysisResult) => void;
}

export const SimulatorEntry = ({ onAnalysisComplete }: SimulatorEntryProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [jd, setJd] = useState('');
    const [role, setRole] = useState('');
    const [ats, setAts] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);

    const handleSimulation = async () => {
        if (!file) return;

        setIsSimulating(true);
        try {
            // Simulate "tactical" delay for effect
            await new Promise(resolve => setTimeout(resolve, 1500));
            const result = await analyzeResume(file, jd || undefined);
            onAnalysisComplete(result);
        } catch (error) {
            console.error('Simulation failed:', error);
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <Shell>
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                {/* Hero Section */}
                <div className="text-center mb-12 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary tracking-tight">
                        Outsmart the ATS.
                    </h1>
                    <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                        Build a resume that passes machines and impresses humans.
                        Run a professional simulation against top ATS algorithms.
                    </p>
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Left: Upload */}
                    <div className="h-full">
                        <UploadCard onFileSelect={setFile} selectedFile={file} />
                    </div>

                    {/* Right: Job Description */}
                    <div className="h-full">
                        <JobDescriptionCard value={jd} onChange={setJd} />
                    </div>
                </div>

                {/* Configuration Bar */}
                <div className="bg-surface border border-border-subtle rounded-xl p-6 shadow-sm mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Intended Role</label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger className="w-full bg-canvas border-border-subtle">
                                    <SelectValue placeholder="Select Role..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="software-engineer">Software Engineer</SelectItem>
                                    <SelectItem value="product-manager">Product Manager</SelectItem>
                                    <SelectItem value="data-scientist">Data Scientist</SelectItem>
                                    <SelectItem value="marketing">Marketing Manager</SelectItem>
                                    <SelectItem value="sales">Sales Representative</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Target ATS</label>
                            <Select value={ats} onValueChange={setAts}>
                                <SelectTrigger className="w-full bg-canvas border-border-subtle">
                                    <SelectValue placeholder="Select ATS Vendor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="workday">Workday</SelectItem>
                                    <SelectItem value="taleo">Taleo (Oracle)</SelectItem>
                                    <SelectItem value="greenhouse">Greenhouse</SelectItem>
                                    <SelectItem value="icims">iCIMS</SelectItem>
                                    <SelectItem value="lever">Lever</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            size="lg"
                            className="w-full font-heading font-bold text-lg h-11"
                            disabled={!file || isSimulating}
                            onClick={handleSimulation}
                        >
                            {isSimulating ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Running Simulation...
                                </>
                            ) : (
                                "Start Simulation"
                            )}
                        </Button>
                    </div>
                </div>

                {/* Trust Signals */}
                <div className="text-center">
                    <p className="text-sm text-text-muted mb-4">Trusted by candidates landing jobs at</p>
                    <div className="flex justify-center items-center space-x-8 opacity-50 grayscale">
                        {/* Placeholders for logos */}
                        <span className="font-heading font-bold text-xl">Google</span>
                        <span className="font-heading font-bold text-xl">Amazon</span>
                        <span className="font-heading font-bold text-xl">Microsoft</span>
                        <span className="font-heading font-bold text-xl">Netflix</span>
                    </div>
                </div>
            </div>
        </Shell>
    );
};
