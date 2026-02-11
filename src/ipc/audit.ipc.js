import AuditLogRepository from "../db/repositories/auditLog.repo.js";
import { db } from "../db/index.db.js";

export function registerAuditIPC(ipcMain) {
    const handle = (channel, listener) => {
        ipcMain.removeHandler(channel);
        ipcMain.handle(channel, listener);
    };

    const repo = AuditLogRepository(db);

    handle("audit:getAll", async () => {
        try {
            return repo.getAll();
        } catch (error) {
            console.error("Error en audit:getAll:", error);
            throw error;
        }
    });
}
