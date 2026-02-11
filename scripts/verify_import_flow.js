
const XLSX = require('xlsx');
const path = require('path');
const Database = require('better-sqlite3');

// Mock partial environment or just run logic directly
// For simplicity, we will run the actual service logic if possible or a simplified version of it
const db = new Database('calleja.db');

// Repositories logic (simplified for script)
const getApto = (torre, numero) => {
    let cleanTorre = torre.toUpperCase().replace('TORRE', '').trim();
    return db.prepare('SELECT a.* FROM apartamentos a JOIN torres t ON t.id = a.torre_id WHERE t.nombre = ? AND a.numero = ?').get(cleanTorre, numero);
};

const getPrevAgua = (aptoId, periodoId) => {
    return db.prepare('SELECT lectura_actual FROM agua_consumo WHERE apartamento_id = ? AND periodo_id < ? ORDER BY periodo_id DESC LIMIT 1').get(aptoId, periodoId)?.lectura_actual || 0;
};

const importFile = (filename, periodoId) => {
    console.log(`\n--- Importing ${filename} into Periodo ID ${periodoId} ---`);
    const wb = XLSX.readFile(filename);
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

    db.transaction(() => {
        data.forEach(row => {
            const apto = getApto(row.torre || row.Torre, row.apartamento || row.Apartamento);
            if (!apto) return;

            const lectActual = row.agua || row.Agua || 0;
            const prevLect = getPrevAgua(apto.id, periodoId);
            const consumo = Math.max(0, lectActual - prevLect);

            // Upsert logically
            const existing = db.prepare('SELECT id FROM agua_consumo WHERE apartamento_id = ? AND periodo_id = ?').get(apto.id, periodoId);
            if (existing) {
                db.prepare('UPDATE agua_consumo SET lectura_actual = ?, consumo_m3 = ? WHERE id = ?').run(lectActual, consumo, existing.id);
            } else {
                db.prepare('INSERT INTO agua_consumo (apartamento_id, periodo_id, lectura_actual, consumo_m3, costo_calculado) VALUES (?, ?, ?, ?, 0)').run(apto.id, periodoId, lectActual, consumo);
            }
        });
    })();
    console.log(`✅ ${filename} imported.`);
};

try {
    // 1. Ensure Periodos exist (January and February)
    db.prepare('INSERT OR IGNORE INTO periodo (id, anio_init, mes_init, anio_end, mes_end) VALUES (1, 2024, 12, 2025, 1)').run();
    db.prepare('INSERT OR IGNORE INTO periodo (id, anio_init, mes_init, anio_end, mes_end) VALUES (2, 2025, 1, 2025, 2)').run();

    // 2. Import January
    importFile('PruebaCalleja Ene2025.xlsx', 1);

    // 3. Import February
    importFile('PruebaCalleja Feb2025.xlsx', 2);

    // 4. Verify some results
    console.log('\n--- VERIFICATION RESULTS ---');
    const samples = db.prepare(`
        SELECT t.nombre as torre, a.numero as apto, p.mes_end as mes, ac.lectura_actual, ac.consumo_m3
        FROM agua_consumo ac
        JOIN apartamentos a ON a.id = ac.apartamento_id
        JOIN torres t ON t.id = a.torre_id
        JOIN periodo p ON p.id = ac.periodo_id
        WHERE a.numero IN (201, 202)
        ORDER BY a.numero, p.id
    `).all();

    samples.forEach(s => {
        console.log(`Apto ${s.torre}-${s.apto} Mes ${s.mes}: Lectura=${s.lectura_actual}, Consumo=${s.consumo_m3}`);
    });

} catch (e) {
    console.error('Error during verification:', e.message);
} finally {
    db.close();
}
