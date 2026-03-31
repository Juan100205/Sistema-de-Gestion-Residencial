// server/index.js — Express REST API server (replaces Electron main process)
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, dbPath } from './db.js';
import { initDatabase } from './initDb.js';

import PeriodoRepository from '../src/db/repositories/periodo.repo.js';
import BasureroRepository from '../src/db/repositories/basurero.repo.js';
import AuditLogRepository from '../src/db/repositories/auditLog.repo.js';
import CallDataService from '../src/services/CallData.services.js';
import SaveDataService from '../src/services/SaveData.services.js';
import UpdateExcelService from '../src/services/updateExcel.services.js';
import EnvironmentDataModService from '../src/services/EnvironmentDataMod.services.js';
import ExportDataService from '../src/services/ExportData.services.js';
import HomeDataService from '../src/services/HomeData.services.js';
import ImportExcelService from '../src/services/importExcel.services.js';
import { seedInitialData } from '../src/db/seeds/seed.initial.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3001;

// Initialize DB
const database = db();
initDatabase(database);

// Initialize services and repositories
const repo = PeriodoRepository(database);
const basureroRepo = BasureroRepository(database);
const auditRepo = AuditLogRepository(database);
const callDataService = CallDataService(database);
const saveDataService = SaveDataService(database);
const updateExcelService = UpdateExcelService(database);
const envModService = EnvironmentDataModService(database);
const exportService = ExportDataService(database);
const homeService = HomeDataService(database);
const importService = ImportExcelService(database);

// Setup Express
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper: wrap async handlers
const wrap = (fn) => (req, res) => {
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message });
  });
};

// ─── PERIODO ────────────────────────────────────────────────────────────────
app.get('/api/periodo', wrap(async (req, res) => {
  res.json(repo.getAll());
}));

app.get('/api/periodo/activo', wrap(async (req, res) => {
  res.json(repo.getPeriodoActivo());
}));

app.get('/api/periodo/previous', wrap(async (req, res) => {
  const { anio, mes } = req.query;
  res.json(await repo.getPrevious(Number(anio), Number(mes)));
}));

app.get('/api/periodo/consumo/:anio/:mes', wrap(async (req, res) => {
  const { anio, mes } = req.params;
  res.json(await callDataService.getConsumoDetallado(Number(anio), Number(mes)));
}));

app.delete('/api/periodo/:id', wrap(async (req, res) => {
  repo.delete(Number(req.params.id));
  res.json({ success: true });
}));

app.put('/api/periodo', wrap(async (req, res) => {
  const { id, data } = req.body;
  res.json(await envModService.updatePeriodo(id, data));
}));

app.post('/api/periodo/:id/resetEnvVars', wrap(async (req, res) => {
  await repo.resetEnvVars(Number(req.params.id));
  res.json({ success: true });
}));

app.post('/api/periodo/saveConsumos', wrap(async (req, res) => {
  res.json(await saveDataService.saveConsumos(req.body));
}));

app.post('/api/periodo/saveMultipleConsumos', wrap(async (req, res) => {
  const { periodo_id, items } = req.body;
  res.json(await saveDataService.saveMultipleConsumos(periodo_id, items));
}));

// ─── BASURERO ───────────────────────────────────────────────────────────────
app.get('/api/basurero', wrap(async (req, res) => {
  res.json(basureroRepo.getAll());
}));

app.post('/api/basurero/restore', wrap(async (req, res) => {
  const { anio, mes } = req.body;
  res.json(await saveDataService.restoreSnapshot(anio, mes));
}));

app.get('/api/basurero/snapshot', wrap(async (req, res) => {
  const { anio, mes } = req.query;
  res.json(basureroRepo.getSnapshotData(Number(anio), Number(mes)));
}));

// ─── EXCEL ──────────────────────────────────────────────────────────────────
app.post('/api/excel/save', wrap(async (req, res) => {
  const rows = req.body;
  await importService.import(rows);
  res.json({ success: true, message: 'Datos importados correctamente' });
}));

app.put('/api/excel/update', wrap(async (req, res) => {
  const { periodo_id, rows } = req.body;
  res.json(await updateExcelService.update(periodo_id, rows));
}));

// ─── EXPORT ─────────────────────────────────────────────────────────────────
app.get('/api/export/torres', wrap(async (req, res) => {
  res.json(await exportService.getTorres());
}));

app.get('/api/export/apartamentos', wrap(async (req, res) => {
  res.json(await exportService.getApartamentos());
}));

app.get('/api/export/report', wrap(async (req, res) => {
  const { anio, mes, filters } = req.query;
  const parsedFilters = filters ? JSON.parse(filters) : undefined;
  res.json(await exportService.getReportData(Number(anio), Number(mes), parsedFilters));
}));

app.get('/api/export/history/:aptoId', wrap(async (req, res) => {
  res.json(await exportService.getApartmentHistory(Number(req.params.aptoId)));
}));

app.get('/api/export/all', wrap(async (req, res) => {
  res.json(await exportService.getAllData());
}));

// ─── HOME ───────────────────────────────────────────────────────────────────
app.get('/api/home/stats', wrap(async (req, res) => {
  const periodoId = req.query.periodoId ? Number(req.query.periodoId) : undefined;
  res.json(await homeService.getDashboardStats(periodoId));
}));

app.get('/api/home/alertas', wrap(async (req, res) => {
  res.json(await homeService.getAlertas());
}));

app.get('/api/home/heatmap', wrap(async (req, res) => {
  const periodoId = req.query.periodoId ? Number(req.query.periodoId) : undefined;
  res.json(await homeService.getTowerPerformance(periodoId));
}));

// ─── AUDIT ──────────────────────────────────────────────────────────────────
app.get('/api/audit', wrap(async (req, res) => {
  res.json(auditRepo.getAll());
}));

// ─── DB ─────────────────────────────────────────────────────────────────────
app.get('/api/db/info', wrap(async (req, res) => {
  res.json({ path: dbPath });
}));

app.post('/api/db/reset', wrap(async (req, res) => {
  console.log('🧨 Iniciando reset total de DB...');
  database.pragma('foreign_keys = OFF');
  try {
    database.transaction(() => {
      const tables = [
        'facturacion', 'gas_consumo', 'agua_consumo', 'basurero',
        'audit_logs', 'calderas', 'zonas_comunes', 'apartamentos', 'torres', 'periodo'
      ];
      tables.forEach(table => {
        try {
          database.prepare(`DELETE FROM ${table}`).run();
          database.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
        } catch (e) {
          console.warn(`⚠️ Al vaciar ${table}:`, e.message);
        }
      });
      seedInitialData(database);
    })();
    res.json({ success: true });
  } finally {
    database.pragma('foreign_keys = ON');
  }
}));

// ─── STATIC (production) ────────────────────────────────────────────────────
const distPath = path.join(__dirname, '..', 'dist-web');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Servidor web iniciado en http://localhost:${PORT}`);
});
