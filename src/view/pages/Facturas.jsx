import React, { useEffect, useState } from "react";
import SideBar from "../Components/Global/Sidebar";
import { UserCircleIcon, ArrowLeftIcon, DocumentTextIcon, HomeIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Logo from '../../assets/Logo.png';

export default function Facturas() {
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-sidebar-bg">
      <SideBar menubar={menu} setMenubar={setMenu} />
      <ToastContainer />

      <div className={`page-container overflow-y-auto scroll-container ${menu ? "w-7/8" : "w-full"}`}>

        {/* HEADER OSCURO */}
        <div className="bg-header-bg p-8 rounded-3xl shadow-premium mb-8 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              {!menu && (
                <button onClick={() => setMenu(true)} className="hover:scale-110 transition-transform">
                  <Bars3Icon className="w-12 h-12 text-white/80" />
                </button>
              )}
              <button
                onClick={() => navigate("/")}
                className="hover:scale-110 transition-transform bg-sidebar-bg p-2.5 rounded-full shadow-lg"
              >
                <ArrowLeftIcon className="w-6 h-6 text-white" />
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white/40 tracking-widest uppercase mb-1">Facturación</span>
                <h1 className="text-4xl font-display text-white tracking-tight uppercase">
                  Gestión <span className="text-sidebar-bg/40 font-bold">de Facturas</span>
                </h1>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <img src={Logo} alt="Logo" className="w-20 h-auto" />
              <span className="text-[8px] font-black text-white tracking-[0.3em] mt-1 uppercase">Edificio Calleja</span>
            </div>
          </div>
        </div>

        {/* CONTENIDO (Placeholder) */}
        <div className="flex flex-col items-center justify-center py-32 text-sidebar-bg/10">
          <div className="p-10 bg-white shadow-premium rounded-full mb-8">
            <DocumentTextIcon className="w-24 h-24" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-[0.2em] mb-2">Módulo en Desarrollo</h2>
          <p className="text-sm font-bold uppercase tracking-widest opacity-40 italic">Funcionalidad de facturación próximamente disponible</p>
        </div>

      </div>
    </div>
  );
}