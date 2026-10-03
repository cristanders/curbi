import mysql from "mysql2/promise";
import path from "path";
import dotenv from "dotenv";

//Se cargan las credenciales ANTES de crear el pool; el archivo process.env
//esta en la raiz del backend y de otra forma llegaria vacio a la conexion.
dotenv.config({ path: path.join(__dirname, "..", "process.env") });

export const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});