
import Database from 'better-sqlite3';
import path from 'node:path';
const db = new Database('calleja.db');
const counts = db.prepare('SELECT t.nombre, count(a.id) as c FROM apartamentos a JOIN torres t ON t.id = a.torre_id GROUP BY t.nombre').all();
console.log('RESULT_COUNTS:');
counts.forEach(r => console.log(`${r.nombre}:${r.c}`));
db.close();
