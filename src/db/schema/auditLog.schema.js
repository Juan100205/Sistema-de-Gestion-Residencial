export function createAuditLogTable(db) {
    db.prepare(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL, -- 'periodo', 'user', etc.
      entity_id INTEGER,         -- ID of the entity (can be null if deleted and we just want ref)
      entity_name TEXT,          -- Name snapshot (e.g. "Enero 2024") useful if entity is deleted
      action TEXT NOT NULL,      -- 'CREATION', 'UPDATE', 'DELETION', 'RESET'
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}
