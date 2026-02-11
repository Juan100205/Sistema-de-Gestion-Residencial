export function createZonasComunesTable(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS zonas_comunes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      periodo_id INTEGER NOT NULL,

      consumo_agua_m3 REAL NOT NULL DEFAULT 0,
      consumo_gas_m3 REAL NOT NULL DEFAULT 0,

      observaciones TEXT,

      CHECK (consumo_agua_m3 >= 0),
      CHECK (consumo_gas_m3 >= 0),

      UNIQUE (periodo_id),

      FOREIGN KEY (periodo_id)
        REFERENCES periodo(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    )
  `).run();
}
