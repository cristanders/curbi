-- Migracion: el freno de gastos (intento de compra).
--
-- Expenditure_attempt guardaba product_name, estimated_amount, status e id_user, y
-- el status lo mandaba el cliente sin que nadie lo evaluara: cualquiera podia
-- "aprobarse" una compra. Con estas columnas el backend decide si el gasto cabe en
-- el presupuesto de la categoria, y guarda a que movimiento quedo ligado.
--
-- id_category es contra que limite se evalua. id_transaction deja rastro de que el
-- intento aprobado si movio plata de verdad. reason guarda el por que del Frenado,
-- porque un "no" sin explicacion no le sirve de nada al usuario.

use curbidb_in5bv;

SET @col = (
  SELECT COUNT(*)
    FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'Expenditure_attempt'
     AND COLUMN_NAME = 'id_category'
);
SET @sql = IF(
  @col = 0,
  'ALTER TABLE Expenditure_attempt
     ADD COLUMN id_category int NULL DEFAULT 1 AFTER product_name,
     ADD COLUMN id_transaction int NULL DEFAULT NULL AFTER status,
     ADD COLUMN reason varchar(160) NULL DEFAULT NULL AFTER id_transaction,
     ADD COLUMN created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP',
  'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Los intentos viejos no tienen categoria: se les asigna la 1, que es la que usa
-- el resto del proyecto cuando no se indica otra.
UPDATE Expenditure_attempt
   SET id_category = 1
 WHERE id_category IS NULL;

-- El listado es por usuario y ordenado por fecha, asi que el indice cubre las dos
-- cosas que usa la pantalla.
SET @idx = (
  SELECT COUNT(*)
    FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'Expenditure_attempt'
     AND INDEX_NAME = 'ix_expenditure_usuario'
);
SET @sql_idx = IF(
  @idx = 0,
  'CREATE INDEX ix_expenditure_usuario ON Expenditure_attempt (id_user, created_at)',
  'DO 0'
);
PREPARE stmt_idx FROM @sql_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;
