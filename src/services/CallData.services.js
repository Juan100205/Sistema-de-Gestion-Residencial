import PeriodoRepository from "../db/repositories/periodo.repo.js";

/**
 * Servicio encargado de la recuperación y tabulación de datos para visualización.
 * Actúa como la contraparte del servicio de importación.
 */
export default function CallDataService(db) {
  const periodoRepo = PeriodoRepository(db);

  return {
    /**
     * Obtiene el consumo detallado (agua y gas) consolidado para un periodo específico.
     * @param {number} anio Año del periodo
     * @param {number} mes Mes del periodo
     * @returns {Promise<Array>} Lista de consumos por apartamento
     */
    async getConsumoDetallado(anio, mes) {
      console.log(`🔵 CallDataService: Obteniendo consumos para ${anio}-${mes}`);

      const p = periodoRepo.getByYearMonth(anio, mes);
      if (!p) {
        console.warn(`🟡 No se encontró periodo para ${anio}-${mes}`);
        return [];
      }

      // 1. Calculamos el Factor de Eficiencia del Gas para este periodo
      // REQUERIMIENTO: El gas de zonas comunes se resta del contador de Torre A
      const adjustedGasTorreA = Math.max(0, (p.gas_m3_torre_a || 0) - (p.gas_m3_comunes || 0));

      const totalGasM3 = adjustedGasTorreA + (p.gas_m3_torre_b || 0) + (p.gas_m3_torre_c || 0);
      const towerWaterM3 = (p.agua_m3_total_residencia || 0) - (p.agua_m3_comunes || 0);

      // Evitamos división por cero
      const calculatedFactor = towerWaterM3 > 0 ? totalGasM3 / towerWaterM3 : 0;

      // REQUERIMIENTO: Si existe un coeficiente general definido en el periodo (Excel "3.4"), se usa ese prefrentemente
      // Si es 0 o null, usamos el calculado.
      const efficiencyFactor = (p.coeficiente_general && p.coeficiente_general > 0)
        ? p.coeficiente_general
        : calculatedFactor;

      console.log(`📊 CallDataService: Factor Eficiciencia Gas = ${efficiencyFactor.toFixed(4)} (Gas: ${totalGasM3}m3 / Agua: ${towerWaterM3}m3)`);

      // 2. Consulta consolidada que une apartamentos, torres y consumos de agua
      // El gas se calcula proporcionalmente al agua
      const data = db.prepare(`
        SELECT 
            a.id as apto_id,
            t.nombre as torre,
            a.numero as apto,
            ac.id as agua_id,
            ac.lectura_actual as agua_lectura,
            ac.consumo_m3 as agua_m3,
            (COALESCE(ac.consumo_m3, 0) * ?) as agua_valor,
            ac.observaciones as agua_obs,
            gc.observaciones as gas_obs
        FROM apartamentos a
        JOIN torres t ON t.id = a.torre_id
        LEFT JOIN agua_consumo ac ON ac.apartamento_id = a.id AND ac.periodo_id = ?
        LEFT JOIN gas_consumo gc ON gc.apartamento_id = a.id AND gc.periodo_id = ?
        ORDER BY t.nombre, a.numero
      `).all(p.precio_m3_agua, p.id, p.id);


      // 3. Aplicamos el factor de gas a cada registro
      return data.map(row => {
        const gas_m3 = (row.agua_m3 || 0) * efficiencyFactor;
        const gas_valor = gas_m3 * p.precio_m3_gas;

        return {
          ...row,
          gas_m3,
          gas_valor,
          total_valor: (row.agua_valor || 0) + (gas_valor || 0)
        };
      });
    }
  };
}
