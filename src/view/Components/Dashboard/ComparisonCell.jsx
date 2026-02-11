import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";

const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0);
};

const formatNumber = (val) => {
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(val || 0);
};

export default function ComparisonCell({ value, prevValue, type = 'currency', showComparison = false }) {
    if (!showComparison || !prevValue) {
        return <div className="font-bold text-sidebar-bg">{type === 'currency' ? formatCurrency(value) : formatNumber(value)}</div>;
    }

    const diff = value - prevValue;
    const isIncrease = diff > 0;
    const bgColor = isIncrease ? "bg-red-50" : "bg-green-50";
    const textColor = isIncrease ? "text-red-600" : "text-green-600";

    return (
        <div className={`flex items-center justify-between gap-3 py-2 px-3 rounded-xl ${bgColor} border border-black/[0.03] transition-all`}>
            <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-bold text-sidebar-bg">{type === 'currency' ? formatCurrency(value) : formatNumber(value)}</span>
                <span className="text-[8px] font-medium text-sidebar-bg/40">Prev: {type === 'currency' ? formatCurrency(prevValue) : formatNumber(prevValue)}</span>
            </div>
            <div className={`flex flex-col items-center ${textColor}`}>
                {diff !== 0 ? (
                    <>
                        {isIncrease ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                        <span className="text-[8px] font-black uppercase">{isIncrease ? "Subió" : "Bajó"}</span>
                    </>
                ) : (
                    <span className="text-[8px] font-black text-gray-400 uppercase">Igual</span>
                )}
            </div>
        </div>
    );
}
