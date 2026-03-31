import React, { useEffect, useState } from "react";
import SideBar from "../Components/Global/Sidebar";
import { UserCircleIcon, MagnifyingGlassIcon, EyeIcon, ArrowLeftIcon, HomeIcon, ChevronDownIcon, ChevronUpIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import Logo from '../../assets/Logo.png';

export default function History() {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para controlar qué tarjetas están expandidas
  const [expanded, setExpanded] = useState({});

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const fetchPeriodos = async () => {
    try {
      setLoading(true);
      const allPeriodos = await window.api.periodo.getAll();

      const formatted = allPeriodos.map(p => {
        // Calcular promedio de gas (m3) si no existe directament
        const gasM3A = p.gas_m3_torre_a || 0;
        const gasM3B = p.gas_m3_torre_b || 0;
        const gasM3C = p.gas_m3_torre_c || 0;

        return {
          ...p,
          displayName: `${monthNames[p.mes_end - 1]} ${p.anio_end}`,
          fechaOrden: p.anio_end * 100 + p.mes_end,
          promedioGasM3: ((gasM3A + gasM3B + gasM3C) / 3).toFixed(2),
          totalGasM3: (gasM3A + gasM3B + gasM3C).toFixed(2)
        };
      }).sort((a, b) => b.fechaOrden - a.fechaOrden);

      setPeriodos(formatted);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriodos();
  }, []);

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const navToMetric = (key, label) => {
    navigate(`/MetricHistory?key=${key}&label=${label}`);
  };

  const MetricButton = ({ label, value, dbKey, highlight = false }) => (
    <button
      onClick={(e) => { e.stopPropagation(); navToMetric(dbKey, label); }}
      className={`flex flex-col items-start p-4 rounded-2xl w-full transition-all border ${highlight ? 'bg-accent/10 border-accent/20 hover:bg-accent/20' : 'bg-gray-50 border-gray-100 hover:bg-gray-100 hover:scale-[1.02]'}`}
    >
      <span className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1 text-left">{label}</span>
      <span className={`text-lg font-black ${highlight ? 'text-accent' : 'text-sidebar-bg'}`}>
        {typeof value === 'number' ? value.toLocaleString('es-CO', { maximumFractionDigits: 3 }) : value}
      </span>
    </button>
  );

  const filtrados = periodos.filter(p => p.displayName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-screen bg-sidebar-bg">
      <SideBar menubar={menu} setMenubar={setMenu} />

      <div className={`page-container overflow-y-auto scroll-container ${menu ? "w-7/8" : "w-full"}`}>

        {/* HEADER */}
        <div className="bg-header-bg p-10 rounded-[2.5rem] shadow-premium mb-12 relative">
          <div className="flex items-start justify-between mb-8">
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
                <span className="text-sm font-bold text-white/40 tracking-[0.2em] uppercase">Auditoría de Parámetros</span>
                <h1 className="text-5xl font-display text-white tracking-tight uppercase">
                  Historial <span className="text-sidebar-bg/40 font-bold">Medidores</span>
                </h1>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <img src={Logo} alt="Logo" className="w-24 h-auto" />
              <span className="text-[10px] font-black text-white tracking-[0.4em] mt-2 uppercase">Edificio Calleja</span>
            </div>
          </div>

          {/* BÚSQUEDA */}
          <div className="bg-white rounded-2xl flex items-center px-8 py-5 w-full shadow-sm hover:shadow-md transition-shadow max-w-2xl">
            <MagnifyingGlassIcon className="w-6 text-accent" />
            <input
              type="text"
              placeholder="Buscar periodo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-6 w-full text-sidebar-bg outline-none font-bold text-sm placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* LISTA DE TARJETAS */}
        <div className="space-y-6 pb-20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <div className="w-10 h-10 border-4 border-accent rounded-full border-t-transparent animate-spin mb-4" />
              <span className="text-white font-bold uppercase tracking-widest text-xs">Cargando auditoría...</span>
            </div>
          ) : filtrados.map((p) => (
            <div key={p.id} className="bg-white rounded-3xl p-8 shadow-premium border border-black/5 relative overflow-hidden group">

              {/* HEADER DE TARJETA */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-black text-sidebar-bg uppercase tracking-tight mb-1">{p.displayName}</h2>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">ID: {p.id}</span>
                </div>
              </div>

              {/* METRICAS PRINCIPALES (GRID SUPERIOR) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <MetricButton label="Coeficiente General" value={p.coeficiente_general} dbKey="coeficiente_general" highlight />
                <MetricButton label="Promedio m³ Gas" value={p.promedioGasM3} dbKey="gas_m3_torre_a" /> {/* Usamos torre A como proxy para link, o podríamos crear un endpoint virtual de promedio */}
                <MetricButton label="m³ Agua Total" value={p.agua_m3_total_residencia} dbKey="agua_m3_total_residencia" />
                <MetricButton label="Relación A/G" value={(p.agua_m3_total_residencia > 0 ? (p.totalGasM3 / p.agua_m3_total_residencia) : 0).toFixed(3)} dbKey="coeficiente_general" />
              </div>

              {/* SECCIÓN EXPANDIBLE */}
              <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-500 overflow-hidden ${expanded[p.id] ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <MetricButton label="m3 Gas Torre A" value={p.gas_m3_torre_a} dbKey="gas_m3_torre_a" />
                <MetricButton label="m3 Gas Torre B" value={p.gas_m3_torre_b} dbKey="gas_m3_torre_b" />
                <MetricButton label="m3 Gas Torre C" value={p.gas_m3_torre_c} dbKey="gas_m3_torre_c" />
                <MetricButton label="m3 Agua Z. Comunes" value={p.agua_m3_comunes} dbKey="agua_m3_comunes" />

                <MetricButton label="Precio m3 Agua" value={p.precio_m3_agua} dbKey="precio_m3_agua" />
                <MetricButton label="Precio m3 Gas" value={p.precio_m3_gas} dbKey="precio_m3_gas" />
                <MetricButton label="Factura Agua ($)" value={p.agua_total_residencia} dbKey="agua_total_residencia" />
                <MetricButton label="Alertas" value={p.alertas} dbKey="alertas" />
              </div>

              {/* BOTÓN VER MÁS */}
              <button
                onClick={() => toggleExpand(p.id)}
                className="w-full flex items-center justify-center gap-2 py-3 mt-4 text-[10px] font-black uppercase tracking-widest text-sidebar-bg/30 hover:text-accent hover:bg-accent/5 rounded-xl transition-all"
              >
                {expanded[p.id] ? (
                  <>Ver Menos <ChevronUpIcon className="w-4 h-4" /></>
                ) : (
                  <>Ver Detalle Completo <ChevronDownIcon className="w-4 h-4" /></>
                )}
              </button>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
