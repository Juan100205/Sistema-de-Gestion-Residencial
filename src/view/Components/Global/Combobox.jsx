import React, { useState, useRef, useEffect } from "react";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";

export default function Combobox({
    value,
    onChange,
    options = [],
    placeholder = "Seleccionar...",
    icon: Icon,
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const containerRef = useRef(null);

    // Sync internal query with external value if needed, 
    // but usually we want to allow typing freely.
    // Actually, for a "search input" that acts as a filter, the value IS the query.
    // So we just use value directly.

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = query === ""
        ? options
        : options.filter((opt) =>
            opt.toString().toLowerCase().includes(query.toLowerCase())
        );

    // When value changes externally (e.g. clear), update query if it differs?
    // Or better: Treat 'value' as the source of truth for the input.

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="relative bg-white rounded-xl shadow-sm px-4 py-2 flex items-center gap-3 border border-black/5 w-full">
                {Icon && <Icon className="w-4 h-4 text-sidebar-bg/30 flex-shrink-0" />}
                <input
                    type="text"
                    className="bg-transparent text-sidebar-bg text-sm font-bold focus:outline-none w-full placeholder:text-sidebar-bg/20"
                    placeholder={placeholder}
                    value={value}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        onChange(event.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <ChevronUpDownIcon className="w-4 h-4 text-gray-400 cursor-pointer" onClick={() => setIsOpen(!isOpen)} />
            </div>

            {isOpen && filteredOptions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white mt-2 border border-black/5 rounded-xl shadow-xl max-h-60 overflow-auto focus:outline-none ml-1">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt, index) => (
                            <li
                                key={index}
                                className="px-4 py-2 text-sm text-sidebar-bg hover:bg-main-bg/10 cursor-pointer font-bold"
                                onClick={() => {
                                    onChange(opt.toString());
                                    setQuery("");
                                    setIsOpen(false);
                                }}
                            >
                                {opt}
                            </li>
                        ))
                    ) : (
                        <li className="px-4 py-2 text-sm text-gray-400 italic">No hay coincidencias</li>
                    )}
                </ul>
            )}
        </div>
    );
}
