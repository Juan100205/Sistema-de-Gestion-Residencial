import React, { useEffect, useState } from "react";
import SideBar from "../Components/Global/Sidebar";
import { UserCircleIcon, ArrowLeftIcon, HomeIcon, ChartBarIcon, Bars3Icon } from "@heroicons/react/24/solid";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardFilters from "../Components/Dashboard/DashboardFilters";
import DashboardTable from "../Components/Dashboard/DashboardTable";
import Button from "../Components/Global/Button";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menu, setMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("GENERAL");
  const [loading, setLoading] = useState(false);

  // Datos reales
  const [periodosRaw, setPeriodosRaw] = useState([]); // Todos los periodos de la DB
  const [dataPrincipal, setDataPrincipal] = useState([]); // Datos del periodo seleccionado
  const [dataComparativa, setDataComparativa] = useState([]); // Datos para la pestaña comparación
  const [dataHistorica, setDataHistorica] = useState([]); // Datos para la pestaña HISTORICO (Rango)

  // Selectores
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTorre, setSelectedTorre] = useState(""); // Nuevo estado para torre (TAB)
  const [searchTerm, setSearchTerm] = useState(""); // Búsqueda Apto
  const [searchTorre, setSearchTorre] = useState(""); // Nueva Búsqueda Torre

  // Selectores secundarios para COMPARACION
  const [selectedMonth2, setSelectedMonth2] = useState("");
  const [selectedYear2, setSelectedYear2] = useState("");


  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // 1. Cargar periodos disponibles al inicio
  useEffect(() => {
    const init = async () => {
      try {
        const res = await window.api.periodo.getAll();
        setPeriodosRaw(res);

        // Por defecto, seleccionar el más reciente
        if (res.length > 0) {
          const ultimo = res.sort((a, b) => b.anio_end - a.anio_end || b.mes_end - a.mes_end)[0];
          setSelectedMonth(ultimo.mes_end.toString());
          setSelectedYear(ultimo.anio_end.toString());

          // Si hay al menos otro, ponerlo para comparación
          if (res.length > 1) {
            const penultimo = res.sort((a, b) => b.anio_end - a.anio_end || b.mes_end - a.mes_end)[1];
            setSelectedMonth2(penultimo.mes_end.toString());
            setSelectedYear2(penultimo.anio_end.toString());
          }
        }
      } catch (err) {
        console.error("Error cargando periodos:", err);
      }
    };
    init();
  }, []);

  // 1.5. Manejar navegación desde Home (Auto-configurar filtros)
  useEffect(() => {
    if (periodosRaw.length > 0 && location.state?.autoRange) {
      const { tower, apto } = location.state;
      console.log("Auto-configuring Dashboard from State:", location.state);

      // 1. Activar Tab Historico
      setActiveTab("HISTORICO");

      // 2. Setear filtros de búsqueda
      setSearchTorre(tower);
      setSearchTerm(apto ? apto.toString() : "");

      // 3. Setear Rango Completo (Primero -> Ultimo)
      const sorted = [...periodosRaw].sort((a, b) => a.anio_end - b.anio_end || a.mes_end - b.mes_end);
      if (sorted.length > 0) {
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        setSelectedYear(first.anio_end.toString());
        setSelectedMonth(first.mes_end.toString());

        setSelectedYear2(last.anio_end.toString());
        setSelectedMonth2(last.mes_end.toString());
      }

      // 4. Limpiar state para no re-aplicar
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [periodosRaw, location.state, navigate, location.pathname]);

  // 2. Cargar datos cuando cambian los selectores
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedMonth || !selectedYear) return;
      setLoading(true);
      try {
        const res = await window.api.periodo.getConsumoDetallado(parseInt(selectedYear), parseInt(selectedMonth));
        setDataPrincipal(res);

        // Si hay una torre seleccionada pero no existe en el nuevo periodo, resetearla
        const torresDisponibles = [...new Set(res.map(d => d.torre))];
        if (selectedTorre && !torresDisponibles.includes(selectedTorre)) {
          setSelectedTorre(torresDisponibles[0] || "");
        } else if (!selectedTorre && torresDisponibles.length > 0) {
          setSelectedTorre(torresDisponibles[0]);
        }

        // Si estamos en comparación, cargar el segundo mes
        if (activeTab === "COMPARACION" && selectedMonth2 && selectedYear2) {
          const res2 = await window.api.periodo.getConsumoDetallado(parseInt(selectedYear2), parseInt(selectedMonth2));
          setDataComparativa(res2);
        }

        // Si estamos en HISTORICO, cargar rango (Requiere Torre y Apto)
        if (activeTab === "HISTORICO" && selectedMonth && selectedYear && selectedMonth2 && selectedYear2 && searchTerm && searchTorre) {
          console.log("Starting Historic Fetch...", { selectedMonth, selectedYear, selectedMonth2, selectedYear2, searchTerm, searchTorre });

          // 1. Filtrar periodos en el rango
          // Convert to comparable values (Total Months)
          const date1 = parseInt(selectedYear) * 12 + parseInt(selectedMonth);
          const date2 = parseInt(selectedYear2) * 12 + parseInt(selectedMonth2);

          const startVal = Math.min(date1, date2);
          const endVal = Math.max(date1, date2);

          const periodsInRange = periodosRaw.filter(p => {
            const pVal = p.anio_end * 12 + p.mes_end;
            return pVal >= startVal && pVal <= endVal;
          }).sort((a, b) => a.anio_end - b.anio_end || a.mes_end - b.mes_end); // Orden cronológico

          console.log("Periods in Range:", periodsInRange);

          // 2. Fetch para cada periodo (Optimizable: Promise.all)
          const historyData = await Promise.all(periodsInRange.map(async (p) => {
            try {
              const details = await window.api.periodo.getConsumoDetallado(p.anio_end, p.mes_end);
              // Buscar apto en torre específica
              // Ensure comparison is safe (trim, lowercase, string)
              const aptoData = details.find(d =>
                d.apto?.toString().toLowerCase().trim() === searchTerm.toString().toLowerCase().trim() &&
                d.torre?.toString().toLowerCase().trim() === searchTorre.toString().toLowerCase().trim()
              );

              if (aptoData) {
                console.log(`Found match in ${p.mes_end}/${p.anio_end}:`, aptoData);
              } else {
                // console.log(`No match in ${p.mes_end}/${p.anio_end} for ${searchTorre} ${searchTerm}`);
              }

              return {
                period: `${monthNames[p.mes_end - 1]} ${p.anio_end}`,
                fullDate: `${p.mes_end}/${p.anio_end}`,
                ...aptoData // Si no existe será undefined
              };
            } catch (e) {
              console.error("Error fetching detail for period:", p, e);
              return null;
            }
          }));

          const finalData = historyData.filter(d => d && d.apto);
          console.log("Final History Data:", finalData);
          setDataHistorica(finalData);
        } else if (activeTab === "HISTORICO") {
          // Limpiar si falta info
          console.log("Missing filters for Historic:", { selectedMonth, selectedYear, selectedMonth2, selectedYear2, searchTerm, searchTorre });
          setDataHistorica([]);
        }

      } catch (err) {
        console.error("Error cargando consumos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, selectedYear, selectedMonth2, selectedYear2, activeTab, searchTerm, searchTorre, periodosRaw]);

  // Cerrar menú con Escape
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);


  // Helper para agrupar años y meses únicos para los selectores
  const availableYears = [...new Set(periodosRaw.map(p => p.anio_end))].sort((a, b) => b - a);
  const getMonthsForYear = (year) => {
    return periodosRaw
      .filter(p => p.anio_end.toString() === year.toString())
      .map(p => ({ val: p.mes_end, name: monthNames[p.mes_end - 1] }))
      .sort((a, b) => b.val - a.val);
  };

  // Torres y Aptos únicos para los selectores
  const uniqueTowers = [...new Set(dataPrincipal.map(d => d.torre))].sort();
  const uniqueAptos = [...new Set(dataPrincipal.map(d => d.apto))].sort(); // Extract unique aptos

  // Filtrado final de datos según la pestaña activa y búsqueda
  const displayData = dataPrincipal.filter(d => {
    const matchApto = d.apto?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    const matchTorre = d.torre?.toLowerCase().includes(searchTorre.toLowerCase());
    return matchApto && matchTorre;
  });


  return (
    <div className="flex h-screen bg-sidebar-bg">
      <SideBar menubar={menu} setMenubar={setMenu} />

      <div className="page-container overflow-y-auto scroll-container">

        {/* SECCIÓN SUPERIOR CON FONDO OSCURO (MODERNIZADO) */}
        <div className="bg-header-bg p-10 rounded-[2.5rem] shadow-premium relative mb-12">

          {/* HEADER: TITULO Y LOGO */}
          <div className="flex items-start justify-between mb-12">
            <div className="flex items-center gap-8">
              {!menu && (
                <button
                  onClick={() => setMenu(true)}
                  className="hover:scale-110 transition-transform duration-200"
                >
                  <Bars3Icon className="w-14 h-14 text-white/80" />
                </button>
              )}
              <Button
                variant="icon"
                icon={ArrowLeftIcon}
                onClick={() => navigate("/")}
                className="p-3"
              />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-white/40 tracking-[0.2em] uppercase">Visualización de Datos</span>
                <h1 className="text-5xl font-display text-white tracking-tight uppercase">
                  Gestión <span className="text-sidebar-bg/40 font-bold">de Consumos</span>
                </h1>

                {activeTab === "GENERAL" && selectedMonth && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-widest uppercase bg-white/10 px-4 py-2 rounded-full border border-white/20 shadow-sm">
                      NOTA: Periodo {monthNames[parseInt(selectedMonth) - 1]} &rarr; Cobros en {monthNames[(parseInt(selectedMonth)) % 12]}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end">
              <img src="assets/Logo.png" alt="Logo" className="w-24 h-auto" />
              <span className="text-[10px] font-black text-white tracking-[0.4em] mt-2 uppercase">Edificio Calleja</span>
            </div>
          </div>

          {/* FILTROS Y TABS COMPONETIZADOS */}
          <DashboardFilters
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedTorre={selectedTorre}
            setSelectedTorre={setSelectedTorre}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedMonth2={selectedMonth2}
            setSelectedMonth2={setSelectedMonth2}
            selectedYear2={selectedYear2}
            setSelectedYear2={setSelectedYear2}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchTorre={searchTorre}
            setSearchTorre={setSearchTorre}
            uniqueTowers={uniqueTowers}
            uniqueAptos={uniqueAptos}
            availableYears={availableYears}
            getMonthsForYear={getMonthsForYear}
          />
        </div>

        {/* CONTENIDO (TABLA COMPONETIZADA) */}
        {/* CONTENIDO (TABLA COMPONETIZADA O GRÁFICA HISTÓRICA) */}
        {activeTab === "HISTORICO" ? (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-black/5">
            {(!searchTerm || !searchTorre) ? (
              <div className="flex flex-col items-center justify-center p-20 opacity-50">
                <UserCircleIcon className="w-20 h-20 text-sidebar-bg/20 mb-4" />
                <p className="text-xl font-black text-sidebar-bg uppercase tracking-widest">Seleccione Torre y Apartamento</p>
                <p className="text-sm font-bold text-sidebar-bg/60">Ingrese la Torre y el Apartamento en los buscadores para ver su historial.</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center p-20 opacity-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-sidebar-bg mb-4"></div>
              </div>
            ) : dataHistorica.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 opacity-50">
                <p className="text-xl font-black text-sidebar-bg uppercase tracking-widest">No hay datos</p>
                <p className="text-sm font-bold text-sidebar-bg/60">No se encontraron registros para {searchTerm} en el rango seleccionado.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-8 w-full">
                {/* CHART SECTION */}
                <div className="h-[400px] w-full">
                  <h3 className="text-sidebar-bg font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5 text-accent" />
                    Historial de Consumo: Apto {searchTerm}
                  </h3>
                  <Line
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: false }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: '#f3f4f6' }
                        },
                        x: {
                          grid: { display: false }
                        }
                      }
                    }}
                    data={{
                      labels: dataHistorica.map(d => d.period),
                      datasets: [
                        {
                          label: 'Consumo Agua (m³)',
                          data: dataHistorica.map(d => d.agua_m3 || 0),
                          borderColor: 'rgba(59, 130, 246, 1)',
                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                          fill: false,
                          tension: 0.4
                        },
                        {
                          label: 'Consumo Gas (m³)',
                          data: dataHistorica.map(d => d.gas_m3 || 0),
                          borderColor: 'rgba(249, 115, 22, 1)', // Orange
                          backgroundColor: 'rgba(249, 115, 22, 0.2)',
                          fill: false,
                          tension: 0.4
                        },
                        {
                          label: 'Costo Total ($)',
                          data: dataHistorica.map(d => d.total_valor || 0),
                          borderColor: 'rgba(16, 185, 129, 1)', // Emerald
                          backgroundColor: 'rgba(16, 185, 129, 0.0)',
                          yAxisID: 'y1',
                          tension: 0.4,
                          hidden: true // Hide by default to not skew scale? Or use separate axis
                        }
                      ]
                    }}
                  />
                </div>

                {/* TABLE SECTION */}
                <div className="overflow-x-auto mt-8 border-t border-black/5 pt-8">
                  <h3 className="text-sidebar-bg font-black uppercase tracking-widest mb-6 px-2">
                    Detalle por Periodo
                  </h3>
                  <table className="min-w-full divide-y divide-black/5">
                    <thead className="bg-sidebar-bg rounded-xl">
                      <tr>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest rounded-tl-xl">Periodo</th>
                        <th className="px-6 py-3 text-center text-[10px] font-black text-white/80 uppercase tracking-widest">Lectura (m³)</th>
                        <th className="px-6 py-3 text-center text-[10px] font-black text-white/80 uppercase tracking-widest">Agua (m³)</th>
                        <th className="px-6 py-3 text-center text-[10px] font-black text-white/80 uppercase tracking-widest">Valor Agua</th>
                        <th className="px-6 py-3 text-center text-[10px] font-black text-white/80 uppercase tracking-widest text-orange-300">Gas (m³)</th>
                        <th className="px-6 py-3 text-center text-[10px] font-black text-white/80 uppercase tracking-widest text-orange-300">Valor Gas</th>
                        <th className="px-6 py-3 text-right text-[10px] font-black text-white uppercase tracking-widest rounded-tr-xl">Total ($)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {dataHistorica.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-sidebar-bg">{row.period}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-center text-gray-500">{row.agua_lectura?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-center font-bold text-blue-600">{row.agua_m3?.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-center text-gray-600">${row.agua_valor?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-center font-bold text-orange-500">{row.gas_m3?.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-center text-gray-600">${row.gas_valor?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-right font-black text-emerald-600">${row.total_valor?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <DashboardTable
            loading={loading}
            data={displayData}
            dataComparativa={dataComparativa}
            activeTab={activeTab}
          />
        )}
      </div>
    </div>
  );
}
