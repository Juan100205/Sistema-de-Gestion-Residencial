import React, { useEffect, useState } from "react";
import SideBar from "../Components/Global/Sidebar";
import {
    ClockIcon,
    ArrowPathIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    ArrowRightIcon,
    HomeIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    PencilSquareIcon,
    Bars3Icon
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

export default function AuditLog() {
    const [menu, setMenu] = useState(false);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    // Expansion State
    const [expandedId, setExpandedId] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [logDetails, setLogDetails] = useState({}); // Cache for fetched details { periodId: { modifications: [] } }

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const rawLogs = await window.api.audit.getAll();
            console.log("Audit Logs reçus de l'IPC:", rawLogs);

            // Transform into Log Entries
            const formatted = rawLogs.map(l => {
                const date = new Date(l.created_at);

                return {
                    id: l.id,
                    periodId: l.entity_id,
                    periodName: l.entity_name || "Desconocido",
                    anio: l.anio,
                    mes: l.mes,
                    createdAt: date,
                    updatedAt: date,
                    isModified: l.action.includes("UPDATE") || l.action.includes("RESET"),
                    user: "Admin",
                    action: l.action,
                    description: l.description,
                    rawAction: l.action
                };
            }); //.sort((a, b) => b.createdAt - a.createdAt); // Query already sorts by created_at DESC

            setLogs(formatted);
        } catch (error) {
            console.error("Error fetching audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(l =>
        l.periodName.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        (l.description && l.description.toLowerCase().includes(search.toLowerCase()))
    );

    const getActionLabel = (action) => {
        switch (action) {
            case 'CREATION': return 'Carga Inicial';
            case 'UPDATE': return 'Actualización';
            case 'RESET': return 'Reinicio Valores';
            case 'DELETION': return 'Eliminación';
            default: return action;
        }
    };

    return (
        <div className="flex h-screen bg-sidebar-bg">
            <SideBar menubar={menu} setMenubar={setMenu} />

            <div className={`page-container overflow-y-auto scroll-container ${menu ? "w-7/8" : "w-full"}`}>

                {/* HEADER */}
                <div className="bg-header-bg p-10 rounded-[2.5rem] shadow-premium mb-12 relative">
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-6">
                            {!menu && (
                                <button onClick={() => setMenu(true)} className="hover:scale-110 transition-transform duration-200">
                                    <Bars3Icon className="w-12 h-12 text-white/80" />
                                </button>
                            )}
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-bold text-white/40 tracking-[0.2em] uppercase">Control de Cambios</span>
                                <h1 className="text-5xl font-display text-white tracking-tight uppercase">
                                    Bitácora <span className="text-sidebar-bg/40 font-bold">Global</span>
                                </h1>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <img src="assets/Logo.png" alt="Logo" className="w-24 h-auto" />
                            <span className="text-[10px] font-black text-white tracking-[0.4em] mt-2 uppercase">Edificio Calleja</span>
                        </div>
                    </div>

                    {/* SEARCH */}
                    <div className="bg-white rounded-2xl flex items-center px-8 py-5 w-full shadow-sm hover:shadow-md transition-shadow max-w-2xl">
                        <MagnifyingGlassIcon className="w-6 text-accent" />
                        <input
                            type="text"
                            placeholder="Buscar por periodo, acción o detalles..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ml-6 w-full text-sidebar-bg outline-none font-bold text-sm placeholder:text-gray-300"
                        />
                    </div>
                </div>

                {/* LOG TABLE */}
                <div className="bg-white rounded-[2rem] shadow-premium border border-black/5 overflow-hidden min-h-[500px]">
                    <table className="min-w-full divide-y divide-black/5">
                        <thead className="bg-sidebar-bg sticky top-0 z-10">
                            <tr>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-white/60 uppercase tracking-widest">Periodo Afectado</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-white/60 uppercase tracking-widest">Tipo de Evento</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-white/60 uppercase tracking-widest">Fecha Evento</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-white/60 uppercase tracking-widest">Detalles</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black text-white/60 uppercase tracking-widest">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                                        Cargando bitácora...
                                    </td>
                                </tr>
                            ) : (filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-main-bg/20 transition-colors group cursor-pointer" onClick={() => log.periodId && log.anio ? navigate(`/HistoryDetail?id=${log.periodId}&anio=${log.anio}&mes=${log.mes}`) : null}>
                                        <td className="px-8 py-6">
                                            <span className="text-lg font-black text-sidebar-bg uppercase tracking-tight block">{log.periodName}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${log.rawAction === 'DELETION' ? 'bg-red-100 text-red-600' : (log.isModified ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600')}`}>
                                                    {log.rawAction === 'DELETION' ? <ExclamationTriangleIcon className="w-5 h-5" /> :
                                                        log.isModified ? <ArrowPathIcon className="w-5 h-5" /> : <DocumentTextIcon className="w-5 h-5" />}
                                                </div>
                                                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{getActionLabel(log.action)}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-sidebar-bg">
                                                    {log.createdAt.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                    {log.createdAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs text-gray-500 font-medium">{log.description}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-sidebar-bg">
                                                    {log.updatedAt.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                    {log.updatedAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {log.isModified ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-100">
                                                    <ExclamationTriangleIcon className="w-3 h-3" /> Editado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest border border-green-100">
                                                    <ClockIcon className="w-3 h-3" /> Original
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="group-hover:translate-x-1 transition-transform p-2 bg-sidebar-bg rounded-full shadow-lg">
                                                <ArrowRightIcon className="w-4 h-4 text-white" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                        No se encontraron registros en la bitácora
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
