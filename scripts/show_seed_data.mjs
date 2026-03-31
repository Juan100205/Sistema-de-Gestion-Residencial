import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'calleja.db');
const db = new Database(dbPath);

console.log('📊 Verifying Seeded Data...\n');

try {
    // 1. Agua Consumo Summary
    const aguaCount = db.prepare('SELECT COUNT(*) c FROM agua_consumo').get().c;
    console.log(`💧 Agua Consumo Total Records: ${aguaCount}`);

    if (aguaCount > 0) {
        // Group by Year/Month
        const periods = db.prepare(`
            SELECT p.anio_init, p.mes_init, COUNT(*) as count 
            FROM agua_consumo c
            JOIN periodo p ON c.periodo_id = p.id
            GROUP BY p.anio_init, p.mes_init
            ORDER BY p.anio_init DESC, p.mes_init DESC
            LIMIT 10
        `).all();

        console.log('\n📅 Recent Periods (Top 10):');
        console.table(periods);

        // Sample Data
        const samples = db.prepare(`
            SELECT t.nombre as Torre, a.numero as Apto, p.anio_init, p.mes_init, c.lectura_actual, c.consumo_m3
            FROM agua_consumo c
            JOIN apartamentos a ON c.apartamento_id = a.id
            JOIN torres t ON a.torre_id = t.id
            JOIN periodo p ON c.periodo_id = p.id
            LIMIT 5
        `).all();

        console.log('\n📝 Sample Rows:');
        console.table(samples);
    }

    // 2. Gas Consumo Summary
    const gasCount = db.prepare('SELECT COUNT(*) c FROM gas_consumo').get().c;
    console.log(`\n🔥 Gas Consumo Total Records: ${gasCount}`);

} catch (e) {
    console.error('Error querying DB:', e);
}
