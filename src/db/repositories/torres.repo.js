// src/main/db/repositories/torres.repo.js

export default function TorresRepository(db) {

  return {

    /* =========================
       GETTERS
    ========================== */

    getAll() {
      return db.prepare(`
        SELECT *
        FROM torres
        ORDER BY nombre
      `).all();
    },

    getById(id) {
      return db.prepare(`
        SELECT *
        FROM torres
        WHERE id = ?
      `).get(id);
    },

    getByNombre(nombre) {
      const clean = normalize(nombre);

      return db.prepare(`
        SELECT *
        FROM torres
        WHERE nombre = ?
      `).get(clean);
    },

    exists(nombre) {
      return !!this.getByNombre(nombre);
    },

    /* =========================
       CREATE
    ========================== */

    create(nombre) {
      const clean = normalize(nombre);

      if (!clean) {
        throw new Error('El nombre de la torre es obligatorio');
      }

      if (this.exists(clean)) {
        throw new Error(`La torre "${clean}" ya existe`);
      }

      const result = db.prepare(`
        INSERT INTO torres (nombre)
        VALUES (?)
      `).run(clean);

      return this.getById(result.lastInsertRowid);
    },

    /* =========================
       UPDATE
    ========================== */

    update(id, nombre) {
      const clean = normalize(nombre);

      if (!clean) {
        throw new Error('El nombre de la torre es obligatorio');
      }

      db.prepare(`
        UPDATE torres
        SET nombre = ?
        WHERE id = ?
      `).run(clean, id);

      return this.getById(id);
    },

    /* =========================
       DELETE
    ========================== */

    delete(id) {
      db.prepare(`
        DELETE FROM torres
        WHERE id = ?
      `).run(id);
    }
  };
}

/* =========================
   Helpers
========================= */

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase();
}
