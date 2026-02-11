// src/main/db/connection.db.js

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';

/**
 * Ruta segura para la DB en Electron
 * (no se borra al actualizar la app)
 */
// Use project root DB for dev/verification consistency
const isDev = !app.isPackaged;
const dbPath = isDev
  ? path.join(process.cwd(), 'calleja.db')
  : path.join(app.getPath('userData'), 'calleja.db');

/**
 * Inicialización de SQLite
 */
const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development'
    ? console.log
    : null
});

/**
 * Configuración recomendada
 */
db.pragma('journal_mode = WAL');   // mejor concurrencia
db.pragma('foreign_keys = ON');    // claves foráneas
db.pragma('synchronous = NORMAL'); // balance seguridad/performance


export { dbPath };
export default db;
