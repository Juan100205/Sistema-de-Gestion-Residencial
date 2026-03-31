import {
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PresentationChartBarIcon,
  TableCellsIcon,
  UserCircleIcon,
  Bars3Icon
} from "@heroicons/react/16/solid";

import React, { useEffect, useMemo, useState } from "react";
import CardHome from "../Components/Home/CardHome";
import SideBar from "../Components/Global/Sidebar";
import TableHome from "../Components/Home/TableHome";
import RendimientoHome from "../Components/Home/RendimientoHome";
import AlertasHome from "../Components/Home/AlertasHome";
import Logo from '../../assets/Logo.png';

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function Home() {
  const [period, setPeriod] = useState("anual");
  const [selectedView, setSelectedView] = useState("torres");
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(false);
  const [stats, setStats] = useState({
    agua_total: 0,
    gas_total: 0,
    coeficiente_avg: 0,
    periodo: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const data = await window.api.home.getStats();
        setStats(data);
      } catch (err) {
        console.error("Error cargando stats de Home:", err);
      } finally {
        setLoading(false);
      }
    };
    init();

    const handleEsc = (e) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val);
  };



  return (
    <div className="flex h-screen bg-sidebar-bg">
      <SideBar menubar={menu} setMenubar={setMenu} />

      <div
        className="page-container overflow-y-auto scroll-container">

        {/* LOGO & MENU TOGGLE */}
        <div className="w-full flex items-center justify-between mb-5">
          <button
            className={`hover:scale-110 transition-transform duration-200 ${menu ? "invisible" : "flex"}`}
            onClick={() => setMenu(true)}
          >
            <Bars3Icon className="w-14 h-14 text-sidebar-bg opacity-80" />
          </button>

          <div className="flex flex-col items-end">
            <img src={Logo} alt="Logo" className="w-15 h-auto" />
            <span className="text-[10px] font-black text-sidebar-bg tracking-[0.3em] mt-2 uppercase">Edificio Calleja Resort</span>
          </div>
        </div>

        {/* HEADER DE BIENVENIDA */}
        <div className="flex flex-col @5xl:flex-row @5xl:items-end @5xl:justify-between gap-6 section-gap">
          <div className="flex flex-col gap-2 min-w-fit">
            <span className="text-xl text-text-secondary font-medium italic">Bienvenido de vuelta a,</span>
            <h1 className="font-display text-3xl sm:text-4xl text-text-primary tracking-tight leading-tight">
              Edificio <span className="text-accent underline decoration-accent/20">Calleja</span> Resort
            </h1>
          </div>

          {/* QUICK STAT CARDS */}
          <div className="grid grid-cols-1 @2xl:grid-cols-2 @5xl:grid-cols-3 gap-6 flex-1">
            <CardHome
              title="Valor Factura Agua"
              icon={<BuildingOfficeIcon />}
              amount={loading ? "..." : formatCurrency(stats.agua_total)}
              subtitle={`Total agua ${stats.periodo ? monthNames[stats.periodo.mes - 1] : "este mes"}`}
              click="/EnvVarHistory"
            />

            <CardHome
              title="Valor Total Gas"
              icon={<BuildingOffice2Icon />}
              amount={loading ? "..." : formatCurrency(stats.gas_total)}
              subtitle={`Total gas ${stats.periodo ? monthNames[stats.periodo.mes - 1] : "este mes"}`}
              click="/EnvVarHistory"
            />

            <CardHome
              title="Coeficiente general"
              icon={<ArrowTrendingUpIcon />}
              amount={loading ? "..." : `${stats.coeficiente_avg}%`}
              subtitle="ESTE VALOR DEBE ESTAR IGUAL O CERCA A 1 !!"
              click="/EnvVarHistory"
            />
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex flex-col @5xl:flex-row gap-6">
          <div className="w-full @5xl:w-2/5">
            <TableHome />
          </div>
          <div className="w-full @5xl:w-1/5 flex mx-auto">
            <RendimientoHome periodo={stats.periodo} />

          </div>
          <div className="w-full @5xl:w-2/5 m-auto">
            <AlertasHome />
          </div>
        </div>

      </div>
    </div>
  );
}
