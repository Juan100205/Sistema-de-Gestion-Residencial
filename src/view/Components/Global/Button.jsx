import React from 'react';

export default function Button({
    variant = 'primary',
    onClick,
    children,
    icon: Icon,
    disabled = false,
    className = '',
    type = 'button'
}) {
    const baseStyles = "flex items-center gap-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-accent text-white hover:scale-[1.02] shadow-accent/20",
        secondary: "bg-main-bg/20 text-sidebar-bg shadow-sm hover:bg-main-bg/40",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-red-500/20",
        ghost: "bg-transparent text-sidebar-bg hover:bg-black/5 shadow-none",
        icon: "p-2.5 rounded-full bg-sidebar-bg text-white shadow-lg hover:scale-110" // Special variant for back buttons etc
    };

    const paddings = variant === 'icon' ? '' : "px-8 py-4";

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${paddings} ${className}`}
        >
            {Icon && <Icon className={`w-4 h-4 ${variant === 'icon' ? 'w-6 h-6' : ''}`} />}
            {children}
        </button>
    );
}
