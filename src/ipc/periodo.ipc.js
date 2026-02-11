
import PeriodoRepository from "../db/repositories/periodo.repo.js";
import BasureroRepository from "../db/repositories/basurero.repo.js";
import CallDataService from "../services/CallData.services.js";
import SaveDataService from "../services/SaveData.services.js";
import UpdateExcelService from "../services/updateExcel.services.js";
import EnvironmentDataModService from "../services/EnvironmentDataMod.services.js";
import ExportDataService from "../services/ExportData.services.js";
import HomeDataService from "../services/HomeData.services.js";
import { db } from "../db/index.db.js";
import { dbPath } from "../db/connection.js";
import { seedInitialData } from "../db/seeds/seed.initial.js";

export function registerPeriodoIPC(ipcMain) {
    // Helper to safely register handlers (avoiding "already registered" errors in dev)
    const handle = (channel, listener) => {
        ipcMain.removeHandler(channel);
        ipcMain.handle(channel, listener);
    };

    // AUTO-MIGRATION (Ensure Billing Columns/Table Exist)
    try {
        db.exec("ALTER TABLE agua_consumo ADD COLUMN costo_calculado REAL DEFAULT 0");
        console.log("✅ IPC: Added costo_calculado to agua_consumo");
    } catch (e) { }

    try {
        db.exec("ALTER TABLE gas_consumo ADD COLUMN costo_calculado REAL DEFAULT 0");
        console.log("✅ IPC: Added costo_calculado to gas_consumo");
    } catch (e) { }

    try {
        db.prepare(`
          CREATE TABLE IF NOT EXISTS facturacion (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            apartamento_id INTEGER NOT NULL,
            periodo_id INTEGER NOT NULL,
            costo_agua REAL NOT NULL DEFAULT 0,
            costo_gas REAL NOT NULL DEFAULT 0,
            costo_total REAL NOT NULL DEFAULT 0,
            UNIQUE(apartamento_id, periodo_id),
            FOREIGN KEY (apartamento_id) REFERENCES apartamentos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
            FOREIGN KEY (periodo_id) REFERENCES periodo(id) ON DELETE RESTRICT ON UPDATE CASCADE
          )
        `).run();
        console.log("✅ IPC: Table facturacion verified");
    } catch (e) {
        console.error("❌ IPC Migration Error:", e.message);
    }

    const repo = PeriodoRepository(db);
    const basureroRepo = BasureroRepository(db);
    const callDataService = CallDataService(db);
    const saveDataService = SaveDataService(db);
    const updateExcelService = UpdateExcelService(db);
    const envModService = EnvironmentDataModService(db);
    const exportService = ExportDataService(db);
    const homeService = HomeDataService(db);

    // Obtener todos los periodos
    handle("periodo:getAll", async () => {
        try {
            return repo.getAll();
        } catch (error) {
            console.error("Error en periodo:getAll:", error);
            throw error;
        }
    });

    // Obtener el periodo activo (el más reciente)
    handle("periodo:getActivo", async () => {
        try {
            return repo.getPeriodoActivo();
        } catch (error) {
            console.error("Error en periodo:getActivo:", error);
            throw error;
        }
    });

    // Eliminar un periodo
    handle("periodo:delete", async (_, id) => {
        try {
            repo.delete(id);
            return { success: true };
        } catch (error) {
            console.error("Error en periodo:delete:", error);
            return { success: false, error: error.message };
        }
    });

    // Actualizar un periodo (costos y coeficientes) con snapshot de seguridad
    handle("periodo:update", async (_, { id, data }) => {
        try {
            return await envModService.updatePeriodo(id, data);
        } catch (error) {
            console.error("Error en periodo:update:", error);
            return { success: false, error: error.message };
        }
    });

    // Resetear variables de entorno de un periodo (limpiar costos y totales)
    handle("periodo:resetEnvVars", async (_, id) => {
        try {
            await repo.resetEnvVars(id);
            return { success: true };
        } catch (error) {
            console.error("Error en periodo:resetEnvVars:", error);
            return { success: false, error: error.message };
        }
    });

    // Obtener consumo detallado de un periodo (Agua + Gas + Apto + Torre)
    handle("periodo:getConsumoDetallado", async (_, anio, mes) => {
        try {
            return await callDataService.getConsumoDetallado(anio, mes);
        } catch (error) {
            console.error("Error en periodo:getConsumoDetallado:", error);
            throw error;
        }
    });

    // Obtener el periodo anterior cronológicamente
    handle("periodo:getPrevious", async (_, { anio, mes }) => {
        try {
            const result = await repo.getPrevious(anio, mes);
            return result;
        } catch (error) {
            console.error("❌ IPC Error en periodo:getPrevious:", error);
            throw error;
        }
    });

    // Guardar consumos editados
    handle("periodo:saveConsumos", async (_, payload) => {
        try {
            return await saveDataService.saveConsumos(payload);
        } catch (error) {
            console.error("Error en periodo:saveConsumos:", error);
            throw error;
        }
    });

    // Guardar múltiples consumos (Masivo)
    handle("periodo:saveMultipleConsumos", async (_, { periodo_id, items }) => {
        try {
            return await saveDataService.saveMultipleConsumos(periodo_id, items);
        } catch (error) {
            console.error("Error en periodo:saveMultipleConsumos:", error);
            throw error;
        }
    });

    // OBTENER BASURERO
    handle("basurero:getAll", async () => {
        try {
            return basureroRepo.getAll();
        } catch (error) {
            console.error("Error en basurero:getAll:", error);
            throw error;
        }
    });

    // RESTAURAR SNAPSHOT
    handle("basurero:restore", async (_, { anio, mes }) => {
        try {
            return await saveDataService.restoreSnapshot(anio, mes);
        } catch (error) {
            console.error("Error en basurero:restore:", error);
            throw error;
        }
    });

    // RECUPERAR DATOS DE SNAPSHOT
    handle("basurero:getSnapshotData", async (_, { anio, mes }) => {
        try {
            return basureroRepo.getSnapshotData(anio, mes);
        } catch (error) {
            console.error("Error en basurero:getSnapshotData:", error);
            throw error;
        }
    });

    // ACTUALIZAR DATOS DESDE EXCEL
    handle("excel:updateData", async (_, { periodo_id, rows }) => {
        try {
            return await updateExcelService.update(periodo_id, rows);
        } catch (error) {
            console.error("Error en excel:updateData:", error);
            return { success: false, message: error.message };
        }
    });

    // --- REPORTES Y EXPORTACIÓN ---
    handle("export:getTorres", async () => {
        try {
            return await exportService.getTorres();
        } catch (error) {
            console.error("Error en export:getTorres:", error);
            throw error;
        }
    });

    handle("export:getApartamentos", async () => {
        try {
            return await exportService.getApartamentos();
        } catch (error) {
            console.error("Error en export:getApartamentos:", error);
            throw error;
        }
    });

    handle("export:getReportData", async (_, { anio, mes, filters }) => {
        try {
            return await exportService.getReportData(anio, mes, filters);
        } catch (error) {
            console.error("Error en export:getReportData:", error);
            throw error;
        }
    });

    handle("export:getApartmentHistory", async (_, { aptoId }) => {
        try {
            return await exportService.getApartmentHistory(aptoId);
        } catch (error) {
            console.error("Error en export:getApartmentHistory:", error);
            throw error;
        }
    });

    handle("export:getAllData", async () => {
        try {
            return await exportService.getAllData();
        } catch (error) {
            console.error("Error en export:getAllData:", error);
            throw error;
        }
    });

    // --- HOME Y ESTADÍSTICAS ---
    handle("home:getStats", async (_, periodoId) => {
        try {
            return await homeService.getDashboardStats(periodoId);
        } catch (error) {
            console.error("Error en home:getStats:", error);
            throw error;
        }
    });

    handle("home:getAlertas", async () => {
        try {
            return await homeService.getAlertas();
        } catch (error) {
            console.error("Error en home:getAlertas:", error);
            throw error;
        }
    });

    handle("home:getHeatmap", async (_, periodoId) => {
        try {
            return await homeService.getTowerPerformance(periodoId);
        } catch (error) {
            console.error("Error en home:getHeatmap:", error);
            throw error;
        }
    });

    // --- MANTENIMIENTO DB ---
    handle("db:getInfo", async () => {
        return { path: dbPath };
    });

    handle("db:reset", async () => {
        console.log("🧨 IPC: Iniciando reset total de DB...");
        try {
            // Disable FKs OUTSIDE the transaction (necessary in SQLite)
            db.pragma('foreign_keys = OFF');

            db.transaction(() => {
                // Table list in safe order (children first)
                const tables = [
                    'facturacion',
                    'gas_consumo',
                    'agua_consumo',
                    'basurero',
                    'audit_logs',
                    'calderas',
                    'zonas_comunes',
                    'apartamentos',
                    'torres',
                    'periodo'
                ];

                tables.forEach(table => {
                    try {
                        db.prepare(`DELETE FROM ${table}`).run();
                        db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
                        console.log(`  - Tabla ${table} vaciada.`);
                    } catch (e) {
                        console.warn(`  ⚠️ Al vaciar ${table}:`, e.message);
                    }
                });

                console.log("🧨 IPC: Tablas vaciadas. Re-sembrando...");
                seedInitialData(db);
                console.log("✅ IPC: DB reseteada y re-sembrada.");
            })();

            return { success: true };
        } catch (error) {
            console.error("❌ IPC: Error en db:reset:", error);
            return { success: false, error: error.message };
        } finally {
            // ALWAYS re-enable FKs after the operation
            db.pragma('foreign_keys = ON');
        }
    });
}
