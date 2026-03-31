import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SideBar from "../Components/Global/Sidebar";
import {
  ArrowLeftIcon,
  CheckIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/solid";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Logo from '../../assets/Logo.png';

export default function EditTable() {
  const [menu, setMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const periodoId = query.get("id");
  const anio = query.get("anio");
  const mes = query.get("mes");

  const [periodoInfo, setPeriodoInfo] = useState(null);
  const [efficiencyFactor, setEfficiencyFactor] = useState(0);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  useEffect(() => {
    if (!periodoId || !anio || !mes) {
      navigate("/Edit");
      return;
    }
    fetchData();
  }, [periodoId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Obtener info del periodo para el factor de gas
      const allPeriodos = await window.api.periodo.getAll();
      const p = allPeriodos.find(item => item.id === parseInt(periodoId));

      if (!p) {
        toast.error("Periodo no encontrado");
        navigate("/Edit");
        return;
      }
      setPeriodoInfo(p);

      // Calcular factor de gas / agua
      const totalGasM3 = (p.gas_m3_torre_a || 0) + (p.gas_m3_torre_b || 0) + (p.gas_m3_torre_c || 0);
      const towerWaterM3 = (p.agua_m3_total_residencia || 0) - (p.agua_m3_comunes || 0);
      const factor = towerWaterM3 > 0 ? totalGasM3 / towerWaterM3 : 0;
      setEfficiencyFactor(factor);

      // Cargar datos
      const res = await window.api.periodo.getConsumoDetallado(parseInt(anio), parseInt(mes));

      // Enriquecer datos con lectura anterior calculada (para poder recalcular m3 al editar lectura)
      const enriched = res.map(item => ({
        ...item,
        _prev_lectura: (item.agua_lectura || 0) - (item.agua_m3 || 0),
        total_valor: (item.agua_valor || 0) + (item.gas_valor || 0)
      }));

      setData(enriched);
      setOriginalData(JSON.parse(JSON.stringify(enriched)));
    } catch (err) {
      console.error("Error cargando datos:", err);
      toast.error("Error al cargar los datos del periodo");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (aptoId, value) => {
    setData(prev => prev.map(item => {
      if (item.apto_id === aptoId) {
        const newItem = { ...item };
        const newLectura = parseFloat(value) || 0;

        // 1. Actualizar Lectura
        newItem.agua_lectura = newLectura;

        // 2. Recalcular M3 Agua (Lectura Actual - Anterior)
        const newAguaM3 = Math.max(0, newLectura - item._prev_lectura);
        newItem.agua_m3 = newAguaM3;

        // 3. Recalcular M3 Gas (Factor * Agua M3)
        const newGasM3 = newAguaM3 * efficiencyFactor;
        newItem.gas_m3 = newGasM3;

        // 4. Recalcular Valores ($)
        const precioAgua = periodoInfo?.precio_m3_agua || 0;
        const precioGas = periodoInfo?.precio_m3_gas || 0;

        newItem.agua_valor = newAguaM3 * precioAgua;
        newItem.gas_valor = newGasM3 * precioGas;

        // 5. Recalcular Total
        newItem.total_valor = newItem.agua_valor + newItem.gas_valor;

        return newItem;
      }
      return item;
    }));
  };

  const handleSaveRow = async (item) => {
    setSaving(item.apto_id);
    try {
      const payload = {
        periodo_id: parseInt(periodoId),
        apto_id: item.apto_id,
        agua: {
          lectura: parseFloat(item.agua_lectura || 0),
          consumo: parseFloat(item.agua_m3 || 0),
          obs: item.agua_obs // Mantenemos obs aunque no se edite
        },
        gas: {
          lectura: 0,
          consumo: parseFloat(item.gas_m3 || 0),
          obs: item.gas_obs
        }
      };

      const res = await window.api.periodo.saveConsumos(payload);
      if (res.success) {
        toast.success(`Guardado: Apto ${item.apto}`, { autoClose: 1500 });
        setOriginalData(prev => prev.map(o => o.apto_id === item.apto_id ? JSON.parse(JSON.stringify(item)) : o));
      }
    } catch (err) {
      console.error("Error guardando:", err);
      toast.error(`Error guardando apto ${item.apto}`);
    } finally {
      setSaving(null);
    }
  };

  const hasChanged = (item) => {
    const original = originalData.find(o => o.apto_id === item.apto_id);
    if (!original) return false;
    // Solo verificamos lo que cambia (Lectura agua y sus derivados)
    return item.agua_lectura !== original.agua_lectura;
  };

  const changedItems = data.filter(item => hasChanged(item));

  const handleSaveAll = async () => {
    if (changedItems.length === 0) return;
    setSaving("all");
    try {
      const items = changedItems.map(item => ({
        apto_id: item.apto_id,
        agua: {
          lectura: parseFloat(item.agua_lectura || 0),
          consumo: parseFloat(item.agua_m3 || 0),
          obs: item.agua_obs
        },
        gas: {
          lectura: 0,
          consumo: parseFloat(item.gas_m3 || 0),
          obs: item.gas_obs
        }
      }));

      const res = await window.api.periodo.saveMultipleConsumos({
        periodo_id: parseInt(periodoId),
        items
      });

      if (res.success) {
        toast.success(`Se guardaron ${items.length} apartamentos.`);
        setOriginalData(JSON.parse(JSON.stringify(data)));
      }
    } catch (err) {
      toast.error("Error en guardado masivo");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="flex h-screen bg-sidebar-bg">
      <SideBar menubar={menu} setMenubar={setMenu} />
      <ToastContainer />

      <div className={`page-container overflow-y-auto scroll-container ${menu ? "w-7/8" : "w-full"}`}>

        {/* HEADER */}
        <div className="bg-header-bg p-8 rounded-3xl shadow-premium mb-8 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate("/Edit")}
                className="hover:scale-110 transition-transform bg-sidebar-bg p-2.5 rounded-full shadow-lg"
              >
                <ArrowLeftIcon className="w-6 h-6 text-white" />
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white/40 tracking-widest uppercase mb-1">Editando periodo</span>
                <h1 className="text-4xl font-display text-white tracking-tight uppercase">
                  {monthNames[parseInt(mes) - 1]} <span className="text-sidebar-bg/40 font-bold">{anio}</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-10">
              {changedItems.length > 0 && (
                <button
                  onClick={handleSaveAll}
                  disabled={saving !== null}
                  className="flex items-center gap-3 px-8 py-4 bg-accent text-white rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  {saving === "all" ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <CheckIcon className="w-5 h-5" />
                  )}
                  <span>Guardar Todo ({changedItems.length})</span>
                </button>
              )}

              <div className="flex flex-col items-end">
                <img src={Logo} alt="Logo" className="w-20 h-auto" />
                <span className="text-[8px] font-black text-white tracking-[0.3em] mt-1 uppercase">Edificio Calleja</span>
              </div>
            </div>
          </div>
        </div>

        {/* TABLA DE EDICIÓN */}
        <div className="bg-white rounded-3xl shadow-premium border border-black/5 overflow-hidden flex flex-col h-[calc(100vh-250px)]">
          <div className="overflow-auto scroll-container flex-1">
            <table className="min-w-full divide-y divide-black/5">
              <thead className="bg-sidebar-bg sticky top-0 z-20">
                <tr>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest border-r border-white/5">Torre</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest border-r border-white/5">Apto</th>

                  {/* AGUA */}
                  <th className="px-6 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest border-r border-white/5">Lectura (m3)</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest border-r border-white/5 bg-sidebar-bg/40">Agua Consumo (m3)</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest border-r border-white/5 bg-sidebar-bg/40">Agua ($)</th>

                  {/* GAS */}
                  <th className="px-6 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest border-r border-white/5 bg-sidebar-bg/30">Gas Consumo (m3)</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest border-r border-white/5 bg-sidebar-bg/30">Gas ($)</th>

                  {/* TOTAL */}
                  <th className="px-6 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest bg-accent/20">Total ($)</th>

                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-black/5">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-32 text-center text-xs font-bold uppercase text-text-secondary opacity-50 tracking-widest">
                      Cargando datos...
                    </td>
                  </tr>
                ) : data.map((item) => (
                  <tr key={item.apto_id} className={`transition-all ${hasChanged(item) ? 'bg-accent/5' : 'hover:bg-main-bg/20'}`}>
                    <td className="px-6 py-4 text-center text-xs font-medium text-text-secondary/60">{item.torre}</td>
                    <td className="px-6 py-4 text-center text-sm font-black text-sidebar-bg">{item.apto}</td>

                    {/* LECTURA EDITABLE */}
                    <td className="px-6 py-3 text-center border-r border-black/5">
                      <input
                        type="number"
                        value={item.agua_lectura || ''}
                        onChange={(e) => handleInputChange(item.apto_id, e.target.value)}
                        className="w-24 text-center py-2 bg-main-bg/30 border border-transparent focus:border-accent/40 rounded-lg focus:bg-white transition-all outline-none font-bold text-sm shadow-sm text-sidebar-bg [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        placeholder="0.00"
                      />
                    </td>

                    {/* CALCULADOS (READ ONLY) */}
                    <td className="px-6 py-4 text-center text-xs font-bold text-text-secondary border-r border-black/5 bg-sidebar-bg/[0.01]">
                      {item.agua_m3?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-medium text-text-secondary border-r border-black/5 bg-sidebar-bg/[0.01]">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.agua_valor)}
                    </td>

                    <td className="px-6 py-4 text-center text-xs font-bold text-text-secondary border-r border-black/5 bg-sidebar-bg/[0.02]">
                      {item.gas_m3?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-medium text-text-secondary border-r border-black/5 bg-sidebar-bg/[0.02]">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.gas_valor)}
                    </td>

                    {/* TOTAL */}
                    <td className="px-6 py-4 text-center text-xs font-black text-sidebar-bg bg-accent/[0.03]">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.total_valor)}
                    </td>

                    {/* ACTION */}
                    <td className="px-4 text-center">
                      {hasChanged(item) && (
                        <button
                          onClick={() => handleSaveRow(item)}
                          disabled={saving === item.apto_id}
                          className="p-2 bg-accent text-white rounded-lg hover:scale-110 transition-transform shadow-md"
                          title="Guardar cambios"
                        >
                          {saving === item.apto_id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <CheckIcon className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && data.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                <ExclamationCircleIcon className="w-12 h-12 text-sidebar-bg" />
                <span className="text-xs font-black uppercase text-sidebar-bg tracking-widest">No hay datos</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
