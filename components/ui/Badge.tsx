
import React from 'react';

interface BadgeProps {
    colorClasses: string;
    children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ colorClasses, children }) => {
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses}`}>
            {children}
        </span>
    );
};

export default Badge;
