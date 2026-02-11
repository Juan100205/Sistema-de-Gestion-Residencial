import TorresRepository from "../db/repositories/torres.repo.js";
import ApartamentosRepository from "../db/repositories/apartamentos.repo.js";
import PeriodoRepository from "../db/repositories/periodo.repo.js";

/**
 * Servicio encargado de preparar y filtrar los datos para la generación de reportes y exportaciones.
 */
export default function ExportDataService(db) {
  const torresRepo = TorresRepository(db);
  const aptosRepo = ApartamentosRepository(db);
  const periodoRepo = PeriodoRepository(db);

  return {
    /**
     * Obtiene todas las torres registradas.
     */
    async getTorres() {
      return torresRepo.getAll();
    },

    /**
     * Obtiene todos los apartamentos con su respectiva información de torre.
     */
    async getApartamentos() {
      return aptosRepo.getAll();
    },

    /**
     * Obtiene los consumos detallados de un periodo, con capacidad de filtrado.
     * @param {number} anio 
     * @param {number} mes 
     * @param {Object} filters Opciones de filtrado (torreId, aptoId, servicio)
     */
    async getReportData(anio, mes, filters = {}) {
      const targetAnio = parseInt(anio);
      const targetMes = parseInt(mes);
      console.log(`📊 ExportDataService: Generando datos para ${targetAnio}-${targetMes}`, filters);

      const p = periodoRepo.getByYearMonth(targetAnio, targetMes);
      if (!p) {
        console.warn(`⚠️ ExportDataService: No se encontró periodo para ${targetAnio}-${targetMes}`);
        return [];
      }

      // 1. Calculamos el Factor de Eficiencia del Gas para este periodo
      const totalGasM3 = (p.gas_m3_torre_a || 0) + (p.gas_m3_torre_b || 0) + (p.gas_m3_torre_c || 0);
      const towerWaterM3 = (p.agua_m3_total_residencia || 0) - (p.agua_m3_comunes || 0);
      const efficiencyFactor = towerWaterM3 > 0 ? totalGasM3 / towerWaterM3 : 0;

      let query = `
        SELECT 
            t.nombre as torre,
            a.numero as apto,
            ac.lectura_actual as agua_lectura,
            ac.consumo_m3 as agua_m3,
            (COALESCE(ac.consumo_m3, 0) * ?) as agua_valor
        FROM apartamentos a
        JOIN torres t ON t.id = a.torre_id
        LEFT JOIN agua_consumo ac ON ac.apartamento_id = a.id AND ac.periodo_id = ?
        WHERE 1=1
      `;

      const params = [p.precio_m3_agua, p.id];

      if (filters.torreId) {
        query += ` AND t.id = ?`;
        params.push(parseInt(filters.torreId));
      }

      if (filters.aptoId) {
        query += ` AND a.id = ?`;
        params.push(parseInt(filters.aptoId));
      }

      query += ` ORDER BY t.nombre, a.numero`;

      const rows = db.prepare(query).all(...params);

      // 2. Calculamos el gas proporcional para cada fila
      const finalRows = rows.map(row => {
        const gas_m3 = (row.agua_m3 || 0) * efficiencyFactor;
        const gas_valor = gas_m3 * p.precio_m3_gas;

        return {
          ...row,
          gas_m3,
          gas_valor
        };
      });

      console.log(`✅ ExportDataService: Se procesaron ${finalRows.length} registros con factor gas ${efficiencyFactor.toFixed(4)}.`);
      return finalRows;
    },

    /**
     * Obtiene el historial completo de consumos para un apartamento específico.
     * @param {number} aptoId 
     */
    async getApartmentHistory(aptoId) {
      console.log(`📊 ExportDataService: Obteniendo historial para aptoId: ${aptoId}`);

      const query = `
        SELECT 
            p.mes_end as mes,
            p.anio_end as anio,
            p.precio_m3_agua,
            p.precio_m3_gas,
            ac.consumo_m3 as agua_m3,
            (COALESCE(ac.consumo_m3, 0) * p.precio_m3_agua) as agua_valor,
            p.agua_m3_total_residencia,
            p.agua_m3_comunes,
            p.gas_m3_torre_a,
            p.gas_m3_torre_b,
            p.gas_m3_torre_c
        FROM periodo p
        LEFT JOIN agua_consumo ac ON ac.periodo_id = p.id AND ac.apartamento_id = ?
        WHERE p.id != 1
        ORDER BY p.anio_end DESC, p.mes_end DESC
      `;

      const rows = db.prepare(query).all(aptoId);

      // Calculamos el gas proporcional históricamente para cada mes
      return rows.map(p => {
        const totalGasM3 = (p.gas_m3_torre_a || 0) + (p.gas_m3_torre_b || 0) + (p.gas_m3_torre_c || 0);
        const towerWaterM3 = (p.agua_m3_total_residencia || 0) - (p.agua_m3_comunes || 0);
        const efficiencyFactor = towerWaterM3 > 0 ? totalGasM3 / towerWaterM3 : 0;

        const gas_m3 = (p.agua_m3 || 0) * efficiencyFactor;
        const gas_valor = gas_m3 * p.precio_m3_gas;
        const agua_valor = p.agua_valor || 0;

        return {
          mes: p.mes,
          anio: p.anio,
          agua_valor,
          gas_valor,
          hasData: (p.agua_m3 > 0 || gas_m3 > 0)
        };
      });

      // Retornar solo aquellos con datos (historial real)
      return history.filter(h => h.hasData);
    },

    /**
     * Obtiene TODOS los datos históricos de todos los apartamentos.
     */
    async getAllData() {
      console.log(`📊 ExportDataService: Obteniendo reporte General completo`);

      const query = `
        SELECT 
            p.mes_end as mes,
            p.anio_end as anio,
            t.nombre as torre,
            a.numero as apto_numero,
            p.precio_m3_agua,
            p.precio_m3_gas,
            ac.consumo_m3 as agua_m3,
            (COALESCE(ac.consumo_m3, 0) * p.precio_m3_agua) as agua_valor,
            p.agua_m3_total_residencia,
            p.agua_m3_comunes,
            p.gas_m3_torre_a,
            p.gas_m3_torre_b,
            p.gas_m3_torre_c
        FROM agua_consumo ac
        JOIN periodo p ON ac.periodo_id = p.id
        JOIN apartamentos a ON ac.apartamento_id = a.id
        JOIN torres t ON a.torre_id = t.id
        WHERE p.id != 1
        ORDER BY p.anio_end DESC, p.mes_end DESC, t.nombre, a.numero
      `;

      const rows = db.prepare(query).all();

      return rows.map(r => {
        const totalGasM3 = (r.gas_m3_torre_a || 0) + (r.gas_m3_torre_b || 0) + (r.gas_m3_torre_c || 0);
        const towerWaterM3 = (r.agua_m3_total_residencia || 0) - (r.agua_m3_comunes || 0);
        const efficiencyFactor = towerWaterM3 > 0 ? totalGasM3 / towerWaterM3 : 0;

        const gas_m3 = (r.agua_m3 || 0) * efficiencyFactor;
        const gas_valor = gas_m3 * r.precio_m3_gas;
        const agua_valor = r.agua_valor || 0;

        return {
          mes: r.mes,
          anio: r.anio,
          torre: r.torre,
          apto: r.apto_numero,
          agua_valor,
          gas_valor
        };
      });
    }
  };
}
