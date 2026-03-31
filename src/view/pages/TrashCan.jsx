import React, { useEffect, useState } from "react";
import SideBar from "../Components/Global/Sidebar";
import {
  UserCircleIcon,
  HomeIcon,
  TrashIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  Bars3Icon
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Logo from '../../assets/Logo.png';

export default function TrashCan() {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Cargar snapshots reales
  const fetchSnapshots = async () => {
    try {
      setLoading(true);
      const res = await window.api.basurero.getAll();
      setSnapshots(res);
    } catch (err) {
      console.error("Error cargando basurero:", err);
      toast.error("Error al cargar la papelera");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
    const handleEsc = (e) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleRestore = async (snap) => {
    try {
      const { success, message } = await window.api.basurero.restore({
        anio: snap.anio_init,
        mes: snap.mes_init
      });

      if (success) {
        toast.success(`Periodo ${monthNames[snap.mes_init - 1]} ${snap.anio_init} restaurado con éxito`, {
          position: "top-center"
        });
        // Opcional: recargar si el basurero cambia, pero usualmente el snapshot se queda como respaldo.
      } else {
        toast.error(message || "Error al restaurar el periodo");
      }
    } catch (err) {
      console.error("Error restaurando:", err);
      toast.error("Error crítico al intentar restaurar el periodo");
    }
  };

  const filtradas = (snapshots || []).filter((s) => {
    if (!s.mes_init || !s.anio_init) return false;
    const label = `${monthNames[s.mes_init - 1] || '---'} ${s.anio_init}`;
    return label.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex h-screen bg-sidebar-bg">
      <SideBar menubar={menu} setMenubar={setMenu} />
      <ToastContainer />

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
                <span className="text-sm font-bold text-white/40 tracking-[0.2em] uppercase">Respaldo de Seguridad</span>
                <h1 className="text-5xl font-display text-white tracking-tight uppercase">
                  Basurero <span className="text-sidebar-bg/40 font-bold">Histórico</span>
                </h1>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <img src={Logo} alt="Logo" className="w-24 h-auto" />
              <span className="text-[10px] font-black text-white tracking-[0.4em] mt-2 uppercase">Edificio Calleja</span>
            </div>
          </div>

          {/* BARRA DE BÚSQUEDA */}
          <div className="bg-white rounded-2xl flex items-center px-8 py-5 w-full shadow-sm hover:shadow-md transition-shadow">
            <MagnifyingGlassIcon className="w-6 text-accent" />
            <input
              type="text"
              placeholder="Buscar respaldos por mes o año..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-6 w-full text-sidebar-bg outline-none font-bold text-sm placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* LISTA DE SNAPSHOTS */}
        <div className="bg-white rounded-3xl shadow-premium border border-black/5 overflow-hidden">
          <table className="min-w-full divide-y divide-black/[0.03]">
            <thead className="bg-sidebar-bg">
              <tr>
                <th className="px-10 py-5 text-left text-[10px] font-black text-white/60 uppercase tracking-widest border-r border-white/5">Periodo Respaldado</th>
                <th className="px-10 py-5 text-center text-[10px] font-black text-white/60 uppercase tracking-widest border-r border-white/5">Fecha de Snapshot</th>
                <th className="px-10 py-5 text-right text-[10px] font-black text-white/60 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-black/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan="3" className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-3 border-accent/20 border-t-accent rounded-full animate-spin"></div>
                      <span className="text-xs font-bold text-text-secondary tracking-widest uppercase opacity-40">Escaneando basurero...</span>
                    </div>
                  </td>
                </tr>
              ) : filtradas.length > 0 ? (
                filtradas.map((snap) => (
                  <tr key={snap.id} className="hover:bg-main-bg/20 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="text-xl font-bold text-sidebar-bg flex items-center gap-3">
                        {monthNames[snap.mes_init - 1]} <span className="text-accent">{snap.anio_init}</span>
                      </div>
                      <div className="text-[10px] text-sidebar-bg/30 font-black tracking-widest uppercase mt-1">
                        Snapshot ID: {snap.id}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <span className="px-4 py-1.5 bg-sidebar-bg/5 rounded-full text-[10px] font-black text-sidebar-bg/60 uppercase tracking-widest border border-sidebar-bg/5">
                        {new Date(snap.creado_en || Date.now()).toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-4">
                        <button
                          onClick={() => handleRestore(snap)}
                          className="flex items-center gap-3 px-6 py-3 bg-accent text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:scale-[1.05] active:scale-95 transition-all"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                          Restaurar
                        </button>
                        <button className="p-3 text-sidebar-bg/10 hover:text-red-500 transition-all hover:scale-110 active:scale-90">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="py-32 text-center opacity-20">
                    <div className="flex flex-col items-center gap-6">
                      <div className="p-8 bg-main-bg rounded-full">
                        <TrashIcon className="w-16 h-16 text-sidebar-bg" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-sidebar-bg font-black tracking-widest uppercase">Papelera Vacía</p>
                        <p className="text-sidebar-bg/60 text-xs">No hay respaldos automáticos registrados en el sistema.</p>
                      </div>
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
