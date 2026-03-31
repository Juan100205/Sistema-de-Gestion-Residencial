import path from 'node:path';
import fs from 'node:fs';
import * as XLSX from 'xlsx';

const EXCEL_FILES = [
    {
        name: '2025-09 AGUA CALIENTE (1).xlsx',
        type: 'agua',
        sheetIndex: 0,
        mapRow: (row) => ({
            torre: row[0],
            apto: row[1],
            year: row[2],
            month: row[3],
            lectura: row[4]
        })
    },
    {
        name: 'LECTURA MEDIDORES SEPTIE 2025 (1).xls',
        type: 'gas',
        sheetIndex: 0,
        fixedYear: 2025,
        fixedMonth: 9,
        mapRow: (row) => {
            return {
                apto: row[0],
                lectura: row[2],
            };
        }
    }
];

export function seedExcelData(db) {
    console.log('📊 Iniciando carga de datos desde Excel...');
    const rootDir = process.cwd();

    // Helper to find ID
    const getAptoId = (torreName, aptoNum) => {
        let torre = db.prepare('SELECT id FROM torres WHERE nombre LIKE ?').get(`%${torreName}%`);
        if (!torre) return null;
        const apto = db.prepare('SELECT id FROM apartamentos WHERE torre_id = ? AND numero = ?').get(torre.id, aptoNum);
        return apto ? apto.id : null;
    };

    const getPeriodoId = (year, month) => {
        let per = db.prepare('SELECT id FROM periodo WHERE anio = ? AND mes = ?').get(year, month);
        if (!per) {
            const info = db.prepare('INSERT INTO periodo (anio, mes, fecha_inicio, fecha_fin, activo) VALUES (?, ?, ?, ?, 0)').run(year, month, `${year}-${month}-01`, `${year}-${month}-28`);
            per = { id: info.lastInsertRowid };
        }
        return per.id;
    };

    EXCEL_FILES.forEach(fileConfig => {
        const filePath = path.join(rootDir, fileConfig.name);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Archivo no encontrado: ${fileConfig.name}`);
            return;
        }

        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[fileConfig.sheetIndex];
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

            console.log(`Processing ${fileConfig.name} (${fileConfig.type})...`);

            data.forEach((row, rowIndex) => {
                if (rowIndex < 1) return;

                if (!row || row.length === 0 || !row[1]) return;

                let record = null;
                if (fileConfig.type === 'agua') {
                    record = fileConfig.mapRow(row);
                    if (record.torre && typeof record.torre === 'string' && record.torre.length === 1) {
                        record.torre = `TORRE ${record.torre}`;
                    }
                } else if (fileConfig.type === 'gas') {
                    // Skip Gas for now as discussed
                    return;
                }

                if (!record || !record.apto || !record.lectura) return;

                const aptoId = getAptoId(record.torre, record.apto);
                if (!aptoId) return;

                const periodoId = getPeriodoId(record.year, record.month);
                const table = fileConfig.type === 'agua' ? 'agua_consumo' : 'gas_consumo';

                try {
                    const existing = db.prepare(`SELECT id FROM ${table} WHERE apartamento_id = ? AND periodo_id = ?`).get(aptoId, periodoId);

                    if (existing) {
                        db.prepare(`UPDATE ${table} SET lectura_actual = ? WHERE id = ?`).run(record.lectura, existing.id);
                    } else {
                        db.prepare(`INSERT INTO ${table} (apartamento_id, periodo_id, lectura_actual, consumo_m3) VALUES (?, ?, ?, 0)`).run(aptoId, periodoId, record.lectura);
                    }
                } catch (err) {
                    console.error(`Error processing row ${rowIndex}:`, err.message);
                }
            });

        } catch (e) {
            console.error(`Error parsing ${fileConfig.name}:`, e.message);
        }
    });

    console.log('✅ Carga Excel completada.');
}
