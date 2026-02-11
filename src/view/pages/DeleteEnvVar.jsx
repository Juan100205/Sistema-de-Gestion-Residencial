import React, { useEffect, useState } from "react";
import SideBar from "../Components/Global/Sidebar";
import { UserCircleIcon, ArrowLeftIcon, HomeIcon, Bars3Icon } from "@heroicons/react/24/solid";
import { MagnifyingGlassIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

export default function DeleteEnvVar() {
    const navigate = useNavigate();
    const [menu, setMenu] = useState(false);
    const [search, setSearch] = useState("");

    const [tablas, setTablas] = useState([]);
    const [loading, setLoading] = useState(true);

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const fetchPeriodos = async () => {
        try {
            setLoading(true);
            const allPeriodos = await window.api.periodo.getAll();
            const activo = await window.api.periodo.getActivo();

            const formatted = allPeriodos.map(p => ({
                id: p.id,
                name: `${monthNames[p.mes_end - 1]} ${p.anio_end}`,
                isActive: activo && p.id === activo.id,
                anio: p.anio_end,
                mes: p.mes_end
            })).sort((a, b) => b.anio - a.anio || b.mes - a.mes);

            setTablas(formatted);
        } catch (error) {
            console.error("Error al cargar periodos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPeriodos();
    }, []);

    // Cerrar menú con ESC
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") setMenu(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    const eliminar = async (periodo) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar las variables de entorno del periodo ${periodo.name}? Esta acción reiniciará los costos y totales a cero.`)) {
            return;
        }

        try {
            const result = await window.api.periodo.resetEnvVars(periodo.id);
            if (result.success) {
                alert("Variables de entorno eliminadas correctamente.");
                // Opcional: Recargar lista o simplemente dejarlo ahí
                fetchPeriodos();
            } else {
                alert("Error al eliminar: " + result.error);
            }
        } catch (error) {
            console.error("Error en eliminar:", error);
            alert("Error inesperado al eliminar variables.");
        }
    };

    const filtradas = tablas.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-sidebar-bg">
            <SideBar menubar={menu} setMenubar={setMenu} />

            <div className={`page-container overflow-y-auto scroll-container ${menu ? "w-7/8" : "w-full"}`}>

                {/* HEADER OSCURO */}
                <div className="bg-header-bg p-10 rounded-[2.5rem] shadow-premium mb-12 relative">
                    <div className="flex items-start justify-between mb-12">
                        <div className="flex items-center gap-8">
                            {!menu && (
                                <button onClick={() => setMenu(true)} className="hover:scale-110 transition-transform duration-200">
                                    <Bars3Icon className="w-14 h-14 text-white/80" />
                                </button>
                            )}
                            <button onClick={() => navigate("/Tables")} className="hover:scale-110 transition-transform bg-sidebar-bg p-3 rounded-full shadow-lg">
                                <ArrowLeftIcon className="w-8 h-8 text-white" />
                            </button>
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-bold text-white/40 tracking-[0.2em] uppercase">Gestión de archivos</span>
                                <h1 className="text-5xl font-display text-white tracking-tight uppercase">
                                    Eliminar <span className="text-sidebar-bg/40 font-bold">Medidas Principales</span>
                                </h1>
                            </div>
                        </div>

                        <div className="flex flex-col items-end">
                            <img src="assets/Logo.png" alt="Logo" className="w-24 h-auto" />
                            <span className="text-[10px] font-black text-white tracking-[0.4em] mt-2 uppercase">Edificio Calleja</span>
                        </div>
                    </div>

                    {/* BÚSQUEDA */}
                    <div className="bg-white rounded-2xl flex items-center px-8 py-5 w-full shadow-sm hover:shadow-md transition-shadow">
                        <MagnifyingGlassIcon className="w-6 text-accent" />
                        <input
                            type="text"
                            placeholder="Buscar periodo para limpiar variables..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ml-6 w-full text-sidebar-bg outline-none font-bold text-sm placeholder:text-gray-300"
                        />
                    </div>
                </div>

                {/* LISTA */}
                <div className="bg-white rounded-3xl shadow-premium border border-black/5 overflow-hidden">
                    <table className="min-w-full divide-y divide-black/[0.03]">
                        <thead className="bg-sidebar-bg">
                            <tr>
                                <th className="px-10 py-5 text-center text-xs font-black text-white/60 uppercase tracking-widest border-r border-white/5">Periodo</th>
                                <th className="px-10 py-5 text-center text-xs font-black text-white/60 uppercase tracking-widest border-r border-white/5">Estado</th>
                                <th className="px-10 py-5 text-center text-xs font-black text-white/60 uppercase tracking-widest">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-black/[0.03]">
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-3 border-accent/20 border-t-accent rounded-full animate-spin"></div>
                                            <span className="text-xs font-bold text-text-secondary tracking-widest uppercase opacity-40">Cargando registros...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtradas.length > 0 ? (
                                filtradas.map((t) => (
                                    <tr key={t.id} className="hover:bg-main-bg/20 transition-colors group">
                                        <td className="px-10 py-6 text-center text-sidebar-bg font-bold text-lg">{t.name}</td>
                                        <td className="px-10 py-6 text-center">
                                            {t.isActive ? (
                                                <span className="px-4 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="px-4 py-1.5 bg-gray-50 text-gray-400 border border-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    Histórico
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <button
                                                onClick={() => eliminar(t)}
                                                className="p-3 rounded-xl bg-gray-50 text-sidebar-bg/30 hover:text-red-600 hover:bg-red-50 transition-all transform hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                                                title="Eliminar variables de entorno"
                                            >
                                                <TrashIcon className="w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="py-24 text-center opacity-20">
                                        <div className="flex flex-col items-center gap-4">
                                            <MagnifyingGlassIcon className="w-12 h-12 text-sidebar-bg" />
                                            <span className="text-xs font-black uppercase tracking-widest text-sidebar-bg">No se encontraron resultados</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
