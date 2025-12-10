import React from 'react';

interface MaterialIconProps {
    icon: string;
    filled?: boolean;
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}

export const MaterialIcon: React.FC<MaterialIconProps> = ({
    icon,
    filled = false,
    size = 24,
    className = '',
    style = {}
}) => {
    return (
        <span
            className={`material-symbols-rounded ${filled ? 'filled' : ''} ${className}`}
            style={{
                fontSize: `${size}px`,
                ...style
            }}
        >
            {icon}
        </span>
    );
};
