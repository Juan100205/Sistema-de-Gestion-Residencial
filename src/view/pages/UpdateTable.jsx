import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import SideBar from "../Components/Global/Sidebar";
import * as XLSX from "xlsx";
import {
  UserCircleIcon,
  HomeIcon,
  ArrowUpTrayIcon,
  BookmarkIcon,
  CheckCircleIcon,
  PencilIcon,
  PlusCircleIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function UpdateTable() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const periodoId = searchParams.get("id");
  const anio = searchParams.get("anio");
  const mes = searchParams.get("mes");

  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [menu, setMenu] = useState(false);
  const [editingCell, setEditingCell] = useState({ row: null, field: null });
  const [isSaving, setIsSaving] = useState(false);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Manejo de archivo Excel
  const handleFile = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setExcelFile(selectedFile);
      toast.info("Archivo seleccionado: " + selectedFile.name);
    }
  };

  // Importar Excel y mapear a estado
  const handleImportExcel = () => {
    if (!excelFile) {
      toast.warn("Primero seleccione un archivo Excel.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      if (jsonData.length === 0) {
        toast.error("El archivo está vacío.");
        return;
      }

      // VALIDACIÓN INICIAL DE FECHA (Mismo mes y año)
      const firstRow = jsonData[0];
      const getVal = (row, keys) => {
        for (let k of keys) {
          const found = Object.keys(row).find(rk => rk.toLowerCase().includes(k));
          if (found) return row[found];
        }
        return null;
      };

      const excelAnio = parseInt(getVal(firstRow, ['ano', 'año', 'anio', 'year']));
      const excelMes = parseInt(getVal(firstRow, ['mes', 'month']));

      if (excelAnio !== parseInt(anio) || excelMes !== parseInt(mes)) {
        toast.error(`Error de Fecha: El Excel es de ${excelMes}/${excelAnio}, pero el periodo seleccionado es ${mes}/${anio}.`, {
          autoClose: 10000,
          position: "top-center"
        });
        setExcelFile(null);
        return;
      }

      setExcelData(jsonData);
      toast.success(`Datos cargados: ${jsonData.length} filas encontradas.`);
    };
    reader.readAsArrayBuffer(excelFile);
  };

  const updateCell = (rowIndex, field, value) => {
    const updated = [...excelData];
    updated[rowIndex][field] = value;
    setExcelData(updated);
  };

  const handleSaveToDB = async () => {
    if (!excelData.length) {
      toast.warn("No hay datos para guardar.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await window.api.excel.updateData({
        periodo_id: parseInt(periodoId),
        rows: excelData
      });

      if (result.success) {
        toast.success(`¡Éxito! Se han actualizado ${result.updated} registros correctamente.`, {
          position: "top-center"
        });
        setTimeout(() => navigate("/Update"), 2000);
      } else {
        toast.error("Error: " + result.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error crítico al actualizar la base de datos.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-sidebar-bg">
      <SideBar menubar={menu} setMenubar={setMenu} />
      <ToastContainer />

      <div className={`page-container overflow-y-auto scroll-container ${menu ? "w-7/8" : "w-full"}`}>

        {/* HEADER OSCURO */}
        <div className="bg-header-bg p-8 rounded-3xl shadow-premium mb-8 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate("/Update")}
                className="hover:scale-110 transition-transform bg-sidebar-bg p-2.5 rounded-full shadow-lg"
              >
                <ArrowLeftIcon className="w-6 h-6 text-white" />
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white/40 tracking-widest uppercase mb-1">Actualizando periodo</span>
                <h1 className="text-4xl font-display text-white tracking-tight uppercase">
                  {monthNames[parseInt(mes) - 1]} <span className="text-sidebar-bg/40 font-bold">{anio}</span>
                </h1>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <img src="assets/Logo.png" alt="Logo" className="w-20 h-auto" />
              <span className="text-[8px] font-black text-white tracking-[0.3em] mt-1 uppercase">Edificio Calleja</span>
            </div>
          </div>
        </div>

        {/* CONTROLES */}
        <div className="bg-white rounded-3xl shadow-premium p-6 mb-8 border border-black/5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <label
                className={`flex items-center gap-3 px-6 py-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-lg font-bold text-xs uppercase tracking-widest
                  ${excelFile ? "bg-green-600 text-white" : "bg-sidebar-bg text-white"}`}
              >
                {excelFile ? <CheckCircleIcon className="w-5 h-5" /> : <PlusCircleIcon className="w-5 h-5" />}
                {excelFile ? "Listo" : "Cargar Excel"}
                <input type="file" onChange={handleFile} className="hidden" accept=".xlsx,.xls,.csv" />
              </label>
            </div>

            <button onClick={handleImportExcel} className="flex items-center gap-3 px-6 py-4 bg-white border border-sidebar-bg/10 rounded-xl hover:bg-main-bg/50 hover:scale-[1.02] active:scale-95 transition-all shadow-sm font-bold text-xs uppercase tracking-widest text-sidebar-bg">
              <ArrowUpTrayIcon className="w-5 h-5 text-accent" />
              Previsualizar
            </button>

            {excelData.length > 0 && (
              <button
                onClick={handleSaveToDB}
                disabled={isSaving}
                className="ml-auto flex items-center gap-3 px-10 py-4 bg-accent text-white rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg font-bold text-xs uppercase tracking-widest disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <BookmarkIcon className="w-5 h-5" />
                )}
                <span>Sincronizar Datos</span>
              </button>
            )}
          </div>
        </div>

        {/* TABLA PREVISUALIZACIÓN */}
        <div className="bg-white rounded-3xl shadow-premium border border-black/5 overflow-hidden h-[500px] flex flex-col">
          {excelData.length > 0 ? (
            <div className="overflow-auto scroll-container flex-1">
              <table className="min-w-full divide-y divide-black/[0.03]">
                <thead className="bg-sidebar-bg sticky top-0 z-20">
                  <tr>
                    {Object.keys(excelData[0]).map((col, idx) => (
                      <th
                        key={idx}
                        className="px-6 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest border-x border-white/5"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-black/[0.03]">
                  {excelData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-main-bg/20 transition-colors">
                      {Object.keys(row).map((field, i) => (
                        <td key={i} className="px-4 py-3 text-center text-xs font-medium text-sidebar-bg whitespace-nowrap">
                          {editingCell.row === rowIndex && editingCell.field === field ? (
                            <input
                              autoFocus
                              className="border-2 border-accent px-3 py-1.5 rounded-lg w-full text-center focus:outline-none shadow-premium font-bold"
                              value={row[field]}
                              onChange={(e) => updateCell(rowIndex, field, e.target.value)}
                              onBlur={() => setEditingCell({ row: null, field: null })}
                            />
                          ) : (
                            <div
                              className="flex items-center justify-center gap-2 cursor-pointer group/cell py-1 px-2 rounded hover:bg-white transition-all shadow-sm hover:shadow"
                              onClick={() => setEditingCell({ row: rowIndex, field })}
                            >
                              <span>{row[field]}</span>
                              <PencilIcon className="w-3 h-3 text-accent opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-32 gap-6 opacity-20">
              <div className="p-8 bg-main-bg rounded-full">
                <ArrowUpTrayIcon className="w-16 h-16 text-sidebar-bg" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sidebar-bg font-black tracking-widest uppercase">Esperando Archivo</p>
                <p className="text-sidebar-bg/60 text-xs">Cargue el archivo Excel de {monthNames[parseInt(mes) - 1]} para sincronizar.</p>
              </div>
            </div>
          )}
        </div>

        {/* MENSAJE DE ADVERTENCIA */}
        {excelData.length > 0 && (
          <div className="mt-8 flex items-start gap-4 p-6 bg-amber-50 rounded-2xl border border-amber-100/50">
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-amber-900 font-bold text-xs uppercase tracking-widest">Aviso de Integridad</span>
              <p className="text-amber-800/70 text-xs font-medium leading-relaxed italic">
                Al sincronizar, se crearán respaldos automáticos en el basurero. Los consumos existentes del periodo <span className="font-bold underline">{monthNames[parseInt(mes) - 1]} {anio}</span> serán reemplazados por los valores del Excel.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
