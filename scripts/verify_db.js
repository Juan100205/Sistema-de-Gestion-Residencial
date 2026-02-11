
import Database from 'better-sqlite3';
import path from 'node:path';

const dbPath = path.join(process.cwd(), 'calleja.db');
const db = new Database(dbPath);

console.log('--- DETAILED APARTMENT VERIFICATION ---');
try {
    const towers = db.prepare('SELECT nombre, id FROM torres ORDER BY nombre').all();
    for (const t of towers) {
        const count = db.prepare('SELECT count(*) as c FROM apartamentos WHERE torre_id = ?').get(t.id).c;
        console.log(`Torre ${t.nombre}: ${count} apartamentos`);

        // Opcional: listar los números para estar 100% seguros
        const nums = db.prepare('SELECT numero FROM apartamentos WHERE torre_id = ? ORDER BY numero').all(t.id);
        console.log(`   Números: ${nums.map(n => n.numero).join(', ')}`);
    }

    const total = db.prepare('SELECT count(*) as c FROM apartamentos').get().c;
    console.log(`\nTOTAL GENERAL: ${total} apartamentos`);
} catch (e) {
    console.log('Error:', e.message);
}
db.close();
