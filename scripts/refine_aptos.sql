
-- Desactivar FKs
PRAGMA foreign_keys = OFF;

-- Limpiar tablas
DELETE FROM facturacion;
DELETE FROM agua_consumo;
DELETE FROM gas_consumo;
DELETE FROM calderas;
DELETE FROM basurero_periodo;
DELETE FROM zonas_comunes;
DELETE FROM periodo;
DELETE FROM apartamentos;
DELETE FROM torres;
DELETE FROM sqlite_sequence;

-- Insertar Torres
INSERT INTO torres (id, nombre) VALUES (1, 'A');
INSERT INTO torres (id, nombre) VALUES (2, 'B');
INSERT INTO torres (id, nombre) VALUES (3, 'C');

-- Torre A (37)
INSERT INTO apartamentos (torre_id, numero) VALUES 
(1,201),(1,202),(1,203),
(1,301),(1,302),
(1,401),(1,402),(1,403),(1,404),
(1,501),(1,502),(1,503),(1,504),
(1,601),(1,602),(1,603),
(1,701),(1,702),
(1,801),(1,802),(1,803),
(1,901),(1,902),
(1,1001),(1,1002),(1,1003),(1,1004),
(1,1101),(1,1102),(1,1103),(1,1104),
(1,1201),(1,1202),(1,1203),(1,1204),
(1,1301),(1,1302);

-- Torre B (32)
INSERT INTO apartamentos (torre_id, numero) VALUES 
(2,201),(2,202),(2,203),(2,204),
(2,301),(2,302),(2,303),
(2,401),(2,402),(2,403),
(2,501),(2,502),
(2,601),(2,602),(2,603),
(2,701),(2,702),(2,703),
(2,801),(2,802),
(2,901),(2,902),
(2,1001),(2,1002),
(2,1101),(2,1102),
(2,1201),(2,1202),(2,1203),(2,1204),
(2,1301),(2,1302);

-- Torre C (30)
INSERT INTO apartamentos (torre_id, numero) VALUES 
(3,201),(3,202),(3,203),
(3,301),(3,302),(3,303),
(3,401),(3,402),(3,403),
(3,501),(3,502),(3,503),
(3,601),(3,602),(3,603),
(3,701),(3,702),(3,703),
(3,801),(3,802),
(3,901),(3,902),
(3,1001),(3,1002),
(3,1101),(3,1102),
(3,1201),(3,1202),
(3,1301),(3,1302);

-- Activar FKs
PRAGMA foreign_keys = ON;

-- Verificación
SELECT 'TORRE A:', count(*) FROM apartamentos WHERE torre_id = 1;
SELECT 'TORRE B:', count(*) FROM apartamentos WHERE torre_id = 2;
SELECT 'TORRE C:', count(*) FROM apartamentos WHERE torre_id = 3;
SELECT 'TOTAL:', count(*) FROM apartamentos;
