-- Migracion: categoria de ahorro, que es la que decide el icono de la meta.
--
-- El problema: savings.ts asignaba el icono POR POSICION en la lista
-- (icons[i % icons.length]), con tres iconos fijos. Eso no dice nada de la meta:
-- la primera recibia el avion, la segunda el candado y la tercera la consola, y
-- la cuarta volvia a empezar. Una meta llamada "Viaje a Antigua" salia con el
-- icono de consola si era la tercera de la lista.
--
-- La categoria se elige al crear la meta y se guarda. Asi el icono se deduce de
-- lo que la persona quiere ahorrar y no del orden en que se guardo. Las metas
-- viejas no tienen categoria (NULL), asi que el backfill de abajo adivina por
-- el nombre con las palabras mas comunes, y lo que no se reconoce queda en
-- 'otro' con el icono generico.
--
-- El catalogo de categorias vive en el backend (SAVINGS_CATEGORIES, en
-- model/savings.ts) y el service lo valida: un POST con categoria inventada
-- devuelve 400 en vez de meter basura en la base.

use curbidb_in5bv;

-- 1) La columna.
SET @col = (
  SELECT COUNT(*)
    FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'Savings_goal'
     AND COLUMN_NAME = 'category'
);
SET @sql_col = IF(
  @col = 0,
  'ALTER TABLE Savings_goal ADD COLUMN category varchar(32) DEFAULT ''otro''',
  'DO 0'
);
PREPARE stmt_col FROM @sql_col;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;

-- 2) Backfill de las metas que ya existian. Solo toca las que siguen sin una
--    categoria real, para que correr la migracion dos veces no pise la categoria
--    que el usuario ya habia elegido.
--
--    OJO: hay que mirar tambien category = 'otro' y no solo IS NULL. La columna
--    se agrega con DEFAULT 'otro', y MySQL les pone ese valor a las filas que ya
--    existian en vez de dejarlas en NULL: con solo "IS NULL" el backfill no
--    actualizaba nada y todas las metas viejas quedaban con el icono generico.
UPDATE Savings_goal SET category = 'viaje' WHERE category IS NULL OR category = 'otro'
  AND (LOWER(goal_name) REGEXP 'viaje|viajar|volar|avion|aviÃ³n|turis|pasaj');

UPDATE Savings_goal SET category = 'emergencia' WHERE category IS NULL OR category = 'otro'
  AND LOWER(goal_name) REGEXP 'emergenc|reserva|imprevist|seguridad';

UPDATE Savings_goal SET category = 'casa' WHERE category IS NULL OR category = 'otro'
  AND LOWER(goal_name) REGEXP 'casa|departamento|apartamento|lote|terreno|vivienda|alquiler|mortaj';

UPDATE Savings_goal SET category = 'auto' WHERE category IS NULL OR category = 'otro'
  AND LOWER(goal_name) REGEXP 'auto|carro|coche|vehic|cartera.*moto|moto';

UPDATE Savings_goal SET category = 'educacion' WHERE category IS NULL OR category = 'otro'
  AND LOWER(goal_name) REGEXP 'educa|estudi|universi|colegio|maestr|doctor|carrera|matricul|curso';

UPDATE Savings_goal SET category = 'salud' WHERE category IS NULL OR category = 'otro'
  AND LOWER(goal_name) REGEXP 'salud|medic|dentist|operac|seguro.*med';

UPDATE Savings_goal SET category = 'boda' WHERE category IS NULL OR category = 'otro'
  AND LOWER(goal_name) REGEXP 'boda|casamiento|matrimonio|novios';

UPDATE Savings_goal SET category = 'negocio' WHERE category IS NULL OR category = 'otro'
  AND LOWER(goal_name) REGEXP 'negocio|empresa|tienda|local|startup|proyecto|independiente|freelanc';

UPDATE Savings_goal SET category = 'gaming' WHERE category IS NULL OR category = 'otro'
  AND LOWER(goal_name) REGEXP 'consola|game|juego|gaming|playstation|xbox|nintendo|switch|videojuego';

UPDATE Savings_goal SET category = 'tecnologia' WHERE category IS NULL OR category = 'otro'
  AND LOWER(goal_name) REGEXP 'tecno|comput|laptop|celular|telefono|tablet|monitor|teclado|computadora|camara|smartphone|iphone|ipod';

UPDATE Savings_goal SET category = 'musica' WHERE category IS NULL OR category = 'otro'
  AND LOWER(goal_name) REGEXP 'musica|mÃºsica|instrumento|guitarra|piano|violin|bateria|equipo.*sonido';

UPDATE Savings_goal SET category = 'mascota' WHERE category IS NULL OR category = 'otro'
  AND LOWER(goal_name) REGEXP 'mascota|perro|perrito|gato|cachorro|mascot';

UPDATE Savings_goal SET category = 'regalo' WHERE category IS NULL OR category = 'otro'
  AND LOWER(goal_name) REGEXP 'regalo|regalos|navidad|regal|aniversario|cumple';

UPDATE Savings_goal SET category = 'retiro' WHERE category IS NULL OR category = 'otro'
  AND LOWER(goal_name) REGEXP 'retiro|jubil|pension|pensiÃ³n|vejez|independencia.*financ';

-- Lo que no se reconoce se queda en el generico.
UPDATE Savings_goal SET category = 'otro' WHERE category IS NULL OR category = 'otro';
