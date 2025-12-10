import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner = ({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <Loader2
                className={`${sizeClasses[size]} animate-spin mb-3`}
                style={{ color: 'var(--color-accent-cyan)' }}
            />
            <p
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
            >
                {message}
            </p>
        </div>
    );
};

interface LoadingSkeletonProps {
    count?: number;
    height?: string;
}

export const LoadingSkeleton = ({ count = 1, height = '80px' }: LoadingSkeletonProps) => {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-lg animate-pulse"
                    style={{
                        background: 'var(--color-bg-card)',
                        height,
                    }}
                />
            ))}
        </div>
    );
};

interface LoadingOverlayProps {
    message?: string;
}

export const LoadingOverlay = ({ message = 'Processing...' }: LoadingOverlayProps) => {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            style={{ background: 'rgba(15, 20, 25, 0.8)' }}
        >
            <div
                className="p-8 rounded-2xl text-center"
                style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border-subtle)',
                    boxShadow: 'var(--shadow-float)',
                }}
            >
                <Loader2
                    className="w-12 h-12 animate-spin mx-auto mb-4"
                    style={{ color: 'var(--color-accent-cyan)' }}
                />
                <p
                    className="font-heading font-semibold text-lg"
                    style={{ color: 'var(--color-text-primary)' }}
                >
                    {message}
                </p>
            </div>
        </div>
    );
};
