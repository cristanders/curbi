-- Migracion: fechas reales en las transacciones y presupuesto por categoria/mes.
--
-- Cierra dos problemas de la pantalla de Transacciones y de la de Presupuestos:
--
-- 1) Transaction no tenia columna de fecha. La tabla del frontend se inventaba una
--    a partir de la posicion de la fila (new Date(Date.now() - i * 86400000)), asi
--    que dos movimientos del mismo dia parecian de dias distintos y uno de hace
--    meses aparecia como "hoy". Sin created_at no hay forma de saber cuando paso
--    nada, y tampoco de calcular cuanto se gasto en un mes.
--
-- 2) Budget solo guardaba amount + id_user: sin categoria ni periodo no podia
--    decir "te pasaste en Comida este mes", que es lo unico que hace util un
--    presupuesto.

use curbidb_in5bv;

-- ---------------------------------------------------------------------------
-- 1) created_at en Transaction
-- ---------------------------------------------------------------------------

-- IF NOT EXISTS es de MariaDB; en MySQL 8 se arma con SQL preparado para que la
-- migracion se pueda correr mas de una vez.
SET @existe = (
  SELECT COUNT(*)
    FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'Transaction'
     AND COLUMN_NAME = 'created_at'
);
SET @sql = IF(
  @existe = 0,
  'ALTER TABLE Transaction ADD COLUMN created_at timestamp NULL DEFAULT NULL AFTER id_category',
  'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill: los movimientos anteriores a esta migracion no tienen fecha real. Se
-- les asigna una fecha en cascada hacia atras a partir del id mas alto, para que
-- al menos queden ordenados de forma coherente en vez de todos con la misma fecha.
SET @backfill = (
  SELECT COUNT(*) FROM Transaction WHERE created_at IS NULL
);
SET @sql_bf = IF(
  @backfill > 0,
  'UPDATE Transaction
      SET created_at = DATE_SUB(NOW(), INTERVAL (SELECT GREATEST(0, total - id_transaction) FROM (SELECT MAX(id_transaction) AS total FROM Transaction) AS t) DAY)',
  'DO 0'
);
PREPARE stmt_bf FROM @sql_bf;
EXECUTE stmt_bf;
DEALLOCATE PREPARE stmt_bf;

-- El listado se pide por usuario ordenado por fecha, asi que el indice cubre las
-- dos columnas que usa la pantalla.
SET @existe_idx = (
  SELECT COUNT(*)
    FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'Transaction'
     AND INDEX_NAME = 'ix_transaction_usuario_fecha'
);
SET @sql_idx = IF(
  @existe_idx = 0,
  'CREATE INDEX ix_transaction_usuario_fecha ON Transaction (id_user, created_at, id_transaction)',
  'DO 0'
);
PREPARE stmt_idx FROM @sql_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;

-- ---------------------------------------------------------------------------
-- 2) Budget con categoria y periodo mensual
-- ---------------------------------------------------------------------------

SET @col = (
  SELECT COUNT(*)
    FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'Budget'
     AND COLUMN_NAME = 'id_category'
);
SET @sql_col = IF(
  @col = 0,
  'ALTER TABLE Budget
     ADD COLUMN id_category int NULL AFTER amount,
     ADD COLUMN period_month char(7) NULL AFTER id_category,
     ADD COLUMN created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP',
  'DO 0'
);
PREPARE stmt_col FROM @sql_col;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;

-- Los presupuestos viejos no tienen categoria ni mes. Se les asignan el mes en
-- curso y la categoria 1 para que no queden huerfanos: NULL en id_category
-- romperia el indice unico de abajo.
UPDATE Budget
   SET period_month = DATE_FORMAT(NOW(), '%Y-%m')
 WHERE period_month IS NULL OR period_month = '';

UPDATE Budget
   SET id_category = 1
 WHERE id_category IS NULL;

-- Si ya habia dos limites para la misma categoria y mes, se queda el mas alto y se
-- borra el resto. Se hace ANTES de crear el indice unico, que si no fallaria.
DELETE b
  FROM Budget b
  JOIN (
    SELECT id_user, id_category, period_month, MAX(id_budget) AS ganador
      FROM Budget
     WHERE id_category IS NOT NULL
       AND period_month IS NOT NULL
     GROUP BY id_user, id_category, period_month
    HAVING COUNT(*) > 1
  ) d
    ON d.id_user = b.id_user
   AND d.id_category = b.id_category
   AND d.period_month = b.period_month
   AND d.ganador <> b.id_budget;

-- El indice unico es lo que hace que la API pueda responder 409 en vez de crear
-- un segundo limite para la misma categoria y mes.
SET @existe_ux = (
  SELECT COUNT(*)
    FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'Budget'
     AND INDEX_NAME = 'ux_budget_categoria_mes'
);
SET @sql_ux = IF(
  @existe_ux = 0,
  'ALTER TABLE Budget
     MODIFY COLUMN amount double(10,2) NOT NULL,
     MODIFY COLUMN id_category int NOT NULL,
     MODIFY COLUMN period_month char(7) NOT NULL,
     ADD UNIQUE KEY ux_budget_categoria_mes (id_user, id_category, period_month),
     ADD KEY ix_budget_mes (period_month)',
  'DO 0'
);
PREPARE stmt_ux FROM @sql_ux;
EXECUTE stmt_ux;
DEALLOCATE PREPARE stmt_ux;
