import { ReactNode } from 'react';

interface SplitViewProps {
    left: ReactNode;
    right: ReactNode;
    leftWidth?: string;
    rightWidth?: string;
    gap?: string;
}

export const SplitView = ({
    left,
    right,
    leftWidth = '50%',
    rightWidth = '50%',
    gap = '1.5rem'
}: SplitViewProps) => {
    return (
        <div
            className="flex flex-col lg:flex-row h-full"
            style={{ gap }}
        >
            <div
                className="flex-shrink-0 overflow-auto"
                style={{
                    width: leftWidth,
                    minHeight: '400px'
                }}
            >
                {left}
            </div>
            <div
                className="flex-1 overflow-auto"
                style={{
                    width: rightWidth,
                    minHeight: '400px'
                }}
            >
                {right}
            </div>
        </div>
    );
};
