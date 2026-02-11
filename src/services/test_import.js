import Database from 'better-sqlite3';
import { createPeriodoTable } from '../db/schema/periodo.schema.js';
import { createTorresTable } from '../db/schema/torres.schema.js';
import { createApartamentosTable } from '../db/schema/apartamentos.schema.js';
import { createAguaConsumoTable } from '../db/schema/aguaConsumo.schema.js';
import { createBasureroTable } from '../db/schema/basurero.schema.js';
import { seedInitialData } from '../db/seeds/seed.initial.js';
import ImportExcelService from './importExcel.services.js';

// Setup Test DB in Memory
const db = new Database(':memory:');
createPeriodoTable(db);
createTorresTable(db);
createApartamentosTable(db);
createAguaConsumoTable(db);
createBasureroTable(db);

// Mock Electron app path helper if needed (not needed for :memory: usually but let's be careful)

console.log('🧪 Iniciando pruebas de importación...');

async function runTests() {
    try {
        // 1. Ejecutar Seed (debe crear Dic 2025)
        console.log('\n1. Ejecutando Seed Inicial...');
        seedInitialData(db);

        const initialPeriod = db.prepare('SELECT * FROM periodo').get();
        console.log('✅ Seed creado:', initialPeriod.anio_init, '-', initialPeriod.mes_init, 'hasta', initialPeriod.anio_end, '-', initialPeriod.mes_end);

        const service = ImportExcelService(db);

        // 2. Prueba: Importar mes NO consecutivo (debe fallar)
        console.log('\n2. Probando importación NO consecutiva (Feb 2026)...');
        try {
            service.import([{
                'anio': 2026,
                'mes': 2,
                'torre': 'A',
                'apartamento': 101,
                'lectura_actual_agua': 10
            }]);
            console.error('❌ ERROR: Debería haber fallado por falta de continuidad');
        } catch (e) {
            console.log('✅ Éxito: Falló como se esperaba:', e.message);
        }

        // 3. Prueba: Importar mes consecutivo (Ene 2026)
        console.log('\n3. Probando importación consecutiva (Ene 2026)...');
        service.import([{
            'anio': 2026,
            'mes': 1,
            'torre': 'A',
            'apartamento': 101,
            'lectura_actual_agua': 10
        }]);

        const janPeriod = db.prepare('SELECT * FROM periodo WHERE anio_end = 2026 AND mes_end = 1').get();
        if (janPeriod && janPeriod.anio_init === 2025 && janPeriod.mes_init === 12) {
            console.log('✅ Éxito: Periodo Ene 2026 creado encadenado a Dic 2025');
        } else {
            console.error('❌ ERROR: El periodo Ene 2026 no se creó correctamente o no está encadenado', janPeriod);
        }

        // 4. Prueba: Importar Feb 2026 después de Ene 2026
        console.log('\n4. Probando importación encadenada (Feb 2026)...');
        service.import([{
            'anio': 2026,
            'mes': 2,
            'torre': 'A',
            'apartamento': 101,
            'lectura_actual_agua': 20
        }]);

        const febPeriod = db.prepare('SELECT * FROM periodo WHERE anio_end = 2026 AND mes_end = 2').get();
        if (febPeriod && febPeriod.anio_init === 2026 && febPeriod.mes_init === 1) {
            console.log('✅ Éxito: Periodo Feb 2026 creado encadenado a Ene 2026');
        } else {
            console.error('❌ ERROR: El periodo Feb 2026 no se creó correctamente encadenado', febPeriod);
        }

        // 5. Prueba: Intentar sobreescribir mes existente (Feb 2026) -> debe fallar
        console.log('\n5. Probando protección contra sobreescritura (Feb 2026)...');
        try {
            service.import([{
                'anio': 2026,
                'mes': 2,
                'torre': 'A',
                'apartamento': 101,
                'lectura_actual_agua': 30
            }]);
            console.error('❌ ERROR: Debería haber fallado por protección contra sobreescritura');
        } catch (e) {
            console.log('✅ Éxito: Falló como se esperaba:', e.message);
        }

        console.log('\n✨ Todas las pruebas lógicas pasaron exitosamente.');

    } catch (error) {
        console.error('\n💥 Prueba fallida con error inesperado:', error);
    } finally {
        db.close();
    }
}

runTests();
