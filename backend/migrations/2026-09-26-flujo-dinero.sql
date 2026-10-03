-- Migracion: flujo de dinero completo (transferencias, credito y estado de cuenta).
--
-- Hasta ahora Financial_account solo guardaba account_name, balance e id_user, y
-- las rutas que el frontend ya llamaba (/api/transfers, /api/credit-requests,
-- /api/bank-accounts, /api/accounts/:idFinancial/state) no existian. Con esta
-- migracion las cuentas pueden recibir Depositos y pedir cupo.

ALTER TABLE Financial_account
  -- Numero con el que la cuenta recibe Depositos de otros usuarios.
  ADD COLUMN account_number varchar(20) NULL AFTER account_name,
  -- Monograma del banco (bi, banrural, bac...). Antes se adivinaba del texto
  -- de account_name; ahora viaja explicito.
  ADD COLUMN bank_code varchar(20) NULL AFTER account_name,
  ADD COLUMN card_type enum('Debito','Credito') NOT NULL DEFAULT 'Debito' AFTER balance,
  -- Cupo total que la tarjeta puede alcanzar mediante solicitudes de credito.
  ADD COLUMN credit_limit double(10,2) NOT NULL DEFAULT 0.00 AFTER balance;

-- El numero de cuenta identifica al destino de una transferencia: no puede
-- repetirse. Es nullable para que las cuentas antiguas queden sin numero en vez
-- de bloquear la migracion.
CREATE UNIQUE INDEX ux_financial_account_number
  ON Financial_account (account_number);

-- Solicitudes de cupo. La banca responde en 1-2 min, asi que la fila nace
-- Pendiente y se aprueba sola al cumplirse el plazo (ver financialService).
CREATE TABLE Credit_request (
  id_credit int NOT NULL AUTO_INCREMENT,
  id_financial int NOT NULL,
  id_user int NOT NULL,
  amount double(10,2) NOT NULL,
  status enum('Pendiente','Aprobado','Rechazado') NOT NULL DEFAULT 'Pendiente',
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at timestamp NULL,
  -- Solo las solicitudes Pendientes ocupan una ranura por tarjeta. Al no ser
  -- Pendiente la columna vale NULL, y MySQL si admite varios NULL en un indice
  -- unico, asi que una tarjeta puede tener cuantos cupos ya resueltos quiera.
  pending_slot int GENERATED ALWAYS AS
    (CASE WHEN status = 'Pendiente' THEN id_financial ELSE NULL END) VIRTUAL,
  PRIMARY KEY (id_credit),
  UNIQUE KEY ux_credit_pendiente (pending_slot),
  CONSTRAINT fk_credit_financial FOREIGN KEY (id_financial)
    REFERENCES Financial_account (id_financial) ON DELETE CASCADE,
  CONSTRAINT fk_credit_user FOREIGN KEY (id_user) REFERENCES users (id_user)
) ENGINE=InnoDB;

-- El historial necesita saber desde que cuenta salio el movimiento para que el
-- wallet registre el ingreso de una transferencia como Credito.
ALTER TABLE `transaction`
  ADD COLUMN id_financial int NULL AFTER id_user,
  ADD CONSTRAINT fk_transaction_financial FOREIGN KEY (id_financial)
    REFERENCES Financial_account (id_financial) ON DELETE SET NULL;

-- La tabla category venia vacia y `transaction.id_category` es obligatorio con
-- FK a ella: sin estas filas no se podia registrar ningun movimiento.
-- El enum solo admite estos tres valores.
INSERT INTO category (type_category) VALUES ('Personal'), ('Fijo'), ('Ahorro');
