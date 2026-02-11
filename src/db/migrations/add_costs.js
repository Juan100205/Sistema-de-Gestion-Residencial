import Database from 'better-sqlite3';
import path from 'path';

console.log('🔄 Iniciando Migración Manual de Costos (Standalone)...');

// Explicit DB Path to avoid importing connection.js which uses Electron
const dbPath = path.join(process.cwd(), 'calleja.db');
console.log('📦 DB path:', dbPath);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// 1. Agregar columnas a agua_consumo
try {
    db.exec("ALTER TABLE agua_consumo ADD COLUMN costo_calculado REAL DEFAULT 0");
    console.log("✅ Added costo_calculado to agua_consumo");
} catch (e) {
    if (e.message.includes("duplicate column name")) console.log("ℹ️ costo_calculado already in agua_consumo");
    else console.error("❌ Error agua_consumo:", e.message);
}

// 2. Agregar columnas a gas_consumo
try {
    db.exec("ALTER TABLE gas_consumo ADD COLUMN costo_calculado REAL DEFAULT 0");
    console.log("✅ Added costo_calculado to gas_consumo");
} catch (e) {
    if (e.message.includes("duplicate column name")) console.log("ℹ️ costo_calculado already in gas_consumo");
    else console.error("❌ Error gas_consumo:", e.message);
}

// 3. Crear tabla facturacion (Inline Schema)
try {
    db.prepare(`
    CREATE TABLE IF NOT EXISTS facturacion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      apartamento_id INTEGER NOT NULL,
      periodo_id INTEGER NOT NULL,
      
      costo_agua REAL NOT NULL DEFAULT 0,
      costo_gas REAL NOT NULL DEFAULT 0,
      costo_total REAL NOT NULL DEFAULT 0,
      
      UNIQUE(apartamento_id, periodo_id),
      
      FOREIGN KEY (apartamento_id) 
        REFERENCES apartamentos(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
        
      FOREIGN KEY (periodo_id) 
        REFERENCES periodo(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
    )
  `).run();
    console.log("✅ Tabla facturacion verificada/creada");
} catch (e) {
    console.error("❌ Error facturacion:", e.message);
}

console.log('🏁 Migración Finalizada.');
process.exit(0);
