import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FunnelIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function AlertasHome() {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  // Carga inicial de alertas reales desde backend IPC
  const loadAlertas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.api.home.getAlertas();
      setAlertas(data || []);
    } catch (err) {
      setError(err.message);
      console.warn("Error cargando alertas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlertas();
  }, [loadAlertas]);

  // Filtrado de alertas por texto
  const filtered = useMemo(() => {
    if (!search.trim()) return alertas;
    const s = search.toLowerCase();
    return alertas.filter(
      (a) =>
        a.title.toLowerCase().includes(s) ||
        a.msg.toLowerCase().includes(s) ||
        a.type.toLowerCase().includes(s)
    );
  }, [search, alertas]);

  // Cuando haces click en una alerta
  const onAlertClick = (alert) => {
    console.log("Abrir detalle alerta:", alert);
    // navigate(`/alerta/${alert.id}`) si deseas
  };

  return (
    <div className="xl:w-8/9 xl:mt-0 mt-10 mx-auto">

      {/* Botones superiores */}
      <div className="flex gap-4 justify-end">
        <button
          onClick={() => navigate("/EnvVarHistory")}
          className="bg-white h-15 px-5 rounded-4xl hover:shadow-lg hover:scale-105 transition-all duration-300">
          <FunnelIcon className="w-5" />
        </button>

        <button
          onClick={() => navigate("/Dashboard")}
          className="bg-white h-15 px-5 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300">
          <CalendarIcon className="w-5" />
        </button>

        <button
          onClick={() => navigate("/Export")}
          className="bg-white h-15 px-5 rounded-4xl hover:shadow-lg hover:scale-105 transition-all duration-300">
          <div className="flex gap-2 items-center">
            <ArrowDownTrayIcon className="w-7" />
            <span>Descargar Reportes</span>
          </div>
        </button>
      </div>

      {/* Contenedor alertas */}
      <div className="bg-white rounded-xl mt-5 p-5 w-full flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="px-2 py-2 bg-[#A5A29D] text-white rounded-full">
            <ChatBubbleOvalLeftEllipsisIcon className="w-5" />
          </div>
          <span className="text-[#A5A29D]">Alertas</span>
        </div>

        {/* Buscador */}
        <div className="border rounded-full px-4 py-2 flex items-center text-gray-400 mb-5">
          <MagnifyingGlassIcon className="w-5" />
          <input
            className="ml-2 outline-none w-full"
            placeholder="Buscar alerta…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Loading / error */}
        {loading && <div className="text-gray-500 text-sm">Cargando alertas...</div>}
        {error && <div className="text-red-500 text-sm">{error}</div>}

        {/* Lista */}
        <div className="flex flex-col gap-4 h-50 overflow-y-auto">
          {filtered.length === 0 && !loading ? (
            <div className="text-gray-500 text-sm">No hay alertas.</div>
          ) : (
            filtered.map((alert) => (
              <div
                key={alert.id}
                onClick={() => onAlertClick(alert)}
                className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border ${alert.type === "rojo" ? "bg-red-300" : "bg-green-300"
                    }`}
                >
                  <ExclamationTriangleIcon className="w-6 text-white" />
                </div>

                <div>
                  <div className="font-semibold text-gray-700 text-sm">
                    {alert.title}
                  </div>
                  <div className="text-gray-500 text-sm">{alert.msg}</div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
