import React from 'react';
import { HomeIcon, BuildingOfficeIcon, PresentationChartLineIcon, FunnelIcon } from "@heroicons/react/24/solid";

import Combobox from "../Global/Combobox";

const tabs = [
    { name: "GENERAL", icon: <HomeIcon className="w-6 h-6" /> },
    { name: "HISTORICO", icon: <BuildingOfficeIcon className="w-6 h-6" /> },
    { name: "COMPARACION", icon: <PresentationChartLineIcon className="w-6 h-6" /> }
];

const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function DashboardFilters({
    activeTab,
    setActiveTab,
    selectedTorre,
    setSelectedTorre,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    selectedMonth2,
    setSelectedMonth2,
    selectedYear2,
    setSelectedYear2,
    searchTerm,
    setSearchTerm,
    searchTorre,
    setSearchTorre,
    uniqueTowers,
    uniqueAptos,
    availableYears,
    getMonthsForYear
}) {
    // Helper to format aptos for autocomplete (ensure they are strings)
    const aptoOptions = uniqueAptos ? uniqueAptos.map(a => a.toString()) : [];

    return (
        <div className="flex flex-col @5xl:flex-row items-center justify-between gap-8">
            {/* TABS NAVEGACIÓN */}
            <div className="flex gap-4 p-1.5 bg-white/10 rounded-2xl backdrop-blur-md">
                {tabs.map((tab) => (
                    <button
                        key={tab.name}
                        onClick={() => setActiveTab(tab.name)}
                        className={`flex items-center gap-4 px-8 py-3.5 rounded-xl transition-all duration-300
              ${activeTab === tab.name
                                ? 'bg-white text-sidebar-bg shadow-xl transform scale-105'
                                : 'text-white/70 hover:bg-white/5'
                            }`}
                    >
                        {React.cloneElement(tab.icon, { className: "w-6 h-6" })}
                        <span className="text-xs font-black tracking-widest uppercase">{tab.name}</span>
                    </button>
                ))}
            </div>

            {/* SELECTORES DINÁMICOS */}
            <div className="flex flex-wrap justify-end gap-4">

                <div className="bg-white rounded-xl shadow-sm px-4 py-2 flex flex-col border border-black/5">
                    <span className="text-[8px] font-black text-sidebar-bg/30 uppercase tracking-widest mb-1">
                        {activeTab === "HISTORICO" ? "Desde (Año)" : "Año"}
                    </span>
                    <select
                        value={selectedYear}
                        onChange={(e) => {
                            setSelectedYear(e.target.value);
                            setSelectedMonth("");
                        }}
                        className="bg-transparent text-sidebar-bg text-sm font-bold focus:outline-none cursor-pointer"
                    >
                        {!selectedYear && <option value="">Año</option>}
                        {availableYears.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-white rounded-xl shadow-sm px-4 py-2 flex flex-col border border-black/5">
                    <span className="text-[8px] font-black text-sidebar-bg/30 uppercase tracking-widest mb-1">
                        {activeTab === "HISTORICO" ? "Desde (Mes)" : "Mes"}
                    </span>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-transparent text-sidebar-bg text-sm font-bold focus:outline-none cursor-pointer"
                    >
                        {!selectedMonth && <option value="">Mes</option>}
                        {selectedYear && getMonthsForYear(selectedYear).map(m => (
                            <option key={m.val} value={m.val}>{m.name}</option>
                        ))}
                    </select>
                </div>

                {(activeTab === "COMPARACION" || activeTab === "HISTORICO") && (
                    <div className="flex gap-4 items-center animate-in fade-in slide-in-from-right-4 duration-500">
                        {activeTab === "COMPARACION" && <span className="text-white/40 text-sm font-black italic">VS</span>}
                        {activeTab === "HISTORICO" && <span className="text-white/40 text-sm font-black italic">HASTA</span>}

                        <div className="flex gap-3 bg-white/20 p-2 rounded-2xl backdrop-blur-sm">
                            <select
                                value={selectedYear2}
                                onChange={(e) => {
                                    setSelectedYear2(e.target.value);
                                    setSelectedMonth2("");
                                }}
                                className="bg-transparent text-white text-sm font-bold focus:outline-none cursor-pointer"
                            >
                                {!selectedYear2 && <option value="" className="text-sidebar-bg">Año</option>}
                                {availableYears.map(y => (
                                    <option key={y} value={y} className="text-sidebar-bg">{y}</option>
                                ))}
                            </select>

                            <select
                                value={selectedMonth2}
                                onChange={(e) => setSelectedMonth2(e.target.value)}
                                className="bg-transparent text-white text-sm font-bold focus:outline-none cursor-pointer"
                            >
                                {!selectedMonth2 && <option value="" className="text-sidebar-bg">Mes</option>}
                                {selectedYear2 && getMonthsForYear(selectedYear2).map(m => (
                                    <option key={m.val} value={m.val} className="text-sidebar-bg">{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* BARRA DE BÚSQUEDA (CON AUTOCOMPLETE) */}
            <div className="flex gap-2 w-full @5xl:w-auto mt-4 @5xl:mt-0">
                <div className="w-full @5xl:w-48">
                    <Combobox
                        placeholder="Buscar Torre..."
                        value={searchTorre}
                        onChange={(val) => setSearchTorre(val === "Todos" ? "" : val)}
                        options={["Todos", ...uniqueTowers]}
                        icon={BuildingOfficeIcon}
                    />
                </div>

                <div className="w-full @5xl:w-48">
                    <Combobox
                        placeholder="Buscar Apto..."
                        value={searchTerm}
                        onChange={(val) => setSearchTerm(val === "Todos" ? "" : val)}
                        options={["Todos", ...aptoOptions]}
                        icon={FunnelIcon}
                    />
                </div>
            </div>
        </div>
    );
}
