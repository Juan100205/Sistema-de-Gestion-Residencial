export function createApartamentosTable(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS apartamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      torre_id INTEGER NOT NULL,
      numero INTEGER NOT NULL,

      activo INTEGER DEFAULT 1,
      coeficiente REAL DEFAULT 0,

      UNIQUE (torre_id, numero),

      CHECK (numero > 0),
      CHECK (coeficiente >= 0),
      CHECK (activo IN (0,1)),

      FOREIGN KEY (torre_id)
        REFERENCES torres(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    )
  `).run();
}
