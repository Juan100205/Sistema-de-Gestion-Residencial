export function createFacturacionTable(db) {
    db.prepare(`
    CREATE TABLE IF NOT EXISTS facturacion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      apartamento_id INTEGER NOT NULL,
      periodo_id INTEGER NOT NULL,
      
      costo_agua REAL NOT NULL DEFAULT 0,
      costo_gas REAL NOT NULL DEFAULT 0,
      costo_total REAL NOT NULL DEFAULT 0,
      
      UNIQUE(apartamento_id, periodo_id),
      
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
