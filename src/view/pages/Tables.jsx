import React, { useEffect, useState } from "react";
import SideBar from "../Components/Global/Sidebar";
import { UserCircleIcon, ArrowLeftIcon, HomeIcon, Bars3Icon } from "@heroicons/react/24/solid";
import CardTables from "../Components/Tables/CardTables";
import { useNavigate } from "react-router-dom";

export default function Tables() {
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setMenu(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <div className="flex h-screen bg-sidebar-bg">
      <SideBar menubar={menu} setMenubar={setMenu} />

      <div
        className="page-container overflow-y-auto scroll-container">

        {/* HEADER */}
        <div className="w-full flex items-center justify-between section-gap">
          <div className="flex items-center gap-8">
            <button
              className={`hover:scale-110 transition-transform duration-200 ${menu ? "invisible" : "flex"}`}
              onClick={() => setMenu(true)}>
              <Bars3Icon className="w-14 h-14 text-sidebar-bg opacity-80" />
            </button>
            <button onClick={() => navigate("/")} className="hover:scale-110 transition-transform bg-sidebar-bg p-3 rounded-full shadow-lg">
              <ArrowLeftIcon className="w-8 h-8 text-white" />
            </button>
            <h1 className="text-5xl font-display text-text-primary tracking-tight uppercase">
              Subida <span className="text-accent font-bold">de Medidas</span>
            </h1>
          </div>

          <div className="flex flex-col items-end">
            <img src="assets/Logo.png" alt="Logo" className="w-24 h-auto" />
            <span className="text-[10px] font-black text-sidebar-bg tracking-[0.3em] mt-2 uppercase">Edificio Calleja</span>
          </div>
        </div>

        {/* GRID DE ACCIONES */}
        <div className="grid grid-cols-1 @2xl:grid-cols-2 @5xl:grid-cols-3 @7xl:grid-cols-4 gap-10 pb-10 ">
          {/* UPLOADS - HIGHLIGHTED */}
          <div className="hover:scale-[1.03] scale-[0.98]  hover:text-white transition-all duration-300 rounded-2xl ">
            <CardTables name="SUBIR LECTURA MEDIDORES APARTAMENTOS" icon={<UserCircleIcon />} onClick={() => navigate("/Upload")} isActive={true} />
          </div>
          <div className="hover:scale-[1.03] scale-[0.98]  hover:text-white transition-all duration-300 rounded-2xl">
            <CardTables name="SUBIR LECTURA MEDIDORES PRINCIPALES" icon={<UserCircleIcon />} onClick={() => navigate("/EnvVar")} isActive={true} />
          </div>

          {/* MANAGEMENT */}
          <CardTables name="ACTUALIZAR LECTURAS MEDIDORES APARTAMENTOS" icon={<UserCircleIcon />} onClick={() => navigate("/Update")} />
          <CardTables name="EDITAR LECTURAS MEDIDORES APARTAMENTOS" icon={<UserCircleIcon />} onClick={() => navigate("/Edit")} />
          <CardTables name="ELIMINAR LECTURAS MEDIDORES APARTAMENTOS" icon={<UserCircleIcon />} onClick={() => navigate("/Delete")} />
          <CardTables name="ELIMINAR LECTURAS MEDIDORES PRINCIPALES" icon={<UserCircleIcon />} onClick={() => navigate("/DeleteEnvVar")} />
        </div>
      </div>
    </div>
  );
}
