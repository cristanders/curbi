import { PoolConnection } from 'mysql2/promise';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../config/database';
import { BusinessError } from '../model/errors';
import { CreateTransactionDto, CreateTransactionResult, Transaction } from '../model/transaction';
import { money } from '../utils/money';
import { NotificationRepository } from './notificationRepository';

interface AccountRow extends RowDataPacket {
  id_financial: number;
  id_user: number | null;
  balance: number | null;
  card_type: 'Debito' | 'Credito';
}

export class TransactionRepository {
  async findByUser(idUser: number): Promise<Transaction[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      // El id se desempata porque created_at es un timestamp: sin el, dos
      // movimientos del mismo segundo salen en orden indeterminate.
      'SELECT * FROM Transaction WHERE id_user = ? ORDER BY created_at DESC, id_transaction DESC',
      [idUser],
    );
    return rows as Transaction[];
  }

  /**
   * Registra un movimiento y, si viene con cuenta, adjusts el saldo en la misma
   * transaccion. Antes el INSERT era suelto y el saldo solo se restaba en el
   * navegador: al recargar, el movimiento seguia en el historial pero el saldo
   * volvia al valor viejo.
   */
  async create(dto: CreateTransactionDto): Promise<CreateTransactionResult> {
    if (dto.id_financial === null || dto.id_financial === undefined) {
      // Asiento sin cuenta: se registra pero no mueve dinero.
      const { id_transaction } = await this.insertMovement(db, dto);
      return { transaction: { id_transaction, ...dto }, balance: null };
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const account = await this.lockAccount(conn, dto.id_financial);
      if (Number(account.id_user) !== Number(dto.id_user)) {
        throw new BusinessError('CUENTA_INVALIDA', 'La tarjeta no es tuya', 403);
      }

      const esGasto = dto.type_transacion !== 'Ingreso';
      const balance = this.aplicarSaldo(account, esGasto ? -dto.amount : dto.amount);

      await this.updateBalance(conn, account.id_financial, balance);

      const { id_transaction } = await this.insertMovement(conn, dto);
      await this.insertNotification(conn, dto, balance, esGasto);

      await conn.commit();
      return { transaction: { id_transaction, ...dto }, balance };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /** Bloquea la fila para que dos movimientos simultaneos no se pisen. */
  private async lockAccount(conn: PoolConnection, idFinancial: number): Promise<AccountRow> {
    const [rows] = await conn.query<AccountRow[]>(
      `SELECT id_financial, id_user, balance, card_type
         FROM Financial_account WHERE id_financial = ? FOR UPDATE`,
      [idFinancial],
    );
    const account = rows[0];
    if (!account) {
      throw new BusinessError('CUENTA_INVALIDA', 'La cuenta indicada no existe', 404);
    }
    return account;
  }

  /**
   * Regla de saldo, misma que aplica el pago de facturas a proposito: se compara
   * contra `balance`, no contra `balance + credit_limit`. El cupo aprobado se
   * suma al saldo cuando la banca lo autoriza, asi que `credit_limit` no es un
   * margen adicional. Si las dos rutas calcularan distinto, el mismo gasto
   * pasaria por /transactions y seria rechazado por /bills/pay.
   */
  private aplicarSaldo(account: AccountRow, delta: number): number {
    const balance = money(Number(account.balance ?? 0));
    const monto = Math.abs(delta);
    const nuevo = money(balance + delta);

    if (delta < 0 && monto > balance) {
      if (account.card_type === 'Credito') {
        // En credito la UI ofrece pedir cupo, asi que se responde con el codigo
        // que la distingue de un debito sin saldo.
        throw new BusinessError(
          'REQUIERE_CREDITO',
          'Tu tarjeta de credito no tiene cupo. Pide uno para completar el movimiento.',
          402,
          { disponible: balance, falta: money(monto - balance) },
        );
      }
      throw new BusinessError(
        'SALDO_INSUFICIENTE',
        `Saldo insuficiente. Te faltan Q${money(monto - balance).toFixed(2)}.`,
        402,
        { disponible: balance, falta: money(monto - balance) },
      );
    }

    return nuevo;
  }

  private async updateBalance(
    conn: PoolConnection,
    idFinancial: number,
    balance: number,
  ): Promise<void> {
    await conn.query('UPDATE Financial_account SET balance = ? WHERE id_financial = ?', [
      balance,
      idFinancial,
    ]);
  }

  private async insertMovement(
    conn: PoolConnection | typeof db,
    dto: CreateTransactionDto,
  ): Promise<{ id_transaction: number }> {
    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO Transaction (amount, type_transacion, description, id_user, id_financial, id_category)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        dto.amount,
        dto.type_transacion || null,
        dto.description || null,
        dto.id_user,
        dto.id_financial ?? null,
        dto.id_category,
      ],
    );
    return { id_transaction: result.insertId };
  }

  private async insertNotification(
    conn: PoolConnection,
    dto: CreateTransactionDto,
    balance: number,
    esGasto: boolean,
  ): Promise<void> {
    const detalle = String(dto.description || 'Movimiento').slice(0, 60);
    await new NotificationRepository().create(
      {
        id_user: dto.id_user,
        type: esGasto ? 'Sistema' : 'Deposito',
        title: esGasto ? 'Movimiento registrado' : 'Ingreso registrado',
        message: `${detalle} · saldo Q${balance.toFixed(2)}.`,
        amount: dto.amount,
      },
      conn,
    );
  }
}
