import PeriodoRepository from "../db/repositories/periodo.repo.js";
import TorresRepository from "../db/repositories/torres.repo.js";
import ApartamentosRepository from "../db/repositories/apartamentos.repo.js";
import AguaConsumoRepository from "../db/repositories/aguaConsumo.repo.js";
import GasConsumoRepository from "../db/repositories/gasConsumo.repo.js";
import BasureroRepository from "../db/repositories/basurero.repo.js";
import RecalculationService from "./Recalculation.services.js";

/**
 * Servicio encargado de actualizar los datos de un periodo existente usando un archivo Excel.
 */
export default function UpdateExcelService(db) {
  const periodoRepo = PeriodoRepository(db);
  const torresRepo = TorresRepository(db);
  const aptoRepo = ApartamentosRepository(db);
  const aguaRepo = AguaConsumoRepository(db);
  const gasRepo = GasConsumoRepository(db);
  const basureroRepo = BasureroRepository(db);
  const recalcService = RecalculationService(db);

  function normalizeRow(row) {
    const normalized = {};
    Object.keys(row).forEach(key => {
      // Aggressive normalization: remove everything except a-z and 0-9
      const cleanKey = key.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, "");
      normalized[cleanKey] = row[key];
    });
    return normalized;
  }

  function getValueFromRow(row, possibleKeys) {
    for (let key of possibleKeys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
    }
    return null;
  }

  function parseLectura(value) {
    if (value === null || value === undefined || value === "") return 0;
    // Clean string: remove anything that isn't a digit, comma or dot
    const cleanStr = String(value).trim().replace(/[^0-9,.]/g, "").replace(",", ".");
    const num = Number(cleanStr);

    if (isNaN(num)) {
      console.warn(`⚠️ [Parser Update] Valor no numérico: "${value}" -> filtrado como "${cleanStr}" -> 0`);
      return 0;
    }
    return num;
  }

  return {
    async update(periodo_id, rows) {
      console.log(`🟣 UpdateExcelService: Iniciando actualización para periodo ${periodo_id}, filas: ${rows?.length}`);

      if (!rows || !rows.length) throw new Error("El archivo Excel está vacío");

      const normalizedRows = rows.map(normalizeRow);

      // 1. Validar que el periodo existe
      const periodo = periodoRepo.getById(periodo_id);
      if (!periodo) throw new Error(`El periodo con ID ${periodo_id} no existe.`);

      // 2. Validar que el Excel coincida con la fecha del periodo (anio_end y mes_end)
      const firstRow = normalizedRows[0];
      const excelAnio = parseInt(getValueFromRow(firstRow, ['ano', 'año', 'anio', 'year']));
      const excelMes = parseInt(getValueFromRow(firstRow, ['mes', 'month']));

      if (excelAnio !== periodo.anio_end || excelMes !== periodo.mes_end) {
        throw new Error(`Conflicto de fecha: El Excel corresponde a ${excelMes}/${excelAnio}, pero está intentando actualizar el periodo ${periodo.mes_end}/${periodo.anio_end}.`);
      }

      const result = { updated: 0, errors: [] };

      db.transaction(() => {
        // 3. Crear snapshot de seguridad antes de modificar nada
        if (!basureroRepo.exists(periodo.anio_init, periodo.mes_init)) {
          console.log("📸 Creando snapshot de seguridad...");
          basureroRepo.createSnapshot(periodo.anio_init, periodo.mes_init);
        }

        // 4. Procesar cada fila
        normalizedRows.forEach((row, index) => {
          try {
            // Robust Tower Normalization: match "TORRE A", "TORRE B", etc.
            let cleanTorre = String(getValueFromRow(row, ['torre', 'tower']) || "").trim().toUpperCase();
            if (cleanTorre && !cleanTorre.startsWith('TORRE')) {
              cleanTorre = `TORRE ${cleanTorre}`;
            }

            const apartamento = String(getValueFromRow(row, ['apartamento', 'apto', 'apartment']) || "").trim();

            if (!cleanTorre || !apartamento) return; // Saltar filas vacías

            const aptoData = aptoRepo.getByTorreNumero(cleanTorre, apartamento);
            if (!aptoData) {
              console.warn(`⚠️ Apartamento ${cleanTorre}-${apartamento} no encontrado en la base de datos.`);
              return;
            }

            // Procesar Agua
            const lecturaAgua = parseLectura(getValueFromRow(row, [
              'lecturamedidoragua', 'lecturamedidor', 'lecturaagua', 'agua',
              'lecturaactualagua', 'consumoagua', 'lecturaactual', 'lectura'
            ]));
            const obsAgua = getValueFromRow(row, ['observacionesagua', 'obsagua', 'observaciones', 'obs']) || "";

            console.log(`💧 [Update] Apto ${torre}-${apartamento} | Key detectada: lectura=${lecturaAgua}`);

            // Cálculo de m3 (Lectura actual - lectura anterior)
            const lastAgua = aguaRepo.getLastByApto(aptoData.id, periodo.id);
            const lecturaAnteriorAgua = lastAgua?.lectura_actual ?? 0;
            const consumoAgua = Math.max(0, lecturaAgua - lecturaAnteriorAgua);

            aguaRepo.upsert({
              periodo_id: periodo.id,
              apartamento_id: aptoData.id,
              lectura_actual: lecturaAgua,
              consumo_m3: consumoAgua,
              observaciones: obsAgua
            });

            // Procesar Gas
            const lecturaGas = parseLectura(getValueFromRow(row, ['lectura_actual_gas', 'lectura_gas', 'gas']));
            const obsGas = getValueFromRow(row, ['observaciones_gas', 'obs_gas']) || "";

            // Para gas, el repo original usaba SQL directo o update en CallData... 
            // Implementemos un upsert manual de gas aquí para mayor robustez
            const existingGas = db.prepare(`SELECT id FROM gas_consumo WHERE periodo_id = ? AND apartamento_id = ?`).get(periodo.id, aptoData.id);

            // Cálculo de m3 Gas
            const lastGas = db.prepare(`
                SELECT lectura_actual FROM gas_consumo 
                WHERE apartamento_id = ? AND periodo_id < ? 
                ORDER BY periodo_id DESC LIMIT 1
            `).get(aptoData.id, periodo.id);
            const lecturaAnteriorGas = lastGas?.lectura_actual ?? 0;
            const consumoGas = Math.max(0, lecturaGas - lecturaAnteriorGas);

            if (existingGas) {
              db.prepare(`
                UPDATE gas_consumo 
                SET lectura_actual = ?, consumo_m3 = ?, observaciones = ?
                WHERE id = ?
              `).run(lecturaGas, consumoGas, obsGas, existingGas.id);
            } else {
              db.prepare(`
                INSERT INTO gas_consumo (apartamento_id, periodo_id, lectura_actual, consumo_m3, observaciones)
                VALUES (?, ?, ?, ?, ?)
              `).run(aptoData.id, periodo.id, lecturaGas, consumoGas, obsGas);
            }

            result.updated++;
          } catch (e) {
            console.error(`Error en fila ${index + 1}:`, e);
            result.errors.push(`Fila ${index + 1}: ${e.message}`);
          }
        });
      })();

      // RECALCULAR AUTOMÁTICAMENTE TODO EL PERIODO
      console.log(`🔄 [Update] Finalizando: disparando recálculo para periodo ${periodo_id}`);
      recalcService.recalculatePeriod(periodo_id);

      return { success: true, ...result };
    }
  };
}
