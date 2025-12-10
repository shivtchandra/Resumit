import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onClose: () => void;
}

export const Toast = ({ message, type = 'info', duration = 3000, onClose }: ToastProps) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const config = {
        success: {
            icon: CheckCircle,
            color: 'var(--color-accent-green)',
            bg: 'rgba(16, 185, 129, 0.1)',
            border: 'rgba(16, 185, 129, 0.3)',
        },
        error: {
            icon: AlertCircle,
            color: 'var(--color-accent-red)',
            bg: 'rgba(255, 71, 87, 0.1)',
            border: 'rgba(255, 71, 87, 0.3)',
        },
        info: {
            icon: Info,
            color: 'var(--color-accent-cyan)',
            bg: 'rgba(0, 217, 255, 0.1)',
            border: 'rgba(0, 217, 255, 0.3)',
        },
    };

    const { icon: Icon, color, bg, border } = config[type];

    return (
        <div
            className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg min-w-[300px] max-w-md transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                }`}
            style={{
                background: bg,
                border: `1px solid ${border}`,
                boxShadow: 'var(--shadow-float)',
            }}
        >
            <Icon className="w-5 h-5 flex-shrink-0" style={{ color }} />
            <p className="flex-1 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {message}
            </p>
            <button
                onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                }}
                className="p-1 rounded transition-all hover:scale-110"
                style={{ color }}
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

// Toast manager hook
export const useToast = () => {
    const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' | 'info' }>>([]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return {
        toasts,
        showToast,
        removeToast,
        success: (message: string) => showToast(message, 'success'),
        error: (message: string) => showToast(message, 'error'),
        info: (message: string) => showToast(message, 'info'),
    };
};
