import React, { useEffect, useState } from "react";
import SideBar from "../Components/Global/Sidebar";
import {
  HomeIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  ArrowLeftIcon,
  UserCircleIcon,
  Bars3Icon
} from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import DashboardFilters from "../Components/Dashboard/DashboardFilters";
import Button from "../Components/Global/Button";
import Logo from '../../assets/Logo.png';

export default function Export() {
  const [menu, setMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Estados Base (Igual a Dashboard)
  const [activeTab, setActiveTab] = useState("GENERAL");
  const [periodosRaw, setPeriodosRaw] = useState([]);
  const [dataPrincipal, setDataPrincipal] = useState([]); // Datos generales
  const [dataComparativa, setDataComparativa] = useState([]); // Datos comparación
  const [dataHistorica, setDataHistorica] = useState([]); // Datos histórico (rango)

  // Filtros
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth2, setSelectedMonth2] = useState("");
  const [selectedYear2, setSelectedYear2] = useState("");

  const [searchTorre, setSearchTorre] = useState(""); // Buscador Torre (Historico)
  const [searchTerm, setSearchTerm] = useState(""); // Buscador Apto

  // PDF Preview
  const [pdfUrl, setPdfUrl] = useState(null);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // 1. Cargar Datos Maestros (Periodos) - Igual a Dashboard
  useEffect(() => {
    const init = async () => {
      try {
        const res = await window.api.periodo.getAll();
        setPeriodosRaw(res);

        if (res.length > 0) {
          const ultimo = res.sort((a, b) => b.anio_end - a.anio_end || b.mes_end - a.mes_end)[0];
          setSelectedMonth(ultimo.mes_end.toString());
          setSelectedYear(ultimo.anio_end.toString());

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

  // 2. Data Fetching (Unificado con Dashboard)
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedMonth || !selectedYear) return;
      setLoading(true);
      try {
        // A. Cargar datos principales (Periodo 1)
        const res = await window.api.periodo.getConsumoDetallado(parseInt(selectedYear), parseInt(selectedMonth));
        setDataPrincipal(res);



        // B. Cargar Comparison (Periodo 2)
        if (activeTab === "COMPARACION" && selectedMonth2 && selectedYear2) {
          const res2 = await window.api.periodo.getConsumoDetallado(parseInt(selectedYear2), parseInt(selectedMonth2));
          setDataComparativa(res2);
        }

        // C. Cargar Historico (Rango Loop)
        if (activeTab === "HISTORICO" && selectedMonth && selectedYear && selectedMonth2 && selectedYear2 && searchTerm && searchTorre) {
          // Logic: Min/Max dates
          const date1 = parseInt(selectedYear) * 12 + parseInt(selectedMonth);
          const date2 = parseInt(selectedYear2) * 12 + parseInt(selectedMonth2);
          const startVal = Math.min(date1, date2);
          const endVal = Math.max(date1, date2);

          const periodsInRange = periodosRaw.filter(p => {
            const pVal = p.anio_end * 12 + p.mes_end;
            return pVal >= startVal && pVal <= endVal;
          }).sort((a, b) => a.anio_end - b.anio_end || a.mes_end - b.mes_end);

          const historyData = await Promise.all(periodsInRange.map(async (p) => {
            try {
              const details = await window.api.periodo.getConsumoDetallado(p.anio_end, p.mes_end);
              const aptoData = details.find(d =>
                d.apto?.toString().toLowerCase().trim() === searchTerm.toString().toLowerCase().trim() &&
                d.torre?.toString().toLowerCase().trim() === searchTorre.toString().toLowerCase().trim()
              );
              return {
                period: `${monthNames[p.mes_end - 1]} ${p.anio_end}`,
                ...aptoData
              };
            } catch (e) { return null; }
          }));
          setDataHistorica(historyData.filter(d => d && d.apto));
        } else if (activeTab === "HISTORICO") {
          setDataHistorica([]);
        }

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, selectedYear, selectedMonth2, selectedYear2, activeTab, searchTerm, searchTorre, periodosRaw]);

  // 3. Generar PDF (Reactivo a datos)
  useEffect(() => {
    if (loading) return;
    // Debounce small delay to ensure state settling? Not strictly needed if useEffect dep is correct.
    // Call generation based on activeTab
    if (activeTab === "GENERAL" && dataPrincipal.length > 0) generateGeneralPDF();
    else if (activeTab === "HISTORICO" && dataHistorica.length > 0) generateHistoricPDF();
    else if (activeTab === "COMPARACION" && dataPrincipal.length > 0 && dataComparativa.length > 0) generateComparisonPDF();
    else setPdfUrl(null); // Clear PDF if conditions not met
  }, [dataPrincipal, dataHistorica, dataComparativa, activeTab, loading, searchTerm, searchTorre]); // Trigger on data update

  // --- PDF GENERATORS ---

  const generateGeneralPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth(); // 210

    // Filter Data Logic (Same as Dashboard Display)
    const filteredData = dataPrincipal.filter(d => {
      const matchTorre = (searchTorre && searchTorre !== "TODOS") ? d.torre?.toLowerCase().includes(searchTorre.toLowerCase()) : true;
      const matchApto = (searchTerm && searchTerm !== "TODOS") ? d.apto?.toString().toLowerCase().includes(searchTerm.toLowerCase()) : true;
      return matchTorre && matchApto;
    });

    if (filteredData.length === 0) { setPdfUrl(null); return; }

    // Header
    doc.setFillColor(42, 55, 70);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255);
    doc.setFontSize(22);
    doc.text("EDIFICIO CALLEJA RESORT", 15, 25);
    doc.setFontSize(10);
    doc.text(`INFORME GENERAL - ${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`, 15, 32);

    // Columns
    const tableColumn = ["Torre", "Apto", "Lectura (m3)", "Agua (m3)", "Agua ($)", "Gas (m3)", "Gas ($)", "Total ($)"];
    const tableRows = filteredData.map(row => [
      row.torre, row.apto,
      row.agua_lectura, row.agua_m3, `$${row.agua_valor?.toLocaleString()}`,
      row.gas_m3, `$${row.gas_valor?.toLocaleString()}`, `$${row.total_valor?.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 50,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [42, 55, 70] },
      styles: { fontSize: 8, halign: 'center' }
    });

    setPdfUrl(URL.createObjectURL(doc.output('blob')));
  };

  const generateHistoricPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    if (dataHistorica.length === 0) { setPdfUrl(null); return; }

    // Header
    doc.setFillColor(42, 55, 70);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255);
    doc.setFontSize(18);
    doc.text(`HISTORIAL: TORRE ${searchTorre} - APTO ${searchTerm}`, 15, 25);
    doc.setFontSize(10);
    doc.text(`Rango: ${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear} - ${monthNames[parseInt(selectedMonth2) - 1]} ${selectedYear2}`, 15, 32);

    // Columns
    const tableColumn = ["Periodo", "Lectura", "Agua (m3)", "Agua ($)", "Gas (m3)", "Gas ($)", "Total ($)"];
    const tableRows = dataHistorica.map(row => [
      row.period,
      row.agua_lectura, row.agua_m3?.toFixed(2), `$${row.agua_valor?.toLocaleString()}`,
      row.gas_m3?.toFixed(2), `$${row.gas_valor?.toLocaleString()}`, `$${row.total_valor?.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 50,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] }, // Orange for History
      styles: { fontSize: 8, halign: 'center' }
    });

    setPdfUrl(URL.createObjectURL(doc.output('blob')));
  };

  const generateComparisonPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Filter logic (same as Dashboard logic would apply)
    const filteredData = dataPrincipal.filter(d => {
      const matchTorre = (searchTorre && searchTorre !== "TODOS") ? d.torre?.toLowerCase().includes(searchTorre.toLowerCase()) : true;
      const matchApto = (searchTerm && searchTerm !== "TODOS") ? d.apto?.toString().toLowerCase().includes(searchTerm.toLowerCase()) : true;
      return matchTorre && matchApto;
    });

    if (filteredData.length === 0) { setPdfUrl(null); return; }

    // Header
    doc.setFillColor(42, 55, 70);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255);
    doc.setFontSize(18);
    doc.text(`COMPARATIVO PERIODO`, 15, 20);
    doc.setFontSize(10);
    doc.text(`${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear} (Base) VS ${monthNames[parseInt(selectedMonth2) - 1]} ${selectedYear2} (Previo)`, 15, 30);

    // Columns - Complex
    // Layout: Apto | Agua P1 | Agua P2 | Diff | Total P1 | Total P2 | Diff
    const tableColumn = ["Apto", "Agua P1", "Agua P2", "Gas P1", "Gas P2", "Total P1", "Total P2", "Diff $"];
    const tableRows = filteredData.map(row => {
      const comp = dataComparativa.find(c => c.apto_id === row.apto_id) || {};
      const diffTotal = (row.total_valor || 0) - (comp.total_valor || 0);
      return [
        `${row.torre} ${row.apto}`,
        row.agua_m3?.toFixed(1), comp.agua_m3?.toFixed(1) || '-',
        row.gas_m3?.toFixed(1), comp.gas_m3?.toFixed(1) || '-',
        `$${row.total_valor?.toLocaleString()}`, `$${comp.total_valor?.toLocaleString() || 0}`,
        `$${diffTotal.toLocaleString()}`
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }, // Emerald for Comparison
      styles: { fontSize: 8, halign: 'center' }
    });

    setPdfUrl(URL.createObjectURL(doc.output('blob')));
  };


  // Helpers
  const availableYears = [...new Set(periodosRaw.map(p => p.anio_end))].sort((a, b) => b - a);
  const getMonthsForYear = (year) => {
    return periodosRaw
      .filter(p => p.anio_end.toString() === year.toString())
      .map(p => ({ val: p.mes_end, name: monthNames[p.mes_end - 1] }))
      .sort((a, b) => b.val - a.val);
  };
  const uniqueTowers = ["TODOS", ...[...new Set(dataPrincipal.map(d => d.torre))].sort()];
  const uniqueAptos = ["TODOS", ...[...new Set(dataPrincipal.map(d => d.apto))].sort()];

  return (
    <div className="flex h-screen bg-sidebar-bg">
      <SideBar menubar={menu} setMenubar={setMenu} />
      <ToastContainer />

      <div className="page-container overflow-y-auto scroll-container">

        {/* HEADER OSCURO CON FILTROS */}
        <div className="bg-header-bg p-10 rounded-[2.5rem] shadow-premium mb-12 relative">
          <div className="flex items-start justify-between mb-12">
            <div className="flex items-center gap-8">
              {!menu && (
                <button onClick={() => setMenu(true)} className="hover:scale-110 transition-transform">
                  <Bars3Icon className="w-14 h-14 text-white/80" />
                </button>
              )}
              <Button variant="icon" icon={ArrowLeftIcon} onClick={() => navigate("/")} className="p-3" />

              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-white/40 tracking-[0.2em] uppercase">Generación de informes</span>
                <h1 className="text-5xl font-display text-white tracking-tight uppercase">
                  Gestión <span className="text-sidebar-bg/40 font-bold">de Reportes</span>
                </h1>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <img src={Logo} alt="Logo" className="w-24 h-auto" />
              <span className="text-[10px] font-black text-white tracking-[0.4em] mt-2 uppercase">Edificio Calleja</span>
            </div>
          </div>

          <DashboardFilters
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedTorre={""}
            setSelectedTorre={() => { }}
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

        {/* VISOR PDF */}
        <div className="pb-10 flex-1 flex flex-col h-[800px]">
          <div className="bg-[#525659] flex-1 rounded-3xl overflow-hidden shadow-premium relative border-8 border-white h-full">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-sidebar-bg/80 backdrop-blur-md z-20">
                <div className="w-12 h-12 border-3 border-accent/20 border-t-accent rounded-full animate-spin mb-6"></div>
                <span className="text-white font-black tracking-[0.3em] uppercase text-xs">Generando Reporte...</span>
              </div>
            ) : pdfUrl ? (
              <iframe src={pdfUrl} className="w-full h-full" title="Report Preview"></iframe>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/10 p-20 text-center">
                <div className="p-10 bg-white/5 rounded-full mb-8">
                  <DocumentArrowDownIcon className="w-24 h-24" />
                </div>
                <span className="text-2xl font-black uppercase tracking-[0.1em] leading-relaxed">
                  {activeTab === "HISTORICO" ? "Seleccione Torre y Apto" : "Seleccione los filtros para visualizar"}
                </span>
              </div>
            )}
          </div>

          {/* ACCIONES */}
          {pdfUrl && !loading && (
            <div className="mt-8 flex justify-end gap-5">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = pdfUrl;
                  link.download = `Reporte_${activeTab}_${selectedMonth}_${selectedYear}.pdf`;
                  link.click();
                }}
                className="flex items-center gap-4 px-10 py-5 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Descargar Rep.
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}