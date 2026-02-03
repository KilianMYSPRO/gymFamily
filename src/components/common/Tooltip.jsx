import React, { useState } from 'react';
import clsx from 'clsx';

const Tooltip = ({ children, content, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}

            <div className={clsx(
                "absolute z-[100] w-max max-w-xs p-3 text-xs text-slate-300 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl transition-all duration-200",
                isVisible ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none",
                position === 'top' && "bottom-full left-1/2 -translate-x-1/2 mb-2",
                position === 'bottom' && "top-full left-1/2 -translate-x-1/2 mt-2",
                position === 'left' && "right-full top-1/2 -translate-y-1/2 mr-2",
                position === 'right' && "left-full top-1/2 -translate-y-1/2 ml-2"
            )}>
                {content}
            </div>
        </div>
    );
};

export default Tooltip;
