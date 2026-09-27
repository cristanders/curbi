create database if not exists curbidb_in5bv;
use curbidb_in5bv;

-- tabla de usuario
create table if not exists Users (
	id_user int primary key auto_increment,
    name varchar(60),
    username varchar(70),
    email varchar(120),
    phone varchar(60),
    -- Ciudad que muestra y edita la pantalla de Perfil (agregada en la
    -- migracion 2026-09-28-perfil-usuario.sql).
    location varchar(80),
    password varchar(72),
    avatar longtext
);

-- tabla de casa
create table if not exists House (
	id_house int primary key auto_increment,
	name varchar(60),
    username varchar(70),
    -- Agregada en 2026-09-30-familias.sql para que el panel diga cuando se creo
    -- el grupo. Con NULL DEFAULT NULL MySQL no le pondria fecha al INSERT.
    created_at timestamp not null default current_timestamp
);

-- Pertenencia a un grupo de familia (2026-09-30-familias.sql). House.username es
-- el dueno; esta tabla es la que permite que alguien mas sea parte del grupo.
create table if not exists House_member (
	id_member int not null auto_increment,
    id_house int not null,
    id_user int not null,
    role enum('Admin','Miembro') not null default 'Miembro',
    created_at timestamp not null default current_timestamp,
    primary key (id_member),
    -- Una persona una sola vez por grupo, para que el contador de miembros no mienta.
    unique key ux_house_member (id_house, id_user),
    key ix_house_member_user (id_user),
    foreign key (id_house) references House(id_house) on delete cascade,
    foreign key (id_user) references Users(id_user) on delete cascade
);

-- tabla de presupuesto
-- id_category y period_month los agrego 2026-09-29-presupuestos-y-fechas.sql:
-- sin categoria ni mes un presupuesto no puede decir "te pasaste en Comida este
-- mes". El indice unico es lo que permite responder 409 en vez de accumulating
-- dos limites para la misma categoria y mes.
create table if not exists Budget (
	id_budget int primary key auto_increment,
    amount double(10,2) not null,
    id_category int not null,
    period_month char(7) not null,
    id_user int,
    created_at timestamp not null default current_timestamp,
    unique key ux_budget_categoria_mes (id_user, id_category, period_month),
    key ix_budget_mes (period_month),
    foreign key (id_user) references Users(id_user)
    -- El FK a Category se agrega al final del archivo, cuando Category ya existe.
);

-- tabla de categoria
create table if not exists Category (
	id_category int primary key auto_increment,
    type_category enum('Fijo','Personal','Ahorro') not null
);

-- tabla de la transaccion
create table if not exists Transaction (
	id_transaction int primary key auto_increment,
    amount double(10,2) not null,
    type_transacion enum('Ingreso','Gasto'),
    description text,
    id_user int not null,
    -- Cuenta que se debito o se abono. NULL en los asientos que no mueven dinero
    -- (agregada en la migracion 2026-09-26-flujo-dinero.sql). El FK se agrega
    -- al final del archivo, cuando Financial_account ya existe.
    id_financial int,
    id_category int not null,
    -- Fecha real del movimiento (2026-09-29-presupuestos-y-fechas.sql). Antes la
    -- tabla del frontend se la inventaba con la posicion de la fila, asi que dos
    -- movimientos del mismo dia parecian de dias distintos. NOT NULL para que
    -- MySQL le ponga current_timestamp a cada INSERT.
    created_at timestamp not null default current_timestamp,
    foreign key (id_category) references Category(id_category),
    foreign key (id_user) references Users(id_user)
);

-- tabla de intento de gasto
-- id_category, id_transaction y reason los agrego 2026-09-30-freno-de-gastos.sql:
-- el status lo decide el backend contra el limite de la categoria y reason guarda
-- el por que del Frenado. id_transaction deja rastro de que el intento aprobado si
-- movio plata de verdad.
create table if not exists Expenditure_attempt (
	id_expediture int primary key auto_increment,
    product_name varchar(100),
    estimated_amount double(10,2) not null,
    status enum('Frenado','Aprobado','Pendiente') default 'Pendiente',
    id_category int default 1,
    id_transaction int,
    reason varchar(160),
    id_user int not null,
    created_at timestamp not null default current_timestamp,
    key ix_expenditure_usuario (id_user, created_at),
    foreign key (id_user) references Users(id_user),
    foreign key (id_category) references Category(id_category)
);

-- tabla de meta de ahorro
-- category (2026-10-01-categorias-ahorro.sql) es lo que decide el icono de la
-- tarjeta. Antes el frontend asignaba iconos por posicion en la lista, asi que
-- una meta de viaje podia salir con el icono de consola segun el orden.
create table if not exists Savings_goal (
	id_saving int primary key auto_increment,
    goal_name varchar(70),
    target_amount double(10,2) not null,
    current_amount double(10,2) default 0.00,
    category varchar(32) default 'otro',
    id_user int not null,
    foreign key (id_user) references Users(id_user)
);

-- tabla de cuenta financiera
-- bank_code, account_number, credit_limit y card_type los agrego la migracion
-- 2026-09-26-flujo-dinero.sql: sin ellos no hay transferencias ni cupo de
-- credito.
create table if not exists Financial_account (
	id_financial int primary key auto_increment,
    account_name varchar(60) not null,
    bank_code varchar(20),
    -- Numero con el que la cuenta recibe Depositos de otras cuentas.
    account_number varchar(20),
    balance double(10,2) default 0.00,
    -- Cupo extra que la banca concede. En Debito se queda en 0.
    credit_limit double(10,2) not null default 0.00,
    card_type enum('Debito','Credito') not null,
    id_user int,
    foreign key (id_user) references Users(id_user)
);

-- tabla de cliente
create table if not exists Customer (
	id_customer int primary key auto_increment,
	name varchar(60),
    username varchar(70),
    email varchar(120),
    phone varchar(60),
    password varchar(72)
);

-- Estas tres no estaban aqui y solo existian por migracion, asi que instalar
-- desde este archivo solo dejaba la base a medias. Va despues de Financial_account
-- porque las tres la referencian.
--
-- tabla de pago de facturas
-- El catalogo de entidades (eegsa, aguas, tigo...) vive en el backend
-- (billPaymentService); aqui solo queda el codigo que se cobro. El indice unico
-- es lo que impide pagar dos veces la misma factura.
create table if not exists Bill_payment (
    id_payment int not null auto_increment,
    id_user int not null,
    -- Cuenta desde la que salio el dinero. Si la tarjeta se borra, sus pagos
    -- tampoco tienen sentido.
    id_financial int not null,
    provider_code varchar(30) not null,
    provider_name varchar(80) not null,
    -- Numero impreso en la factura (medidor, cliente, afiliacion).
    reference varchar(60) not null,
    amount double(10,2) not null,
    paid_at timestamp not null default current_timestamp,
    primary key (id_payment),
    unique key ux_bill_pagada (id_user, provider_code, reference),
    key ix_bill_financial (id_financial),
    foreign key (id_user) references Users(id_user) on delete cascade,
    foreign key (id_financial) references Financial_account(id_financial) on delete cascade
);

-- Avisos del usuario: depositos recibidos, cupos aprobados, facturas pagadas.
-- No hay tabla de "leido" separada: is_read basta, porque el frontend solo
-- ofrece marcar todas como leidas.
create table if not exists Notification (
    id_notification int not null auto_increment,
    id_user int not null,
    type enum('Transferencia','Deposito','Credito','Factura','Sistema') not null,
    title varchar(80) not null,
    message varchar(255) not null,
    -- Nullable a proposito: los avisos sin monto (cupo en espera, avisos del
    -- sistema) no tienen un numero que mostrar.
    amount double(10,2) null,
    is_read tinyint(1) not null default 0,
    created_at timestamp not null default current_timestamp,
    primary key (id_notification),
    -- El listado se pide ordenado por fecha y filtrando por is_read, asi que el
    -- indice cubre las tres columnas que usa la pantalla de Notificaciones.
    key ix_notification_usuario (id_user, is_read, created_at),
    foreign key (id_user) references Users(id_user) on delete cascade
);

-- Solicitud de cupo de credito. Se aprueba sola al cumplirse el plazo.
-- pending_slot es la pieza que hace funcionar el limite de una sola solicitud
-- pendiente por tarjeta: al no ser Pendiente vale NULL, y MySQL si admite
-- varios NULL en un indice unico, asi que una tarjeta puede tener cuantos cupos
-- ya resueltos quiera.
create table if not exists Credit_request (
    id_credit int not null auto_increment,
    id_financial int not null,
    id_user int not null,
    amount double(10,2) not null,
    status enum('Pendiente','Aprobado','Rechazado') not null default 'Pendiente',
    created_at timestamp not null default current_timestamp,
    resolved_at timestamp null,
    pending_slot int generated always as
        (case when status = 'Pendiente' then id_financial else null end) virtual,
    primary key (id_credit),
    unique key ux_credit_pendiente (pending_slot),
    foreign key (id_financial) references Financial_account(id_financial) on delete cascade,
    foreign key (id_user) references Users(id_user) on delete cascade
);

-- La FK de Transaction.id_financial va al final a proposito: Transaction se
-- declara antes que Financial_account, y MySQL no puede crear una FK que
-- todavia no existe. Mismo nombre que en la base (fk_transaction_financial).
SET @existe_fk = (
  SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE()
     AND TABLE_NAME = 'Transaction'
     AND CONSTRAINT_NAME = 'fk_transaction_financial'
);
SET @sql_fk = IF(
  @existe_fk = 0,
  'ALTER TABLE Transaction ADD CONSTRAINT fk_transaction_financial FOREIGN KEY (id_financial) REFERENCES Financial_account(id_financial)',
  'DO 0'
);
PREPARE stmt_fk FROM @sql_fk;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;

-- Mismo motivo para Budget.id_category: Budget se declara antes que Category, y
-- MySQL no puede crear una FK a una tabla que todavia no existe.
SET @existe_fk_cat = (
  SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE()
     AND TABLE_NAME = 'Budget'
     AND CONSTRAINT_NAME = 'fk_budget_category'
);
SET @sql_fk_cat = IF(
  @existe_fk_cat = 0,
  'ALTER TABLE Budget ADD CONSTRAINT fk_budget_category FOREIGN KEY (id_category) REFERENCES Category(id_category)',
  'DO 0'
);
PREPARE stmt_fk_cat FROM @sql_fk_cat;
EXECUTE stmt_fk_cat;
DEALLOCATE PREPARE stmt_fk_cat;