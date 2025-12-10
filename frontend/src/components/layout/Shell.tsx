import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface ShellProps {
    children: ReactNode;
}

export const Shell = ({ children }: ShellProps) => {
    return (
        <div className="min-h-screen flex flex-col bg-canvas font-sans text-text-primary">
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
};
