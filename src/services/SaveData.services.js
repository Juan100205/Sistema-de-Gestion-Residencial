import AguaConsumoRepository from "../db/repositories/aguaConsumo.repo.js";
import GasConsumoRepository from "../db/repositories/gasConsumo.repo.js";
import BasureroRepository from "../db/repositories/basurero.repo.js";
import PeriodoRepository from "../db/repositories/periodo.repo.js";
import RecalculationService from "./Recalculation.services.js";

/**
 * Servicio encargado de la persistencia de datos y gestión de snapshots (Basurero).
 */
export default function SaveDataService(db) {
  const aguaRepo = AguaConsumoRepository(db);
  const gasRepo = GasConsumoRepository(db);
  const basureroRepo = BasureroRepository(db);
  const periodoRepo = PeriodoRepository(db);
  const recalcService = RecalculationService(db);

  /**
   * Asegura que exista un snapshot del periodo antes de realizar modificaciones.
   */
  const ensureSnapshot = (periodo_id) => {
    if (!basureroRepo.existsByPeriodoId(periodo_id)) {
      const p = periodoRepo.getById(periodo_id);
      if (!p) return;
      console.log(`📸 SaveDataService: Creando snapshot inicial para periodo ID ${periodo_id}`);
      basureroRepo.createSnapshot(p.anio_end, p.mes_end);
    }
  };

  return {
    /**
     * Guarda los cambios de consumo para un apartamento en un periodo.
     */
    async saveConsumos({ periodo_id, apto_id, agua, gas }) {
      console.log(`🔵 SaveDataService: Guardando consumos para apto ${apto_id} periodo ${periodo_id}`);
      console.log("📦 Datos recibidos:", { agua, gas });

      db.transaction(() => {
        // Respaldar antes de cambiar
        ensureSnapshot(periodo_id);

        // Agua
        if (agua) {
          console.log(`💧 Guardando Agua: lectura=${agua.lectura}, consumo=${agua.consumo}`);
          aguaRepo.upsert({
            periodo_id,
            apartamento_id: apto_id,
            lectura_actual: agua.lectura,
            consumo_m3: agua.consumo,
            observaciones: agua.obs
          });
        }

        // Gas
        if (gas) {
          console.log(`🔥 Guardando Gas: lectura=${gas.lectura}, consumo=${gas.consumo}`);
          const existing = db.prepare(`SELECT id FROM gas_consumo WHERE periodo_id = ? AND apartamento_id = ?`).get(periodo_id, apto_id);
          if (existing) {
            gasRepo.update(existing.id, {
              lectura_actual: gas.lectura,
              consumo_m3: gas.consumo,
              observaciones: gas.obs
            });
          } else {
            db.prepare(`
               INSERT INTO gas_consumo (apartamento_id, periodo_id, lectura_actual, consumo_m3, observaciones)
               VALUES (?, ?, ?, ?, ?)
             `).run(apto_id, periodo_id, gas.lectura, gas.consumo, gas.obs);
          }
        }
      })();

      // RECALCULAR AUTOMÁTICAMENTE
      console.log(`🔄 [SaveData] Disparando recálculo tras guardado manual (Apto: ${apto_id})`);
      recalcService.recalculatePeriod(periodo_id);

      return { success: true };
    },

    /**
     * Guarda múltiples consumos en una sola transacción.
     */
    async saveMultipleConsumos(periodo_id, items) {
      console.log(`🔵 SaveDataService: Guardado masivo para ${items.length} apartamentos`);

      db.transaction(() => {
        // Respaldar antes de cambiar
        ensureSnapshot(periodo_id);

        for (const item of items) {
          const { apto_id, agua, gas } = item;

          if (agua) {
            aguaRepo.upsert({
              periodo_id: parseInt(periodo_id),
              apartamento_id: apto_id,
              lectura_actual: agua.lectura,
              consumo_m3: agua.consumo,
              observaciones: agua.obs
            });
          }

          if (gas) {
            const existing = db.prepare(`SELECT id FROM gas_consumo WHERE periodo_id = ? AND apartamento_id = ?`).get(periodo_id, apto_id);
            if (existing) {
              gasRepo.update(existing.id, {
                lectura_actual: gas.lectura,
                consumo_m3: gas.consumo,
                observaciones: gas.obs
              });
            } else {
              db.prepare(`
                INSERT INTO gas_consumo (apartamento_id, periodo_id, lectura_actual, consumo_m3, observaciones)
                VALUES (?, ?, ?, ?, ?)
              `).run(apto_id, periodo_id, gas.lectura, gas.consumo, gas.obs);
            }
          }
        }
      })();

      // RECALCULAR AUTOMÁTICAMENTE
      recalcService.recalculatePeriod(periodo_id);

      return { success: true };
    },

    /**
     * Restaura un periodo a partir de su snapshot.
     */
    /**
     * Restaura un periodo a partir de su snapshot.
     */
    async restoreSnapshot(anio, mes) {

      const snapshot = basureroRepo.getSnapshotData(anio, mes);
      if (!snapshot) throw new Error("No se encontró snapshot para este periodo");

      const periodoId = snapshot.periodo.id;

      db.transaction(() => {
        // 1. Limpiar datos actuales del periodo
        db.prepare(`DELETE FROM agua_consumo WHERE periodo_id = ?`).run(periodoId);
        db.prepare(`DELETE FROM gas_consumo WHERE periodo_id = ?`).run(periodoId);
        // Podríamos limpiar más tablas si el snapshot las incluye (calderas, zonas_comunes)

        // 2. Restaurar Agua
        const insAgua = db.prepare(`
          INSERT INTO agua_consumo (apartamento_id, periodo_id, lectura_actual, consumo_m3, observaciones)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const item of snapshot.agua_consumo) {
          insAgua.run(item.apartamento_id, item.periodo_id, item.lectura_actual, item.consumo_m3, item.observaciones);
        }

        // 3. Restaurar Gas
        const insGas = db.prepare(`
          INSERT INTO gas_consumo (apartamento_id, periodo_id, lectura_actual, consumo_m3, observaciones)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const item of snapshot.gas_consumo) {
          insGas.run(item.apartamento_id, item.periodo_id, item.lectura_actual, item.consumo_m3, item.observaciones);
        }

        console.log(`✅ Snapshot restaurado para periodo ${periodoId}`);
      })();

      // RECALCULAR AUTOMÁTICAMENTE
      console.log(`🔄 [SaveData] Disparando recálculo tras restauración de snapshot para periodo ${periodoId}`);
      recalcService.recalculatePeriod(periodoId);

      return { success: true };
    }
  };
}
