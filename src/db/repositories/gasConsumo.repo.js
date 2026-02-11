// src/main/db/repositories/gasConsumo.repo.js

import ApartamentosRepository from './apartamentos.repo.js';
import PeriodoRepository from './periodo.repo.js';

export default function GasConsumoRepository(db) {

  const apartamentosRepo = ApartamentosRepository(db);
  const periodoRepo = PeriodoRepository(db);

  return {

    /* =========================
       GETTERS
    ========================== */

    getAll() {
      return db.prepare(`
        SELECT gc.*,
               a.numero AS apartamento,
               t.nombre AS torre,
               p.anio_init,
               p.mes_init
        FROM gas_consumo gc
        JOIN apartamentos a ON a.id = gc.apartamento_id
        JOIN torres t ON t.id = a.torre_id
        JOIN periodo p ON p.id = gc.periodo_id
        ORDER BY p.anio_init, p.mes_init, t.nombre, a.numero
      `).all();
    },

    getById(id) {
      return db.prepare(`
        SELECT 
          gc.*, 
          a.numero as apartamento_numero,
          t.nombre as torre_nombre,
          p.anio_end as anio,
          p.mes_end as mes
        FROM gas_consumo gc
        JOIN apartamentos a ON a.id = gc.apartamento_id
        JOIN torres t ON t.id = a.torre_id
        JOIN periodo p ON p.id = gc.periodo_id
        WHERE gc.id = ?
      `).get(id);
    },

    getPreviousReading(apartamento_id, current_anio, current_mes) {
      const row = db.prepare(`
        SELECT gc.lectura_actual
        FROM gas_consumo gc
        JOIN periodo p ON p.id = gc.periodo_id
        WHERE gc.apartamento_id = ? 
          AND (p.anio_end < ? OR (p.anio_end = ? AND p.mes_end < ?))
        ORDER BY p.anio_end DESC, p.mes_end DESC
        LIMIT 1
      `).get(apartamento_id, current_anio, current_anio, current_mes);
      return row?.lectura_actual || 0;
    },

    getByAptoPeriodo({ torre, apartamento, anio, mes }) {
      const apto = apartamentosRepo.getByTorreNumero(torre, apartamento);
      if (!apto) return null;

      const periodo = periodoRepo.getByYearMonth(anio, mes);
      if (!periodo) return null;

      return db.prepare(`
        SELECT *
        FROM gas_consumo
        WHERE apartamento_id = ?
          AND periodo_id = ?
      `).get(apto.id, periodo.id);
    },

    exists(params) {
      return !!this.getByAptoPeriodo(params);
    },

    /* =========================
       CREATE
    ========================== */

    create({
      torre,
      apartamento,
      anio,
      mes,
      lectura_actual,
      consumo_m3,
      costo_calculado = 0,
      observaciones = null
    }) {
      const apto = apartamentosRepo.getByTorreNumero(torre, apartamento);
      if (!apto) {
        throw new Error(`Apartamento ${torre}-${apartamento} no existe`);
      }

      const periodo = periodoRepo.getByYearMonth(anio, mes);
      if (!periodo) {
        throw new Error(`Periodo ${anio}-${mes} no existe`);
      }

      if (this.exists({ torre, apartamento, anio, mes })) {
        throw new Error(`Consumo gas ya existe para ${torre}-${apartamento} ${anio}-${mes}`);
      }

      const result = db.prepare(`
        INSERT INTO gas_consumo (
          apartamento_id,
          periodo_id,
          lectura_actual,
          consumo_m3,
          costo_calculado,
          observaciones
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        apto.id,
        periodo.id,
        toFloat(lectura_actual),
        toFloat(consumo_m3),
        toFloat(costo_calculado),
        observaciones
      );

      return this.getById(result.lastInsertRowid);
    },

    upsert({ torre, apartamento, anio, mes, lectura_actual, consumo_m3, costo_calculado, observaciones = null }) {
      const existing = this.getByAptoPeriodo({ torre, apartamento, anio, mes });

      if (existing) {
        return this.update(existing.id, { lectura_actual, consumo_m3, costo_calculado, observaciones });
      } else {
        return this.create({ torre, apartamento, anio, mes, lectura_actual, consumo_m3, costo_calculado, observaciones });
      }
    },

    /* =========================
       UPDATE
    ========================== */

    update(id, { lectura_actual, consumo_m3, costo_calculado, observaciones }) {
      db.prepare(`
        UPDATE gas_consumo
        SET
          lectura_actual = ?,
          consumo_m3 = ?,
          costo_calculado = ?,
          observaciones = ?
        WHERE id = ?
      `).run(
        toFloat(lectura_actual),
        toFloat(consumo_m3),
        toFloat(costo_calculado),
        observaciones,
        id
      );

      return this.getById(id);
    },

    /* =========================
       DELETE
    ========================== */

    delete(id) {
      db.prepare(`
        DELETE FROM gas_consumo
        WHERE id = ?
      `).run(id);
    }

  };
}

/* =========================
   Helpers
========================= */

function toFloat(value) {
  return Number.parseFloat(String(value ?? '0').trim());
}
