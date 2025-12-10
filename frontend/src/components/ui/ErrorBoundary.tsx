import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div
                    className="min-h-screen flex items-center justify-center p-4"
                    style={{ background: 'var(--color-bg-dark)' }}
                >
                    <div
                        className="max-w-md w-full p-8 rounded-2xl text-center"
                        style={{
                            background: 'var(--color-bg-card)',
                            border: '1px solid var(--color-border-subtle)',
                        }}
                    >
                        <div
                            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                            style={{
                                background: 'rgba(255, 71, 87, 0.1)',
                                border: '2px solid var(--color-accent-red)',
                            }}
                        >
                            <AlertTriangle
                                className="w-8 h-8"
                                style={{ color: 'var(--color-accent-red)' }}
                            />
                        </div>
                        <h2
                            className="font-heading font-bold text-2xl mb-2"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            Something Went Wrong
                        </h2>
                        <p
                            className="mb-6"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                            style={{
                                background: 'var(--color-accent-cyan)',
                                color: 'var(--color-bg-dark)',
                                boxShadow: 'var(--shadow-glow-cyan)',
                            }}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
