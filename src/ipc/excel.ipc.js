
import ImportExcelService from "../services/importExcel.services.js";
import { db } from "../db/index.db.js";

export function registerExcelIPC(ipcMain) {
  const handle = (channel, listener) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, listener);
  };

  const importService = ImportExcelService(db);

  handle("excel:save", async (_, rows) => {
    console.log('🔵 IPC excel:save recibido, filas:', rows?.length);
    try {
      console.log('🔵 Llamando a importService.import...');
      await importService.import(rows);
      console.log('🟢 Import completado sin errores');
      return { success: true, message: "Datos importados correctamente" };
    } catch (error) {
      console.error('🔴 Error en import:', error);
      return { success: false, error: error.message };
    }
  });
}
