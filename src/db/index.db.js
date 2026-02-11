// src/main/db/index.db.js

import db from './connection.js';

// Schemas
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
  try {
    db.transaction(() => {

      // 1️⃣ Tablas base
      createPeriodoTable(db);
      createTorresTable(db);
      createAuditLogTable(db);

      // 2️⃣ Dependientes directos
      createApartamentosTable(db);
      createCalderasTable(db);
      createZonasComunesTable(db);

      // 3️⃣ Consumos
      createAguaConsumoTable(db);
      createGasConsumoTable(db);

      // 4️⃣ Snapshot / cache
      // 4️⃣ Snapshot / cache / Facturacion
      createFacturacionTable(db);
      createBasureroTable(db);

      // 🌱 Seed inicial
      seedInitialData(db);

    })();

    console.log('✅ DB inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando DB', error);
    throw error;
  }
}

export { db };
