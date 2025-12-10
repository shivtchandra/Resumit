import { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { motion } from 'framer-motion';

interface UploadZoneProps {
    onFileSelect: (file: File) => void;
}

export const UploadZone = ({ onFileSelect }: UploadZoneProps) => {
    const [isDragging, setIsDragging] = useState(false);

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
            onFileSelect(files[0]);
        }
    }, [onFileSelect]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            onFileSelect(files[0]);
        }
    };

    return (
        <div
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-12 transition-all ${isDragging
                ? 'border-heist-red bg-heist-red/10 shadow-vault'
                : 'border-vault-steel bg-vault-gray hover:border-vault-silver'
                }`}
        >
            <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.docx"
                onChange={handleFileInput}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
                <motion.div
                    className="flex flex-col items-center space-y-4"
                    whileHover={{ scale: 1.02 }}
                >
                    <Upload className="w-16 h-16 text-heist-red" />
                    <div className="text-center">
                        <p className="text-xl font-bold text-vault-white mb-2">
                            📄 UPLOAD BLUEPRINT (Your Resume)
                        </p>
                        <p className="text-sm text-vault-silver">
                            Drag PDF/DOCX or click to browse
                        </p>
                    </div>
                </motion.div>
            </label>
        </div>
    );
};
