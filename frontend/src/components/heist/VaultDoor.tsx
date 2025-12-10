import { motion } from 'framer-motion';

export const VaultDoor = ({ isOpen }: { isOpen: boolean }) => {
    return (
        <motion.div
            className="relative w-24 h-24 mx-auto"
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
        >
            <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-vault-steel"
                />
                <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-heist-red"
                />
                <circle
                    cx="50"
                    cy="50"
                    r="25"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-vault-silver"
                />
                <line
                    x1="50"
                    y1="50"
                    x2="50"
                    y2="15"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-heist-red"
                />
            </svg>
        </motion.div>
    );
};
