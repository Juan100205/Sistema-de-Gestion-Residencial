import AguaConsumoRepository from "../db/repositories/aguaConsumo.repo.js";
import GasConsumoRepository from "../db/repositories/gasConsumo.repo.js";
import PeriodoRepository from "../db/repositories/periodo.repo.js";
import FacturacionRepository from "../db/repositories/facturacion.repo.js";
import ApartamentosRepository from "../db/repositories/apartamentos.repo.js";

/**
 * Motor de recalculación centralizado.
 * Asegura que los consumos, costos y facturación estén sincronizados.
 */
export default function RecalculationService(db) {
    const aguaRepo = AguaConsumoRepository(db);
    const gasRepo = GasConsumoRepository(db);
    const periodoRepo = PeriodoRepository(db);
    const facturacionRepo = FacturacionRepository(db);
    const aptoRepo = ApartamentosRepository(db);

    return {
        /**
         * Recalcula todos los datos de un periodo específico.
         * Útil cuando cambian los precios o se actualizan lecturas masivamente.
         */
        recalculatePeriod(periodoId) {

            const periodo = periodoRepo.getById(periodoId);
            if (!periodo) return;

            const aptos = aptoRepo.getAll();
            const precioAgua = periodo.precio_m3_agua || 0;
            const precioGas = periodo.precio_m3_gas || 0;
            const factorAguaGas = periodo.coeficiente_general || 0;

            db.transaction(() => {
                for (const apto of aptos) {
                    // 1. Obtener lectura actual de agua
                    const aguaRecord = db.prepare(`SELECT * FROM agua_consumo WHERE periodo_id = ? AND apartamento_id = ?`).get(periodoId, apto.id);

                    let consumoAgua = 0;
                    let costoAgua = 0;

                    if (aguaRecord) {
                        // Recalcular consumo de agua contra el anterior
                        const prevReading = aguaRepo.getPreviousReading(apto.id, periodo.anio_end, periodo.mes_end);
                        consumoAgua = Math.max(0, aguaRecord.lectura_actual - prevReading);
                        costoAgua = consumoAgua * precioAgua;

                        // Actualizar registro de agua con nuevos m3 y costo
                        aguaRepo.upsert({
                            periodo_id: periodoId,
                            apartamento_id: apto.id,
                            lectura_actual: aguaRecord.lectura_actual,
                            consumo_m3: +consumoAgua.toFixed(2),
                            costo_calculado: +costoAgua.toFixed(2),
                            observaciones: aguaRecord.observaciones
                        });
                    }

                    // 2. Recalcular Gas (Basado en consumo de Agua promediado o lectura si existe)
                    // Nota: Actualmente el sistema deriva gas de agua si no hay lectura de gas.
                    const gasRecord = db.prepare(`SELECT * FROM gas_consumo WHERE periodo_id = ? AND apartamento_id = ?`).get(periodoId, apto.id);

                    let consumoGas = 0;
                    let costoGas = 0;

                    if (gasRecord) {
                        // Si hay lectura de gas > 0, usamos lectura. Si no, usamos factor agua.
                        if (gasRecord.lectura_actual > 0) {
                            const prevGasReading = gasRepo.getPreviousReading(apto.id, periodo.anio_end, periodo.mes_end);
                            consumoGas = Math.max(0, gasRecord.lectura_actual - prevGasReading);
                        } else {
                            consumoGas = consumoAgua * factorAguaGas;
                        }

                        costoGas = consumoGas * precioGas;

                        gasRepo.upsert({
                            torre: apto.torre,
                            apartamento: apto.numero,
                            anio: periodo.anio_end,
                            mes: periodo.mes_end,
                            lectura_actual: gasRecord.lectura_actual,
                            consumo_m3: +consumoGas.toFixed(2),
                            costo_calculado: +costoGas.toFixed(2),
                            observaciones: gasRecord.observaciones
                        });
                    } else if (consumoAgua > 0 && factorAguaGas > 0) {
                        // Si no existe registro de gas pero hay consumo de agua, lo creamos proporcionalmente
                        consumoGas = consumoAgua * factorAguaGas;
                        costoGas = consumoGas * precioGas;

                        gasRepo.upsert({
                            torre: apto.torre,
                            apartamento: apto.numero,
                            anio: periodo.anio_end,
                            mes: periodo.mes_end,
                            lectura_actual: 0,
                            consumo_m3: +consumoGas.toFixed(2),
                            costo_calculado: +costoGas.toFixed(2)
                        });
                    }

                    // 3. Sincronizar Facturación
                    facturacionRepo.upsert({
                        apartamento_id: apto.id,
                        periodo_id: periodoId,
                        costo_agua: +costoAgua.toFixed(2),
                        costo_gas: +costoGas.toFixed(2),
                        costo_total: +(costoAgua + costoGas).toFixed(2)
                    });
                }

                // --- 4. PERSISTIR TOTALES EN EL PERIODO ---
                // ✅ FIX: El nombre de la torre ahora es 'TORRE A', 'TORRE B', etc. Usamos LIKE o coincidencias robustas.
                const totals = db.prepare(`
                  SELECT 
                    SUM(CASE WHEN t.nombre LIKE '%A' THEN ac.consumo_m3 ELSE 0 END) as water_m3_a,
                    SUM(CASE WHEN t.nombre LIKE '%B' THEN ac.consumo_m3 ELSE 0 END) as water_m3_b,
                    SUM(CASE WHEN t.nombre LIKE '%C' THEN ac.consumo_m3 ELSE 0 END) as water_m3_c,
                    SUM(ac.consumo_m3) as water_total_m3,
                    SUM(CASE WHEN t.nombre LIKE '%A' THEN gc.consumo_m3 ELSE 0 END) as gas_m3_a,
                    SUM(CASE WHEN t.nombre LIKE '%B' THEN gc.consumo_m3 ELSE 0 END) as gas_m3_b,
                    SUM(CASE WHEN t.nombre LIKE '%C' THEN gc.consumo_m3 ELSE 0 END) as gas_m3_c,
                    SUM(gc.consumo_m3) as gas_total_m3
                  FROM apartamentos a
                  JOIN torres t ON t.id = a.torre_id
                  LEFT JOIN agua_consumo ac ON ac.apartamento_id = a.id AND ac.periodo_id = ?
                  LEFT JOIN gas_consumo gc ON gc.apartamento_id = a.id AND gc.periodo_id = ?
                `).get(periodoId, periodoId);

                console.log(`📊 [Recalc] Totales calculados (Apts) para Periodo ${periodoId}:`, totals);

                // ✅ IMPORTANTE: No sobreescribir agua_m3_total_residencia ni gas_m3_torre_X 
                // si el usuario los ingresó manualmente como valores de factura.
                // Estos campos en la tabla Periodo representan la FACTURA, no la suma de aptos.
                // Sin embargo, necesitamos guardar los totales de la SUMA en algún lado o 
                // actualizar solo si el usuario no los mandó. 
                // En este flujo, simplemente quitamos la sobreescritura de los valores que vienen de la factura.

                periodoRepo.update(periodoId, {
                    ...periodo,
                    // Estos valores ahora se calculan en base a lo que el usuario subió/editó masivamente,
                    // pero dejamos que el repo maneje la persistencia de lo que ya tiene el objeto 'periodo'.
                    precio_m3_agua: periodo.precio_m3_agua,
                    precio_m3_gas: periodo.precio_m3_gas,
                    coeficiente_general: periodo.coeficiente_general
                });
            })();

            console.log(`✅ RecalculationService: Periodo ${periodoId} recalculado con éxito.`);
        },

        /**
         * Dispara una recalculación en cadena desde un periodo hacia adelante.
         * Necesario si se cambia una lectura en el pasado que afecte consumos futuros.
         */
        triggerChainRecalculation(startAnio, startMes) {
            const periodos = db.prepare(`
                SELECT id FROM periodo 
                WHERE (anio_end > ? OR (anio_end = ? AND mes_end >= ?))
                ORDER BY anio_end ASC, mes_end ASC
            `).all(startAnio, startAnio, startMes);

            for (const p of periodos) {
                this.recalculatePeriod(p.id);
            }
        }
    };
}
