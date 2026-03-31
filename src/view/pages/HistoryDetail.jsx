import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import SideBar from "../Components/Global/Sidebar";
import {
  ArrowLeftIcon,
  DocumentCheckIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import { toast, ToastContainer } from "react-toastify";
import Logo from '../../assets/Logo.png';

export default function HistoryDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const periodoId = searchParams.get("id");
  const anio = searchParams.get("anio");
  const mes = searchParams.get("mes");

  const [menu, setMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data State
  const [currentData, setCurrentData] = useState([]);
  const [snapshotData, setSnapshotData] = useState(null);
  const [periodoInfo, setPeriodoInfo] = useState(null);

  // Filters
  const [showOnlyChanges, setShowOnlyChanges] = useState(true);
  const [search, setSearch] = useState("");

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Get Metadata (Periodo info for timestamps)
      const allPeriodos = await window.api.periodo.getAll();
      const pInfo = allPeriodos.find(p => p.id === parseInt(periodoId));
      setPeriodoInfo(pInfo || {});

      // 2. Get Current Data
      const current = await window.api.periodo.getConsumoDetallado(parseInt(anio), parseInt(mes));
      setCurrentData(current);

      // 3. Get Snapshot (Original Upload)
      const snapshot = await window.api.basurero.getSnapshotData({ anio: parseInt(anio), mes: parseInt(mes) });
      setSnapshotData(snapshot);

    } catch (error) {
      console.error("Error cargando auditoría:", error);
      toast.error("Error cargando datos de trazabilidad.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (anio && mes) fetchData();
  }, [anio, mes]);

  // --- Audit Logic ---
  const getAuditStatus = (item) => {
    if (!snapshotData) return { status: 'unknown', changes: [] };

    const originalWater = snapshotData.agua_consumo?.find(a => a.apartamento_id === item.apto_id);
    const originalGas = snapshotData.gas_consumo?.find(g => g.apartamento_id === item.apto_id);

    const changes = [];

    // Check Water
    if (originalWater) {
      if (item.agua_lectura !== originalWater.lectura_actual) {
        changes.push({
          field: 'Agua (Lectura)',
          from: originalWater.lectura_actual,
          to: item.agua_lectura
        });
      }
    }

    // Check Gas
    if (originalGas) {
      if (item.gas_lectura !== originalGas.lectura_actual) {
        changes.push({
          field: 'Gas (Lectura)',
          from: originalGas.lectura_actual,
          to: item.gas_lectura
        });
      }
    }

    return {
      status: changes.length > 0 ? 'modified' : 'unchanged',
      changes
    };
  };

  // Filter Data
  const filteredData = currentData.filter(item => {
    const audit = getAuditStatus(item);
    const matchesSearch = item.apto?.toString().toLowerCase().includes(search.toLowerCase());
    const matchesFilter = showOnlyChanges ? audit.status === 'modified' : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-screen bg-sidebar-bg">
      <SideBar menubar={menu} setMenubar={setMenu} />
      <ToastContainer />

      <div className={`page-container overflow-y-auto scroll-container ${menu ? "w-7/8" : "w-full"}`}>

        {/* HEADER & TIMELINE */}
        <div className="bg-header-bg p-8 rounded-3xl shadow-premium mb-8 relative">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate("/AuditLog")}
                className="hover:scale-110 transition-transform bg-sidebar-bg p-2.5 rounded-full shadow-lg"
              >
                <ArrowLeftIcon className="w-6 h-6 text-white" />
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white/40 tracking-widest uppercase mb-1">Centro de Transparencia</span>
                <h1 className="text-4xl font-display text-white tracking-tight uppercase">
                  Auditoría <span className="text-sidebar-bg/40 font-bold">de Cambios</span>
                </h1>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <img src={Logo} alt="Logo" className="w-20 h-auto" />
              <span className="text-[8px] font-black text-white tracking-[0.3em] mt-1 uppercase">Edificio Calleja</span>
            </div>
          </div>

          {/* TIMELINE METADATA */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white/10 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
              <div className="p-3 bg-accent/20 rounded-xl">
                <DocumentCheckIcon className="w-6 h-6 text-accent" />
              </div>
              <div>
                <div className="text-[10px] text-white/40 uppercase font-black tracking-widest">Fecha de Carga (Original)</div>
                <div className="text-white font-bold text-sm">
                  {periodoInfo?.created_at ? new Date(periodoInfo.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Fecha no registrada"}
                </div>
              </div>
            </div>

            <div className="bg-white/10 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
              <div className="p-3 bg-blue-400/20 rounded-xl">
                <ClockIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-[10px] text-white/40 uppercase font-black tracking-widest">Última Actualización</div>
                <div className="text-white font-bold text-sm">
                  {/* Fallback to Today relative logic or DB field if available */}
                  {periodoInfo?.updated_at ? new Date(periodoInfo.updated_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Sin ediciones recientes"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6 px-2">

          {/* SEARCH */}
          <div className="bg-white rounded-2xl flex items-center px-4 py-3 shadow-premium border border-black/5 w-full md:w-96">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar apartamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-3 w-full outline-none text-sm font-bold text-sidebar-bg placeholder:text-gray-300"
            />
          </div>

          {/* TOGGLE */}
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-premium border border-black/5">
            <span className={`text-[10px] uppercase font-black tracking-widest ${!showOnlyChanges ? 'text-sidebar-bg' : 'text-gray-300'}`}>Ver Todo</span>
            <button
              onClick={() => setShowOnlyChanges(!showOnlyChanges)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${showOnlyChanges ? 'bg-accent' : 'bg-gray-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${showOnlyChanges ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-[10px] uppercase font-black tracking-widest ${showOnlyChanges ? 'text-accent' : 'text-gray-300'}`}>Solo Cambios</span>
          </div>
        </div>

        {/* LOG LIST */}
        <div className="space-y-4 pb-12">
          {loading ? (
            <div className="text-center py-20 text-sidebar-bg/40 font-bold uppercase tracking-widest animate-pulse">Analizando trazas de auditoría...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircleIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-300 font-black uppercase tracking-widest">No hay registros que coincidan</p>
              {showOnlyChanges && <p className="text-[10px] text-gray-300 mt-2">Los datos coinciden exactamente con la carga original.</p>}
            </div>
          ) : (
            filteredData.map((item) => {
              const audit = getAuditStatus(item);
              const isMod = audit.status === 'modified';

              return (
                <div key={item.apto_id} className={`bg-white rounded-2xl p-6 shadow-sm border ${isMod ? 'border-accent/30 bg-accent/[0.02]' : 'border-black/5'} transition-all hover:shadow-md`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-sidebar-bg">{item.apto}</h3>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-2 py-1 bg-gray-100 rounded-lg">{item.torre}</span>
                        {isMod && <span className="text-[10px] text-accent font-black uppercase tracking-widest px-2 py-1 bg-accent/10 rounded-lg flex items-center gap-1"><PencilSquareIcon className="w-3 h-3" /> Modificado</span>}
                      </div>
                      {!isMod && <p className="text-xs text-gray-400 font-medium italic">Sin cambios respecto a carga original</p>}
                    </div>
                    <div className="text-right">
                      {/* Action Timestamp? If we had per-row timestamps we'd put them here */}
                    </div>
                  </div>

                  {/* CHANGE DETAILS */}
                  {isMod && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {audit.changes.map((change, idx) => (
                        <div key={idx} className="bg-white border border-gray-100 p-4 rounded-xl shadow-inner flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-500 uppercase">{change.field}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-400 line-through decoration-red-400 decoration-2">{change.from}</span>
                            <span className="text-gray-300">➜</span>
                            <span className="text-sm font-black text-sidebar-bg">{change.to}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}

