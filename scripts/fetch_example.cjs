const Database = require('better-sqlite3');
const db = new Database('./calleja.db');

const periodos = db.prepare(`
    SELECT id, anio_end, mes_end, gas_m3_torre_a, gas_m3_zonas_humedas, 
           gas_m3_torre_b, gas_m3_torre_c, agua_total_residencia, agua_m3_total_residencia, 
           agua_m3_comunes
    FROM periodo
`).all();

console.log("=== PERIODOS ===");
console.log(periodos.slice(-2)); // last 2 periods

if (periodos.length > 0) {
    const p = periodos[periodos.length - 1];
    
    // Formula from code
    const adjustedGasTorreA = Math.max(0, (p.gas_m3_torre_a || 0) - (p.gas_m3_zonas_humedas || 0));
    const totalGasM3 = adjustedGasTorreA + (p.gas_m3_torre_b || 0) + (p.gas_m3_torre_c || 0);
    const towerWaterM3 = (p.agua_m3_total_residencia || 0) - (p.agua_m3_comunes || 0);
    
    console.log(`\n=== CALCULO DEL FACTOR (Periodo ${p.anio_end}-${p.mes_end}) ===`);
    console.log(`Gas Torre A ajustado: ${adjustedGasTorreA} = (Gas Torre A: ${p.gas_m3_torre_a} - Zonas Humedas: ${p.gas_m3_zonas_humedas})`);
    console.log(`Gas Total M3: ${totalGasM3} = (${adjustedGasTorreA} + Torre B: ${p.gas_m3_torre_b} + Torre C: ${p.gas_m3_torre_c})`);
    console.log(`Agua Torres M3: ${towerWaterM3} = (Agua Residencia M3: ${p.agua_m3_total_residencia} - Agua Comunes: ${p.agua_m3_comunes})`);
    
    const factorAguaGas = towerWaterM3 > 0 ? totalGasM3 / towerWaterM3 : 0;
    console.log(`Factor Relacion Agua/Gas: ${factorAguaGas} = (Gas Total: ${totalGasM3} / Agua Torres: ${towerWaterM3})`);

    const consumos = db.prepare(`
        SELECT a.numero, t.nombre as torre, ag.consumo_m3 as agua_m3, g.consumo_m3 as gas_m3
        FROM apartamentos a
        JOIN torres t ON a.torre_id = t.id
        LEFT JOIN agua_consumo ag ON a.id = ag.apartamento_id AND ag.periodo_id = ?
        LEFT JOIN gas_consumo g ON a.id = g.apartamento_id AND g.periodo_id = ?
        WHERE ag.consumo_m3 > 0
        LIMIT 5
    `).all(p.id, p.id);

    console.log("\n=== EJEMPLOS DE APARTAMENTOS ===");
    consumos.forEach(c => {
        const factorCalculado = c.agua_m3 > 0 ? c.gas_m3 / c.agua_m3 : 0;
        console.log(`Apto ${c.torre}-${c.numero}: Agua=${c.agua_m3} m3 | Gas=${c.gas_m3} m3 | (Gas/Agua = ${factorCalculado.toFixed(4)})`);
    });
}
