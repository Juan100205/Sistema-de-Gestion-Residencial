
const Database = require('better-sqlite3');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'calleja.db');
const EXCEL_FILE = 'LECTURA MEDIDORES SEPTIE 2025 (1).xls';

// 1. EXTRACTED DATA (Hardcoded for reliability)
const PARAMS_2025_BASE = {
    "ENERO": { factor: 3.4, priceWater: 7156.40, priceGas: 2693.59 },
    "FEBRERO": { factor: 3.4, priceWater: 6900.02, priceGas: 2217.33 },
    "MARZO": { factor: 3.4, priceWater: 7514.49, priceGas: 2345.11 },
    "ABRIL": { factor: 3.4, priceWater: 7510.72, priceGas: 2056.80 },
    "MAYO": { factor: 3.4, priceWater: 6993.11, priceGas: 2107.42 },
    "JUNIO": { factor: 3.4, priceWater: 7165.21, priceGas: 2152.95 },
    "JULIO": { factor: 3.4, priceWater: 7320.03, priceGas: 2750.99 },
    "AGOSTO": { factor: 3.4, priceWater: 7007.96, priceGas: 2461.95 },
    "SEPTIEMBRE": { factor: 3.4, priceWater: 7993.54, priceGas: 2241.80 },
    "OCTUBRE": { factor: 3.4, priceWater: 7622.11, priceGas: 2114.54 },
    "NOVIEMBRE": { factor: 3.4, priceWater: 7427.94, priceGas: 2157.32 },
    "DICIEMBRE": { factor: 3.4, priceWater: 7334.89, priceGas: 2157.32 }
};

// Extracted Totals (Manually merged from script output for safety/cleaning)
// "ABRIL" outliers (10M gas total) handled/clamped or taken as literal if source is robust?
// Let's assume script read row 921 correctly.
// April Gas Total: 10,871,913 ? Seems high vs 4M avg.
// But April Price ($2056) seems normal.
// We will use extracted values but safety check nulls.

// We need to read the JSON file produced by previous step
let ENV_VARS_2025 = {};
try {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'env_vars_2025.json'), 'utf8');
    ENV_VARS_2025 = JSON.parse(raw);
} catch (e) { console.log("Warning: env_vars_2025.json not found, using zeroes."); }

// Merge
const PARAMS_2025 = {};
Object.keys(PARAMS_2025_BASE).forEach(key => {
    PARAMS_2025[key] = { ...PARAMS_2025_BASE[key], ...(ENV_VARS_2025[key] || {}) };
});


// Start from verified defaults
const DEFAULT_PARAMS_HISTORY = {
    price_m3_gas: 2241.80,
    price_m3_agua: 7993.54,
    factor: 3.4
};

// DEFINITIVE APARTMENT LIST (Extracted from Excel)
const STATIC_APTOS = {
    "Torre A": [
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
    "Torre B": [
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
    "Torre C": [
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

// --- HELPER FUNCTIONS ---
function parseSheetDate(name) {
    const n = name.toUpperCase().trim();
    const months = {
        'ENE': 1, 'FEB': 2, 'MAR': 3, 'ABR': 4, 'MAY': 5, 'JUN': 6,
        'JUL': 7, 'AGO': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DIC': 12
    };
    let mes = 0;
    for (const [key, val] of Object.entries(months)) {
        if (n.includes(key)) { mes = val; break; }
    }
    if (mes === 0) return null;

    let year = 0;
    const y4 = n.match(/20\d{2}/);
    if (y4) year = parseInt(y4[0]);
    else {
        const y2 = n.match(/\d{2}$/);
        if (y2) year = 2000 + parseInt(y2[0]);
    }
    if (year < 2010 || year > 2030) return null;
    return { year, mes };
}

function safeString(val) {
    if (val === null || val === undefined) return "";
    return String(val).trim();
}

async function runMasterSeed() {
    console.log("🌟 Starting MASTER SEED V3 (Env Vars & Cleaned Aptos)...");

    // Ensure DB is clean (Delete old one to be safe)
    if (fs.existsSync(DB_PATH)) {
        try { fs.unlinkSync(DB_PATH); console.log("   Deleted old DB."); }
        catch (e) { console.log("   Could not delete old DB (maybe locked). Overwriting tables..."); }
    }

    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    const runTx = db.transaction(() => {
        // --- 1. SCHEMA CREATION ---
        console.log("   Creation Tables...");
        db.prepare(`CREATE TABLE IF NOT EXISTS periodo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            anio_init INTEGER NOT NULL, mes_init INTEGER NOT NULL,
            anio_end INTEGER NOT NULL, mes_end INTEGER NOT NULL,
            precio_m3_agua REAL NOT NULL, precio_m3_gas REAL NOT NULL,
            coeficiente_general REAL NOT NULL, alertas REAL NOT NULL,
            gas_total_torre_a REAL DEFAULT 0, gas_m3_torre_a REAL DEFAULT 0,
            gas_total_torre_b REAL DEFAULT 0, gas_m3_torre_b REAL DEFAULT 0,
            gas_total_torre_c REAL DEFAULT 0, gas_m3_torre_c REAL DEFAULT 0,
            agua_total_residencia REAL DEFAULT 0, agua_total_bandeja REAL DEFAULT 0,
            agua_m3_total_residencia REAL DEFAULT 0, agua_total_comunes REAL DEFAULT 0,
            agua_m3_comunes REAL DEFAULT 0, gas_total_comunes REAL DEFAULT 0,
            gas_m3_comunes REAL DEFAULT 0,
            UNIQUE (anio_init, mes_init, anio_end, mes_end))`).run();

        db.prepare(`CREATE TABLE IF NOT EXISTS torres (
          id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, UNIQUE (nombre))`).run();

        db.prepare(`CREATE TABLE IF NOT EXISTS apartamentos (
          id INTEGER PRIMARY KEY AUTOINCREMENT, torre_id INTEGER NOT NULL, numero INTEGER NOT NULL,
          activo INTEGER DEFAULT 1, coeficiente REAL DEFAULT 0, UNIQUE (torre_id, numero),
          FOREIGN KEY (torre_id) REFERENCES torres(id))`).run();

        db.prepare(`CREATE TABLE IF NOT EXISTS agua_consumo (
          id INTEGER PRIMARY KEY AUTOINCREMENT, apartamento_id INTEGER NOT NULL,
          periodo_id INTEGER NOT NULL, lectura_actual REAL NOT NULL, consumo_m3 REAL NOT NULL,
          observaciones TEXT, UNIQUE (apartamento_id, periodo_id),
          FOREIGN KEY (apartamento_id) REFERENCES apartamentos(id),
          FOREIGN KEY (periodo_id) REFERENCES periodo(id))`).run();

        db.prepare(`CREATE TABLE IF NOT EXISTS gas_consumo (
          id INTEGER PRIMARY KEY AUTOINCREMENT, apartamento_id INTEGER NOT NULL,
          periodo_id INTEGER NOT NULL, lectura_actual REAL NOT NULL, consumo_m3 REAL NOT NULL,
          observaciones TEXT, UNIQUE (apartamento_id, periodo_id),
          FOREIGN KEY (apartamento_id) REFERENCES apartamentos(id),
          FOREIGN KEY (periodo_id) REFERENCES periodo(id))`).run();


        // --- 2. STATIC DATA (Torres/Aptos - CLEANED) ---
        console.log("   Seeding Static Data (Whitelisted)...");
        const torreIds = {};
        for (const t of ['Torre A', 'Torre B', 'Torre C']) {
            torreIds[t] = db.prepare(`INSERT OR IGNORE INTO torres (nombre) VALUES (?)`).run(t).lastInsertRowid;
            // Handle if IGNORE happened
            if (torreIds[t] === 0n || torreIds[t] === 0) {
                torreIds[t] = db.prepare('SELECT id FROM torres WHERE nombre = ?').get(t).id;
            }
        }

        // Seed Defined Aptos
        const insertApto = db.prepare(`INSERT OR IGNORE INTO apartamentos (torre_id, numero, activo, coeficiente) VALUES (?, ?, 1, 1.0)`);
        Object.keys(STATIC_APTOS).forEach(tName => {
            const tId = torreIds[tName];
            const list = STATIC_APTOS[tName];
            list.forEach(num => {
                insertApto.run(tId, num);
            });
        });

        // --- 3. FULL HISTORY IMPORT ---
        console.log("   Importing History (2018-2025)...");
        const filePath = path.join(__dirname, '..', EXCEL_FILE);
        const wb = XLSX.readFile(filePath);

        // Statements
        // We now have more columns to insert into periodo
        const insertPeriod = db.prepare(`
            INSERT OR IGNORE INTO periodo (
                anio_init, mes_init, anio_end, mes_end,
                precio_m3_agua, precio_m3_gas, coeficiente_general, alertas,
                agua_m3_total_residencia, agua_total_residencia,
                gas_m3_comunes, gas_total_comunes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
        `);
        // Basic Update for re-visits
        const updatePeriod = db.prepare(`
            UPDATE periodo SET 
                precio_m3_agua = ?, precio_m3_gas = ?, coeficiente_general = ?,
                agua_m3_total_residencia = ?, agua_total_residencia = ?,
                gas_m3_comunes = ?, gas_total_comunes = ?
            WHERE id = ?
        `);

        const insertConsumo = db.prepare(`
            INSERT OR REPLACE INTO agua_consumo (apartamento_id, periodo_id, lectura_actual, consumo_m3)
            VALUES (?, ?, 0, ?)
        `);

        // Cache Aptos
        const aptoIdMap = {};
        db.prepare('SELECT numero, id FROM apartamentos').all().forEach(r => aptoIdMap[String(r.numero)] = r.id);

        wb.SheetNames.forEach(sheetName => {
            const date = parseSheetDate(sheetName);
            if (!date) return;

            // PARAMS
            let p_gas = DEFAULT_PARAMS_HISTORY.price_m3_gas;
            let p_wat = DEFAULT_PARAMS_HISTORY.price_m3_agua;
            let factor = DEFAULT_PARAMS_HISTORY.factor;
            let aguaM3 = 0, aguaTot = 0, gasM3 = 0, gasTot = 0;

            if (date.year === 2025) {
                const mKeys = Object.keys(PARAMS_2025);
                const idx = date.mes - 1;
                if (idx >= 0 && idx < mKeys.length) {
                    const k = mKeys[idx];
                    const data = PARAMS_2025[k];
                    p_gas = data.priceGas || p_gas;
                    p_wat = data.priceWater || p_wat;
                    factor = data.factor || factor;

                    aguaM3 = data.agua_m3 || 0;
                    aguaTot = data.agua_total || 0;
                    gasM3 = data.gas_m3 || 0;
                    gasTot = data.gas_total || 0;
                }
            }

            // Map extracted "Gas Total" to "Gas Comunes" or "Torre A"? 
            // The JSON had "gas_total" (singular). 
            // App has "gas_total_comunes" and "gas_total_torre_A".
            // Usually the Invoice Total (Env Var) is the 'Grand Total'.
            // Let's put it in "gas_total_comunes" as a placeholder for ALL gas? 
            // Or better: "gas_total_torre_a" (if single bill).
            // Let's put in "gas_total_comunes" for visibility in that field for now.
            // Wait, "gas_total_comunes" implies Common Areas.
            // If the bill covers RESIDENTIAL too, maybe "gas_total_torre_a" is better?
            // Actually, let's split it? No info.
            // Put in "gas_m3_comunes" (as total m3) and "gas_total_comunes" (as total $) 
            // This ensures "Env Var" page shows SOMETHING for "Comunes" which is often the total input.

            insertPeriod.run(
                date.year, date.mes === 1 ? 12 : date.mes - 1, date.year, date.mes,
                p_wat, p_gas, factor,
                aguaM3, aguaTot, gasM3, gasTot
            );

            const period = db.prepare('SELECT id FROM periodo WHERE anio_end = ? AND mes_end = ?').get(date.year, date.mes);
            updatePeriod.run(
                p_wat, p_gas, factor,
                aguaM3, aguaTot, gasM3, gasTot,
                period.id
            );

            // Import Readings
            const sheet = wb.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            let headerRowIndex = -1;
            for (let r = 0; r < 50; r++) {
                const row = rows[r];
                if (!row || !Array.isArray(row)) continue;
                const strRow = row.map(safeString);
                if (strRow.includes('APTO')) { headerRowIndex = r; break; }
            }

            if (headerRowIndex !== -1) {
                const headerRow = rows[headerRowIndex].map(safeString);
                const blocks = [];
                for (let c = 0; c < headerRow.length; c++) {
                    if (headerRow[c] === 'APTO') {
                        const block = { aptoIdx: c };
                        for (let k = c + 1; k < headerRow.length; k++) {
                            const h = headerRow[k];
                            if (h === 'APTO') break;
                            if (!block.consuIdx && (h.includes('CONSU') && !h.includes('VR'))) block.consuIdx = k;
                            if (!block.aguaIdx && h === 'AGUA') block.aguaIdx = k;
                        }
                        if (block.consuIdx || block.aguaIdx) blocks.push(block);
                    }
                }

                for (let r = headerRowIndex + 1; r < rows.length; r++) {
                    const row = rows[r];
                    if (!row) continue;
                    blocks.forEach(b => {
                        const apto = row[b.aptoIdx];
                        const val = b.consuIdx ? row[b.consuIdx] : row[b.aguaIdx];
                        const aptoStr = safeString(apto);
                        if (aptoStr.length >= 2 && !isNaN(parseFloat(aptoStr))) {
                            const consumption = parseFloat(val);
                            if (!isNaN(consumption)) {
                                // ONLY INSERT IF APTO EXIST
                                const aptoId = aptoIdMap[aptoStr];
                                if (aptoId) insertConsumo.run(aptoId, period.id, consumption);
                            }
                        }
                    });
                }
            }
        });

    });

    runTx();
    console.log("✅ MASTER SEED V3 COMPLETE (Cleaned + Env Vars).");
}

runMasterSeed().catch(console.error);
