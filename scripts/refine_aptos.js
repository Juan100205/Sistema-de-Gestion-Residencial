
import Database from 'better-sqlite3';
import path from 'node:path';

const dbPath = path.join(process.cwd(), 'calleja.db');
const db = new Database(dbPath);

console.log('🏗️ Refinando estructura de apartamentos según imágenes...');

const towersData = {
    'A': [
        201, 202, 203,
        301, 302,
        401, 402, 403, 404,
        501, 502, 503, 504,
        601, 602, 603,
        701, 702,
        801, 802, 803,
        901, 902,
        1001, 1002, 1003, 1004,
        1101, 1102, 1103, 1104,
        1201, 1202, 1203, 1204,
        1301, 1302
    ],
    'B': [
        201, 202, 203, 204,
        301, 302, 303,
        401, 402, 403,
        501, 502,
        601, 602, 603,
        701, 702, 703,
        801, 802,
        901, 902,
        1001, 1002,
        1101, 1102,
        1201, 1202, 1203, 1204,
        1301, 1302
    ],
    'C': [
        201, 202, 203,
        301, 302, 303,
        401, 402, 403,
        501, 502, 503,
        601, 602, 603,
        701, 702, 703,
        801, 802,
        901, 902,
        1001, 1002,
        1101, 1102,
        1201, 1202,
        1301, 1302
    ]
};

db.transaction(() => {
    // Limpiar datos existentes (FKs OFF para evitar errores si hay algo colgado)
    db.prepare('PRAGMA foreign_keys = OFF').run();
    ['facturacion', 'agua_consumo', 'gas_consumo', 'calderas', 'basurero', 'zonas_comunes', 'periodo', 'apartamentos', 'torres'].forEach(t => {
        db.prepare(`DELETE FROM ${t}`).run();
    });
    db.prepare('DELETE FROM sqlite_sequence').run();

    const insertTorre = db.prepare('INSERT INTO torres (nombre) VALUES (?)');
    const insertApto = db.prepare('INSERT INTO apartamentos (torre_id, numero) VALUES (?, ?)');

    for (const towerName in towersData) {
        const info = insertTorre.run(towerName);
        const towerId = info.lastInsertRowid;
        let count = 0;

        for (const aptoNum of towersData[towerName]) {
            insertApto.run(towerId, aptoNum);
            count++;
        }
        console.log(`✅ Torre ${towerName}: ${count} apartamentos insertados.`);
    }

    db.prepare('PRAGMA foreign_keys = ON').run();
})();

console.log('✨ Base de datos actualizada con los apartamentos exactos.');

// Verificación final
console.log('\n--- RESUMEN FINAL ---');
const total = db.prepare('SELECT count(*) as c FROM apartamentos').get().c;
console.log(`Total apartamentos: ${total}`);
const counts = db.prepare('SELECT t.nombre, count(a.id) as c FROM apartamentos a JOIN torres t ON t.id = a.torre_id GROUP BY t.nombre').all();
counts.forEach(row => console.log(`Torre ${row.nombre}: ${row.c}`));

db.close();
process.exit(0);
