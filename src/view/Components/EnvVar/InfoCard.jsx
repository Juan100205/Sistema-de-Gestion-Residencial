import React from 'react';

export default function InfoCard({ icon: Icon, title, value, description, prefix = "$", variant = "default" }) {
    const isDark = variant === "golden";

    return (
        <div className={`p-8 rounded-3xl shadow-premium border flex flex-col gap-6 group transition-all ${isDark
            ? 'bg-white border-black/5 hover:shadow-xl'
            : 'bg-white border-black/5 hover:border-accent/30 opacity-80'
            }`}>
            <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${isDark
                    ? 'bg-sidebar-bg/5 text-sidebar-bg'
                    : 'bg-sidebar-bg/5 text-sidebar-bg/60'
                    }`}>
                    {Icon && <Icon className="w-8 h-8" />}
                </div>
                <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDark
                        ? 'text-sidebar-bg/30'
                        : 'text-sidebar-bg/20'
                        }`}>
                        {isDark ? 'Calculado Automáticamente' : 'Calculado'}
                    </span>
                    <h3 className={`text-xl font-bold ${isDark
                        ? 'text-sidebar-bg'
                        : 'text-sidebar-bg'
                        }`}>{title}</h3>
                </div>
            </div>
            <div className="relative">
                {prefix && <span className={`absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black ${isDark
                    ? 'text-sidebar-bg/10'
                    : 'text-sidebar-bg/10'
                    }`}>{prefix}</span>}
                <div className={`w-full py-6 ${prefix ? 'pl-12' : 'pl-8'} pr-8 rounded-2xl text-3xl font-black border ${isDark
                    ? 'bg-gray-50 text-sidebar-bg border-black/5'
                    : 'bg-main-bg/10 text-sidebar-bg border-transparent'
                    }`}>
                    {value}
                </div>
            </div>
            <p className={`text-[10px] font-bold uppercase tracking-widest px-2 ${isDark
                ? 'text-sidebar-bg/40'
                : 'text-sidebar-bg/40'
                }`}>{description}</p>
        </div>
    );
}
