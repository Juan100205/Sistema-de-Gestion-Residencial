import TorresRepository from '../repositories/torres.repo.js';
import ApartamentosRepository from '../repositories/apartamentos.repo.js';

export function seedInitialData(db) {
  const torresRepo = TorresRepository(db);
  const aptoRepo = ApartamentosRepository(db);

  // Verificar si ya hay datos
  const count = db.prepare(`SELECT COUNT(*) c FROM torres`).get().c;
  if (count > 0) return;

  const runSeed = db.transaction(() => {
    console.log('🌱 Iniciando seed inicial...');

    // 1. Crear torres
    const torres = ['TORRE A', 'TORRE B', 'TORRE C'];
    const torreIds = {};
    torres.forEach(t => {
      torreIds[t] = db.prepare(`INSERT INTO torres (nombre) VALUES (?)`).run(t).lastInsertRowid;
    });

    // 2. Crear apartamentos Torre A (Específicos)
    const aptosTorreA = {
      2: [1, 2, 3],
      3: [1, 2],
      4: [1, 2, 3, 4],
      5: [1, 2, 3, 4],
      6: [1, 2, 3],
      7: [1, 2],
      8: [1, 2, 3],
      9: [1, 2],
      10: [1, 2, 3, 4],
      11: [1, 2, 3, 4],
      12: [1, 2, 3, 4],
      13: [1, 2]
    };
    const aptosTorreB = {
      2: [1, 2, 3],
      3: [1, 2],
      4: [1, 2, 3, 4],
      5: [1, 2, 3, 4],
      6: [1, 2, 3],
      7: [1, 2],
      8: [1, 2, 3],
      9: [1, 2],
      10: [1, 2, 3, 4],
      11: [1, 2, 3, 4],
      12: [1, 2, 3, 4],
      13: [1, 2]
    };
    const aptosTorreC = {
      2: [1, 2, 3],
      3: [1, 2],
      4: [1, 2, 3, 4],
      5: [1, 2, 3, 4],
      6: [1, 2, 3],
      7: [1, 2],
      8: [1, 2, 3],
      9: [1, 2],
      10: [1, 2, 3, 4],
      11: [1, 2, 3, 4],
      12: [1, 2, 3, 4],
      13: [1, 2]
    };



    for (const [piso, numeros] of Object.entries(aptosTorreA)) {
      for (const num of numeros) {
        const numeroApto = parseInt(`${piso}${num.toString().padStart(2, '0')}`);
        db.prepare(`
          INSERT INTO apartamentos (torre_id, numero, activo, coeficiente)
          VALUES (?, ?, 1, 1.0)
        `).run(torreIds['Torre A'], numeroApto);
      }
    }

    for (const [piso, numeros] of Object.entries(aptosTorreB)) {
      for (const num of numeros) {
        const numeroApto = parseInt(`${piso}${num.toString().padStart(2, '0')}`);
        db.prepare(`
          INSERT INTO apartamentos (torre_id, numero, activo, coeficiente)
          VALUES (?, ?, 1, 1.0)
        `).run(torreIds['Torre B'], numeroApto);
      }
    }

    for (const [piso, numeros] of Object.entries(aptosTorreC)) {
      for (const num of numeros) {
        const numeroApto = parseInt(`${piso}${num.toString().padStart(2, '0')}`);
        db.prepare(`
          INSERT INTO apartamentos (torre_id, numero, activo, coeficiente)
          VALUES (?, ?, 1, 1.0)
        `).run(torreIds['Torre C'], numeroApto);
      }
    }

    console.log('✅ Seed inicial completado');
  });

  runSeed();
}
