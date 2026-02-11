export function createGasConsumoTable(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS gas_consumo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      apartamento_id INTEGER NOT NULL,
      periodo_id INTEGER NOT NULL,

      lectura_actual REAL NOT NULL,
      consumo_m3 REAL NOT NULL,
      costo_calculado REAL DEFAULT 0,

      observaciones TEXT,

      CHECK (lectura_actual >= 0),
      CHECK (consumo_m3 >= 0),

      UNIQUE (apartamento_id, periodo_id),

      FOREIGN KEY (apartamento_id)
        REFERENCES apartamentos(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

      FOREIGN KEY (periodo_id)
        REFERENCES periodo(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    )
  `).run();
}
