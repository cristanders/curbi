create database curbidb_in5bv;

create table Users (
	id_user int primary key auto_increment,
    name varchar(60),
    username varchar(50),
    email varchar(120),
    phone varchar(60),
    password varchar(72)
);

create table house (
	id_house int primary key auto_increment,
	name varchar(60),
    username varchar(70),
    foreign key house(username) references users(username)
); 

create table budget (
	id_budget int primary key auto_increment,
    amount double (10,2)
);

create table transaction (
	id_transaction int primary key auto_increment,
    type_transacion varchar(72)
);

create table category (
	id_category int primary key auto_increment,
    type_category enum("")
);