import mysql from "mysql2/promise";

//Colocados dentro de un .env para la seguridad de los datos del servidor
export const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});