import Database from 'better-sqlite3';

async function run() {
  try {
    const database = new Database('calleja.db');
    const periodos = database.prepare('SELECT p.* FROM periodo p ORDER BY anio_end DESC, mes_end DESC LIMIT 3').all();
    console.log('--- Últimos 3 Periodos ---');
    periodos.forEach(p => {
      console.log(`\n[Periodo ${p.id}] ${p.mes_end}/${p.anio_end} | Precio Gas: ${p.precio_m3_gas} | Factor Agua-Gas (coeficiente_general): ${p.coeficiente_general}`);
      
      const facturas = database.prepare('SELECT SUM(costo_gas) as total_gas_facturado FROM facturacion WHERE periodo_id = ?').get(p.id);
      const gases = database.prepare('SELECT * FROM gas_consumo WHERE periodo_id = ? LIMIT 10').all();
      
      console.log(`  Total Gas Facturado en este periodo: $${facturas.total_gas_facturado}`);
      console.log('  Ejemplo de apartamentos (primeros 10) en este periodo:');
      for (const g of gases) {
         const agua = database.prepare('SELECT * FROM agua_consumo WHERE periodo_id = ? AND apartamento_id = ?').get(p.id, g.apartamento_id);
         const apto = database.prepare('SELECT t.nombre as torre, a.numero FROM apartamentos a JOIN torres t ON a.torre_id = t.id WHERE a.id = ?').get(g.apartamento_id);
         console.log(`    Apto ${apto.torre}-${apto.numero} | Agua Consumo: ${agua ? agua.consumo_m3 : 0} m3 | Gas Lectura: ${g.lectura_actual} | Gas Consumo: ${g.consumo_m3} m3 | Costo Calculado Gas: $${g.costo_calculado} | Obs: ${g.observaciones}`);
      }
    });
  } catch(e) {
    console.error(e);
  }
}

run();
