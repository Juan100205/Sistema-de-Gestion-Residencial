import { ArrowTrendingUpIcon } from "@heroicons/react/24/solid";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RendimientoHome({ periodo }) {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estructura de pisos y apartamentos por torre según datos del usuario
  const towerStructures = {
    'TORRE A': {
      2: [1, 2, 3], 3: [1, 2], 4: [1, 2, 3, 4], 5: [1, 2, 3, 4], 6: [1, 2, 3],
      7: [1, 2], 8: [1, 2, 3], 9: [1, 2], 10: [1, 2, 3, 4], 11: [1, 2, 3, 4],
      12: [1, 2, 3, 4], 13: [1, 2]
    },
    'TORRE B': {
      2: [1, 2, 3, 4], 3: [1, 2, 3], 4: [1, 2, 3], 5: [1, 2], 6: [1, 2, 3],
      7: [1, 2, 3], 8: [1, 2], 9: [1, 2], 10: [1, 2], 11: [1, 2],
      12: [1, 2, 3, 4], 13: [1, 2]
    },
    'TORRE C': {
      2: [1, 2, 3], 3: [1, 2, 3], 4: [1, 2, 3], 5: [1, 2, 3], 6: [1, 2, 3],
      7: [1, 2, 3], 8: [1, 2], 9: [1, 2], 10: [1, 2], 11: [1, 2],
      12: [1, 2], 13: [1, 2]
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await window.api.home.getHeatmap(periodo?.id);
        setData(res);
      } catch (error) {
        console.error("Error fetching heatmap data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [periodo]);

  const getColor = (status) => {
    switch (status) {
      case 'ok': return 'bg-green-400 hover:bg-green-500';
      case 'alert': return 'bg-red-400 hover:bg-red-500';
      default: return 'bg-gray-200 hover:bg-gray-400'; // pending
    }
  };

  const getStatusText = (status, consumptionWater, consumptionGas) => {
    switch (status) {
      case 'ok': return `✓ Normal (Agua: ${consumptionWater?.toFixed(2) || 0} m³, Gas: ${consumptionGas?.toFixed(2) || 0} m³)`;
      case 'alert': return `⚠ Desviación (Agua: ${consumptionWater?.toFixed(2) || 0} m³, Gas: ${consumptionGas?.toFixed(2) || 0} m³)`;
      default: return 'Sin datos';
    }
  };

  // Función para obtener el apartamento específico de una torre
  const getApto = (towerData, floor, aptoNum) => {
    const aptoNumero = `${floor}0${aptoNum}`;
    return towerData.aptos.find(a => String(a.numero) === String(aptoNumero));
  };

  return (
    <div className="mx-auto bg-white rounded-xl mt-20 p-5 w-full xl:w-100 flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="px-2 py-2 bg-[#A5A29D] text-white rounded-full">
          <ArrowTrendingUpIcon className="w-5" />
        </div>
        <span className="text-[#A5A29D] font-bold">Rendimiento por Consumo</span>
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
          <span className="text-gray-600">Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-400 rounded-sm"></div>
          <span className="text-gray-600">Bajo consumo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-300 rounded-sm"></div>
          <span className="text-gray-600">Sin datos</span>
        </div>
      </div>

      {/* Grid tipo heatmap */}
      <div className="grid grid-cols-3 gap-3 justify-center items-center text-center">
        {loading ? (
          <span className="text-xs text-gray-400 col-span-3">Cargando...</span>
        ) : (
          data.map((towerData) => {
            const currentStructure = towerStructures[towerData.tower] || {};
            return (
              <div key={towerData.tower} className="flex flex-col items-center">

                {/* Pisos organizados verticalmente (13 filas) */}
                <div className="flex flex-col-reverse gap-1">
                  {Object.keys(currentStructure).map((floor) => (
                    <div key={floor} className="flex gap-1 justify-center">
                      {currentStructure[floor].map((aptoNum) => {
                        const apto = getApto(towerData, floor, aptoNum);
                        return (
                          <div
                            key={`${floor}-${aptoNum}`}
                            onClick={() => {
                              if (apto) {
                                navigate('/Dashboard', {
                                  state: {
                                    tab: 'HISTORICO',
                                    tower: towerData.tower,
                                    apto: apto.numero,
                                    autoRange: true
                                  }
                                });
                              }
                            }}
                            title={apto ? `Apto ${apto.numero}: ${getStatusText(apto.status, apto.consumo_agua, apto.consumo_gas)}` : `${floor}0${aptoNum}`}
                            className={`w-3 h-3 rounded-sm cursor-pointer hover:scale-125 transition-all duration-200 ${apto ? getColor(apto.status) : 'bg-gray-200'}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>

                <span className="text-sm text-gray-500 mt-2 font-semibold">Torre {towerData.tower}</span>
              </div>
            );
          })
        )}
      </div>

    </div>
  )
}