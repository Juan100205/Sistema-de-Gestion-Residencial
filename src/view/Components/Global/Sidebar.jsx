import {
  HomeIcon,
  TableCellsIcon,
  PresentationChartBarIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  TrashIcon,
  ClipboardDocumentCheckIcon
} from "@heroicons/react/24/solid";
import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

export default function SideBar({ menubar, setMenubar }) {
  // El menú está controlado desde fuera
  const menu = menubar;
  const setMenu = setMenubar;
  const navigate = useNavigate();
  return (
    <div
      className={`h-screen bg-sidebar-bg transition-all duration-300 flex flex-col items-center py-10 shadow-xl z-50 ${menu ? "w-80" : "w-0 overflow-hidden"
        }`}

    >

      <div className="flex flex-col gap-2 w-full px-4">
        <NavItem
          icon={<HomeIcon className="w-6 h-6" />}
          label="Inicio"
          onClick={() => {
            navigate("/");
            setMenu(false);
          }}
          menu={menu}
        />
        <NavItem
          icon={<TableCellsIcon className="w-6 h-6" />}
          label="Gestión de Datos"
          onClick={() => {
            navigate("/Tables");
            setMenu(false);
          }}
          menu={menu}
        />
        <NavItem
          icon={<PresentationChartBarIcon className="w-6 h-6" />}
          label="Dashboard"
          onClick={() => {
            navigate("/Dashboard");
            setMenu(false);
          }}
          menu={menu}
        />

        <div className="h-px bg-white/5 my-2 w-full" />

        <NavItem
          icon={<ClipboardDocumentCheckIcon className="w-6 h-6" />}
          label="Auditoria Medidores Apt"
          onClick={() => {
            navigate("/AuditLog");
            setMenu(false);
          }}
          menu={menu}
        />

        <NavItem
          icon={<AdjustmentsHorizontalIcon className="w-6 h-6" />}
          label="Medidores Principales"
          onClick={() => {
            navigate("/EnvVarHistory");
            setMenu(false);
          }}
          menu={menu}
        />

        <NavItem
          icon={<ClockIcon className="w-6 h-6" />}
          label="Historial M.Principales"
          onClick={() => {
            navigate("/History");
            setMenu(false);
          }}
          menu={menu}
        />


        <div className="h-px bg-white/5 my-2 w-full" />

        <NavItem
          icon={<PaperAirplaneIcon className="w-6 h-6" />}
          label="Exportar Datos"
          onClick={() => {
            navigate("/Export");
            setMenu(false);
          }}
          menu={menu}
        />
        <NavItem
          icon={<TrashIcon className="w-6 h-6" />}
          label="Papelera"
          onClick={() => {
            navigate("/TrashCan");
            setMenu(false);
          }}
          menu={menu}
        />

        <div className="h-px bg-white/5 my-2 w-full" />

        <NavItem
          icon={<TrashIcon className="w-6 h-6 text-red-500" />}
          label="RESETEAR BASE DE DATOS"
          onClick={async () => {
            if (window.confirm("⚠️ ¿ESTÁS SEGURO? Esto borrará TODOS los periodos y lecturas permanentemente. Se mantendrán las Torres y Apartamentos.")) {
              const res = await window.api.db.reset();
              if (res.success) {
                alert("✅ Base de datos reseteada con éxito.");
                window.location.reload();
              } else {
                alert("❌ Error: " + res.error);
              }
            }
          }}
          menu={menu}
        />
      </div>

      {/* FOOTER / BRANDING */}
      <div className={`mt-auto px-8 w-full transition-opacity duration-300 ${menu ? "opacity-100" : "opacity-0"}`}>
        <div className="h-px bg-white/5 mb-6" />
        <div className="flex flex-col items-center text-center gap-1">
          <span className="text-white font-black tracking-[0.4em] text-xs uppercase mb-1">RIANODEV</span>
          <span className="text-[10px] text-white/40 font-bold italic mb-3">"Isaías 43:19"</span>

          <p className="text-[9px] text-white/20 font-medium leading-relaxed mb-4">
            © 2026 Juan Jose Riaño.<br />
            All rights reserved.
          </p>

          <div className="flex flex-col gap-2">
            <a
              href="https://juan100205.github.io/RianoDev2.0/#/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-white/40 hover:text-accent font-bold uppercase tracking-widest transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="https://juan100205.github.io/RianoDev2.0/#/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-white/40 hover:text-accent font-bold uppercase tracking-widest transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, onClick, menu }) {
  return (
    <button
      className="group relative flex items-center w-full py-4 px-6 rounded-2xl transition-all duration-300 hover:cursor-pointer hover:bg-white/5"
      onClick={onClick}
    >
      <div className="relative z-20 text-main-bg/60 group-hover:text-accent transition-colors flex-shrink-0">
        {icon}
      </div>

      <span className={`ml-4 text-sm font-bold text-gray-400 group-hover:text-white uppercase tracking-wider whitespace-nowrap overflow-hidden transition-all duration-300 ${menu ? "opacity-100 w-auto" : "opacity-0 w-0"}`}>
        {label}
      </span>
    </button>
  );
}
