/**
 * Corre una migracion de backend/migrations contra la base configurada en
 * process.env. Se usa en vez del cliente de MySQL porque no hay mysql CLI
 * instalado en la maquina.
 *
 *   npx tsx tools/migrar.ts migrations/2026-09-27-facturas-notificaciones.sql
 *
 * Cada sentencia se manda por separado: el pool de mysql2 no acepta multiples
 * sentencias en un solo query a menos que se active `multipleStatements`.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', 'process.env') });

async function main(): Promise<void> {
  const archivo = process.argv[2];
  if (!archivo) {
    throw new Error('Uso: npx tsx tools/migrar.ts <ruta-del.sql>');
  }
  const ruta = path.resolve(process.cwd(), archivo);
  const sql = fs.readFileSync(ruta, 'utf8');

  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  try {
    await db.query(sql);
    console.log(`Migracion aplicada: ${archivo}`);
  } finally {
    await db.end();
  }
}

main().catch((error: unknown) => {
  console.error('La migracion fallo:', error instanceof Error ? error.message : error);
  process.exit(1);
});
