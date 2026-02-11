// src/main/db/repositories/zonasComunes.repo.js

import PeriodoRepository from './periodo.repo.js';

export default function ZonasComunesRepository(db) {

  const periodoRepo = PeriodoRepository(db);

  return {

    /* =========================
       GETTERS
    ========================== */

    getAll() {
      return db.prepare(`
        SELECT zc.*,
               p.anio_init,
               p.mes_init
        FROM zonas_comunes zc
        JOIN periodo p ON p.id = zc.periodo_id
        ORDER BY p.anio_init, p.mes_init
      `).all();
    },

    getById(id) {
      return db.prepare(`
        SELECT *
        FROM zonas_comunes
        WHERE id = ?
      `).get(id);
    },

    getByPeriodo(anio, mes) {
      const periodo = periodoRepo.getByYearMonth(anio, mes);
      if (!periodo) return null;

      return db.prepare(`
        SELECT *
        FROM zonas_comunes
        WHERE periodo_id = ?
      `).get(periodo.id);
    },

    exists(anio, mes) {
      return !!this.getByPeriodo(anio, mes);
    },

    /* =========================
       CREATE
    ========================== */

    create({
      anio,
      mes,
      consumo_agua_m3 = 0,
      consumo_gas_m3 = 0,
      observaciones = null
    }) {
      const periodo = periodoRepo.getByYearMonth(anio, mes);
      if (!periodo) {
        throw new Error(`Periodo ${anio}-${mes} no existe`);
      }

      if (this.exists(anio, mes)) {
        throw new Error(`Zonas comunes ya existen para ${anio}-${mes}`);
      }

      const result = db.prepare(`
        INSERT INTO zonas_comunes (
          periodo_id,
          consumo_agua_m3,
          consumo_gas_m3,
          observaciones
        ) VALUES (?, ?, ?, ?)
      `).run(
        periodo.id,
        toFloat(consumo_agua_m3),
        toFloat(consumo_gas_m3),
        observaciones
      );

      return this.getById(result.lastInsertRowid);
    },

    /* =========================
       UPDATE
    ========================== */

    update(id, { consumo_agua_m3, consumo_gas_m3, observaciones }) {
      db.prepare(`
        UPDATE zonas_comunes
        SET
          consumo_agua_m3 = ?,
          consumo_gas_m3 = ?,
          observaciones = ?
        WHERE id = ?
      `).run(
        toFloat(consumo_agua_m3),
        toFloat(consumo_gas_m3),
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
        DELETE FROM zonas_comunes
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
