create database curbidb_in5bv;

-- tabla de usuario
create table Users (
	id_user int primary key auto_increment,
    name varchar(60),
    username varchar(50),
    email varchar(120),
    phone varchar(60),
    password varchar(72)
);

-- tabla de casa
create table house (
	id_house int primary key auto_increment,
	name varchar(60),
    username varchar(70),
    foreign key house(username) references users(username)
); 

-- tabla de presupuesto 
create table budget (
	id_budget int primary key auto_increment,
    amount double (10,2)
);

-- tabla de la transaccion
create table transaction (
	id_transaction int primary key auto_increment,
    type_transacion varchar(72)
);

-- tabla de categoria 
create table category (
	id_category int primary key auto_increment,
    type_category enum("")
);

-- tabloa de intento gasto
create table expenditure_attempt (
	id_expediture int primary key auto_increment
);

-- tabla de meta de ahorro
create table savings_goal(
	id_saving int primary key auto_increment
);

-- tabla de cuenta financiera
create table financial_account (
	id_financial int primary key auto_increment
);