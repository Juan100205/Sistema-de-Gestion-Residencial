import snapshot from './data/snapshot.json' with { type: 'json' };

export function seedInitialData(db) {
  // Check if DB is empty (check torres) or use a "seeded" flag table if needed.
  // We check 'torres' count.
  const count = db.prepare(`SELECT COUNT(*) c FROM torres`).get().c;
  if (count > 0) return;

  console.log('🌱 Loading Initial Seed from Snapshot (Dev Data)...');

  const runSeed = db.transaction(() => {
    // 1. Torres
    if (snapshot.torres && snapshot.torres.length > 0) {
      const keys = Object.keys(snapshot.torres[0]);
      const cols = keys.join(', ');
      const vals = keys.map(k => '@' + k).join(', ');
      const stmt = db.prepare(`INSERT INTO torres (${cols}) VALUES (${vals})`);
      snapshot.torres.forEach(row => stmt.run(row));
    }

    // 2. Apartamentos
    if (snapshot.apartamentos && snapshot.apartamentos.length > 0) {
      const keys = Object.keys(snapshot.apartamentos[0]);
      const cols = keys.join(', ');
      const vals = keys.map(k => '@' + k).join(', ');
      const stmt = db.prepare(`INSERT INTO apartamentos (${cols}) VALUES (${vals})`);
      snapshot.apartamentos.forEach(row => stmt.run(row));
    }

    // 3. Periodo
    if (snapshot.periodo && snapshot.periodo.length > 0) {
      const keys = Object.keys(snapshot.periodo[0]);
      const cols = keys.join(', ');
      const vals = keys.map(k => '@' + k).join(', ');
      const stmt = db.prepare(`INSERT INTO periodo (${cols}) VALUES (${vals})`);
      snapshot.periodo.forEach(row => stmt.run(row));
    }

    // 4. Agua Consumo
    if (snapshot.agua_consumo && snapshot.agua_consumo.length > 0) {
      const keys = Object.keys(snapshot.agua_consumo[0]);
      const cols = keys.join(', ');
      const vals = keys.map(k => '@' + k).join(', ');
      const stmt = db.prepare(`INSERT INTO agua_consumo (${cols}) VALUES (${vals})`);
      snapshot.agua_consumo.forEach(row => stmt.run(row));
    }

    // 5. Gas Consumo
    if (snapshot.gas_consumo && snapshot.gas_consumo.length > 0) {
      const keys = Object.keys(snapshot.gas_consumo[0]);
      const cols = keys.join(', ');
      const vals = keys.map(k => '@' + k).join(', ');
      const stmt = db.prepare(`INSERT INTO gas_consumo (${cols}) VALUES (${vals})`);
      snapshot.gas_consumo.forEach(row => stmt.run(row));
    }

    console.log('✅ Snapshot restored successfully.');
  });

  runSeed();
}
