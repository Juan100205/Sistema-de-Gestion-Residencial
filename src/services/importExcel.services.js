import PeriodoRepository from "../db/repositories/periodo.repo.js";
import TorresRepository from "../db/repositories/torres.repo.js";
import ApartamentosRepository from "../db/repositories/apartamentos.repo.js";
import AguaConsumoRepository from "../db/repositories/aguaConsumo.repo.js";
import GasConsumoRepository from "../db/repositories/gasConsumo.repo.js";
import BasureroRepository from "../db/repositories/basurero.repo.js";
import FacturacionRepository from "../db/repositories/facturacion.repo.js";
import RecalculationService from "./Recalculation.services.js";

export default function ImportExcelService(db) {
  const periodoRepo = PeriodoRepository(db);
  const torresRepo = TorresRepository(db);
  const aptoRepo = ApartamentosRepository(db);
  const aguaRepo = AguaConsumoRepository(db);
  const gasRepo = GasConsumoRepository(db);
  const basureroRepo = BasureroRepository(db);
  const facturacionRepo = FacturacionRepository(db);
  const recalcService = RecalculationService(db);

  function normalizeRow(row) {
    const normalized = {};
    Object.keys(row).forEach(key => {
      // Aggressive normalization: remove everything except a-z and 0-9
      const cleanKey = key.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9]/g, ""); // remove EVERYTHING ELSE (symbols, spaces, underscores)
      normalized[cleanKey] = row[key];
    });
    return normalized;
  }

  function normalize(value) {
    if (value === null || value === undefined) return null;
    return String(value).trim();
  }

  function parseLectura(value) {
    if (value === null || value === undefined || value === "") return 0;
    // Clean string: remove anything that isn't a digit, comma or dot
    const cleanStr = String(value).trim().replace(/[^0-9,.]/g, "").replace(",", ".");
    const num = Number(cleanStr);

    if (isNaN(num)) {
      console.warn(`⚠️ [Parser] Valor de lectura no numérico: "${value}" -> filtrado como "${cleanStr}" -> 0`);
      return 0;
    }
    return num;
  }
  function getValueFromRow(row, possibleKeys) {
    for (let key of possibleKeys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
    }
    return null;
  }
  function validateYearMonth(anio, mes, index) {
    if (isNaN(anio) || isNaN(mes) || !anio || !mes) {
      throw new Error(`Año o mes inválido en fila ${index + 1}: año=${anio}, mes=${mes}`)
    }
    if (mes < 1 || mes > 12) {
      throw new Error(`Mes fuera de rango (1-12) en fila ${index + 1}: ${mes}`);
    }
  }
  function getPreviousMonth(anio, mes) {
    if (mes === 1) return { initAnio: anio - 1, initMes: 12 };
    return { initAnio: anio, initMes: mes - 1 };
  }

  function getNextMonth(anio, mes) {
    if (mes === 12) return { anio: anio + 1, mes: 1 };
    return { anio, mes: mes + 1 };
  }

  function interpolateReadings(readings, daysInMonth) {
    if (!readings.length) return Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, value: 0 }));

    const sorted = [...readings].sort((a, b) => a.day - b.day);
    const result = [];

    // Fill gaps before first reading
    for (let d = 1; d < sorted[0].day; d++) {
      result.push({ day: d, value: sorted[0].value });
    }

    for (let i = 0; i < sorted.length; i++) {
      result.push(sorted[i]);
      if (i < sorted.length - 1) {
        const current = sorted[i];
        const next = sorted[i + 1];
        const gap = next.day - current.day;
        if (gap > 1) {
          const step = (next.value - current.value) / gap;
          for (let d = 1; d < gap; d++) {
            result.push({ day: current.day + d, value: current.value + step * d });
          }
        }
      }
    }

    // Fill gaps after last reading
    const last = result[result.length - 1];
    for (let d = last.day + 1; d <= daysInMonth; d++) {
      result.push({ day: d, value: last.value });
    }

    return result.sort((a, b) => a.day - b.day);
  }

  return {
    async import(rows) {
      console.log(`� importExcelService: Iniciando importación de ${rows?.length} filas`);
      if (!rows || !rows.length) throw new Error("El archivo Excel está vacío o no se leyó correctamente.");

      const normalizedRows = rows.map(normalizeRow);

      // --- DETECCIÓN DE PERIODO ---
      const firstRow = normalizedRows[0];
      const anio = parseInt(getValueFromRow(firstRow, ['anio', 'year', 'ano']));
      const mes = parseInt(getValueFromRow(firstRow, ['mes', 'month']));

      console.log(`📅 Periodo detectado del Excel: ${anio}-${mes}`);
      console.log('🔍 [Headers] Primer registro (Normalizado):', JSON.stringify(firstRow));

      if (isNaN(anio) || isNaN(mes)) {
        console.error('❌ Error detectando periodo. Llaves disponibles:', Object.keys(firstRow));
        throw new Error("No se pudo detectar el Año o Mes en el archivo Excel.");
      }
      validateYearMonth(anio, mes, 0);

      const daysInMonth = new Date(anio, mes, 0).getDate();

      const groups = {};
      normalizedRows.forEach((row, index) => {
        const torre = normalize(getValueFromRow(row, ['torre', 'tower', 'torr', 'tr']));
        const apto = normalize(getValueFromRow(row, ['apartamento', 'apto', 'apartment', 'apt', 'apart']));
        const dia = parseInt(getValueFromRow(row, ['dia', 'day']));
        // Aggressive variations for water and gas
        const lectAgua = parseLectura(getValueFromRow(row, [
          'lecturamedidoragua', 'lecturamedidor', 'lecturaagua', 'agua',
          'lecturaactualagua', 'consumoagua', 'lecturaactual', 'lectura'
        ]));
        const lectGas = parseLectura(getValueFromRow(row, [
          'lecturagas', 'gas', 'lecturamedidorgas', 'lecturaactualgas',
          'consumogas', 'lecturagasactual'
        ]));

        if (!torre || !apto) return;

        const key = `${torre}-${apto}`;
        if (!groups[key]) {
          groups[key] = { torre, apto, aguaReadings: [], gasReadings: [], monthlyAgua: 0, monthlyGas: 0 };
        }

        if (!isNaN(dia) && dia >= 1 && dia <= daysInMonth) {
          groups[key].aguaReadings.push({ day: dia, value: lectAgua });
          groups[key].gasReadings.push({ day: dia, value: lectGas });
        } else {
          groups[key].monthlyAgua = lectAgua;
          groups[key].monthlyGas = lectGas;
        }
      });

      console.log(`🟣 Iniciando transacción para ${Object.keys(groups).length} grupos de apartamentos`);
      db.transaction(() => {
        let periodo = periodoRepo.getByYearMonth(anio, mes);

        // --- OVERWRITE PROTECTION ---
        if (periodo) {
          const hasData = db.prepare('SELECT 1 FROM agua_consumo WHERE periodo_id = ? LIMIT 1').get(periodo.id);
          if (hasData) {
            throw new Error(`El periodo ${anio}-${mes} ya contiene datos. Para actualizar use la página de actualización o borre el periodo primero.`);
          }
        }
        if (!periodo) {
          const lastPeriodo = periodoRepo.getLast();
          let initAnio, initMes;

          if (lastPeriodo) {
            const expected = getNextMonth(lastPeriodo.anio_end, lastPeriodo.mes_end);
            if (anio !== expected.anio || mes !== expected.mes) {
              throw new Error(`Continuidad rota: El último periodo cerrado es ${lastPeriodo.anio_end}-${lastPeriodo.mes_end}. Debe importar el periodo ${expected.anio}-${expected.mes} antes de ${anio}-${mes}.`);
            }
            initAnio = lastPeriodo.anio_end;
            initMes = lastPeriodo.mes_end;
          } else {
            ({ initAnio, initMes } = getPreviousMonth(anio, mes));
          }

          periodo = periodoRepo.create({
            anio_init: initAnio, // ... use defaults
            mes_init: initMes,
            anio_end: anio,
            mes_end: mes,
            precio_m3_agua: lastPeriodo?.precio_m3_agua ?? 0,
            precio_m3_gas: lastPeriodo?.precio_m3_gas ?? 0,
            coeficiente_general: lastPeriodo?.coeficiente_general ?? 1.0,
            alertas: lastPeriodo?.alertas ?? 0,
            // ... Initialize other fields with 0 or carry-over
            gas_total_torre_a: lastPeriodo?.gas_total_torre_a ?? 0,
            gas_m3_torre_a: 0,
            gas_total_torre_b: lastPeriodo?.gas_total_torre_b ?? 0,
            gas_m3_torre_b: 0,
            gas_total_torre_c: lastPeriodo?.gas_total_torre_c ?? 0,
            gas_m3_torre_c: 0,
            agua_total_residencia: lastPeriodo?.agua_total_residencia ?? 0,
            agua_m3_total_residencia: 0,
            agua_total_comunes: 0,
            agua_m3_comunes: 0,
            agua_m3_eeab: 0,
            gas_m3_zonas_humedas: 0
          });
        }

        // --- BILLING PARAMS ---
        const precioAgua = periodo.precio_m3_agua || 0;
        const precioGas = periodo.precio_m3_gas || 0;
        const factorAguaGas = periodo.coeficiente_general || 0; // Ratio used to Estimate Gas

        Object.values(groups).forEach(group => {
          // Robust Tower Normalization: ensure it matches "TORRE A", "TORRE B", etc.
          let cleanTorre = group.torre.toUpperCase().trim();
          if (!cleanTorre.startsWith('TORRE')) {
            cleanTorre = `TORRE ${cleanTorre}`;
          }

          const torreData = torresRepo.getByNombre(cleanTorre);
          if (!torreData) {
            console.error(`❌ Torre no encontrada: "${cleanTorre}" (Original: "${group.torre}")`);
            throw new Error(`La torre "${group.torre}" (buscada como "${cleanTorre}") no existe en la base de datos.`);
          }

          const aptoData = aptoRepo.getByTorreNumero(cleanTorre, group.apto);
          if (!aptoData) {
            console.warn(`⚠️ Apartamento ${cleanTorre}-${group.apto} no encontrado en la BD. Saltando...`);
            return;
          }

          let consumoAgua = 0;
          let lastAgua = 0;

          // 1. Calculate Water Consumption
          if (group.aguaReadings.length > 0) {
            // DAILY READINGS (with "dia" column)
            const interpolatedAgua = interpolateReadings(group.aguaReadings, daysInMonth);
            const firstAgua = interpolatedAgua[0].value;
            lastAgua = interpolatedAgua[interpolatedAgua.length - 1].value;
            consumoAgua = Math.max(0, lastAgua - firstAgua);
          } else {
            // MONTHLY READING (single value for the whole month)
            // Try to find the reading in the normalized row (without "dia")
            // We search in original group data if we captured it without dia
            lastAgua = group.monthlyAgua || 0;

            // Fetch previous reading from DB
            const previousReading = aguaRepo.getPreviousReading(aptoData.id, anio, mes);
            consumoAgua = Math.max(0, lastAgua - previousReading);
            console.log(`💧 Apt ${cleanTorre}-${group.apto}: Act=${lastAgua}, Prev=${previousReading}, Consumo=${consumoAgua}`);
          }

          // 2. Calculate Water Cost
          const costoAgua = consumoAgua * precioAgua;

          console.log(`💧 [Import] Apto ${cleanTorre}-${group.apto}: Lectura=${lastAgua}, Consumo=${consumoAgua}`);

          aguaRepo.upsert({
            periodo_id: periodo.id,
            apartamento_id: aptoData.id,
            lectura_actual: lastAgua,
            consumo_m3: +consumoAgua.toFixed(2),
            costo_calculado: +costoAgua.toFixed(2)
          });

          // 3. Calculate Gas Consumption (Derived) & Cost
          const consumoGas = consumoAgua * factorAguaGas;
          const costoGas = consumoGas * precioGas;

          gasRepo.upsert({
            torre: cleanTorre,
            apartamento: group.apto,
            anio,
            mes,
            lectura_actual: 0,
            consumo_m3: +consumoGas.toFixed(2),
            costo_calculado: +costoGas.toFixed(2)
          });

          // 4. Calculate Total Cost & Persist Facturacion
          const totalCosto = costoAgua + costoGas;

          facturacionRepo.upsert({
            apartamento_id: aptoData.id,
            periodo_id: periodo.id,
            costo_agua: +costoAgua.toFixed(2),
            costo_gas: +costoGas.toFixed(2),
            costo_total: +totalCosto.toFixed(2)
          });
        });

        basureroRepo.createSnapshot(anio, mes);
        console.log('🟣 Transacción exitosa. Snapshot de basurero creado.');
      })();

      // RECALCULAR AUTOMÁTICAMENTE PARA ASEGURAR CONSISTENCIA
      const periodo = periodoRepo.getByYearMonth(anio, mes);
      if (periodo) {
        console.log(`🔄 [Import] Finalizando: disparando recálculo para periodo ${periodo.id}`);
        recalcService.recalculatePeriod(periodo.id);
      }

      console.log('🟢 Importación finalizada');
    }
  }
}
