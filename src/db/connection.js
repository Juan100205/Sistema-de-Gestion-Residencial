// src/main/db/connection.db.js

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';

let dbInstance = null;

/**
 * Obtiene la ruta de la base de datos de manera segura
 */
export function getDbPath() {
  const isDev = !app.isPackaged;
  return isDev
    ? path.join(process.cwd(), 'calleja.db')
    : path.join(app.getPath('userData'), 'calleja.db');
}

/**
 * Inicialización perezosa de la base de datos
 */
function getDatabase() {
  if (!dbInstance) {
    const dbPath = getDbPath();
    console.log(`[DB] Opening database at: ${dbPath}`);
    console.log(`[DB] Database constructor type: ${typeof Database}`);
    try {
      dbInstance = new Database(dbPath, {
        verbose: process.env.NODE_ENV === 'development'
          ? console.log
          : null
      });

      /**
       * Configuración recomendada
       */
      dbInstance.pragma('journal_mode = WAL');   // mejor concurrencia
      dbInstance.pragma('foreign_keys = ON');    // claves foráneas
      dbInstance.pragma('synchronous = NORMAL'); // balance seguridad/performance
      console.log(`[DB] Database instance created successfully. keys: ${Object.keys(dbInstance).join(',')}`);
      console.log(`[DB] Has transaction method? ${typeof dbInstance.transaction}`);
    } catch (e) {
      console.error('[DB] Failed to create database instance:', e);
      throw e;
    }
  }
  return dbInstance;
}

export { getDatabase as db, getDbPath as dbPath };
export default getDatabase;
