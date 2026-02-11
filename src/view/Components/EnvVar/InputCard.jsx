import React, { useState, useEffect, useRef } from 'react';

export default function InputCard({
    icon: Icon,
    title,
    subtitle,
    value,
    onChange,
    prefix = "$",
    placeholder = "0",
    description,
    type = "text", // Forced to text for formatting
    step,
    readOnly = false
}) {
    const [localValue, setLocalValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    // Formatter: 1234567.89 -> 1.234.567,89
    const formatValue = (val) => {
        if (val === undefined || val === null) return "";
        if (val === 0 && !isFocused) return ""; // Show empty if 0 and not focused (unless typed?)
        // Actually user said: "predeterminado cero... borrar ya si le dan a guardar y lo dejan vacio ahi si lo dejamos en cero"
        // So visually empty is fine.

        const parts = val.toString().split('.');
        // Add thousands separator (dot)
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        // Join with comma for decimal
        return parts.join(',');
    };

    // Sync from parent ONLY if not focused (to allow typing "12.")
    // Or if parent value changes drastically? 
    // We trust parent passes the number back.
    useEffect(() => {
        if (!isFocused) {
            setLocalValue(formatValue(value));
        }
    }, [value, isFocused]);

    const handleChange = (e) => {
        const inputVal = e.target.value;

        // 1. Sanitize: Allow digits, dots, commas
        // But removing existing dots (thousands) to analyze
        // We assume User types DOT or COMMA as decimal separator if they want decimals.
        // But since we output DOT as thousand, we must be careful.

        // Allowed chars: 0-9, . ,
        if (!/^[0-9.,]*$/.test(inputVal)) return;

        setLocalValue(inputVal);

        // 2. Parse effective number for parent
        // Remove .'s (thousands)
        let clean = inputVal.replace(/\./g, '');
        // Replace , with . for JS float
        clean = clean.replace(',', '.');

        // Handling multiple dots? 
        // We just take the string as is after replacing , -> .

        const num = parseFloat(clean);

        // Pass to parent (NaN if empty or invalid)
        onChange(isNaN(num) ? 0 : num); // Return pure number
    };

    const handleFocus = () => {
        setIsFocused(true);
        // If value is 0 or empty, ensure it's empty
        if (value === 0) setLocalValue("");
        else {
            // Keep formatting or strip?
            // Usually easier to edit if stripped of thousands separators?
            // User asked: "al momento de ingresar un numero le organice" -> keep formatting while typing!
            // So we keep localValue as is (formatted).
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        // Effect will trigger and re-format properly from canonical 'value'
    };

    return (
        <div className={`p-8 rounded-3xl shadow-premium border border-black/5 flex flex-col gap-6 group transition-all bg-header-bg hover:shadow-xl`}>
            <div className="flex items-center gap-4">
                <div className="p-4 bg-white/10 rounded-2xl text-white group-hover:scale-110 transition-transform">
                    {Icon && <Icon className="w-8 h-8" />}
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{subtitle}</span>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                </div>
            </div>
            <div className="relative">
                {prefix && <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-white/20">{prefix}</span>}
                <input
                    type="text"
                    inputMode="decimal"
                    value={localValue}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    readOnly={readOnly}
                    className={`w-full py-6 ${prefix ? 'pl-12' : 'px-8'} pr-8 rounded-2xl text-3xl font-black outline-none focus:ring-4 ring-accent/10 transition-all border border-transparent [appearance:textfield] ${readOnly ? 'bg-white/10 cursor-not-allowed text-white/50' : 'bg-white text-sidebar-bg focus:border-accent/20'}`}
                    placeholder={placeholder}
                />
            </div>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest px-2">{description}</p>
        </div>
    );
}
