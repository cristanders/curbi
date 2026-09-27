-- Migracion: grupos de familia con miembros reales.
--
-- House solo guardaba (name, username), donde username es de QUIEN es la casa. Con
-- eso no se puede "agregarse" a la familia de alguien: no hay forma de registrar
-- que un segundo usuario pertenece al grupo, ni de saber quienes son. El boton
-- "Add to Family" del perfil no tenia a donde apuntar por esto.
--
-- House_member resuelve la pertenencia. House.username se queda como el dueno, que
-- es lo que ya usaba el resto del codigo, y role distingue al admin de los demás.
--
-- House tampoco tenia created_at (solo name y username), asi que se agrega para que
-- el panel pueda decir cuando se creo el grupo. NOT NULL con CURRENT_TIMESTAMP: con
-- NULL DEFAULT NULL, MySQL no le pone fecha a los INSERT y sale en blanco.

use curbidb_in5bv;

SET @col = (
  SELECT COUNT(*)
    FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'House'
     AND COLUMN_NAME = 'created_at'
);
SET @sql_col = IF(
  @col = 0,
  'ALTER TABLE House ADD COLUMN created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP',
  'DO 0'
);
PREPARE stmt_col FROM @sql_col;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;

CREATE TABLE IF NOT EXISTS House_member (
  id_member int NOT NULL AUTO_INCREMENT,
  id_house int NOT NULL,
  id_user int NOT NULL,
  -- Admin es quien creo el grupo; Miembro se unio escribiendo el username.
  role enum('Admin','Miembro') NOT NULL DEFAULT 'Miembro',
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_member),
  -- Una persona una sola vez por grupo: sin esto, volver a unirse duplicaria la
  -- fila y el contador de miembros mentiria.
  UNIQUE KEY ux_house_member (id_house, id_user),
  KEY ix_house_member_user (id_user),
  CONSTRAINT fk_house_member_house FOREIGN KEY (id_house) REFERENCES House (id_house)
    ON DELETE CASCADE,
  CONSTRAINT fk_house_member_user FOREIGN KEY (id_user) REFERENCES Users (id_user)
    ON DELETE CASCADE
) ENGINE = InnoDB;

-- Las casas que ya existian tienen dueno pero ningun miembro. Se registra al
-- dueno como Admin para que el contador y la lista de miembros no salgan vacios
-- en los datos que ya se tenian.
INSERT INTO House_member (id_house, id_user, role)
SELECT h.id_house, u.id_user, 'Admin'
  FROM House h
  JOIN Users u ON u.username = h.username
 WHERE h.username IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM House_member m WHERE m.id_house = h.id_house AND m.id_user = u.id_user
   );
