export default function AuditLogRepository(db) {
    return {
        getAll() {
            return db.prepare(`
        SELECT al.*, p.anio_end as anio, p.mes_end as mes
        FROM audit_logs al
        LEFT JOIN periodo p ON al.entity_id = p.id AND al.entity_type = 'periodo'
        ORDER BY al.created_at DESC
      `).all();
        },

        create(entityType, entityId, entityName, action, description) {
            const result = db.prepare(`
        INSERT INTO audit_logs (entity_type, entity_id, entity_name, action, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(entityType, entityId, entityName, action, description);

            return result.lastInsertRowid;
        }
    };
}
