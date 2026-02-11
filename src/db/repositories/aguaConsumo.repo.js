// src/main/db/repositories/aguaConsumo.repo.js

import ApartamentosRepository from './apartamentos.repo.js';
import PeriodoRepository from './periodo.repo.js';

export default function AguaConsumoRepository(db) {

  const apartamentosRepo = ApartamentosRepository(db);
  const periodoRepo = PeriodoRepository(db);

  return {

    /* =========================
       GETTERS
    ========================== */

    getAll() {
      return db.prepare(`
        SELECT ac.*,
               a.numero AS apartamento,
               t.nombre AS torre,
               p.anio_init,
               p.mes_init
        FROM agua_consumo ac
        JOIN apartamentos a ON a.id = ac.apartamento_id
        JOIN torres t ON t.id = a.torre_id
        JOIN periodo p ON p.id = ac.periodo_id
        ORDER BY p.anio_init, p.mes_init, t.nombre, a.numero
      `).all();
    },

    getById(id) {
      return db.prepare(`
        SELECT 
          ac.*, 
          a.numero as apartamento_numero,
          t.nombre as torre_nombre,
          p.anio_end as anio,
          p.mes_end as mes
        FROM agua_consumo ac
        JOIN apartamentos a ON a.id = ac.apartamento_id
        JOIN torres t ON t.id = a.torre_id
        JOIN periodo p ON p.id = ac.periodo_id
        WHERE ac.id = ?
      `).get(id);
    },

    getPreviousReading(apartamento_id, current_anio, current_mes) {
      const row = db.prepare(`
        SELECT ac.lectura_actual
        FROM agua_consumo ac
        JOIN periodo p ON p.id = ac.periodo_id
        WHERE ac.apartamento_id = ? 
          AND (p.anio_end < ? OR (p.anio_end = ? AND p.mes_end < ?))
        ORDER BY p.anio_end DESC, p.mes_end DESC
        LIMIT 1
      `).get(apartamento_id, current_anio, current_anio, current_mes);

      console.log(`🔍 [AguaRepo] Buscando anterior para apto ${apartamento_id} antes de ${current_anio}-${current_mes}. Encontrado: ${row?.lectura_actual || 0}`);
      return row?.lectura_actual || 0;
    },

    getByAptoPeriodo({ torre, apartamento, anio, mes }) {
      const apto = apartamentosRepo.getByTorreNumero(torre, apartamento);
      if (!apto) return null;

      const periodo = periodoRepo.getByYearMonth(anio, mes);
      if (!periodo) return null;

      return db.prepare(`
        SELECT *
        FROM agua_consumo
        WHERE apartamento_id = ?
          AND periodo_id = ?
      `).get(apto.id, periodo.id);
    },

    exists(params) {
      return !!this.getByAptoPeriodo(params);
    },

    getLastByApto(apartamento_id) {
      return db.prepare(`
        SELECT *
        FROM agua_consumo
        WHERE apartamento_id = ?
        ORDER BY periodo_id DESC
        LIMIT 1
      `).get(apartamento_id);
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
        throw new Error(`Consumo agua ya existe para ${torre}-${apartamento} ${anio}-${mes}`);
      }

      const result = db.prepare(`
        INSERT INTO agua_consumo (
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

    // ✅ MÉTODO CORREGIDO
    upsert({ periodo_id, apartamento_id, lectura_actual, consumo_m3, costo_calculado = 0, observaciones = null }) {
      const existing = db.prepare(`
        SELECT id
        FROM agua_consumo
        WHERE periodo_id = ? AND apartamento_id = ?
      `).get(periodo_id, apartamento_id);

      if (existing) {
        db.prepare(`
          UPDATE agua_consumo
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
          existing.id
        );
        return this.getById(existing.id);
      } else {
        const result = db.prepare(`
          INSERT INTO agua_consumo (
            apartamento_id, 
            periodo_id, 
            lectura_actual,
            consumo_m3,
            costo_calculado,
            observaciones
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          apartamento_id,
          periodo_id,
          toFloat(lectura_actual),
          toFloat(consumo_m3),
          toFloat(costo_calculado),
          observaciones
        );
        return this.getById(result.lastInsertRowid);
      }
    },

    /* =========================
       UPDATE
    ========================== */

    update(id, { lectura_actual, consumo_m3, costo_calculado, observaciones }) {
      db.prepare(`
        UPDATE agua_consumo
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
        DELETE FROM agua_consumo
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