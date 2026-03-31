// server/initDb.js — Initialize DB schema without Electron dependency
import { createPeriodoTable } from '../src/db/schema/periodo.schema.js';
import { createTorresTable } from '../src/db/schema/torres.schema.js';
import { createApartamentosTable } from '../src/db/schema/apartamentos.schema.js';
import { createCalderasTable } from '../src/db/schema/calderas.schema.js';
import { createZonasComunesTable } from '../src/db/schema/zonasComunes.schema.js';
import { createAguaConsumoTable } from '../src/db/schema/aguaConsumo.schema.js';
import { createGasConsumoTable } from '../src/db/schema/gasConsumo.schema.js';
import { createBasureroTable } from '../src/db/schema/basurero.schema.js';
import { createFacturacionTable } from '../src/db/schema/facturacion.schema.js';
import { createAuditLogTable } from '../src/db/schema/auditLog.schema.js';
import { seedInitialData } from '../src/db/seeds/seed.initial.js';

export function initDatabase(database) {
  console.log('[DB Init] Starting database initialization...');
  try {
    database.transaction(() => {
      createPeriodoTable(database);
      createTorresTable(database);
      createAuditLogTable(database);
      createApartamentosTable(database);
      createCalderasTable(database);
      createZonasComunesTable(database);
      createAguaConsumoTable(database);
      createGasConsumoTable(database);
      createFacturacionTable(database);
      createBasureroTable(database);
      seedInitialData(database);
    })();

    // Auto-migrations
    try { database.exec("ALTER TABLE agua_consumo ADD COLUMN costo_calculado REAL DEFAULT 0"); } catch (_) {}
    try { database.exec("ALTER TABLE gas_consumo ADD COLUMN costo_calculado REAL DEFAULT 0"); } catch (_) {}
    try {
      database.prepare(`
        CREATE TABLE IF NOT EXISTS facturacion (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          apartamento_id INTEGER NOT NULL,
          periodo_id INTEGER NOT NULL,
          costo_agua REAL NOT NULL DEFAULT 0,
          costo_gas REAL NOT NULL DEFAULT 0,
          costo_total REAL NOT NULL DEFAULT 0,
          UNIQUE(apartamento_id, periodo_id),
          FOREIGN KEY (apartamento_id) REFERENCES apartamentos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
          FOREIGN KEY (periodo_id) REFERENCES periodo(id) ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `).run();
    } catch (_) {}

    console.log('[DB Init] Database initialized successfully.');
  } catch (error) {
    console.error('[DB Init] Error initializing DB:', error.message);
    throw error;
  }
}
