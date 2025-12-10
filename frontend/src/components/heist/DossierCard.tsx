import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface DossierCardProps {
    title: string;
    children: ReactNode;
    status?: 'safe' | 'warning' | 'danger';
}

export const DossierCard = ({ title, children, status = 'safe' }: DossierCardProps) => {
    const borderColor = {
        safe: 'border-safe-green',
        warning: 'border-warning-amber',
        danger: 'border-danger-red',
    }[status];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`vault-card border-l-4 ${borderColor}`}
        >
            <h3 className="text-lg font-bold mb-3 text-vault-white">{title}</h3>
            <div className="text-vault-silver">{children}</div>
        </motion.div>
    );
};
