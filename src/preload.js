// preload.js
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  periodo: {
    getAll: () => ipcRenderer.invoke("periodo:getAll"),
    getActivo: () => ipcRenderer.invoke("periodo:getActivo"),
    delete: (id) => ipcRenderer.invoke("periodo:delete", id),
    update: (payload) => ipcRenderer.invoke("periodo:update", payload),
    resetEnvVars: (id) => ipcRenderer.invoke("periodo:resetEnvVars", id),
    getConsumoDetallado: (anio, mes) => ipcRenderer.invoke("periodo:getConsumoDetallado", anio, mes),
    saveConsumos: (payload) => ipcRenderer.invoke("periodo:saveConsumos", payload),
    saveMultipleConsumos: (payload) => ipcRenderer.invoke("periodo:saveMultipleConsumos", payload),
    getPrevious: (payload) => ipcRenderer.invoke("periodo:getPrevious", payload)
  },
  basurero: {
    getAll: () => ipcRenderer.invoke("basurero:getAll"),
    restore: (payload) => ipcRenderer.invoke("basurero:restore", payload),
    getSnapshotData: (payload) => ipcRenderer.invoke("basurero:getSnapshotData", payload)
  },
  excel: {
    saveData: (rows) => ipcRenderer.invoke("excel:save", rows),
    updateData: (payload) => ipcRenderer.invoke("excel:updateData", payload)
  },
  export: {
    getTorres: () => ipcRenderer.invoke("export:getTorres"),
    getApartamentos: () => ipcRenderer.invoke("export:getApartamentos"),
    getReportData: (payload) => ipcRenderer.invoke("export:getReportData", payload),
    getApartmentHistory: (payload) => ipcRenderer.invoke("export:getApartmentHistory", payload),
    getAllData: () => ipcRenderer.invoke("export:getAllData")
  },
  home: {
    getStats: (periodoId) => ipcRenderer.invoke("home:getStats", periodoId),
    getAlertas: () => ipcRenderer.invoke("home:getAlertas"),
    getHeatmap: (periodoId) => ipcRenderer.invoke("home:getHeatmap", periodoId)
  },
  audit: {
    getAll: () => ipcRenderer.invoke("audit:getAll")
  },
  db: {
    getInfo: () => ipcRenderer.invoke("db:getInfo"),
    reset: () => ipcRenderer.invoke("db:reset")
  }
});
