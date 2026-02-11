// src/db/reset_db.js
import Database from 'better-sqlite3';
import path from 'node:path';

// Connect directly to the database file in the root
const dbPath = path.join(process.cwd(), 'calleja.db');
const db = new Database(dbPath);

console.log(`🧹 Iniciando vaciado de base de datos en: ${dbPath}`);

try {
    db.transaction(() => {
        // 1. Desactivar llaves foráneas
        db.pragma('foreign_keys = OFF');

        const tables = [
            'audit_logs',
            'basurero',
            'facturacion',
            'gas_consumo',
            'agua_consumo',
            'calderas',
            'zonas_comunes',
            'apartamentos',
            'torres',
            'periodo'
        ];

        for (const table of tables) {
            try {
                db.prepare(`DELETE FROM ${table}`).run();
                db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
                console.log(`  - Tabla ${table} vaciada.`);
            } catch (e) {
                // Silently skip if table doesn't exist
            }
        }

        db.pragma('foreign_keys = ON');

        console.log('🌱 Re-sembrando estructura básica...');

        // Inlining the seed logic to avoid Electron-related imports
        const torres = ['TORRE A', 'TORRE B', 'TORRE C'];
        const torreIds = {};
        torres.forEach(t => {
            torreIds[t] = db.prepare(`INSERT INTO torres (nombre) VALUES (?)`).run(t).lastInsertRowid;
        });

        const aptoMap = {
            2: [1, 2, 3], 3: [1, 2], 4: [1, 2, 3, 4], 5: [1, 2, 3, 4],
            6: [1, 2, 3], 7: [1, 2], 8: [1, 2, 3], 9: [1, 2],
            10: [1, 2, 3, 4], 11: [1, 2, 3, 4], 12: [1, 2, 3, 4], 13: [1, 2]
        };

        ['TORRE A', 'TORRE B', 'TORRE C'].forEach(torre => {
            for (const [piso, numeros] of Object.entries(aptoMap)) {
                for (const num of numeros) {
                    const numeroApto = parseInt(`${piso}${num.toString().padStart(2, '0')}`);
                    db.prepare(`
                INSERT INTO apartamentos (torre_id, numero, activo, coeficiente)
                VALUES (?, ?, 1, 1.0)
                `).run(torreIds[torre], numeroApto);
                }
            }
        });

        console.log('✅ Base de datos reseteada con éxito.');
    })();
} catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
} finally {
    db.close();
}
