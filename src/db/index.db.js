import getDatabase from './connection.js';
import { log, logError } from '../utils/logger';

// Schemas
// ... existing imports ...
import { createPeriodoTable } from './schema/periodo.schema.js';
import { createTorresTable } from './schema/torres.schema.js';
import { createApartamentosTable } from './schema/apartamentos.schema.js';
import { createCalderasTable } from './schema/calderas.schema.js';
import { createZonasComunesTable } from './schema/zonasComunes.schema.js';
import { createAguaConsumoTable } from './schema/aguaConsumo.schema.js';
import { createGasConsumoTable } from './schema/gasConsumo.schema.js';
import { createBasureroTable } from './schema/basurero.schema.js';
import { createFacturacionTable } from './schema/facturacion.schema.js';
import { createAuditLogTable } from './schema/auditLog.schema.js';

// Seed
import { seedInitialData } from './seeds/seed.initial.js';

export function initDatabase() {
  log('Starting database initialization...');
  try {
    const db = getDatabase();
    log(`[DB Init] DB Object acquired. Type: ${typeof db}, IsNull? ${db === null}`);
    if (db) {
      log(`[DB Init] DB keys: ${Object.keys(db).join(',')}`);
      log(`[DB Init] db.transaction type: ${typeof db.transaction}`);
    }
    db.transaction(() => {

      // 1️⃣ Tablas base
      log('Creating base tables...');
      createPeriodoTable(db);
      createTorresTable(db);
      createAuditLogTable(db);

      // 2️⃣ Dependientes directos
      log('Creating dependent tables...');
      createApartamentosTable(db);
      createCalderasTable(db);
      createZonasComunesTable(db);

      // 3️⃣ Consumos
      log('Creating consumption tables...');
      createAguaConsumoTable(db);
      createGasConsumoTable(db);

      // 4️⃣ Snapshot / cache / Facturacion
      log('Creating billing and cache tables...');
      createFacturacionTable(db);
      createBasureroTable(db);

      // 🌱 Seed inicial
      log('Seeding initial data...');
      seedInitialData(db);

    })();

    log('✅ Database initialized successfully');
  } catch (error) {
    logError('❌ Error initializing DB: ' + error.message);
    throw error;
  }
}

export { getDatabase as db };
