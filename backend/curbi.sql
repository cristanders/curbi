create database curbidb_in5bv;

-- tabla de usuario
create table Users (
	id_user int primary key auto_increment,
    name varchar(60),
    username varchar(70),
    email varchar(120),
    phone varchar(60),
    password varchar(72)
);

-- tabla de casa
create table House (
	id_house int primary key auto_increment,
	name varchar(60),
    username varchar(70),
    foreign key house(username) references Users(username)
); 

-- tabla de presupuesto 
create table Budget (
	id_budget int primary key auto_increment,
    amount double (10,2)
    id_user int,
    foreign key budget(id_user) references Users(id_user)
);

-- tabla de categoria 
create table Category (
	id_category int primary key auto_increment,
    type_category enum("Fijo","Personal","Ahorro") not null
);

-- tabla de la transaccion
create table Transaction (
	id_transaction int primary key auto_increment,
    amount double(10,2) not null,
    type_transacion enum("Ingreso","Gasto"),
    description text,
    id_user int not null,
    id_category int not null,
    foreign key transaccion(id_category) references Category(id_category),
    foreign key transaccion(id_user) references Users(id_user)
);

-- tabloa de intento gasto
create table Expenditure_attempt (
	id_expediture int primary key auto_increment,
    product_name varchar(100),
    estimated_amount double(10,2) not null,
    status enum('Frenado', 'Aprobado','Pendiente') default 'Pendiente',
    id_user int not null,
    foreign key expenditure_attempt(id_user) references Users(id_user)
);

-- tabla de meta de ahorro
create table Savings_goal(
	id_saving int primary key auto_increment
    goal_name varchar(70),
    target_amount double(10,2) not null,
    current_amount double(10,2) default 00.00,
    id_user int not null,
    foreign key Savings_goal(id_user) references Users(id_user);
);

-- tabla de cuenta financiera
create table Financial_account (
	id_financial int primary key auto_increment
    account_name varchar(60) not null,
    balance double(10,2) default 00.00,
    id_user int,
    foreign key financial_account(id_user) references Users(id_user)
);