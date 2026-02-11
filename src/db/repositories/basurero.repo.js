// src/main/db/repositories/basurero.repo.js

import crypto from 'node:crypto';
import PeriodoRepository from './periodo.repo.js';

export default function BasureroRepository(db) {

  const periodoRepo = PeriodoRepository(db);

  return {

    /* =========================
       GETTERS
    ========================== */

    getAll() {
      try {
        return db.prepare(`
          SELECT bp.*, p.anio_init, p.mes_init, p.anio_end, p.mes_end
          FROM basurero_periodo bp
          JOIN periodo p ON p.id = bp.periodo_id
          ORDER BY p.anio_init DESC, p.mes_init DESC
        `).all();
      } catch (error) {
        console.error("Error en BasureroRepo.getAll:", error);
        return [];
      }
    },

    getByPeriodo(anio, mes) {
      const periodo = periodoRepo.getByYearMonth(anio, mes);
      if (!periodo) return null;
      return this.getByPeriodoId(periodo.id);
    },

    getByPeriodoId(periodoId) {
      return db.prepare(`
        SELECT *
        FROM basurero_periodo
        WHERE periodo_id = ?
      `).get(periodoId);
    },

    exists(anio, mes) {
      return !!this.getByPeriodo(anio, mes);
    },

    existsByPeriodoId(periodoId) {
      const row = db.prepare(`
        SELECT 1 FROM basurero_periodo WHERE periodo_id = ?
      `).get(periodoId);
      return !!row;
    },

    /* =========================
       CREATE SNAPSHOT
    ========================== */

    createSnapshot(anio, mes) {
      const periodo = periodoRepo.getByYearMonth(anio, mes);
      if (!periodo) {
        throw new Error(`Periodo ${anio}-${mes} no existe`);
      }

      if (this.existsByPeriodoId(periodo.id)) {
        console.log(`Snapshot ya existe para periodo ID ${periodo.id}`);
        return { success: false, message: "Snapshot ya existe" };
      }

      const snapshot = this._buildSnapshot(periodo.id);
      const json = JSON.stringify(snapshot);
      const checksum = sha256(json);

      db.prepare(`
        INSERT INTO basurero_periodo (
          periodo_id,
          snapshot_json,
          checksum
        ) VALUES (?, ?, ?)
      `).run(periodo.id, json, checksum);

      return { periodo_id: periodo.id, checksum, success: true };
    },

    /* =========================
       RESTORE DATA
    ========================== */

    getSnapshotData(anio, mes) {
      const row = this.getByPeriodo(anio, mes);
      if (!row) return null;

      try {
        return JSON.parse(row.snapshot_json);
      } catch (e) {
        console.error("Error parseando snapshot JSON:", e);
        return null;
      }
    },

    getSnapshotDataById(periodoId) {
      const row = this.getByPeriodoId(periodoId);
      if (!row) return null;

      try {
        return JSON.parse(row.snapshot_json);
      } catch (e) {
        console.error("Error parseando snapshot JSON por ID:", e);
        return null;
      }
    },

    /* =========================
       INTERNAL
    ========================== */

    _buildSnapshot(periodoId) {
      return {
        periodo: db.prepare(`
          SELECT *
          FROM periodo
          WHERE id = ?
        `).get(periodoId),

        torres: db.prepare(`
          SELECT *
          FROM torres
        `).all(),

        apartamentos: db.prepare(`
          SELECT *
          FROM apartamentos
        `).all(),

        calderas: db.prepare(`
          SELECT *
          FROM calderas
          WHERE periodo_id = ?
        `).all(periodoId),

        agua_consumo: db.prepare(`
          SELECT *
          FROM agua_consumo
          WHERE periodo_id = ?
        `).all(periodoId),

        gas_consumo: db.prepare(`
          SELECT *
          FROM gas_consumo
          WHERE periodo_id = ?
        `).all(periodoId),

        zonas_comunes: db.prepare(`
          SELECT *
          FROM zonas_comunes
          WHERE periodo_id = ?
        `).get(periodoId)
      };
    }
  };
}

/* =========================
   Helpers
========================= */

function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}
