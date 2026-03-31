// server/db.js — SQLite connection for Express server (no Electron dependency)
import Database from 'better-sqlite3';
import path from 'node:path';

const DB_PATH = path.join(process.cwd(), 'calleja.db');

let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    console.log(`[DB] Opening database at: ${DB_PATH}`);
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    dbInstance.pragma('synchronous = NORMAL');
    console.log('[DB] Database instance created successfully.');
  }
  return dbInstance;
}

export { getDatabase as db, DB_PATH as dbPath };
export default getDatabase;
