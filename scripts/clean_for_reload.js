
const Database = require('better-sqlite3');
const db = new Database('calleja.db');

try {
    console.log('🧹 Limpiando base de datos para reinicio de carga...');
    db.prepare('DELETE FROM facturacion').run();
    db.prepare('DELETE FROM agua_consumo').run();
    db.prepare('DELETE FROM gas_consumo').run();
    db.prepare('DELETE FROM calderas').run();
    db.prepare('DELETE FROM zonas_comunes').run();
    db.prepare('DELETE FROM basurero_periodo').run();
    db.prepare('DELETE FROM periodo').run();
    db.prepare('UPDATE sqlite_sequence SET seq = 0 WHERE name IN ("periodo", "facturacion", "agua_consumo", "gas_consumo")').run();
    console.log('✅ Base de datos limpia (excepto Torres y Apartamentos).');
} catch (e) {
    console.error('❌ Error limpiando DB:', e.message);
} finally {
    db.close();
}
