export function createCalderasTable(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS calderas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      torre_id INTEGER NOT NULL,
      periodo_id INTEGER NOT NULL,

      consumo_m3_agua REAL DEFAULT 0,
      consumo_m3_gas REAL DEFAULT 0,

      CHECK (consumo_m3_agua >= 0),
      CHECK (consumo_m3_gas >= 0),

      UNIQUE (torre_id, periodo_id),

      FOREIGN KEY (torre_id)
        REFERENCES torres(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

      FOREIGN KEY (periodo_id)
        REFERENCES periodo(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    )
  `).run();
}
