import React from 'react';
import { PresentationChartLineIcon } from "@heroicons/react/24/solid";
import ComparisonCell from './ComparisonCell';

export default function DashboardTable({
    loading,
    data,
    dataComparativa,
    activeTab
}) {
    return (
        <div className="bg-white rounded-3xl shadow-premium border border-black/5 overflow-hidden">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="w-10 h-10 border-3 border-accent/20 border-t-accent rounded-full animate-spin"></div>
                    <span className="text-text-secondary text-xs font-bold tracking-widest uppercase opacity-50">Cargando datos...</span>
                </div>
            ) : data.length > 0 ? (
                <div className="overflow-x-auto scroll-container">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-sidebar-bg">
                                {activeTab !== "TORRES" && <th className="px-6 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest">Torre</th>}
                                <th className="px-6 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest">Apto</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest">Lectura (m3)</th>
                                <th className="px-0 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest">Consumo Agua Periodo (m3)</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest">Agua ($)</th>
                                <th className="px-0 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest">Consumo Gas Periodo (m3)</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest">Gas ($)</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest bg-accent/20">Total ($)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {data.map((row) => {
                                let comparisonRow = null;
                                if (activeTab === "COMPARACION") {
                                    comparisonRow = dataComparativa.find(dc => dc.apto_id === row.apto_id);
                                }

                                return (
                                    <tr key={row.apto_id} className="hover:bg-main-bg/30 transition-colors">
                                        {activeTab !== "TORRES" && <td className="px-6 py-4 text-center text-xs text-text-secondary font-medium">{row.torre}</td>}
                                        <td className="px-6 py-4 text-center text-xs text-sidebar-bg font-black">{row.apto}</td>
                                        <td className="px-6 py-4 text-center text-xs text-text-secondary font-medium">{row.agua_lectura?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center text-xs">
                                            <ComparisonCell value={row.agua_m3} prevValue={comparisonRow?.agua_m3} type="number" showComparison={activeTab === "COMPARACION"} />
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs">
                                            <ComparisonCell value={row.agua_valor} prevValue={comparisonRow?.agua_valor} showComparison={activeTab === "COMPARACION"} />
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs">
                                            <ComparisonCell value={row.gas_m3} prevValue={comparisonRow?.gas_m3} type="number" showComparison={activeTab === "COMPARACION"} />
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs">
                                            <ComparisonCell value={row.gas_valor} prevValue={comparisonRow?.gas_valor} showComparison={activeTab === "COMPARACION"} />
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs bg-accent/5 font-black text-sidebar-bg">
                                            <ComparisonCell value={row.total_valor} prevValue={comparisonRow?.total_valor} showComparison={activeTab === "COMPARACION"} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 gap-6 opacity-20">
                    <PresentationChartLineIcon className="w-16 h-16 text-sidebar-bg" />
                    <span className="text-sidebar-bg font-black tracking-widest uppercase text-center max-w-xs">No hay datos registrados para este periodo</span>
                </div>
            )}
        </div>
    );
}
