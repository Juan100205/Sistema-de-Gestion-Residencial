import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
    ArrowUpTrayIcon,
    TrashIcon,
    CalculatorIcon,
    CheckCircleIcon,
    PlusCircleIcon
} from "@heroicons/react/16/solid";
import { toast } from "react-toastify";

export default function ExcelImporter({ onDataCalculated }) {
    const [file, setFile] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Selection States
    const [startDay, setStartDay] = useState("");
    const [startMonth, setStartMonth] = useState("");
    const [startYear, setStartYear] = useState("");

    const [endDay, setEndDay] = useState("");
    const [endMonth, setEndMonth] = useState("");
    const [endYear, setEndYear] = useState("");

    const handleFile = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setLoading(true);
            const reader = new FileReader();
            reader.onload = (evt) => {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: "array" });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws);

                // Normalize keys and Parse Dates
                const parsedData = jsonData.map(row => {
                    const newRow = {};
                    Object.keys(row).forEach(k => {
                        newRow[k.trim().toUpperCase()] = row[k];
                    });

                    // Create Date Object
                    const d = parseInt(newRow['DIA'] || 0);
                    const m = parseInt(newRow['MES'] || 0);
                    const y = parseInt(newRow['AÑO'] || newRow['ANIO'] || 0);

                    if (d && m && y) {
                        newRow._date = new Date(y, m - 1, d).getTime(); // Timestamp for easier sorting/calc
                    } else {
                        newRow._date = null;
                    }

                    return newRow;
                }).filter(r => r._date !== null).sort((a, b) => a._date - b._date);

                setData(parsedData);
                setFile(selected);
                setLoading(false);
            };
            reader.readAsArrayBuffer(selected);
        }
    };

    const calculateConsumptions = () => {
        if (!data.length) {
            toast.warn("Primero debe cargar un archivo Excel.");
            return;
        }

        const sD = parseInt(startDay);
        const sM = parseInt(startMonth);
        const sY = parseInt(startYear);
        const eD = parseInt(endDay);
        const eM = parseInt(endMonth);
        const eY = parseInt(endYear);

        if (!sD || !sM || !sY || !eD || !eM || !eY) {
            toast.error("Por favor ingrese fechas válidas.");
            return;
        }

        const startDate = new Date(sY, sM - 1, sD).getTime();
        const endDate = new Date(eY, eM - 1, eD).getTime();

        if (endDate <= startDate) {
            toast.warning("La fecha final debe ser posterior a la inicial.");
            return;
        }

        // Interpolator Function
        const interpolateKey = (targetTimestamp, key) => {
            // 1. Exact Match
            const exact = data.find(r => r._date === targetTimestamp);
            if (exact) return parseFloat(exact[key] || 0);

            // 2. Find Neighbors
            const nextIdx = data.findIndex(r => r._date > targetTimestamp);

            // CASE A: Before first record -> Use First (Clamp)
            if (nextIdx === 0) {
                return parseFloat(data[0][key] || 0);
            }

            // CASE B: After last record -> Use Last (Clamp)
            if (nextIdx === -1) {
                return parseFloat(data[data.length - 1][key] || 0);
            }

            // CASE C: Between prevIdx and nextIdx -> Linear Interpolate
            const prevIdx = nextIdx - 1;
            const prevRow = data[prevIdx];
            const nextRow = data[nextIdx];

            const t = targetTimestamp;
            const t1 = prevRow._date;
            const t2 = nextRow._date;
            const y1 = parseFloat(prevRow[key] || 0);
            const y2 = parseFloat(nextRow[key] || 0);

            if (t2 === t1) return y1;

            return y1 + (y2 - y1) * (t - t1) / (t2 - t1);
        };

        // Calculate Readings
        const keys = {
            eeab: 'MEDIDOR RED AGUA EEAB',
            comunes: 'MEDIDOR AGUA ZONAS COMUNES M3',
            gas_humedas: 'MEDIDOR GAS ZONAS HUMEDAS M3'
        };

        const getDiff = (key) => {
            // Check if key exists in data to avoid NaN if column missing
            // (interpolator assumes 0 if missing, which is safe)
            const valStart = interpolateKey(startDate, key);
            const valEnd = interpolateKey(endDate, key);
            return Math.max(0, (valEnd - valStart).toFixed(2));
        };

        const consumptions = {
            agua_m3_eeab: getDiff(keys.eeab),
            agua_m3_comunes: getDiff(keys.comunes),
            gas_m3_zonas_humedas: getDiff(keys.gas_humedas)
        };

        toast.success("Cálculo interpolado realizado exitosamente.");
        if (onDataCalculated) {
            onDataCalculated(consumptions);
        }
    };

    const inputClass = "w-14 text-center p-2 rounded-lg bg-gray-50 border border-gray-100 text-[10px] font-black focus:outline-none focus:border-accent/50 focus:bg-white transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-300";

    return (
        <>
            {/* CONTROLES */}
            <div className="bg-white rounded-3xl shadow-premium p-6 mb-8 border border-black/5">
                <div className="flex flex-wrap items-center justify-between gap-6">

                    {/* FILE SELECTOR */}
                    <div className="relative">
                        <label
                            className={`flex items-center gap-3 px-6 py-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-lg font-bold text-xs uppercase tracking-widest
                            ${file ? "bg-green-600 text-white" : "bg-sidebar-bg text-white"}`}
                        >
                            {file ? <CheckCircleIcon className="w-5 h-5" /> : <PlusCircleIcon className="w-5 h-5" />}
                            {file ? "Archivo Cargado" : "Seleccionar Excel"}
                            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFile} />
                        </label>
                    </div>

                    {/* DATE INPUTS */}
                    <div className="flex items-center gap-4 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 px-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-1">Inicio</span>
                            <div className="flex gap-1">
                                <input type="number" placeholder="DD" className={inputClass} value={startDay} onChange={e => setStartDay(e.target.value)} />
                                <input type="number" placeholder="MM" className={inputClass} value={startMonth} onChange={e => setStartMonth(e.target.value)} />
                                <input type="number" placeholder="AAAA" className={inputClass} value={startYear} onChange={e => setStartYear(e.target.value)} />
                            </div>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="flex items-center gap-2 px-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-1">Fin</span>
                            <div className="flex gap-1">
                                <input type="number" placeholder="DD" className={inputClass} value={endDay} onChange={e => setEndDay(e.target.value)} />
                                <input type="number" placeholder="MM" className={inputClass} value={endMonth} onChange={e => setEndMonth(e.target.value)} />
                                <input type="number" placeholder="AAAA" className={inputClass} value={endYear} onChange={e => setEndYear(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* CALCULATE BUTTON */}
                    <button
                        onClick={calculateConsumptions}
                        className="flex items-center gap-3 px-10 py-4 bg-accent text-white rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg font-bold text-xs uppercase tracking-widest ml-auto"
                    >
                        <CalculatorIcon className="w-5 h-5" />
                        Calcular
                    </button>

                </div>
            </div>

            {/* PREVIEW AREA */}
            <div className="bg-white rounded-3xl shadow-premium border border-black/5 overflow-hidden h-[400px] flex flex-col mb-8">
                {data.length > 0 ? (
                    <div className="overflow-auto scroll-container flex-1">
                        <table className="min-w-full divide-y divide-black/[0.03]">
                            <thead className="bg-sidebar-bg sticky top-0 z-20">
                                <tr>
                                    {Object.keys(data[0]).filter(k => k !== '_date').map(key => (
                                        <th key={key} className="px-6 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest border-x border-white/5 whitespace-nowrap">
                                            {key}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-black/[0.03]">
                                {data.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-main-bg/20 transition-colors">
                                        {Object.keys(row).filter(k => k !== '_date').map(key => (
                                            <td key={key} className="px-4 py-3 text-center text-xs font-medium text-sidebar-bg whitespace-nowrap border-r border-black/[0.03]">
                                                {row[key]}
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
                            <p className="text-sidebar-bg font-black tracking-widest uppercase">Esperando Importación</p>
                            <p className="text-sidebar-bg/60 text-xs">Cargue un archivo Excel para visualizar los datos</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
