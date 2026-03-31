import React, { useEffect, useState } from "react";
import SideBar from "../Components/Global/Sidebar";
import * as XLSX from "xlsx";
import { UserCircleIcon, ArrowLeftIcon, HomeIcon, Bars3Icon } from "@heroicons/react/24/solid";
import { ArrowUpTrayIcon, BookmarkIcon, CheckCircleIcon, PencilIcon, PlusCircleIcon } from "@heroicons/react/16/solid";
import { useNavigate } from "react-router-dom";
import Logo from '../../assets/Logo.png';

export default function Upload() {
  const [excelFile, setExcelFile] = useState(null);
  const [typeError, setTypeError] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [menu, setMenu] = useState(false);
  const [editingCell, setEditingCell] = useState({ row: null, field: null });
  const navigate = useNavigate();

  // Manejo de archivo Excel
  const handleFile = (e) => {
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    const selectedFile = e.target.files[0];

    if (selectedFile) {
      if (validTypes.includes(selectedFile.type)) {
        setTypeError(null);
        setExcelFile(selectedFile);
      } else {
        setTypeError("Por favor seleccione un archivo Excel válido");
        setExcelFile(null);
      }
    }
  };

  // Importar Excel y mapear a estado
  const handleImportExcel = () => {
    if (!excelFile) {
      alert("Primero seleccione un archivo Excel.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // Redondear valores numéricos y limpiar strings
      const mapped = jsonData.map((row) => {
        const newRow = {};

        // Primero mapeamos lo que venga del Excel
        Object.keys(row).forEach((key) => {
          const trimmedKey = key.trim();
          const value = row[key];
          newRow[trimmedKey] = typeof value === "number" ? Math.round(value) : value?.toString().trim() || "";
        });

        return newRow;
      });

      setExcelData(mapped);
    };
    reader.readAsArrayBuffer(excelFile);
  };

  // Editar celda
  const updateCell = (rowIndex, field, value) => {
    const updated = [...excelData];
    updated[rowIndex][field] = value;
    setExcelData(updated);
  };

  // Cerrar menú con Escape
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);


  const handleSaveToDB = async () => {
    if (!excelData.length) {
      alert("No hay datos para guardar.");
      return;
    }

    console.log('🟡 Iniciando guardado, datos:', excelData.length, 'filas');

    try {
      console.log('🟡 Llamando a window.api.excel.saveData...');
      const result = await window.api.excel.saveData(excelData);
      console.log('🟡 Resultado recibido:', result);

      if (result.success) {
        alert("Datos guardados correctamente en la base de datos.");
      } else {
        alert("Error al guardar los datos: " + (result.message || result.error || "Error desconocido"));
      }
    } catch (err) {
      console.error('🔴 Error en handleSaveToDB:', err);
      alert("Error al guardar los datos en la base de datos.");
    }
  };

  return (
    <div className="flex h-screen bg-sidebar-bg">
      <SideBar menubar={menu} setMenubar={setMenu} />

      <div className={`page-container overflow-y-auto scroll-container ${menu ? "w-7/8" : "w-full"}`}>

        {/* HEADER */}
        <div className="w-full flex items-center justify-between section-gap">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setMenu(true)}
              className={`hover:scale-110 transition-transform duration-200 cursor-pointer ${menu ? "invisible" : "flex"}`}
            >
              <Bars3Icon className="w-14 h-14 text-sidebar-bg opacity-80" />
            </button>
            <button onClick={() => navigate("/Tables")} className="hover:scale-110 transition-transform bg-sidebar-bg p-3 rounded-full shadow-lg">
              <ArrowLeftIcon className="w-8 h-8 text-white" />
            </button>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-sidebar-bg/40 tracking-[0.2em] uppercase">Configuración de datos</span>
              <h1 className="text-5xl font-display text-text-primary tracking-tight uppercase">
                Subir <span className="text-accent font-bold">Tablas</span>
              </h1>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <img src={Logo} alt="Logo" className="w-24 h-auto" />
            <span className="text-[10px] font-black text-sidebar-bg tracking-[0.3em] mt-2 uppercase">Edificio Calleja</span>
          </div>
        </div>

        {/* CONTROLES */}
        <div className="bg-white rounded-3xl shadow-premium p-6 mb-8 border border-black/5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <label
                htmlFor="fileUpload"
                className={`flex items-center gap-3 px-6 py-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-lg font-bold text-xs uppercase tracking-widest
                  ${excelFile ? "bg-green-600 text-white" : "bg-sidebar-bg text-white"}`}
              >
                {excelFile ? <CheckCircleIcon className="w-5 h-5" /> : <PlusCircleIcon className="w-5 h-5" />}
                {excelFile ? "Archivo Listo" : "Seleccionar Archivo"}
              </label>
              <input id="fileUpload" type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
            </div>

            <button onClick={handleImportExcel} className="flex items-center gap-3 px-6 py-4 bg-white border border-sidebar-bg/10 rounded-xl hover:bg-main-bg/50 hover:scale-[1.02] active:scale-95 transition-all shadow-sm font-bold text-xs uppercase tracking-widest text-sidebar-bg">
              <ArrowUpTrayIcon className="w-5 h-5 text-accent" />
              Previsualizar
            </button>


            <button onClick={handleSaveToDB} className="flex items-center gap-3 px-6 py-4 bg-accent text-white rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg font-bold text-xs uppercase tracking-widest">
              <BookmarkIcon className="w-5 h-5" />
              Guardar en DB
            </button>

            {typeError && <div className="text-red-500 font-bold text-xs px-4 animate-pulse">{typeError}</div>}
          </div>
        </div>

        {/* TABLA PREVISUALIZACIÓN */}
        <div className="bg-white rounded-3xl shadow-premium border border-black/5 overflow-hidden h-[500px] flex flex-col">
          {excelData.length ? (
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
                      {Object.keys(row).map((field, i) => {
                        const isEmpty = !row[field];
                        return (
                          <td key={i} className={`px-4 py-3 text-center text-xs font-medium text-sidebar-bg transition-colors ${isEmpty ? "bg-red-50/50" : ""}`}>
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
                                className={`flex items-center justify-center gap-2 cursor-pointer group/cell py-1 px-2 rounded hover:bg-white transition-all shadow-sm hover:shadow ${isEmpty ? "text-red-600 italic font-bold" : ""}`}
                                onClick={() => setEditingCell({ row: rowIndex, field })}
                              >
                                {row[field] || "Vacío"}
                                <PencilIcon className="w-3 h-3 text-accent opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </td>
                        );
                      })}
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
                <p className="text-sidebar-bg font-black tracking-widest uppercase">Esperando Importación</p>
                <p className="text-sidebar-bg/60 text-xs">Cargue un archivo para ver la previsualización</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
