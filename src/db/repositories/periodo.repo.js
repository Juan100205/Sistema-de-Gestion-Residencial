// src/main/db/repositories/periodo.repo.js

export default function PeriodoRepository(db) {

  return {

    /* =========================
       GETTERS
    ========================== */

    getAll() {
      return db.prepare(`
        SELECT *
        FROM periodo
        WHERE id != 1
        ORDER BY anio_init DESC, mes_init DESC
      `).all();
    },

    getById(id) {
      return db.prepare(`
        SELECT *
        FROM periodo
        WHERE id = ?
      `).get(id);
    },

    getByYearMonth(anio, mes) {
      const y = toInt(anio);
      const m = toInt(mes);

      return db.prepare(`
        SELECT *
        FROM periodo
        WHERE anio_end = ?
          AND mes_end = ?
      `).get(y, m);
    },

    getPeriodoActivo() {
      return db.prepare(`
        SELECT *
        FROM periodo
        ORDER BY anio_end DESC, mes_end DESC
        LIMIT 1
      `).get();
    },

    getUltimoPeriodoConDatos() {
      return db.prepare(`
        SELECT p.*
        FROM periodo p
        WHERE p.id != 1 AND EXISTS (
          SELECT 1 FROM agua_consumo ac WHERE ac.periodo_id = p.id
        )
        ORDER BY p.anio_end DESC, p.mes_end DESC
        LIMIT 1
      `).get();
    },

    exists(anioInit, mesInit, anioEnd, mesEnd) {
      const yi = toInt(anioInit);
      const mi = toInt(mesInit);
      const ye = toInt(anioEnd);
      const me = toInt(mesEnd);

      const row = db.prepare(`
        SELECT 1
        FROM periodo
        WHERE anio_init = ? AND mes_init = ?
          AND anio_end = ? AND mes_end = ?
      `).get(yi, mi, ye, me);

      return !!row;
    },

    getLast() {
      return db.prepare(`
        SELECT *
        FROM periodo
        ORDER BY anio_end DESC, mes_end DESC
        LIMIT 1
      `).get();
    },

    getPrevious(anio, mes) {
      const y = toInt(anio);
      const m = toInt(mes);

      const result = db.prepare(`
        SELECT *
        FROM periodo
        WHERE id != 1 AND ((anio_end < ?) OR (anio_end = ? AND mes_end < ?))
        ORDER BY anio_end DESC, mes_end DESC
        LIMIT 1
      `).get(y, y, m);

      return result;
    },

    /* =========================
       CREATE
    ========================== */

    create(data) {
      // ✅ CAMBIO: Acepta tanto el formato antiguo (anio/mes) como el nuevo (anio_init/mes_init)
      const anioInit = toInt(data.anio_init ?? data.anio);
      const mesInit = toInt(data.mes_init ?? data.mes);
      const anioEnd = toInt(data.anio_end ?? data.anio);
      const mesEnd = toInt(data.mes_end ?? data.mes);

      // Validar que no sean NaN
      if (isNaN(anioInit) || isNaN(mesInit) || isNaN(anioEnd) || isNaN(mesEnd)) {
        throw new Error(
          `Valores de fecha inválidos: ` +
          `anio_init=${data.anio_init}, mes_init=${data.mes_init}, ` +
          `anio_end=${data.anio_end}, mes_end=${data.mes_end}`
        );
      }

      if (this.exists(anioInit, mesInit, anioEnd, mesEnd)) {
        throw new Error(`Periodo ${anioInit}-${mesInit} a ${anioEnd}-${mesEnd} ya existe`);
      }

      const result = db.prepare(`
        INSERT INTO periodo (
          anio_init, mes_init,
          anio_end, mes_end,
          precio_m3_agua,
          precio_m3_gas,
          coeficiente_general,
          alertas,
          gas_total_torre_a,
          gas_m3_torre_a,
          gas_total_torre_b,
          gas_m3_torre_b,
          gas_total_torre_c,
          gas_m3_torre_c,
          agua_total_residencia,
          agua_total_bandeja,
          agua_m3_total_residencia,
          agua_total_comunes,
          agua_m3_comunes,
          gas_total_comunes,
          gas_m3_comunes,
          agua_m3_torre_a,
          agua_m3_torre_b,
          agua_m3_torre_c,
          agua_m3_eeab,
          gas_m3_zonas_humedas,
          gas_total_zonas_humedas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        anioInit,
        mesInit,
        anioEnd,
        mesEnd,
        toFloat(data.precio_m3_agua),
        toFloat(data.precio_m3_gas),
        toFloat(data.coeficiente_general ?? 1),
        toFloat(data.alertas ?? 0),
        toFloat(data.gas_total_torre_a ?? 0),
        toFloat(data.gas_m3_torre_a ?? 0),
        toFloat(data.gas_total_torre_b ?? 0),
        toFloat(data.gas_m3_torre_b ?? 0),
        toFloat(data.gas_total_torre_c ?? 0),
        toFloat(data.gas_m3_torre_c ?? 0),
        toFloat(data.agua_total_residencia ?? 0),
        toFloat(data.agua_total_bandeja ?? 0),
        toFloat(data.agua_m3_total_residencia ?? 0),
        toFloat(data.agua_total_comunes ?? 0),
        toFloat(data.agua_m3_comunes ?? 0),
        toFloat(data.gas_total_comunes ?? 0),
        toFloat(data.gas_m3_comunes ?? 0),
        toFloat(data.agua_m3_torre_a ?? 0),
        toFloat(data.agua_m3_torre_b ?? 0),
        toFloat(data.agua_m3_torre_c ?? 0),
        toFloat(data.agua_m3_eeab ?? 0),
        toFloat(data.gas_m3_zonas_humedas ?? 0),
        toFloat(data.gas_total_zonas_humedas ?? 0)
      );

      const newPeriodoId = result.lastInsertRowid;

      // Log Event
      db.prepare(`
        INSERT INTO audit_logs (entity_type, entity_id, entity_name, action, description)
        VALUES (?, ?, ?, ?, ?)
      `).run('periodo', newPeriodoId, `Periodo ${anioEnd}-${mesEnd}`, 'CREATION', 'Creación inicial del periodo');

      return this.getById(newPeriodoId);
    },

    /* =========================
       UPDATE
    ========================== */

    update(id, data) {

      db.prepare(`
        UPDATE periodo
        SET
          precio_m3_agua = ?,
          precio_m3_gas = ?,
          coeficiente_general = ?,
          alertas = ?,
          gas_total_torre_a = ?,
          gas_m3_torre_a = ?,
          gas_total_torre_b = ?,
          gas_m3_torre_b = ?,
          gas_total_torre_c = ?,
          gas_m3_torre_c = ?,
          agua_total_residencia = ?,
          agua_m3_total_residencia = ?,
          agua_total_comunes = ?,
          agua_m3_comunes = ?,
          gas_total_comunes = ?,
          gas_m3_comunes = ?,
          agua_m3_torre_a = ?,
          agua_m3_torre_b = ?,
          agua_m3_torre_c = ?,
          agua_m3_eeab = ?,
          gas_m3_zonas_humedas = ?,
          gas_total_zonas_humedas = ?
        WHERE id = ?
      `).run(
        toFloat(data.precio_m3_agua),
        toFloat(data.precio_m3_gas),
        toFloat(data.coeficiente_general),
        toFloat(data.alertas),
        toFloat(data.gas_total_torre_a),
        toFloat(data.gas_m3_torre_a),
        toFloat(data.gas_total_torre_b),
        toFloat(data.gas_m3_torre_b),
        toFloat(data.gas_total_torre_c),
        toFloat(data.gas_m3_torre_c),
        toFloat(data.agua_total_residencia),
        toFloat(data.agua_m3_total_residencia),
        toFloat(data.agua_total_comunes),
        toFloat(data.agua_m3_comunes),
        toFloat(data.gas_total_comunes),
        toFloat(data.gas_m3_comunes),
        toFloat(data.agua_m3_torre_a),
        toFloat(data.agua_m3_torre_b),
        toFloat(data.agua_m3_torre_c),
        toFloat(data.agua_m3_eeab),
        toFloat(data.gas_m3_zonas_humedas),
        toFloat(data.gas_total_zonas_humedas),
        id
      );

      // Log Event
      db.prepare(`
        INSERT INTO audit_logs (entity_type, entity_id, entity_name, action, description)
        VALUES (?, ?, ?, ?, ?)
      `).run('periodo', id, `Periodo ID ${id}`, 'UPDATE', 'Actualización de variables de entorno');

      return this.getById(id);
    },

    resetEnvVars(id) {
      db.prepare(`
        UPDATE periodo
        SET
          precio_m3_agua = 0,
          precio_m3_gas = 0,
          coeficiente_general = 0,
          alertas = 0,
          gas_total_torre_a = 0,
          gas_m3_torre_a = 0,
          gas_total_torre_b = 0,
          gas_m3_torre_b = 0,
          gas_total_torre_c = 0,
          gas_m3_torre_c = 0,
          agua_total_residencia = 0,
          agua_m3_total_residencia = 0,
          agua_total_comunes = 0,
          agua_m3_comunes = 0,
          gas_total_comunes = 0,
          gas_m3_comunes = 0,
          agua_m3_torre_a = 0,
          agua_m3_torre_b = 0,
          agua_m3_torre_c = 0,
          agua_m3_eeab = 0,
          gas_m3_zonas_humedas = 0,
          gas_m3_zonas_humedas = 0,
          gas_total_zonas_humedas = 0
        WHERE id = ?
      `).run(id);

      // Log Event
      db.prepare(`
        INSERT INTO audit_logs (entity_type, entity_id, entity_name, action, description)
        VALUES (?, ?, ?, ?, ?)
      `).run('periodo', id, `Periodo ID ${id}`, 'RESET', 'Reinicio de medidores principales');

      return this.getById(id);
    },

    /* =========================
       DELETE (raro, pero existe)
    ========================== */

    delete(id) {
      const transaction = db.transaction(() => {
        const periodo = db.prepare('SELECT * FROM periodo WHERE id = ?').get(id);
        const name = periodo ? `${periodo.anio_end}-${periodo.mes_end}` : 'Desconocido';

        // Eliminar dependencias manualmente debido a ON DELETE RESTRICT
        db.prepare(`DELETE FROM agua_consumo WHERE periodo_id = ?`).run(id);
        db.prepare(`DELETE FROM gas_consumo WHERE periodo_id = ?`).run(id);
        db.prepare(`DELETE FROM calderas WHERE periodo_id = ?`).run(id);
        db.prepare(`DELETE FROM zonas_comunes WHERE periodo_id = ?`).run(id);
        db.prepare(`DELETE FROM basurero_periodo WHERE periodo_id = ?`).run(id);

        // Finalmente eliminar el periodo
        db.prepare(`
          DELETE FROM periodo
          WHERE id = ?
        `).run(id);

        // Log Event (After delete, ID is null/ref, but we store name)
        db.prepare(`
            INSERT INTO audit_logs (entity_type, entity_id, entity_name, action, description)
            VALUES (?, ?, ?, ?, ?)
        `).run('periodo', id, name, 'DELETION', 'Eliminación completa del periodo');

      });

      transaction();
    }

  };
}

/* =========================
   Helpers
========================= */

function toInt(value) {
  if (value === null || value === undefined) return NaN;
  return Number.parseInt(String(value).trim(), 10);
}

function toFloat(value) {
  if (value === null || value === undefined) return NaN;
  return Number.parseFloat(String(value).trim());
}