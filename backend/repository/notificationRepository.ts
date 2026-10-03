import { db } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';
import { AppNotification, CreateNotificationDto } from '../model/notification';
import { money } from '../utils/money';

export class NotificationRepository {
  /**
   * Registra un aviso. `conn` es opcional para que un flujo de dinero lo inserte
   * con la misma transaccion del descuento: asi no puede quedar plata movida sin
   * su notificacion, ni notificacion de un pago que se deshizo.
   */
  async create(dto: CreateNotificationDto, conn?: PoolConnection): Promise<AppNotification> {
    const runner = conn ?? db;
    const [result] = await runner.query<ResultSetHeader>(
      `INSERT INTO Notification (id_user, type, title, message, amount)
       VALUES (?, ?, ?, ?, ?)`,
      [dto.id_user, dto.type, dto.title, dto.message, dto.amount ?? null],
    );
    return {
      id_notification: result.insertId,
      id_user: dto.id_user,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      amount: dto.amount ?? null,
      is_read: false,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Ultimos avisos del usuario. El limite es de la base (no un recorte en
   * memoria) porque la campana solo necesita lo reciente y la tabla crece con
   * cada movimiento de dinero.
   */
  async findByUser(idUser: number, limit = 30): Promise<AppNotification[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT * FROM Notification
        WHERE id_user = ?
        ORDER BY created_at DESC, id_notification DESC
        LIMIT ?`,
      [idUser, limit],
    );
    return (rows as AppNotification[]).map((r) => this.normalizar(r));
  }

  /** Cuantos avisos quedan sin leer, para el badge de la campana. */
  async countUnread(idUser: number): Promise<number> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM Notification WHERE id_user = ? AND is_read = 0',
      [idUser],
    );
    return Number((rows as RowDataPacket[])[0]?.total ?? 0);
  }

  /** Marca todo lo pendiente como leido. Devuelve cuantos filas cambio. */
  async markAllRead(idUser: number): Promise<number> {
    const [result] = await db.query<ResultSetHeader>(
      'UPDATE Notification SET is_read = 1 WHERE id_user = ? AND is_read = 0',
      [idUser],
    );
    return result.affectedRows;
  }

  /**
   * MySQL devuelve `amount` como number|null pero el resto de columnas con tipos
   * distintos; el redondeo a dos decimales evita que un double como
   * 0.30000000000000004 llegue al badge de la campana.
   */
  private normalizar(row: AppNotification): AppNotification {
    return {
      ...row,
      amount: row.amount == null ? null : money(Number(row.amount)),
    };
  }
}
