-- Migracion: perfil de usuario editable.
--
-- El boton "Save changes" de la pantalla de Perfil solo cambiaba signals en el
-- navegador y mostraba "Cambios guardados" sin escribir nada: al recargar, todo
-- volvia como estaba. Esta migracion agrega la columna que faltaba para que
-- PUT /api/users/:id tenga donde guardar.
--
-- No se agrega columna para `username` ni para `password`: el username es la
-- identidad con la que se inicia sesion y la clave se cambia por su propio
-- endpoint, asi que el perfil editable no las toca.

use curbidb_in5bv;

-- La pantalla de Perfil muestra y permite editar el campo Location. Sin esta
-- columna el endpoint tendria que ignorar el valor y el usuario volveria a ver
-- su ciudad borrada al recargar.
--
-- MySQL 8 no entiende "ADD COLUMN IF NOT EXISTS" (eso es sintaxis de MariaDB),
-- asi que la idempotencia se arma con SQL preparado: si la columna ya existe se
-- ejecuta un DO 0 en vez del ALTER. Asi la migracion se puede correr mas de una
-- vez sin romper.
SET @existe = (
  SELECT COUNT(*)
    FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'Users'
     AND COLUMN_NAME = 'location'
);
SET @sql = IF(
  @existe = 0,
  'ALTER TABLE Users ADD COLUMN location varchar(80) NULL AFTER phone',
  'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
