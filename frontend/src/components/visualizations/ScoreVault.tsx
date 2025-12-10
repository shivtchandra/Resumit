import { motion } from 'framer-motion';

interface ScoreVaultProps {
    score: number;
    label: string;
    status: 'safe' | 'warning' | 'danger';
}

export const ScoreVault = ({ score, label, status }: ScoreVaultProps) => {
    const color = {
        safe: '#06D6A0',
        warning: '#FFB703',
        danger: '#E63946',
    }[status];

    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r="45"
                        fill="none"
                        stroke="#2D3561"
                        strokeWidth="8"
                    />
                    <motion.circle
                        cx="64"
                        cy="64"
                        r="45"
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold" style={{ color }}>
                        {score}
                    </div>
                    <div className="text-xs text-vault-silver">/100</div>
                </div>
            </div>
            <div className="mt-3 text-sm font-bold text-vault-white uppercase tracking-wider">
                {label}
            </div>
        </div>
    );
};
