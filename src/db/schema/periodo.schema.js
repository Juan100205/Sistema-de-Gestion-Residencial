export function createPeriodoTable(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS periodo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      anio_init INTEGER NOT NULL,
      mes_init INTEGER NOT NULL,
      anio_end INTEGER NOT NULL,
      mes_end INTEGER NOT NULL,

      precio_m3_agua REAL NOT NULL,
      precio_m3_gas REAL NOT NULL,
      coeficiente_general REAL NOT NULL,
      alertas REAL NOT NULL,

      -- Nuevos campos solicitados
      gas_total_torre_a REAL DEFAULT 0, -- Factura $
      gas_m3_torre_a REAL DEFAULT 0,    -- Consumo m3
      gas_total_torre_b REAL DEFAULT 0, -- Factura $
      gas_m3_torre_b REAL DEFAULT 0,    -- Consumo m3
      gas_total_torre_c REAL DEFAULT 0, -- Factura $
      gas_m3_torre_c REAL DEFAULT 0,    -- Consumo m3
      agua_total_residencia REAL DEFAULT 0, -- Factura $ (Principal)
      agua_total_bandeja REAL DEFAULT 0,    -- Factura $ (Bandeja gas)
      agua_m3_total_residencia REAL DEFAULT 0, -- Consumo m3 total
      agua_total_comunes REAL DEFAULT 0, -- Factura $ comunes
      agua_m3_comunes REAL DEFAULT 0, -- Consumo m3 comunes
      gas_total_comunes REAL DEFAULT 0, -- Factura $ comunes
      gas_m3_comunes REAL DEFAULT 0, -- Consumo m3 comunes
      agua_m3_torre_a REAL DEFAULT 0, -- Consumo m3 Torre A
      agua_m3_torre_b REAL DEFAULT 0, -- Consumo m3 Torre B
      agua_m3_torre_c REAL DEFAULT 0, -- Consumo m3 Torre C
      agua_m3_eeab REAL DEFAULT 0,    -- Consumo m3 EEAB (nuevo)
      gas_m3_zonas_humedas REAL DEFAULT 0, -- Consumo m3 Zonas Húmedas (Gas)
      gas_total_zonas_humedas REAL DEFAULT 0, -- Factura $ Zonas Húmedas (Gas)
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      CHECK (mes_init BETWEEN 1 AND 12),
      CHECK (mes_end BETWEEN 1 AND 12),
      CHECK (precio_m3_agua >= 0),
      CHECK (precio_m3_gas >= 0),
      CHECK (coeficiente_general >= 0),

      UNIQUE (anio_init, mes_init, anio_end, mes_end)
    )
  `).run();

  // Migración: Agregar columnas si no existen
  const columns = db.prepare("PRAGMA table_info(periodo)").all();
  const columnNames = columns.map(c => c.name);

  const newColumns = [
    { name: 'gas_total_torre_a', type: 'REAL DEFAULT 0' },
    { name: 'gas_m3_torre_a', type: 'REAL DEFAULT 0' },
    { name: 'gas_total_torre_b', type: 'REAL DEFAULT 0' },
    { name: 'gas_m3_torre_b', type: 'REAL DEFAULT 0' },
    { name: 'gas_total_torre_c', type: 'REAL DEFAULT 0' },
    { name: 'gas_m3_torre_c', type: 'REAL DEFAULT 0' },
    { name: 'agua_total_residencia', type: 'REAL DEFAULT 0' },
    { name: 'agua_total_bandeja', type: 'REAL DEFAULT 0' },
    { name: 'agua_m3_total_residencia', type: 'REAL DEFAULT 0' },
    { name: 'agua_total_comunes', type: 'REAL DEFAULT 0' },
    { name: 'agua_m3_comunes', type: 'REAL DEFAULT 0' },
    { name: 'gas_total_comunes', type: 'REAL DEFAULT 0' },
    { name: 'gas_m3_comunes', type: 'REAL DEFAULT 0' },
    { name: 'agua_m3_torre_a', type: 'REAL DEFAULT 0' },
    { name: 'agua_m3_torre_b', type: 'REAL DEFAULT 0' },
    { name: 'agua_m3_torre_c', type: 'REAL DEFAULT 0' },
    { name: 'agua_m3_eeab', type: 'REAL DEFAULT 0' },
    { name: 'gas_m3_zonas_humedas', type: 'REAL DEFAULT 0' },
    { name: 'gas_total_zonas_humedas', type: 'REAL DEFAULT 0' },
    { name: 'created_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
    { name: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
  ];

  newColumns.forEach(col => {
    if (!columnNames.includes(col.name)) {
      try {
        db.exec(`ALTER TABLE periodo ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Columna agregada: ${col.name}`);
      } catch (e) {
        console.error(`Error agregando columna ${col.name}:`, e.message);
      }
    }
  });
}
