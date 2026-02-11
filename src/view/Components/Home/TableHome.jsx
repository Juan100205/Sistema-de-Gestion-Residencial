/**
 * Componente TableHome
 * Muestra un panel interactivo con:
 * - Filtros por Torre / Apartamento / General
 * - Cambios de mes o año
 * - Navegación entre torres y apartamentos
 * - Una tabla con valores simulados de Agua y Gas
 */

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import React, { useState, useMemo, useEffect } from "react";

/* Lista de meses para mostrar el nombre */
const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function TableHome() {
  const [loading, setLoading] = useState(true);
  const [periodos, setPeriodos] = useState([]);
  const [torres, setTorres] = useState([]);
  const [apartamentos, setApartamentos] = useState([]);
  const [tableData, setTableData] = useState([]);

  /* Mantenemos solo modo mensual por petición */
  const [subject, setSubject] = useState("torres");
  const [editingApto, setEditingApto] = useState(false);

  /* Año y mes actual mostrados en el panel */
  const [period, setPeriod] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  /* Torre y Apto seleccionados */
  const [selectedTorreId, setSelectedTorreId] = useState("");
  const [selectedAptoId, setSelectedAptoId] = useState("");

  // 1. Cargar Catálogos Iniciales
  useEffect(() => {
    const init = async () => {
      try {
        const [pRes, tRes, aRes] = await Promise.all([
          window.api.periodo.getAll(),
          window.api.export.getTorres(),
          window.api.export.getApartamentos()
        ]);
        setPeriodos(pRes);
        setTorres(tRes);
        setApartamentos(aRes);

        // Seleccionar por defecto
        if (tRes.length > 0) {
          const firstTorreId = tRes[0].id;
          setSelectedTorreId(firstTorreId);

          // Buscar primer apto de esa torre
          const firstApto = aRes.find(a => a.torre_id == firstTorreId);
          if (firstApto) setSelectedAptoId(firstApto.id);
        }

        const ultimo = [...pRes].sort((a, b) => b.anio_end - a.anio_end || b.mes_end - a.mes_end)[0];
        if (ultimo) {
          setPeriod({ year: ultimo.anio_end, month: ultimo.mes_end });
        }
      } catch (err) {
        console.error("Error init TableHome:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // 2. Cargar Datos de la Tabla cuando cambien filtros
  useEffect(() => {
    const loadData = async () => {
      try {
        if (subject === "apartamentos") {
          if (!selectedAptoId) {
            setTableData([]);
            return;
          }
          const history = await window.api.export.getApartmentHistory({ aptoId: selectedAptoId });
          setTableData(history || []);
        } else if (subject === "general") {
          const allData = await window.api.export.getAllData();
          setTableData(allData || []);
        } else {
          if (!period.year || !period.month) return;
          const data = await window.api.export.getReportData({
            anio: period.year,
            mes: period.month,
            filters: {
              torreId: selectedTorreId || null,
              aptoId: null // No filtramos por apto en vista torre
            }
          });
          setTableData(data || []);
        }
      } catch (err) {
        console.error("Error loading table data:", err);
      }
    };
    loadData();
  }, [period, selectedTorreId, selectedAptoId, subject]);

  const currentTorreObj = torres.find(t => t.id == selectedTorreId);
  const currentAptoObj = apartamentos.find(a => a.id == selectedAptoId);
  const aptosFiltrados = selectedTorreId
    ? apartamentos.filter(a => a.torre_id == selectedTorreId)
    : apartamentos;

  // ----------------------
  // FUNCIONES HELPER
  // ----------------------

  /**
   * Permite navegar cíclicamente en un arreglo.
   * Ejemplo:
   * Si estoy en "B" y doy next → "C"
   * Si estoy en "C" y doy next → regresa a "A"
   */
  const cycle = (array, current, direction) => {
    const index = array.indexOf(current);
    const next =
      direction === "prev"
        ? (index === 0 ? array.length - 1 : index - 1)
        : (index === array.length - 1 ? 0 : index + 1);
    return array[next];
  };

  /**
   * Cambia el periodo dependiendo si estamos en mensual o anual.
   * Mensual: ajusta mes y año según corresponda
   * Anual: solo suma o resta 1 año
   */
  const changePeriod = (dir) => {
    setPeriod(prev => {
      // Navegación mensual simplificada
      let newMonth = prev.month + (dir === "next" ? 1 : -1);
      let newYear = prev.year;

      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }

      return { year: newYear, month: newMonth };
    });
  };

  // ----------------------
  // RENDER UI PRINCIPAL
  // ----------------------
  return (
    <div className="xl:w-full">

      {/* ------------------------------------
          TABS DE SELECCIÓN (Torres / Aptos / General)
      ------------------------------------ */}
      <div className="gap-2 flex">
        {["torres", "apartamentos", "general"].map(item => (
          <button
            key={item}
            onClick={() => setSubject(item)}
            className={`
              h-15 px-8 rounded-4xl cursor-pointer transition-all duration-300
              ${subject === item
                ? "bg-[#C2AA92] text-white shadow-lg scale-105"
                : "bg-white text-black hover:shadow-lg hover:scale-105"}
            `}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {/* ------------------------------------
          CONTENEDOR PRINCIPAL DEL PANEL
      ------------------------------------ */}
      <div className="bg-white rounded-xl mt-5 p-5 w-full h-89 flex flex-col">

        {/* ------------------------------
            CONTROLES SUPERIORES
        ------------------------------ */}
        <div className="flex items-center gap-3 mb-5 justify-between">

          {/* ------------------ PERIODO ------------------ */}
          {subject !== "apartamentos" && subject !== "general" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => changePeriod("prev")}
                className="px-2 py-2 border border-[#C2AA92] text-[#C2AA92] rounded-full text-sm hover:shadow-lg hover:scale-105 transition-all"
              >
                <ChevronLeftIcon className="w-5" />
              </button>
              <div className="text-[#C2AA92] text-sm font-semibold">
                {`${monthNames[period.month - 1]} ${period.year}`}
              </div>
              <button
                onClick={() => changePeriod("next")}
                className="px-2 py-2 border border-[#C2AA92] text-[#C2AA92] rounded-full text-sm hover:shadow-lg hover:scale-105 transition-all"
              >
                <ChevronRightIcon className="w-5" />
              </button>
            </div>
          )}

          {/* ------------------ TORRES ------------------ */}
          {(subject === "torres" || subject === "apartamentos") && (
            <div className="flex items-center gap-2">
              <select
                value={selectedTorreId}
                onChange={(e) => {
                  const newTorreId = e.target.value;
                  setSelectedTorreId(newTorreId);
                  // Seleccionar el primer apto de la nueva torre automáticamente
                  const firstApto = apartamentos.find(a => a.torre_id == newTorreId);
                  setSelectedAptoId(firstApto ? firstApto.id : "");
                }}
                className="bg-white border border-[#C2AA92] text-[#C2AA92] px-4 py-2 rounded-full text-sm font-bold outline-none shadow-sm"
              >
                <option value="">Todas las Torres</option>
                {torres.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
          )}

          {/* ------------------ APARTAMENTOS ------------------ */}
          {subject === "apartamentos" && (
            <div className="flex items-center gap-2">
              <select
                value={selectedAptoId}
                onChange={(e) => setSelectedAptoId(e.target.value)}
                className="bg-white border border-[#C2AA92] text-[#C2AA92] px-4 py-2 rounded-full text-sm font-bold outline-none shadow-sm"
              >
                <option value="">Cualquier Apto</option>
                {aptosFiltrados.map(a => <option key={a.id} value={a.id}>Apto {a.numero}</option>)}
              </select>
            </div>
          )}



        </div>

        {/* ------------------------------------
            TABLA DE DATOS
        ------------------------------------ */}
        <div className="rounded-xl overflow-auto h-60 mt-2">
          <table className="w-full text-left text-sm">

            {/* ENCABEZADOS */}
            <thead className="bg-[#A5A29D] text-gray-700">
              <tr>
                {subject === "apartamentos" ? (
                  <>
                    <th className="px-4 py-2">Mes</th>
                    <th className="px-4 py-2">Año</th>
                    <th className="px-4 py-2">Agua ($)</th>
                    <th className="px-4 py-2">Gas ($)</th>
                  </>
                ) : subject === "general" ? (
                  <>
                    <th className="px-4 py-2">Mes</th>
                    <th className="px-4 py-2">Año</th>
                    <th className="px-4 py-2">Torre</th>
                    <th className="px-4 py-2">Apto</th>
                    <th className="px-4 py-2">Agua ($)</th>
                    <th className="px-4 py-2">Gas ($)</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-2">Torre</th>
                    <th className="px-4 py-2">Apto</th>
                    <th className="px-4 py-2">Agua ($)</th>
                    <th className="px-4 py-2">Gas ($)</th>
                  </>
                )}
              </tr>
            </thead>

            {/* CUERPO DE LA TABLA */}
            <tbody className="bg-[#E1DDD9]">
              {loading ? (
                <tr><td colSpan="4" className="text-center py-10 opacity-50 uppercase font-black">Cargando datos...</td></tr>
              ) : tableData.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-10 opacity-50 uppercase font-black">No hay consumos en este periodo</td></tr>
              ) : (
                tableData.map((row, i) => (
                  <tr key={i} className="border-b border-black/5 hover:bg-white/40 transition-colors">
                    {subject === "apartamentos" ? (
                      <>
                        <td className="px-4 py-2 font-bold">{monthNames[row.mes - 1]}</td>
                        <td className="px-4 py-2 opacity-70">{row.anio}</td>
                      </>
                    ) : subject === "general" ? (
                      <>
                        <td className="px-4 py-2 font-bold">{monthNames[row.mes - 1]}</td>
                        <td className="px-4 py-2 opacity-70">{row.anio}</td>
                        <td className="px-4 py-2 font-bold">{row.torre}</td>
                        <td className="px-4 py-2">{row.apto}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 font-bold">{row.torre}</td>
                        <td className="px-4 py-2">{row.apto}</td>
                      </>
                    )}
                    <td className="px-4 py-2 text-blue-600 font-medium">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(row.agua_valor)}
                    </td>
                    <td className="px-4 py-2 text-orange-600 font-medium">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(row.gas_valor)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>

      </div>
    </div>
  );
}
