import PeriodoRepository from "../db/repositories/periodo.repo.js";
import BasureroRepository from "../db/repositories/basurero.repo.js";
import RecalculationService from "./Recalculation.services.js";

/**
 * Servicio especializado en la modificación de variables de entorno y parámetros de periodos.
 */
export default function EnvironmentDataModService(db) {
    const periodoRepo = PeriodoRepository(db);
    const basureroRepo = BasureroRepository(db);
    const recalcService = RecalculationService(db);

    /**
     * Asegura que exista un snapshot del periodo antes de realizar modificaciones.
     * (Estrategia compartida para mantener historial)
     */
    const ensureSnapshot = (periodo_id) => {
        if (!basureroRepo.existsByPeriodoId(periodo_id)) {
            const p = periodoRepo.getById(periodo_id);
            if (!p) return;
            basureroRepo.createSnapshot(p.anio_end, p.mes_end);
        }
    };

    return {
        /**
         * Actualiza los metadatos de un periodo (costos, coeficientes) asegurando un snapshot previo.
         */
        async updatePeriodo(id, data) {

            return db.transaction(() => {
                // Respaldar estado original antes de cualquier cambio en variables si no existe snapshot
                ensureSnapshot(id);

                // Actualizar datos en la base de datos
                const result = periodoRepo.update(id, data);

                // RECALCULAR AUTOMÁTICAMENTE
                recalcService.recalculatePeriod(id);

                return result;
            })();
        }
    };
}
