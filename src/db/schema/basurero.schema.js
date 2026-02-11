export function createBasureroTable(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS basurero_periodo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      periodo_id INTEGER NOT NULL,

      snapshot_json TEXT NOT NULL,
      checksum TEXT NOT NULL,

      creado_en TEXT NOT NULL DEFAULT (datetime('now')),

      UNIQUE (periodo_id),

      FOREIGN KEY (periodo_id)
        REFERENCES periodo(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    )
  `).run();
}
