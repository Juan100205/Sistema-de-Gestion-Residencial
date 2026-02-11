
import Database from 'better-sqlite3';
import path from 'node:path';

const dbPath = path.join(process.cwd(), 'calleja.db');
const db = new Database(dbPath);

console.log('🚀 Iniciando reset de base de datos en:', dbPath);

// 1. Limpiar todas las tablas
const tables = [
    'facturacion',
    'agua_consumo',
    'gas_consumo',
    'calderas',
    'basurero',
    'zonas_comunes',
    'periodo',
    'apartamentos',
    'torres'
];

db.transaction(() => {
    console.log('🧹 Limpiando tablas (desactivando FKs temporalmente)...');
    db.prepare('PRAGMA foreign_keys = OFF').run();

    for (const table of tables) {
        try {
            db.prepare(`DELETE FROM ${table}`).run();
            console.log(`   ✅ Tabla ${table} vaciada.`);
        } catch (e) {
            console.warn(`   ⚠️ No se pudo limpiar la tabla ${table}: ${e.message}`);
        }
    }

    // Resetear auto-incrementos
    try {
        db.prepare("DELETE FROM sqlite_sequence").run();
        console.log('   ✅ Contadores de ID reseteados.');
    } catch (e) { }

    db.prepare('PRAGMA foreign_keys = ON').run();

    // 2. Insertar Torres
    console.log('🏗️ Insertando torres A, B y C...');
    const insertTorre = db.prepare('INSERT INTO torres (nombre) VALUES (?)');
    const towers = ['A', 'B', 'C'];
    const towerIds = {};

    for (const t of towers) {
        const info = insertTorre.run(t);
        towerIds[t] = info.lastInsertRowid;
    }

    // 3. Estructura de pisos y apartamentos (tomada de RendimientoHome.jsx)
    const floorStructure = {
        2: [1, 2, 3],
        3: [1, 2],
        4: [1, 2, 3, 4],
        5: [1, 2, 3, 4],
        6: [1, 2, 3],
        7: [1, 2],
        8: [1, 2, 3],
        9: [1, 2],
        10: [1, 2, 3, 4],
        11: [1, 2, 3, 4],
        12: [1, 2, 3, 4],
        13: [1, 2]
    };

    console.log('🏢 Poblando apartamentos...');
    const insertApto = db.prepare('INSERT INTO apartamentos (torre_id, numero) VALUES (?, ?)');

    for (const towerName of towers) {
        const tId = towerIds[towerName];
        let count = 0;
        for (const floor in floorStructure) {
            for (const aptoNum of floorStructure[floor]) {
                // Formato: 201, 202, 1001, etc.
                const numero = parseInt(`${floor}0${aptoNum}`);
                insertApto.run(tId, numero);
                count++;
            }
        }
        console.log(`   ✅ Torre ${towerName}: ${count} apartamentos insertados.`);
    }
})();

console.log('✨ Proceso completado con éxito.');
db.close();
