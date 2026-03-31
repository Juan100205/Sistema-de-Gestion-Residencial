import { db } from './src/db/index.db.js';
import BasureroRepository from './src/db/repositories/basurero.repo.js';

const database = db();
const basureroRepo = BasureroRepository(database);

try {
    database.pragma('foreign_keys = OFF');
    console.log("FK OFF");

    database.transaction(() => {
        const allPeriodos = database.prepare('SELECT id, anio_end, mes_end FROM periodo WHERE id != 1').all();
        console.log("Active periods found:", allPeriodos.length);

        for (const p of allPeriodos) {
            if (!basureroRepo.existsByPeriodoId(p.id)) {
                basureroRepo.createSnapshot(p.anio_end, p.mes_end);
            }
        }

        const tables = [
            'facturacion',
            'gas_consumo',
            'agua_consumo',
            'audit_logs',
            'calderas',
            'zonas_comunes',
            'apartamentos',
            'torres',
            'periodo'
        ];

        tables.forEach(table => {
            try {
                database.prepare(`DELETE FROM ${table}`).run();
                database.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
                console.log("Deleted", table);
            } catch (e) {
                console.error("Error deleting table", table, e.message);
            }
        });
    })();
    console.log("Reset successful");
} catch (e) {
    console.error("Overall error:", e);
} finally {
    database.pragma('foreign_keys = ON');
    console.log("FK ON");
}
