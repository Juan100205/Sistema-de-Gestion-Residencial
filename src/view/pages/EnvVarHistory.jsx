import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBar from "../Components/Global/Sidebar";
import {
    UserCircleIcon,
    HomeIcon,
    ArrowPathIcon,
    ArrowDownTrayIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    InformationCircleIcon,
    ArrowLeftIcon,
    Bars3Icon
} from "@heroicons/react/24/outline";

// REMOVED EXCEL IMPORTER
import { toast, ToastContainer } from "react-toastify";
import InfoCard from "../Components/EnvVar/InfoCard";
import InputCard from "../Components/EnvVar/InputCard";
import Button from "../Components/Global/Button";
import Logo from '../../assets/Logo.png';

export default function EnvVarHistory() {
    const navigate = useNavigate();
    const [dataLoaded, setDataLoaded] = useState(false);
    const [menu, setMenu] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Datos de periodos para selectores
    const [periodosRaw, setPeriodosRaw] = useState([]);
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [currentPeriodo, setCurrentPeriodo] = useState(null);

    // Valores editables (solo inputs del usuario)
    const [formData, setFormData] = useState({
        precio_m3_agua: 0,
        precio_m3_gas: 0,
        coeficiente_general: 1,
        alertas: 0,
        // Gas: usuario ingresa facturas de torres y m3, se calcula precio
        gas_total_torre_a: 0,
        gas_m3_torre_a: 0,
        gas_total_torre_b: 0,
        gas_m3_torre_b: 0,
        gas_total_torre_c: 0,
        gas_m3_torre_c: 0,
        // gas_m3_comunes REMOVED
        // Agua
        agua_total_residencia: 0,
        agua_m3_total_residencia: 0,
        agua_m3_comunes: 0, // Solo m3, factura se calcula
        agua_m3_torre_a: 0,
        agua_m3_torre_b: 0,
        agua_m3_torre_c: 0,
        agua_m3_eeab: 0,
        gas_m3_zonas_humedas: 0 // Renamed from agua_m3_zonas_humedas
    });

    // Cálculo automático de precio de agua
    const calculatedPrecioAgua = formData.agua_m3_total_residencia > 0
        ? (formData.agua_total_residencia / formData.agua_m3_total_residencia).toFixed(2)
        : 0;

    // Cálculo automático de precio de gas (desde facturas de torres)
    const totalGasValueTorres = formData.gas_total_torre_a + formData.gas_total_torre_b + formData.gas_total_torre_c;
    const totalGasM3Torres = formData.gas_m3_torre_a + formData.gas_m3_torre_b + formData.gas_m3_torre_c;
    const calculatedPrecioGas = totalGasM3Torres > 0
        ? (totalGasValueTorres / totalGasM3Torres).toFixed(2)
        : 0;

    // Cálculos de precio de gas individuales por torre (Legacy references kept for specific cards if needed, but redundant with priceGasA below)
    const calculatedPrecioGasA = formData.gas_m3_torre_a > 0 ? (formData.gas_total_torre_a / formData.gas_m3_torre_a).toFixed(2) : 0;
    const calculatedPrecioGasB = formData.gas_m3_torre_b > 0 ? (formData.gas_total_torre_b / formData.gas_m3_torre_b).toFixed(2) : 0;
    const calculatedPrecioGasC = formData.gas_m3_torre_c > 0 ? (formData.gas_total_torre_c / formData.gas_m3_torre_c).toFixed(2) : 0;

    // Cálculos automáticos de facturas para áreas comunes
    const calculatedAguaComunes = (formData.agua_m3_comunes * parseFloat(calculatedPrecioAgua)).toFixed(2);
    // Replaced gas_m3_comunes with gas_m3_zonas_humedas
    const calculatedGasZonasHumedas = (formData.gas_m3_zonas_humedas * parseFloat(calculatedPrecioGas)).toFixed(2);

    // Cálculo de agua consumida en apartamentos (EEAB - Areas Comunes)
    const calculatedAguaApartamentos = (formData.agua_m3_eeab - formData.agua_m3_comunes).toFixed(2);

    // Cálculo de total gas apartamentos: (Torre A - Zonas Húmedas) + Torre B + Torre C
    // Asumiendo que el medidor de zonas húmedas está "aguas abajo" de Torre A o se resta de ahí por lógica física.
    const calculatedGasApartamentos = (
        (formData.gas_m3_torre_a - formData.gas_m3_zonas_humedas) +
        formData.gas_m3_torre_b +
        formData.gas_m3_torre_c
    ).toFixed(2);

    // Factor Relación Agua / Gas (Solicitado: Gas Aptos / Agua Aptos)
    const calculatedFactorAguaGas = parseFloat(calculatedAguaApartamentos) > 0
        ? (parseFloat(calculatedGasApartamentos) / parseFloat(calculatedAguaApartamentos)).toFixed(3)
        : "0.000";

    // Sumatoria Consumo Agua Calderas (Torres A, B, C)
    const totalAguaTorres = formData.agua_m3_torre_a + formData.agua_m3_torre_b + formData.agua_m3_torre_c;

    // Factor Coeficiente General (Solicitado: Agua Neta / Suma Agua Calderas)
    const calculatedCoeficienteGeneral = totalAguaTorres > 0
        ? (parseFloat(calculatedAguaApartamentos) / totalAguaTorres).toFixed(2)
        : "0.00";

    // Cálculos de Precios de Gas por Torre e Indice Promedio
    const priceGasA = formData.gas_m3_torre_a > 0 ? (formData.gas_total_torre_a / formData.gas_m3_torre_a) : 0;
    const priceGasB = formData.gas_m3_torre_b > 0 ? (formData.gas_total_torre_b / formData.gas_m3_torre_b) : 0;
    const priceGasC = formData.gas_m3_torre_c > 0 ? (formData.gas_total_torre_c / formData.gas_m3_torre_c) : 0;

    // Promedio Simple de los 3 precios
    const averageGasPrice = ((priceGasA + priceGasB + priceGasC) / 3).toFixed(2);

    // Sincronizar precios calculados con formData antes de guardar
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            precio_m3_agua: parseFloat(calculatedPrecioAgua),
            precio_m3_gas: parseFloat(calculatedPrecioGas),
            coeficiente_general: parseFloat(calculatedCoeficienteGeneral)
        }));
    }, [calculatedPrecioAgua, calculatedPrecioGas, calculatedCoeficienteGeneral]);

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
                    // Seleccionar el más reciente por defecto
                    const ultimo = [...res].sort((a, b) => b.anio_end - a.anio_end || b.mes_end - a.mes_end)[0];
                    setSelectedYear(ultimo.anio_end.toString());
                    setSelectedMonth(ultimo.mes_end.toString());
                }
            } catch (err) {
                console.error("Error cargando periodos:", err);
                toast.error("No se pudieron cargar los periodos.");
            }
        };
        fetchPeriodos();
    }, []);

    // 2. Cargar datos del periodo seleccionado
    useEffect(() => {
        const loadPeriodoData = async () => {
            if (!selectedYear || !selectedMonth) return;

            setLoading(true);
            try {
                const p = await window.api.periodo.getConsumoDetallado(parseInt(selectedYear), parseInt(selectedMonth));
                // getConsumoDetallado devuelve la lista de aptos, pero necesitamos los datos del periodo.
                // Vamos a buscar el periodo objeto en periodosRaw
                const periodoObj = periodosRaw.find(item => item.anio_end.toString() === selectedYear && item.mes_end.toString() === selectedMonth);

                if (periodoObj) {
                    setCurrentPeriodo(periodoObj);

                    // Buscar el periodo anterior directamente en la BD (más robusto que el estado local)
                    const prevPeriodo = await window.api.periodo.getPrevious({
                        anio: parseInt(selectedYear),
                        mes: parseInt(selectedMonth)
                    });

                    setFormData({
                        precio_m3_agua: periodoObj.precio_m3_agua || 0,
                        precio_m3_gas: periodoObj.precio_m3_gas || 0,
                        coeficiente_general: periodoObj.coeficiente_general || 1,
                        alertas: periodoObj.alertas || 0,
                        gas_total_torre_a: periodoObj.gas_total_torre_a || 0,
                        gas_m3_torre_a: periodoObj.gas_m3_torre_a || 0,
                        gas_total_torre_b: periodoObj.gas_total_torre_b || 0,
                        gas_m3_torre_b: periodoObj.gas_m3_torre_b || 0,
                        gas_total_torre_c: periodoObj.gas_total_torre_c || 0,
                        gas_m3_torre_c: periodoObj.gas_m3_torre_c || 0,

                        // Si el valor actual es 0, usamos el del mes anterior por defecto
                        agua_total_residencia: (periodoObj.agua_total_residencia || 0) !== 0
                            ? periodoObj.agua_total_residencia
                            : (prevPeriodo?.agua_total_residencia || 0),

                        agua_m3_total_residencia: (periodoObj.agua_m3_total_residencia || 0) !== 0
                            ? periodoObj.agua_m3_total_residencia
                            : (prevPeriodo?.agua_m3_total_residencia || 0),

                        agua_m3_comunes: periodoObj.agua_m3_comunes || 0,
                        agua_m3_torre_a: periodoObj.agua_m3_torre_a || 0,
                        agua_m3_torre_b: periodoObj.agua_m3_torre_b || 0,
                        agua_m3_torre_c: periodoObj.agua_m3_torre_c || 0,
                        agua_m3_eeab: periodoObj.agua_m3_eeab || 0,
                        gas_m3_zonas_humedas: periodoObj.gas_m3_zonas_humedas || 0
                    });

                    // Notificar si se usaron valores del mes anterior
                    if (prevPeriodo && (periodoObj.agua_total_residencia === 0 || periodoObj.agua_m3_total_residencia === 0)) {
                        toast.info(`Mostrando valores de Agua sugeridos del periodo anterior (${prevPeriodo.mes_end}/${prevPeriodo.anio_end}).`, {
                            autoClose: 3000,
                            position: "top-right"
                        });
                    }
                }
            } catch (err) {
                console.error("Error al cargar datos del periodo:", err);
            } finally {
                setLoading(false);
            }
        };
        loadPeriodoData();
    }, [selectedYear, selectedMonth, periodosRaw]);

    // Manejo de guardado
    const handleSave = async () => {
        if (!currentPeriodo) return;

        setIsSaving(true);
        try {
            // Al guardar, ya el formData debería tener los valores sugeridos si el usuario los aceptó (no los cambió)
            // No obstante, mantenemos una validación final rápida si sigue en 0
            let finalAguaRes = formData.agua_total_residencia;
            let finalAguaM3Res = formData.agua_m3_total_residencia;

            // Preparar datos con valores calculados
            const dataToSave = {
                ...formData,
                agua_total_residencia: parseFloat(finalAguaRes || 0),
                agua_m3_total_residencia: parseFloat(finalAguaM3Res || 0),
                agua_total_comunes: parseFloat(calculatedAguaComunes),
                gas_total_zonas_humedas: parseFloat(calculatedGasZonasHumedas),
                coeficiente_general: parseFloat(calculatedCoeficienteGeneral)
            };


            const res = await window.api.periodo.update({
                id: currentPeriodo.id,
                data: dataToSave
            });

            if (res && !res.error) {
                toast.success("Variables actualizadas correctamente.");
                // Actualizar lista local para reflejar cambios
                setPeriodosRaw(prev => prev.map(p => p.id === currentPeriodo.id ? { ...p, ...formData } : p));
            } else {
                toast.error("Error al guardar: " + (res?.error || "Desconocido"));
            }
        } catch (err) {
            toast.error("Error de comunicación con la base de datos.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRestore = () => {
        if (currentPeriodo) {
            setFormData({
                precio_m3_agua: currentPeriodo.precio_m3_agua || 0,
                precio_m3_gas: currentPeriodo.precio_m3_gas || 0,
                coeficiente_general: currentPeriodo.coeficiente_general || 1,
                alertas: currentPeriodo.alertas || 0,
                gas_total_torre_a: currentPeriodo.gas_total_torre_a || 0,
                gas_m3_torre_a: currentPeriodo.gas_m3_torre_a || 0,
                gas_total_torre_b: currentPeriodo.gas_total_torre_b || 0,
                gas_m3_torre_b: currentPeriodo.gas_m3_torre_b || 0,
                gas_total_torre_c: currentPeriodo.gas_total_torre_c || 0,
                gas_m3_torre_c: currentPeriodo.gas_m3_torre_c || 0,
                // gas_m3_comunes REMOVED
                agua_total_residencia: currentPeriodo.agua_total_residencia || 0,
                agua_m3_total_residencia: currentPeriodo.agua_m3_total_residencia || 0,
                agua_m3_comunes: currentPeriodo.agua_m3_comunes || 0,
                agua_m3_torre_a: currentPeriodo.agua_m3_torre_a || 0,
                agua_m3_torre_b: currentPeriodo.agua_m3_torre_b || 0,
                agua_m3_torre_c: currentPeriodo.agua_m3_torre_c || 0,
                agua_m3_eeab: currentPeriodo.agua_m3_eeab || 0,
                gas_m3_zonas_humedas: currentPeriodo.gas_m3_zonas_humedas || 0
            });
            toast.info("Valores restaurados al estado inicial.");
        }
    };

    // Helpers para selectores
    const availableYears = [...new Set(periodosRaw.map(p => p.anio_end))].sort((a, b) => b - a);
    const getMonthsForYear = (year) => {
        return periodosRaw
            .filter(p => p.anio_end.toString() === year.toString())
            .map(p => ({ val: p.mes_end, name: monthNames[p.mes_end - 1] }))
            .sort((a, b) => b.val - a.val);
    };

    return (
        <div className="flex h-screen bg-sidebar-bg">
            <SideBar menubar={menu} setMenubar={setMenu} />
            <ToastContainer />

            <div className={`page-container overflow-y-auto scroll-container ${menu ? "w-7/8" : "w-full"}`}>


                {/* HEADER OSCURO */}
                <div className="bg-header-bg p-8 rounded-3xl shadow-premium mb-8 relative">
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-6">
                            {!menu && (
                                <button onClick={() => setMenu(true)} className="hover:scale-110 transition-transform duration-200">
                                    <Bars3Icon className="w-12 h-12 text-white/80" />
                                </button>
                            )}
                            {/* Changed Navigate back to Home or History instead of Tables, since this is accessed from sidebar now */}
                            <Button
                                variant="icon"
                                icon={ArrowLeftIcon}
                                onClick={() => navigate("/")}
                            />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white/40 tracking-widest uppercase mb-1">Gestión de Parámetros</span>
                                <h1 className="text-4xl font-display text-white tracking-tight uppercase">
                                    Medidores <span className="text-sidebar-bg/40 font-bold">Principales</span>
                                </h1>
                            </div>
                        </div>

                        <div className="flex flex-col items-end">
                            <img src={Logo} alt="Logo" className="w-20 h-auto" />
                            <span className="text-[8px] font-black text-white tracking-[0.3em] mt-1 uppercase">Edificio Calleja</span>
                        </div>
                    </div>

                    {/* SELECTORES DE PERIODO */}
                    <div className="flex gap-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden flex-1 max-w-[180px]">
                            <div className="px-4 pt-2 text-[10px] font-black text-sidebar-bg/30 uppercase tracking-widest">Año del Periodo</div>
                            <select
                                value={selectedYear}
                                onChange={(e) => { setSelectedYear(e.target.value); setSelectedMonth(""); }}
                                className="w-full px-4 py-2 bg-transparent text-sidebar-bg text-sm font-bold focus:outline-none appearance-none cursor-pointer"
                            >
                                {!selectedYear && <option value="">Seleccionar</option>}
                                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden flex-1 max-w-[180px]">
                            <div className="px-4 pt-2 text-[10px] font-black text-sidebar-bg/30 uppercase tracking-widest">Mes del Periodo</div>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full px-4 py-2 bg-transparent text-sidebar-bg text-sm font-bold focus:outline-none appearance-none cursor-pointer"
                            >
                                {!selectedMonth && <option value="">Seleccionar</option>}
                                {selectedYear && getMonthsForYear(selectedYear).map(m => (
                                    <option key={m.val} value={m.val}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>


                {/* EXCEL IMPORTER REMOVED */}

                {/* CONTENIDO PRINCIPAL: FORMULARIO */}
                <div className="space-y-8 pb-10">

                    {/* SECCIÓN: INPUTS DEL USUARIO */}
                    <div>
                        <h2 className="text-2xl font-bold text-sidebar-bg mb-6 px-2">Datos de Entrada</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                            {/* CARD: FACTURA TOTAL AGUA ($) */}
                            <InputCard
                                icon={CurrencyDollarIcon}
                                title="Valor Total Factura Agua ($)"
                                subtitle="Costo Principal Agua"
                                value={formData.agua_total_residencia}
                                onChange={(val) => setFormData({ ...formData, agua_total_residencia: val })}
                                description="Valor total monetario de la factura de agua (Principal)."
                            />


                            {/* CARD: CONSUMO TOTAL AGUA (m3) */}
                            <InputCard
                                icon={ChartBarIcon}
                                title="Consumo Agua Total Factura (m³)"
                                subtitle="Consumo Físico Total"
                                value={formData.agua_m3_total_residencia}
                                onChange={(val) => setFormData({ ...formData, agua_m3_total_residencia: val })}
                                prefix={null}
                                description="m3 totales registrados en la factura de agua."
                            />


                            {/* CARD: AGUA TORRE A (m3) */}
                            <InputCard
                                icon={ChartBarIcon}
                                title="Consumo Agua Caldera Torre A (m³)"
                                subtitle="Consumo Agua A"
                                value={formData.agua_m3_torre_a}
                                onChange={(val) => setFormData({ ...formData, agua_m3_torre_a: val })}
                                prefix={null}
                                description="m3 de agua consumidos en Torre A."
                            />

                            {/* CARD: AGUA TORRE B (m3) */}
                            <InputCard
                                icon={ChartBarIcon}
                                title="Consumo Agua Caldera Torre B (m³)"
                                subtitle="Consumo Agua B"
                                value={formData.agua_m3_torre_b}
                                onChange={(val) => setFormData({ ...formData, agua_m3_torre_b: val })}
                                prefix={null}
                                description="m3 de agua consumidos en Torre B."
                            />

                            {/* CARD: AGUA TORRE C (m3) */}
                            <InputCard
                                icon={ChartBarIcon}
                                title="Consumo Agua Caldera Torre C (m³)"
                                subtitle="Consumo Agua C"
                                value={formData.agua_m3_torre_c}
                                onChange={(val) => setFormData({ ...formData, agua_m3_torre_c: val })}
                                prefix={null}
                                description="m3 de agua consumidos en Torre C."
                            />

                            {/* CARD: GAS TORRE A - FACTURA ($) */}
                            <InputCard
                                icon={CurrencyDollarIcon}
                                title="Factura Gas Torre A ($)"
                                subtitle="Costo Gas Torre A"
                                value={formData.gas_total_torre_a}
                                onChange={(val) => setFormData({ ...formData, gas_total_torre_a: val })}
                                description="Valor monetario de la factura de gas para la Torre A."
                            />

                            {/* CARD: GAS TORRE A - CONSUMO (m3) */}
                            <InputCard
                                icon={ChartBarIcon}
                                title="Consumo Gas Torre A (m³)"
                                subtitle="Consumo Gas Torre A"
                                value={formData.gas_m3_torre_a}
                                onChange={(val) => setFormData({ ...formData, gas_m3_torre_a: val })}
                                prefix={null}
                                description="m3 totales de gas consumidos en la Torre A."
                            />

                            {/* CARD: GAS TORRE B - FACTURA ($) */}
                            <InputCard
                                icon={CurrencyDollarIcon}
                                title="Factura Gas Torre B ($)"
                                subtitle="Costo Gas Torre B"
                                value={formData.gas_total_torre_b}
                                onChange={(val) => setFormData({ ...formData, gas_total_torre_b: val })}
                                description="Valor monetario de la factura de gas para la Torre B."
                            />

                            {/* CARD: GAS TORRE B - CONSUMO (m3) */}
                            <InputCard
                                icon={ChartBarIcon}
                                title="Consumo Gas Torre B (m³)"
                                subtitle="Consumo Gas Torre B"
                                value={formData.gas_m3_torre_b}
                                onChange={(val) => setFormData({ ...formData, gas_m3_torre_b: val })}
                                prefix={null}
                                description="m3 totales de gas consumidos en la Torre B."
                            />

                            {/* CARD: GAS TORRE C - FACTURA ($) */}
                            <InputCard
                                icon={CurrencyDollarIcon}
                                title="Factura Gas Torre C ($)"
                                subtitle="Costo Gas Torre C"
                                value={formData.gas_total_torre_c}
                                onChange={(val) => setFormData({ ...formData, gas_total_torre_c: val })}
                                description="Valor monetario de la factura de gas para la Torre C."
                            />

                            {/* CARD: GAS TORRE C - CONSUMO (m3) */}
                            <InputCard
                                icon={ChartBarIcon}
                                title="Consumo Gas Torre C (m³)"
                                subtitle="Consumo Gas Torre C"
                                value={formData.gas_m3_torre_c}
                                onChange={(val) => setFormData({ ...formData, gas_m3_torre_c: val })}
                                prefix={null}
                                description="m3 totales de gas consumidos en la Torre C."
                            />



                        </div>
                    </div>

                    {/* SECCIÓN: VALORES CALCULADOS (OUTPUTS) */}
                    <div>
                        <h2 className="text-2xl font-bold text-sidebar-bg mb-6 px-2 flex items-center gap-3">
                            <span>Valores Calculados</span>
                            <span className="text-xs font-normal text-sidebar-bg/70 tracking-wide">(Generados automáticamente)</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                            {/* CARD: AGUA MEDIDOR EEAB (m3) */}
                            <InfoCard
                                icon={ChartBarIcon}
                                title="Consumo Periodo Agua EAAB (m³)"
                                value={formData.agua_m3_eeab}
                                description="Lectura acumulada del medidor EEAB."
                                variant="golden"
                                prefix={null}
                            />

                            {/* CARD: GAS ZONAS HUMEDAS (m3) */}
                            <InfoCard
                                icon={ChartBarIcon}
                                title="Consumo Periodo Gas Zonas Húmedas (m³)"
                                value={formData.gas_m3_zonas_humedas}
                                description="Consumo de gas en zonas húmedas."
                                variant="golden"
                                prefix={null}
                            />

                            {/* CARD: CONSUMO AGUA AREAS COMUNES (m3) */}
                            <InfoCard
                                icon={ChartBarIcon}
                                title="Consumo Periodo Agua Zonas Comunes (m³)"
                                value={formData.agua_m3_comunes}
                                description="m3 consumidos exclusivamente en áreas comunes."
                                variant="golden"
                                prefix={null}
                            />

                            {/* CARD: PRECIO AGUA (CALCULADO) */}
                            <InfoCard
                                icon={InformationCircleIcon}
                                title="Precio m³ Agua"
                                value={calculatedPrecioAgua}
                                description="Calculado automáticamente: Factura / m³ totales."
                                variant="golden"
                            />

                            {/* CARD: PRECIO GAS (CALCULADO) */}
                            <InfoCard
                                icon={InformationCircleIcon}
                                title="Precio m³ GAS"
                                value={calculatedPrecioGas}
                                description="Calculado automáticamente: (Suma Facturas Torres) / m³ totales."
                                variant="golden"
                            />

                            {/* CARD: COEFICIENTE GENERAL (SOLO LECTURA) */}
                            <InfoCard
                                icon={ChartBarIcon}
                                title="Coeficiente General"
                                value={calculatedCoeficienteGeneral}
                                description="Consumo Neto Agua / Sumatoria Agua Calderas."
                                prefix={null}
                                variant="golden"
                            />


                            {/* CARD: CONSUMO AGUA APARTAMENTOS (CALCULADO) */}
                            <InfoCard
                                icon={ChartBarIcon}
                                title="Consumo Neto Agua Calderas  (m³)"
                                value={calculatedAguaApartamentos}
                                description="Calculado: Consumo agua periodo edificio - Consumo agua periodo medidor areas comunes."
                                variant="golden"
                                prefix={null}
                            />



                            {/* CARD: PRECIO GAS TORRE A (CALCULADO) */}
                            <InfoCard
                                icon={InformationCircleIcon}
                                title="Precio m³ Gas Torre A"
                                value={priceGasA.toFixed(2)}
                                description="Calculado automáticamente: Factura A / m³ A."
                                variant="golden"
                            />

                            {/* CARD: PRECIO GAS TORRE B (CALCULADO) */}
                            <InfoCard
                                icon={InformationCircleIcon}
                                title="Precio m³ GAS Torre B"
                                value={priceGasB.toFixed(2)}
                                description="Calculado automáticamente: Factura B / m³ B."
                                variant="golden"
                            />

                            {/* CARD: PRECIO GAS TORRE C (CALCULADO) */}
                            <InfoCard
                                icon={InformationCircleIcon}
                                title="Precio m³ GAS Torre C"
                                value={priceGasC.toFixed(2)}
                                description="Calculado automáticamente: Factura C / m³ C."
                                variant="golden"
                            />

                            {/* CARD: PRECIO PROMEDIO GAS (CALCULADO) */}
                            <InfoCard
                                icon={CurrencyDollarIcon}
                                title="Precio Promedio Gas ($)"
                                value={averageGasPrice}
                                description="Promedio simple precios A, B y C."
                                variant="golden"
                            />

                            {/* CARD: TOTAL GAS APARTAMENTOS (CALCULADO) */}
                            <InfoCard
                                icon={ChartBarIcon}
                                title="Consumo Gas Calderas (m³)"
                                value={calculatedGasApartamentos}
                                description="Calculado: (Torre A Factura - Gas Comunes) + Torre B Factura + Torre C Factura."
                                variant="golden"
                                prefix={null}
                            />

                            {/* CARD: FACTOR RELACIÓN AGUA/GAS (CALCULADO) */}
                            <InfoCard
                                icon={ChartBarIcon}
                                title="Factor Relación Agua/Gas"
                                value={calculatedFactorAguaGas}
                                description="Calculado: Gas Aptos / Agua Aptos."
                                variant="golden"
                                prefix={null}
                            />

                        </div>
                    </div>

                    {/* BOTONES ACCIÓN */}
                    <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-premium border border-black/5">
                        <div className="flex items-center gap-4 text-sidebar-bg/40 px-4">
                            <InformationCircleIcon className="w-6 h-6" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Los cambios afectarán únicamente al periodo seleccionado.</span>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex gap-4">
                                <Button
                                    variant="secondary"
                                    onClick={handleRestore}
                                    icon={ArrowPathIcon}
                                >
                                    Restaurar
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSave}
                                    disabled={isSaving || !currentPeriodo}
                                    icon={!isSaving ? ArrowDownTrayIcon : undefined}
                                >
                                    {isSaving ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        "Guardar Cambios"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
