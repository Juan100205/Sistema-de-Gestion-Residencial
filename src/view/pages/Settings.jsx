import React, { useEffect, useState } from "react";
import SideBar from "../Components/Global/Sidebar";
import {
  UserCircleIcon,
  HomeIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
  Bars3Icon
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import Logo from '../../assets/Logo.png';

export default function Settings() {
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Estados para selectores y datos
  const [periodosRaw, setPeriodosRaw] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [currentPeriodo, setCurrentPeriodo] = useState(null);
  const [snapshotData, setSnapshotData] = useState(null);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // 1. Cargar periodos al inicio
  useEffect(() => {
    const fetchPeriodos = async () => {
      try {
        const res = await window.api.periodo.getAll();
        setPeriodosRaw(res);

        if (res.length > 0) {
          const ultimo = [...res].sort((a, b) => b.anio_end - a.anio_end || b.mes_end - a.mes_end)[0];
          setSelectedYear(ultimo.anio_end.toString());
          setSelectedMonth(ultimo.mes_end.toString());
        }
      } catch (err) {
        console.error("Error cargando periodos en settings:", err);
      }
    };
    fetchPeriodos();
  }, []);

  // 2. Cargar auditoría del periodo seleccionado
  useEffect(() => {
    const loadAuditData = async () => {
      if (!selectedYear || !selectedMonth) return;

      setLoading(true);
      try {
        // Encontrar objeto actual
        const periodoObj = periodosRaw.find(item => item.anio_end.toString() === selectedYear && item.mes_end.toString() === selectedMonth);
        setCurrentPeriodo(periodoObj);

        // Cargar Snapshot (Original)
        const snapshot = await window.api.basurero.getSnapshotData({ anio: parseInt(selectedYear), mes: parseInt(selectedMonth) });
        setSnapshotData(snapshot);
      } catch (err) {
        console.error("Error al cargar auditoría de variables:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAuditData();
  }, [selectedYear, selectedMonth, periodosRaw]);

  // ESC para cerrar menú
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0);
  };

  const availableYears = [...new Set(periodosRaw.map(p => p.anio_end))].sort((a, b) => b - a);
  const getMonthsForYear = (year) => {
    return periodosRaw
      .filter(p => p.anio_end.toString() === year.toString())
      .map(p => ({ val: p.mes_end, name: monthNames[p.mes_end - 1] }))
      .sort((a, b) => b.val - a.val);
  };

  const renderComparison = (label, currentVal, originalVal, isCurrency = true) => {
    const hasChange = originalVal !== undefined && currentVal !== originalVal;

    return (
      <div className="flex items-center justify-between py-6 border-b border-black/5 group hover:bg-black/5 transition-all px-4 rounded-xl">
        <div className="flex items-center gap-4">
          <div className={`w-2 h-2 rounded-full ${hasChange ? 'bg-amber-400' : 'bg-green-400'}`}></div>
          <div className="text-lg font-medium text-gray-700 tracking-tight">{label}</div>
        </div>

        <div className="flex items-center gap-8">
          {hasChange && (
            <div className="flex flex-col items-end opacity-40 scale-90">
              <span className="text-[10px] font-black uppercase">Original</span>
              <span className="font-bold line-through italic">
                {isCurrency ? formatCurrency(originalVal) : originalVal}
              </span>
            </div>
          )}

          <div className="flex items-center gap-4 min-w-[200px] justify-end">
            <div className={`text-2xl font-black ${hasChange ? 'text-[#2A3746]' : 'text-gray-400'}`}>
              {isCurrency ? formatCurrency(currentVal) : currentVal}
            </div>
            {hasChange ? (
              currentVal > originalVal ? <ArrowUpIcon className="w-6 h-6 text-amber-600" /> : <ArrowDownIcon className="w-6 h-6 text-blue-600" />
            ) : (
              <CheckBadgeIcon className="w-6 h-6 text-green-500 opacity-30" />
            )}
          </div>
        </div>
      </div>
    );
  };

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
                  <HomeIcon className="w-14 h-14 text-white/80" />
                </button>
              )}
              <button onClick={() => navigate("/Tables")} className="hover:scale-110 transition-transform bg-sidebar-bg p-3 rounded-full shadow-lg">
                <ArrowLeftIcon className="w-8 h-8 text-white" />
              </button>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-white/40 tracking-[0.2em] uppercase">Auditoría de Parámetros</span>
                <h1 className="text-5xl font-display text-white tracking-tight uppercase">
                  Historial <span className="text-sidebar-bg/40 font-bold">de Medidores</span>
                </h1>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <img src={Logo} alt="Logo" className="w-24 h-auto" />
              <span className="text-[10px] font-black text-white tracking-[0.4em] mt-2 uppercase">Edificio Calleja</span>
            </div>
          </div>

          {/* SELECTORES DE PERIODO */}
          <div className="flex gap-4">
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setSelectedMonth(""); }}
              className="px-8 py-4 bg-white rounded-xl text-sidebar-bg text-sm font-bold shadow-sm focus:outline-none cursor-pointer"
            >
              {!selectedYear && <option value="">Año</option>}
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-8 py-4 bg-white rounded-xl text-sidebar-bg text-sm font-bold shadow-sm focus:outline-none cursor-pointer"
            >
              {!selectedMonth && <option value="">Mes</option>}
              {selectedYear && getMonthsForYear(selectedYear).map(m => (
                <option key={m.val} value={m.val}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* CONTENIDO: COMPARATIVA */}
        <div className="bg-white rounded-3xl shadow-premium border border-black/5 overflow-hidden">
          {loading ? (
            <div className="py-32 text-center flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-3 border-accent/20 border-t-accent rounded-full animate-spin"></div>
              <span className="text-text-secondary text-xs font-bold tracking-widest uppercase opacity-50">Sincronizando Archivos...</span>
            </div>
          ) : currentPeriodo ? (
            <div className="p-8">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-black/5">
                <h2 className="text-xl font-display text-sidebar-bg tracking-tight">Análisis de Valores <span className="text-accent underline decoration-2 underline-offset-4 decoration-accent/30">{monthNames[parseInt(selectedMonth) - 1]} {selectedYear}</span></h2>
                <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-black uppercase ${snapshotData ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                  {snapshotData ? <CheckBadgeIcon className="w-4 h-4" /> : <ExclamationTriangleIcon className="w-4 h-4" />}
                  {snapshotData ? 'Snapshot Detectado' : 'Sin Historial'}
                </div>
              </div>

              <div className="grid gap-2">
                {renderComparison(
                  "Precio por M3 de Agua",
                  currentPeriodo.precio_m3_agua,
                  snapshotData?.periodo?.precio_m3_agua
                )}

                {renderComparison(
                  "Precio por M3 de Gas",
                  currentPeriodo.precio_m3_gas,
                  snapshotData?.periodo?.precio_m3_gas
                )}

                {renderComparison(
                  "Coeficiente General",
                  currentPeriodo.coeficiente_general,
                  snapshotData?.periodo?.coeficiente_general,
                  false
                )}

                {renderComparison(
                  "Umbral de Alertas",
                  currentPeriodo.alertas,
                  snapshotData?.periodo?.alertas,
                  false
                )}
              </div>

              <div className="mt-12 flex items-start gap-4 bg-main-bg/30 p-6 rounded-2xl border border-black/[0.03] text-sidebar-bg/60 text-xs font-medium leading-relaxed">
                <InformationCircleIcon className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <p>Esta vista audita los valores de facturación actuales comparándolos con el registro original de carga. Los cambios resaltados en <span className="text-accent font-bold">dorado</span> indican modificaciones realizadas post-carga.</p>
              </div>
            </div>
          ) : (
            <div className="py-32 text-center opacity-20 flex flex-col items-center gap-6">
              <div className="p-6 bg-main-bg rounded-full">
                <InformationCircleIcon className="w-12 h-12 text-sidebar-bg" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-sidebar-bg">Seleccione un periodo para auditar</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
