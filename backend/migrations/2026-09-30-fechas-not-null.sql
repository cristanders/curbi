-- Migracion: created_at debe llenarse sola en los movimientos nuevos.
--
-- La migracion 2026-09-29 agrego created_at como "timestamp NULL DEFAULT NULL" y
-- le puso fecha a las filas que ya existian. Pero NULL DEFAULT NULL significa que
-- MySQL NO le pone CURRENT_TIMESTAMP a los INSERT siguientes: todo movimiento nuevo
-- nacia sin fecha. Eso rompia dos cosas a la vez:
--
--   - la barra del presupuesto ignoraba el gasto (el JOIN filtra por created_at), as
--     que se podia gastar de mas y el limite seguia marcando 0 gastado;
--   - el listado ordenado por created_at mandaba los movimientos sin fecha al final,
--     o sea el mas reciente aparecia como el mas viejo.
--
-- Por eso la columna tiene que ser NOT NULL DEFAULT CURRENT_TIMESTAMP, no nullable.
use curbidb_in5bv;

-- Primero se rellenan los NULL que quedaron entre migraciones, con la misma cascada
-- por id: el ALTER a NOT NULL fallaria si quedara alguno.
UPDATE Transaction
   SET created_at = DATE_SUB(
         NOW(),
         INTERVAL (SELECT GREATEST(0, total - id_transaction)
                     FROM (SELECT MAX(id_transaction) AS total FROM Transaction) AS t
       ) DAY
     )
 WHERE created_at IS NULL;

SET @existe = (
  SELECT COUNT(*)
    FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'Transaction'
     AND COLUMN_NAME = 'created_at'
     AND IS_NULLABLE = 'NO'
     AND COLUMN_DEFAULT = 'CURRENT_TIMESTAMP'
);
SET @sql = IF(
  @existe = 0,
  'ALTER TABLE Transaction
     MODIFY COLUMN created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP',
  'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
