
import PeriodoRepository from "../db/repositories/periodo.repo.js";

/**
 * Servicio para proveer datos dinámicos a la página de inicio (Home)
 * @param {import('better-sqlite3').Database} db
 */
export default function HomeDataService(db) {
    const periodoRepo = PeriodoRepository(db);

    return {
        /**
         * Obtiene estadísticas globales para el Dashboard inicial
         * Si no se pasa periodoId, intenta tomar el último periodo activo
         */
        async getDashboardStats(periodoId = null) {

            let p;
            if (periodoId) {
                p = periodoRepo.getById(periodoId);
            } else {
                // Prioritize the LATEST active period (even if no consumptions yet) to reflect current variables
                p = periodoRepo.getPeriodoActivo() || periodoRepo.getUltimoPeriodoConDatos();
            }

            if (!p) {
                console.warn("⚠️ HomeDataService: No hay periodos activos para estadísticas.");
                return {
                    agua_total: 0,
                    gas_total: 0,
                    coeficiente_avg: 0,
                    periodo: null
                };
            }

            // 1. Total Agua ($) - Valor Factura (Input)
            const aguaBill = p.agua_total_residencia || 0;

            // 2. Total Gas ($) - Valor Facturas Torres (Input)
            const gasBill = (p.gas_total_torre_a || 0) + (p.gas_total_torre_b || 0) + (p.gas_total_torre_c || 0);

            // 3. Coeficiente General (Valor almacenado en DB desde Variables de Entorno)
            // Esto coincide con el valor que el usuario ve y edita en EnvVarHistory.
            const coef = p.coeficiente_general || 0;

            return {
                agua_total: aguaBill,
                gas_total: gasBill,
                coeficiente_avg: coef,
                periodo: { anio: p.anio_end, mes: p.mes_end, id: p.id }
            };
        },

        /**
         * Obtiene el rendimiento detallado por torre para el heatmap
         * Basado en la desviación del consumo actual vs el promedio histórico por apartamento (Agua y Gas)
         */
        async getTowerPerformance(periodoId = null) {
            let p;
            if (periodoId) {
                p = periodoRepo.getById(periodoId);
            } else {
                p = periodoRepo.getUltimoPeriodoConDatos() || periodoRepo.getPeriodoActivo();
            }
            if (!p) return [];

            // 1. Obtener todas las torres
            const torres = db.prepare('SELECT id, nombre FROM torres ORDER BY nombre').all();

            // 2. Para cada torre, obtener sus apartamentos y el estado de consumo comparado con el histórico
            const result = torres.map(t => {
                const aptos = db.prepare(`
                    SELECT 
                        a.id, 
                        a.numero,
                        ac.consumo_m3 as consumo_agua,
                        gc.consumo_m3 as consumo_gas,
                        (
                            SELECT AVG(ac2.consumo_m3) 
                            FROM agua_consumo ac2 
                            WHERE ac2.apartamento_id = a.id AND ac2.periodo_id != ? AND ac2.periodo_id != 1 AND ac2.consumo_m3 > 0
                        ) as avg_agua,
                        (
                            SELECT AVG(gc2.consumo_m3) 
                            FROM gas_consumo gc2 
                            WHERE gc2.apartamento_id = a.id AND gc2.periodo_id != ? AND gc2.periodo_id != 1 AND gc2.consumo_m3 > 0
                        ) as avg_gas
                    FROM apartamentos a
                    LEFT JOIN agua_consumo ac ON ac.apartamento_id = a.id AND ac.periodo_id = ?
                    LEFT JOIN gas_consumo gc ON gc.apartamento_id = a.id AND gc.periodo_id = ?
                    WHERE a.torre_id = ?
                    ORDER BY a.numero
                `).all(p.id, p.id, p.id, p.id, t.id);

                const aptosWithStatus = aptos.map(apto => {
                    const consumptionWater = apto.consumo_agua || 0;
                    const consumptionGas = apto.consumo_gas || 0;
                    const historicalWater = apto.avg_agua || consumptionWater || 0;
                    const historicalGas = apto.avg_gas || consumptionGas || 0;

                    let status = 'ok';
                    let detail = [];

                    // Si no hay datos de consumo en este periodo, marcamos como pending
                    if ((apto.consumo_agua === null || apto.consumo_agua === undefined) &&
                        (apto.consumo_gas === null || apto.consumo_gas === undefined)) {
                        status = 'pending';
                    } else {
                        // Lógica de alerta (desviación > 50%)
                        const waterAlert = historicalWater > 0 && Math.abs(consumptionWater - historicalWater) > (historicalWater * 0.5);
                        const gasAlert = historicalGas > 0 && Math.abs(consumptionGas - historicalGas) > (historicalGas * 0.5);

                        if (waterAlert || gasAlert) {
                            status = 'alert';
                        }
                    }

                    return {
                        id: apto.id,
                        numero: apto.numero,
                        consumo_agua: consumptionWater,
                        consumo_gas: consumptionGas,
                        status: status
                    };
                });

                return {
                    tower: t.nombre,
                    aptos: aptosWithStatus
                };
            });

            return result;
        },

        /**
         * Obtiene alertas reales basadas en discrepancias o falta de datos (Histórico)
         */
        async getAlertas() {
            const p = periodoRepo.getUltimoPeriodoConDatos() || periodoRepo.getPeriodoActivo();
            if (!p) return [];

            const alertas = [];

            // 1. Alertas de falta de datos o inconsistencias generales
            if (p.alertas > 0) {
                alertas.push({
                    id: 'alert_coef',
                    type: 'rojo',
                    title: 'Alerta Coeficiente',
                    msg: `Se detectó una discrepancia del ${p.alertas}% en el coeficiente general.`
                });
            }

            // 2. Alertas de desviaciones críticas individuales (Agua y Gas)
            const aptosAudit = db.prepare(`
                SELECT 
                    a.numero, 
                    t.nombre as torre,
                    ac.consumo_m3 as consumo_agua,
                    gc.consumo_m3 as consumo_gas,
                    (SELECT AVG(ac2.consumo_m3) FROM agua_consumo ac2 WHERE ac2.apartamento_id = a.id AND ac2.periodo_id != ? AND ac2.periodo_id != 1 AND ac2.consumo_m3 > 0) as avg_agua,
                    (SELECT AVG(gc2.consumo_m3) FROM gas_consumo gc2 WHERE gc2.apartamento_id = a.id AND gc2.periodo_id != ? AND gc2.periodo_id != 1 AND gc2.consumo_m3 > 0) as avg_gas
                FROM apartamentos a
                JOIN torres t ON a.torre_id = t.id
                LEFT JOIN agua_consumo ac ON ac.apartamento_id = a.id AND ac.periodo_id = ?
                LEFT JOIN gas_consumo gc ON gc.apartamento_id = a.id AND gc.periodo_id = ?
            `).all(p.id, p.id, p.id, p.id);

            let anomalos = 0;
            aptosAudit.forEach(a => {
                const wAlert = a.avg_agua > 0 && Math.abs((a.consumo_agua || 0) - a.avg_agua) > (a.avg_agua * 0.7); // 70% para alertar en lista
                const gAlert = a.avg_gas > 0 && Math.abs((a.consumo_gas || 0) - a.avg_gas) > (a.avg_gas * 0.7);

                if (wAlert || gAlert) {
                    anomalos++;
                    let service = wAlert && gAlert ? 'Agua y Gas' : (wAlert ? 'Agua' : 'Gas');
                    if (anomalos <= 5) { // Mostrar máximo 5 individuales
                        alertas.push({
                            id: `alert_ind_${a.torre}_${a.numero}`,
                            type: 'rojo',
                            title: `Consumo Anómalo ${a.torre}-${a.numero}`,
                            msg: `El consumo de ${service} está muy alejado de su promedio histórico.`
                        });
                    }
                }
            });

            if (anomalos > 5) {
                alertas.push({
                    id: 'alert_many_anomalies',
                    type: 'rojo',
                    title: 'Múltiples Anomalías',
                    msg: `Se detectaron ${anomalos} apartamentos con consumos fuera de lo común.`
                });
            }

            if (alertas.length === 0) {
                alertas.push({
                    id: 'alert_ok',
                    type: 'verde',
                    title: 'Sistema OK',
                    msg: `Consumos analizados para ${p.mes_end}/${p.anio_end}. Sin desviaciones críticas.`
                });
            }

            return alertas;
        }
    };
}
