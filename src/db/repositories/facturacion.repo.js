export default function FacturacionRepository(db) {
    return {
        upsert({ apartamento_id, periodo_id, costo_agua, costo_gas, costo_total }) {
            const stmt = db.prepare(`
        INSERT INTO facturacion (apartamento_id, periodo_id, costo_agua, costo_gas, costo_total)
        VALUES (@apartamento_id, @periodo_id, @costo_agua, @costo_gas, @costo_total)
        ON CONFLICT(apartamento_id, periodo_id) DO UPDATE SET
          costo_agua = excluded.costo_agua,
          costo_gas = excluded.costo_gas,
          costo_total = excluded.costo_total
      `);
            return stmt.run({ apartamento_id, periodo_id, costo_agua, costo_gas, costo_total });
        },
        getByPeriodo(periodo_id) {
            return db.prepare(`SELECT * FROM facturacion WHERE periodo_id = ?`).all(periodo_id);
        }
    };
}
