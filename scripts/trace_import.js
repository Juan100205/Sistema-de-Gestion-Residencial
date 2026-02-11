
import XLSX from 'xlsx';
import path from 'path';
import Database from 'better-sqlite3';
import ImportExcelService from './src/services/importExcel.services.js';

// We run this via npx electron to handle ESM/Native modules
const db = new Database('calleja.db');
console.log('📦 Opened DB: calleja.db');

const importService = ImportExcelService(db);

async function runTrace() {
    try {
        const filename = 'PruebaCalleja Feb2025.xlsx';
        console.log(`📂 Reading ${filename}...`);
        const wb = XLSX.readFile(filename);
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

        console.log(`📊 Total rows in Excel: ${data.length}`);

        // Execute import
        console.log('🚀 Calling importService.import()...');
        importService.import(data);

        // Check results
        console.log('\n--- AFTER IMPORT CHECK ---');
        const periodos = db.prepare('SELECT * FROM periodo').all();
        console.log('Periodos IDs:', periodos.map(p => `${p.id} (${p.anio_end}-${p.mes_end})`));

        const febPeriodo = periodos.find(p => p.anio_end === 2025 && p.mes_end === 2);
        if (!febPeriodo) {
            console.error('❌ February period NOT found in database!');
        } else {
            const count = db.prepare('SELECT count(*) as c FROM agua_consumo WHERE periodo_id = ?').get(febPeriodo.id).c;
            console.log(`✅ Readings in February (Period ${febPeriodo.id}): ${count}`);

            const sample = db.prepare(`
                SELECT t.nombre as torre, a.numero as apto, ac.lectura_actual, ac.consumo_m3 
                FROM agua_consumo ac
                JOIN apartamentos a ON a.id = ac.apartamento_id 
                JOIN torres t ON t.id = a.torre_id
                WHERE ac.periodo_id = ? 
                LIMIT 3
            `).all(febPeriodo.id);
            console.log('Sample Data:', sample);
        }

    } catch (e) {
        console.error('🔴 Trace Error:', e.stack);
    } finally {
        db.close();
    }
}

runTrace();
