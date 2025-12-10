import { ReactNode } from 'react';

interface PageLayoutProps {
    children: ReactNode;
    header?: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const PageLayout = ({ children, header, maxWidth = '2xl' }: PageLayoutProps) => {
    const maxWidthClasses = {
        sm: 'max-w-screen-sm',
        md: 'max-w-screen-md',
        lg: 'max-w-screen-lg',
        xl: 'max-w-screen-xl',
        '2xl': 'max-w-screen-2xl',
        full: 'max-w-full'
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-page)',
            color: 'var(--text-main)'
        }} className="font-[var(--font-body)]">
            {header && (
                <header className="sticky top-0 z-50">
                    {header}
                </header>
            )}
            <main className={maxWidth === 'full' ? 'w-full' : `mx-auto ${maxWidthClasses[maxWidth]}`}>
                {children}
            </main>
        </div>
    );
};
