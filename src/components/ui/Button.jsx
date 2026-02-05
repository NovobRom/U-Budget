import React from 'react';

const Button = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary', // primary, secondary, danger, ghost
    className = '',
    disabled = false,
    fullWidth = true,
}) => {
    const baseStyles =
        'font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

    const variants = {
        primary:
            'bg-slate-900 dark:bg-blue-600 text-white hover:opacity-90 shadow-lg shadow-blue-500/20',
        secondary:
            'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
        danger: 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400',
        ghost: 'bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant] || variants.primary} ${widthClass} ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;
