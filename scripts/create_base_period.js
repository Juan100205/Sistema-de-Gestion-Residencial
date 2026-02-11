
const Database = require('better-sqlite3');
const db = new Database('calleja.db');

try {
    console.log('🧹 Limpiando consumos previos...');
    db.prepare('DELETE FROM facturacion').run();
    db.prepare('DELETE FROM agua_consumo').run();
    db.prepare('DELETE FROM gas_consumo').run();
    db.prepare('DELETE FROM calderas').run();
    db.prepare('DELETE FROM zonas_comunes').run();
    db.prepare('DELETE FROM basurero_periodo').run();
    db.prepare('DELETE FROM periodo').run();
    db.prepare("UPDATE sqlite_sequence SET seq = 0 WHERE name IN ('periodo', 'facturacion', 'agua_consumo', 'gas_consumo')").run();

    console.log('📅 Creando periodo base 2024-12...');
    // Estructura: id, anio_init, mes_init, anio_end, mes_end, precio_agua, precio_gas, coeficiente, alertas...
    const stmt = db.prepare(`
        INSERT INTO periodo (
            anio_init, mes_init, anio_end, mes_end, 
            precio_m3_agua, precio_m3_gas, coeficiente_general, alertas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(2024, 11, 2024, 12, 10000, 5000, 1.0, 0);

    console.log('✅ Periodo 2024-12 creado correctamente.');
    const check = db.prepare('SELECT * FROM periodo').all();
    console.log('Contenido de Periodo:', check);

} catch (e) {
    console.error('❌ Error:', e.message);
} finally {
    db.close();
}
