export function createTorresTable(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS torres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      nombre TEXT NOT NULL COLLATE NOCASE,

      UNIQUE (nombre)
    )
  `).run();
}
