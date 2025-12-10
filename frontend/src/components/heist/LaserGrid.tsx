import { motion } from 'framer-motion';

export const LaserGrid = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
                className="absolute w-full h-1 bg-heist-red/50 shadow-[0_0_10px_rgba(230,57,70,0.8)]"
                animate={{
                    y: ['0%', '100%'],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-heist-red/10 via-transparent to-heist-red/10" />
        </div>
    );
};
