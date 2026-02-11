import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SideBar from "../Components/Global/Sidebar";
import {
    ArrowLeftIcon,
    HomeIcon,
    MagnifyingGlassIcon,
    ChartBarIcon,
    Bars3Icon
} from "@heroicons/react/24/solid";

// CHART.JS IMPORTS
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

export default function MetricHistory() {
    const [menu, setMenu] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search);

    const metricKey = query.get("key");
    const metricLabel = query.get("label");

    const monthNames = [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];

    useEffect(() => {
        if (!metricKey) {
            navigate("/History");
            return;
        }
        fetchHistory();
    }, [metricKey]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const allPeriodos = await window.api.periodo.getAll();

            // Sort chronological
            const sorted = allPeriodos.sort((a, b) =>
                a.anio_end - b.anio_end || a.mes_end - b.mes_end
            );

            const formatted = sorted.map(p => ({
                id: p.id,
                period: `${monthNames[p.mes_end - 1]} ${p.anio_end}`,
                value: p[metricKey] || 0,
                fullDate: `${p.mes_end}/${p.anio_end}`
            }));

            setData(formatted);
        } catch (error) {
            console.error("Error loading history:", error);
        } finally {
            setLoading(false);
        }
    };

    // Prepare Chart Data
    const chartData = {
        labels: data.map(d => d.period),
        datasets: [
            {
                label: metricLabel,
                data: data.map(d => d.value),
                fill: true,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(190, 242, 100, 0.5)'); // accent color
                    gradient.addColorStop(1, 'rgba(190, 242, 100, 0)');
                    return gradient;
                },
                borderColor: '#BEF264', // accent color
                tension: 0.4, // smooth curves
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#BEF264',
                pointBorderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#fff',
                titleColor: '#1e293b',
                bodyColor: '#1e293b',
                borderColor: 'rgba(0,0,0,0.1)',
                borderWidth: 1,
                titleFont: { weight: 'bold' },
                padding: 12,
                cornerRadius: 12,
                displayColors: false,
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    font: { weight: 'bold', size: 10 },
                    color: '#1e293b'
                }
            },
            y: {
                grid: {
                    color: '#f1f5f9',
                },
                ticks: {
                    font: { weight: 'bold', size: 10 },
                    color: '#94a3b8'
                },
                beginAtZero: true
            },
        },
    };

    return (
        <div className="flex h-screen bg-sidebar-bg">
            <SideBar menubar={menu} setMenubar={setMenu} />

            <div className={`page-container overflow-y-auto scroll-container ${menu ? "w-7/8" : "w-full"}`}>

                {/* HEADER */}
                <div className="bg-header-bg p-8 rounded-3xl shadow-premium mb-8 relative">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-6">
                            {!menu && (
                                <button
                                    onClick={() => setMenu(true)}
                                    className="hover:scale-110 transition-transform duration-200"
                                >
                                    <Bars3Icon className="w-12 h-12 text-white/80" />
                                </button>
                            )}
                            <button
                                onClick={() => navigate("/History")}
                                className="hover:scale-110 transition-transform bg-sidebar-bg p-2.5 rounded-full shadow-lg"
                            >
                                <ArrowLeftIcon className="w-6 h-6 text-white" />
                            </button>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white/40 tracking-widest uppercase mb-1">
                                    Análisis Histórico
                                </span>
                                <h1 className="text-4xl font-display text-white tracking-tight uppercase">
                                    {metricLabel}
                                </h1>
                            </div>
                        </div>

                        <div className="flex flex-col items-end">
                            <img src="assets/Logo.png" alt="Logo" className="w-20 h-auto" />
                            <span className="text-[8px] font-black text-white tracking-[0.3em] mt-1 uppercase">Edificio Calleja</span>
                        </div>
                    </div>
                </div>

                {/* CONTENIDO PRINCIPAL */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">

                    {/* GRÁFICA */}
                    <div className="lg:col-span-3 bg-white p-8 rounded-3xl shadow-premium border border-black/5 h-[400px]">
                        <h3 className="text-sidebar-bg font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                            <ChartBarIcon className="w-5 h-5 text-accent" />
                            Tendencia
                        </h3>
                        {loading ? (
                            <div className="flex items-center justify-center h-full opacity-20 text-xs font-black uppercase tracking-widest text-sidebar-bg">Cargando gráfica...</div>
                        ) : (
                            <div className="w-full h-[90%]">
                                <Line options={options} data={chartData} />
                            </div>
                        )}
                    </div>

                    {/* TABLA DE DATOS */}
                    <div className="lg:col-span-3 bg-white rounded-3xl shadow-premium border border-black/5 overflow-hidden">
                        <div className="p-8 border-b border-black/5">
                            <h3 className="text-sidebar-bg font-black uppercase tracking-widest flex items-center gap-2">
                                <MagnifyingGlassIcon className="w-5 h-5 text-accent" />
                                Registro Detallado
                            </h3>
                        </div>
                        <div className="overflow-x-auto max-h-[500px]">
                            <table className="min-w-full divide-y divide-black/5">
                                <thead className="bg-sidebar-bg sticky top-0">
                                    <tr>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-white/60 uppercase tracking-widest">Periodo</th>
                                        <th className="px-8 py-4 text-right text-[10px] font-black text-white/60 uppercase tracking-widest">{metricLabel || "Valor"}</th>
                                        <th className="px-8 py-4 text-center text-[10px] font-black text-white/60 uppercase tracking-widest">Variación (vs Anterior)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5 bg-white">
                                    {data.slice().reverse().map((item, index) => {
                                        // Calculate variation
                                        const nextItem = data.slice().reverse()[index + 1]; // Previous chronological
                                        const diff = nextItem ? item.value - nextItem.value : 0;
                                        const percent = nextItem && nextItem.value !== 0 ? (diff / nextItem.value) * 100 : 0;

                                        return (
                                            <tr key={item.id} className="hover:bg-main-bg/20 transition-colors">
                                                <td className="px-8 py-4 text-sm font-black text-sidebar-bg">{item.period}</td>
                                                <td className="px-8 py-4 text-right text-sm font-bold text-text-secondary">
                                                    {typeof item.value === 'number' ? item.value.toLocaleString('es-CO', { maximumFractionDigits: 3 }) : item.value}
                                                </td>
                                                <td className="px-8 py-4 text-center">
                                                    {nextItem ? (
                                                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${diff >= 0 ? 'bg-accent/10 text-accent' : 'bg-red-50 text-red-400'}`}>
                                                            {diff > 0 ? '+' : ''}{percent.toFixed(1)}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-300 font-bold">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
