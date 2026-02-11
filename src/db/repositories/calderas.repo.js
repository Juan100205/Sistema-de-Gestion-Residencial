// src/main/db/repositories/calderas.repo.js

import TorresRepository from './torres.repo.js';
import PeriodoRepository from './periodo.repo.js';

export default function CalderasRepository(db) {

  const torresRepo = TorresRepository(db);
  const periodoRepo = PeriodoRepository(db);

  return {

    /* =========================
       GETTERS
    ========================== */

    getAll() {
      return db.prepare(`
        SELECT c.*,
               t.nombre AS torre,
               p.anio_init,
               p.mes_init
        FROM calderas c
        JOIN torres t ON t.id = c.torre_id
        JOIN periodo p ON p.id = c.periodo_id
        ORDER BY p.anio_init, p.mes_init, t.nombre
      `).all();
    },

    getById(id) {
      return db.prepare(`
        SELECT c.*,
               t.nombre AS torre,
               p.anio_init,
               p.mes_init
        FROM calderas c
        JOIN torres t ON t.id = c.torre_id
        JOIN periodo p ON p.id = c.periodo_id
        WHERE c.id = ?
      `).get(id);
    },

    getByTorrePeriodo(torre, anio, mes) {
      const torreClean = normalize(torre);

      const periodo = periodoRepo.getByYearMonth(anio, mes);
      if (!periodo) return null;

      return db.prepare(`
        SELECT *
        FROM calderas
        WHERE torre_id = ?
          AND periodo_id = ?
      `).get(
        torresRepo.getByNombre(torreClean)?.id,
        periodo.id
      );
    },

    exists(torre, anio, mes) {
      return !!this.getByTorrePeriodo(torre, anio, mes);
    },

    /* =========================
       CREATE
    ========================== */

    create({
      torre,
      anio,
      mes,
      consumo_m3_agua = 0,
      consumo_m3_gas = 0
    }) {
      const torreClean = normalize(torre);

      if (!torreClean) {
        throw new Error('Torre obligatoria');
      }

      const periodo = periodoRepo.getByYearMonth(anio, mes);
      if (!periodo) {
        throw new Error(`Periodo ${anio}-${mes} no existe`);
      }

      let torreRow = torresRepo.getByNombre(torreClean);
      if (!torreRow) {
        torreRow = torresRepo.create(torreClean);
      }

      if (this.exists(torreClean, anio, mes)) {
        throw new Error(`Caldera ya existe para ${torreClean} ${anio}-${mes}`);
      }

      const result = db.prepare(`
        INSERT INTO calderas (
          torre_id,
          periodo_id,
          consumo_m3_agua,
          consumo_m3_gas
        ) VALUES (?, ?, ?, ?)
      `).run(
        torreRow.id,
        periodo.id,
        toFloat(consumo_m3_agua),
        toFloat(consumo_m3_gas)
      );

      return this.getById(result.lastInsertRowid);
    },

    /* =========================
       UPDATE
    ========================== */

    update(id, { consumo_m3_agua, consumo_m3_gas }) {
      db.prepare(`
        UPDATE calderas
        SET
          consumo_m3_agua = ?,
          consumo_m3_gas = ?
        WHERE id = ?
      `).run(
        toFloat(consumo_m3_agua),
        toFloat(consumo_m3_gas),
        id
      );

      return this.getById(id);
    },

    /* =========================
       DELETE
    ========================== */

    delete(id) {
      db.prepare(`
        DELETE FROM calderas
        WHERE id = ?
      `).run(id);
    }
  };
}

/* =========================
   Helpers
========================= */

function normalize(value) {
  return String(value ?? '').trim().toUpperCase();
}

function toFloat(value) {
  return Number.parseFloat(String(value ?? '0').trim());
}
