import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface UploadCardProps {
    onFileSelect: (file: File) => void;
    selectedFile: File | null;
}

export const UploadCard = ({ onFileSelect, selectedFile }: UploadCardProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragOut = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            simulateUpload(files[0]);
        }
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            simulateUpload(files[0]);
        }
    };

    const simulateUpload = (file: File) => {
        setUploadProgress(0);
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    onFileSelect(file);
                    return 100;
                }
                return prev + 10;
            });
        }, 50);
    };

    return (
        <Card className={`card-base h-full transition-all duration-200 ${isDragging ? 'border-brand-blue ring-2 ring-brand-blue/20' : ''
            }`}>
            <div
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className="p-8 h-full flex flex-col items-center justify-center text-center min-h-[300px]"
            >
                <input
                    type="file"
                    id="resume-upload"
                    className="hidden"
                    accept=".pdf,.docx"
                    onChange={handleFileInput}
                />

                {selectedFile ? (
                    <div className="w-full space-y-4">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8 text-signal-success" />
                        </div>
                        <div>
                            <h3 className="font-heading font-bold text-lg text-primary">
                                {selectedFile.name}
                            </h3>
                            <p className="text-sm text-text-secondary">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for Simulation
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => onFileSelect(null as any)}
                            className="text-sm text-text-secondary hover:text-primary"
                        >
                            Replace File
                        </Button>
                    </div>
                ) : (
                    <label htmlFor="resume-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${isDragging ? 'bg-brand-blue text-white' : 'bg-slate-100 text-text-secondary'
                            }`}>
                            <Upload className="w-8 h-8" />
                        </div>

                        <h3 className="font-heading font-bold text-xl text-primary mb-2">
                            Upload Resume
                        </h3>
                        <p className="text-text-secondary mb-6 max-w-xs mx-auto">
                            Drag & drop your PDF or DOCX file here, or click to browse
                        </p>

                        <div className="flex items-center space-x-2 text-xs text-text-muted bg-slate-50 px-3 py-1.5 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            <span>Supported Formats: PDF, DOCX (Max 5MB)</span>
                        </div>
                    </label>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full max-w-xs mt-6 space-y-2">
                        <Progress value={uploadProgress} className="h-1" />
                        <p className="text-xs text-text-muted font-mono">Uploading... {uploadProgress}%</p>
                    </div>
                )}
            </div>
        </Card>
    );
};
