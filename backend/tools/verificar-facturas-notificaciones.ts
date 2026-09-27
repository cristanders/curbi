/**
 * Verifica que las tablas de facturas y notificaciones quedaron como la
 * migracion las describe. Es la counterpart de `migrar.ts`: correr la migracion
 * no dice si el esquema quedo bien, esto si.
 *
 *   npx tsx tools/verificar-facturas-notificaciones.ts
 */
import path from 'node:path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', 'process.env') });

async function main(): Promise<void> {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [tablas] = await db.query<mysql.RowDataPacket[]>('SHOW TABLES');
    const nombres = tablas.map((t) => Object.values(t)[0] as string);
    for (const esperada of ['Bill_payment', 'Notification']) {
      const ok = nombres.some((n) => n.toLowerCase() === esperada.toLowerCase());
      console.log(`${ok ? 'OK  ' : 'FALTA'} ${esperada}`);
    }

    for (const tabla of ['Bill_payment', 'Notification']) {
      const [columnas] = await db.query<mysql.RowDataPacket[]>(`SHOW COLUMNS FROM ${tabla}`);
      console.log(`\n${tabla}:`);
      for (const c of columnas) {
        console.log(`  ${c.Field} ${c.Type}${c.Null === 'NO' ? ' NOT NULL' : ''}`);
      }
    }

    const [indices] = await db.query<mysql.RowDataPacket[]>(
      'SHOW INDEX FROM Bill_payment WHERE Key_name = "ux_bill_pagada"',
    );
    console.log(
      indices.length > 0
        ? '\nOK   indice unico ux_bill_pagada (no se puede pagar dos veces la misma factura)'
        : '\nFALTA indice unico ux_bill_pagada',
    );
  } finally {
    await db.end();
  }
}

main().catch((error: unknown) => {
  console.error('La verificacion fallo:', error instanceof Error ? error.message : error);
  process.exit(1);
});
