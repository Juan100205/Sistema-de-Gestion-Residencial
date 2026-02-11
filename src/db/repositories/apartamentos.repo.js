// src/main/db/repositories/apartamentos.repo.js

import TorresRepository from './torres.repo.js';

export default function ApartamentosRepository(db) {

  const torresRepo = TorresRepository(db);

  return {

    /* =========================
       GETTERS
    ========================== */

    getAll() {
      return db.prepare(`
        SELECT a.*, t.nombre AS torre
        FROM apartamentos a
        JOIN torres t ON t.id = a.torre_id
        ORDER BY t.nombre, a.numero
      `).all();
    },

    getById(id) {
      return db.prepare(`
        SELECT a.*, t.nombre AS torre
        FROM apartamentos a
        JOIN torres t ON t.id = a.torre_id
        WHERE a.id = ?
      `).get(id);
    },

    getByTorreNumero(torre, numero) {
      const torreClean = normalizeTorre(torre);
      const num = toInt(numero);

      return db.prepare(`
        SELECT a.*, t.nombre AS torre
        FROM apartamentos a
        JOIN torres t ON t.id = a.torre_id
        WHERE t.nombre = ?
          AND a.numero = ?
      `).get(torreClean, num);
    },

    getByTorre(torre) {
      const torreClean = normalizeTorre(torre);

      return db.prepare(`
        SELECT a.*, t.nombre AS torre
        FROM apartamentos a
        JOIN torres t ON t.id = a.torre_id
        WHERE t.nombre = ?
        ORDER BY a.numero
      `).all(torreClean);
    },

    exists(torre, numero) {
      return !!this.getByTorreNumero(torre, numero);
    },

    /* =========================
       CREATE
    ========================== */

    create({ torre, numero, activo = 1, coeficiente = 0 }) {
      const torreClean = normalizeTorre(torre);
      const num = toInt(numero);

      if (!torreClean) {
        throw new Error('La torre es obligatoria');
      }

      if (!num || num <= 0) {
        throw new Error('Número de apartamento inválido');
      }

      // Asegurar torre
      let torreRow = torresRepo.getByNombre(torreClean);
      if (!torreRow) {
        torreRow = torresRepo.create(torreClean);
      }

      if (this.exists(torreClean, num)) {
        throw new Error(`El apartamento ${torreClean}-${num} ya existe`);
      }

      const result = db.prepare(`
        INSERT INTO apartamentos (
          torre_id,
          numero,
          activo,
          coeficiente
        ) VALUES (?, ?, ?, ?)
      `).run(
        torreRow.id,
        num,
        activo ? 1 : 0,
        Number(coeficiente)
      );

      return this.getById(result.lastInsertRowid);
    },

    /* =========================
       UPDATE
    ========================== */

    update(id, { activo, coeficiente }) {
      db.prepare(`
        UPDATE apartamentos
        SET
          activo = ?,
          coeficiente = ?
        WHERE id = ?
      `).run(
        activo ? 1 : 0,
        Number(coeficiente),
        id
      );

      return this.getById(id);
    },

    /* =========================
       DELETE
    ========================== */

    delete(id) {
      db.prepare(`
        DELETE FROM apartamentos
        WHERE id = ?
      `).run(id);
    }
  };
}

/* =========================
   Helpers
========================= */

function normalizeTorre(value) {
  let clean = String(value ?? '').trim().toUpperCase();
  if (clean && clean.length === 1 && /^[A-Z]$/.test(clean)) {
    return `TORRE ${clean}`;
  }
  if (clean && !clean.startsWith('TORRE')) {
    // For cases like "A " or " TORRE A" it handles it above,
    // but if someone passes "B", we want "TORRE B".
    return `TORRE ${clean}`;
  }
  return clean;
}

function toInt(value) {
  return Number.parseInt(String(value).trim(), 10);
}
