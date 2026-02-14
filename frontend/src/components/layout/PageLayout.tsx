import { ReactNode } from 'react';
import { Footer } from './Footer';

interface PageLayoutProps {
    children: ReactNode;
    header?: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    showFooter?: boolean;
}

export const PageLayout = ({ children, header, maxWidth = '2xl', showFooter = true }: PageLayoutProps) => {
    const maxWidthClasses = {
        sm: 'max-w-screen-sm',
        md: 'max-w-screen-md',
        lg: 'max-w-screen-lg',
        xl: 'max-w-screen-xl',
        '2xl': 'max-w-screen-2xl',
        full: 'max-w-full'
    };

    return (
        <div className="min-h-screen bg-bg-page text-text-main font-body flex flex-col">
            {header && (
                <header className="z-50">
                    {header}
                </header>
            )}
            <main className={`flex-1 ${maxWidth === 'full' ? 'w-full' : `mx-auto w-full ${maxWidthClasses[maxWidth]}`}`}>
                {children}
            </main>
            {showFooter && <Footer />}
        </div>
    );
};
