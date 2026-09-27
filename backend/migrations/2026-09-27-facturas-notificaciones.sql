-- Migracion: pago de facturas y notificaciones.
--
-- Cierra las dos rutas que el frontend ya llamaba y que no existian:
-- POST /api/bills/pay, GET /api/notifications/user/:idUser y
-- POST /api/notifications/user/:idUser/read-all.
--
-- Sin estas tablas el modal de "Pagar factura" moria en un 404 y la pantalla de
-- Notificaciones nasca vacia, con la campana del topbar sin marcar nada.

use curbidb_in5bv;

-- Pagos de servicios (luz, agua, telefonia, internet, salud).
--
-- La tabla es el respaldo del pago: el saldo se descuenta de Financial_account
-- en la misma transaccion que inserta aqui, asi que si el INSERT falla el
-- descuento tambien se deshace.
CREATE TABLE IF NOT EXISTS Bill_payment (
  id_payment int NOT NULL AUTO_INCREMENT,
  id_user int NOT NULL,
  -- Cuenta desde la que salio el dinero. ON DELETE CASCADE: si la tarjeta se
  -- borra, sus pagos tampoco tienen sentido.
  id_financial int NOT NULL,
  -- Codigo de la entidad (eegsa, aguas, tigo...). El catalogo vive en el
  -- backend (ver billPaymentService): aqui solo queda el codigo que se cobro.
  provider_code varchar(30) NOT NULL,
  provider_name varchar(80) NOT NULL,
  -- Numero impreso en la factura (medidor, cliente, afiliacion).
  reference varchar(60) NOT NULL,
  amount double(10,2) NOT NULL,
  paid_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_payment),
  -- Soporta la regla de no pagar dos veces la misma factura: la busqueda es
  -- por (usuario, entidad, referencia).
  UNIQUE KEY ux_bill_pagada (id_user, provider_code, reference),
  KEY ix_bill_financial (id_financial),
  CONSTRAINT fk_bill_user FOREIGN KEY (id_user)
    REFERENCES users (id_user) ON DELETE CASCADE,
  CONSTRAINT fk_bill_financial FOREIGN KEY (id_financial)
    REFERENCES Financial_account (id_financial) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Avisos del usuario: depositos recibidos, cupos aprobados, facturas pagadas.
--
-- No hay tabla de "leido" separada: is_read basta, porque el frontend solo
-- offers marcar todas como leidas.
CREATE TABLE IF NOT EXISTS Notification (
  id_notification int NOT NULL AUTO_INCREMENT,
  id_user int NOT NULL,
  type enum('Transferencia','Deposito','Credito','Factura','Sistema') NOT NULL,
  title varchar(80) NOT NULL,
  message varchar(255) NOT NULL,
  -- Es nullable a proposito: los avisos sin monto (cupo en espera, avisos del
  -- sistema) no tienen un numero que mostrar.
  amount double(10,2) NULL,
  is_read tinyint(1) NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_notification),
  -- El listado se pide ordenado por fecha y filtrando por is_read, asi que el
  -- indice cubre las tres columnas que usa la pantalla de Notificaciones.
  KEY ix_notification_usuario (id_user, is_read, created_at),
  CONSTRAINT fk_notification_user FOREIGN KEY (id_user)
    REFERENCES users (id_user) ON DELETE CASCADE
) ENGINE=InnoDB;
