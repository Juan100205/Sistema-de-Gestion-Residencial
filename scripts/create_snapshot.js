const { app } = require('electron');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'calleja.db');
const SNAPSHOT_PATH = path.join(process.cwd(), 'src', 'db', 'seeds', 'data', 'snapshot.json');

async function createSnapshot() {
    console.log(`📸 Creating database snapshot from: ${DB_PATH}`);

    if (!fs.existsSync(DB_PATH)) {
        console.error("❌ Database file not found!");
        if (app) app.quit();
        process.exit(1);
    }

    const db = new Database(DB_PATH, { fileMustExist: true });

    // We export the main tables required for a new installation seed.
    const tablesToExport = [
        'torres',
        'apartamentos',
        'periodo',
        'agua_consumo',
        'gas_consumo'
    ];

    const snapshotData = {};

    for (const table of tablesToExport) {
        try {
            console.log(`  📦 Exporting table: ${table}...`);
            const rows = db.prepare(`SELECT * FROM ${table}`).all();
            snapshotData[table] = rows;
            console.log(`     -> ${rows.length} rows exported.`);
        } catch (error) {
            console.error(`  ⚠️ Could not export table ${table}:`, error.message);
            snapshotData[table] = [];
        }
    }

    // Ensure directory exists
    const dir = path.dirname(SNAPSHOT_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshotData, null, 2), 'utf-8');

    console.log(`✅ Snapshot successfully saved to: ${SNAPSHOT_PATH}`);
    db.close();
    if (app) app.quit();
}

if (app) {
    app.whenReady().then(createSnapshot);
} else {
    createSnapshot().catch(console.error);
}
