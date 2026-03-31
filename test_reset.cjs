const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'calleja.db');
const db = new Database(dbPath);

console.log('Testing reset functionality...');

try {
    db.pragma('foreign_keys = OFF');
    console.log('FK OFF configured');

    db.transaction(() => {
        const tables = [
            'facturacion',
            'gas_consumo',
            'agua_consumo',
            'audit_logs',
            'calderas',
            'zonas_comunes',
            'apartamentos',
            'torres',
            'periodo' // ← This is the one we want to test
        ];

        tables.forEach(table => {
            try {
                db.prepare(`DELETE FROM ${table}`).run();
                db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
                console.log(`✅ Deleted table: ${table}`);
            } catch (e) {
                console.error(`❌ Error deleting table ${table}:`, e.message);
            }
        });
    })();
} catch (e) {
    console.error('Transaction Error:', e);
} finally {
    db.pragma('foreign_keys = ON');
    console.log('FK ON configured');
    db.close();
}
