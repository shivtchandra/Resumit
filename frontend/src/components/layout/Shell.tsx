import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface ShellProps {
    children: ReactNode;
}

export const Shell = ({ children }: ShellProps) => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)', color: 'var(--text-main)' }}>
            <Navbar />
            <main style={{ flexGrow: 1 }}>
                {children}
            </main>
            <Footer />
        </div>
    );
};
