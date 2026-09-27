import { db } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';
import { BillPaymentResult } from '../model/billPayment';
import { FinancialAccount } from '../model/financial';
import { BusinessError } from '../model/errors';
import { money } from '../utils/money';
import { NotificationRepository } from './notificationRepository';

export class BillPaymentRepository {
  private notificationRepository = new NotificationRepository();

  /**
   * Si esa factura ya se pago para este usuario. La comprobacion va aparte de la
   * transaccion porque el error que produce (REFERENCIA_INVALIDA) es de negocio,
   * no un conflicto de escritura.
   */
  async existsPaid(idUser: number, providerCode: string, reference: string): Promise<boolean> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT 1 FROM Bill_payment WHERE id_user = ? AND provider_code = ? AND reference = ? LIMIT 1',
      [idUser, providerCode, reference],
    );
    return (rows as RowDataPacket[]).length > 0;
  }

  /**
   * Paga un servicio desde la cuenta del usuario: descuenta el saldo, deja el
   * comprobante en Bill_payment y registra el gasto, todo en una transaccion.
   *
   * Las validaciones viven adentro de la transaccion a proposito. La cuenta se
   * bloquea con FOR UPDATE antes de mirar el saldo, asi dos pagos simultaneos
   * sobre la misma tarjeta no pueden validar los dos contra el mismo saldo y
   * dejar la cuenta en negativo. Si algo falla, el rollback deshace el descuento:
   * nunca queda plata salida sin comprobante guardado.
   */
  async payFromAccount(params: {
    idUser: number;
    idFinancial: number;
    providerCode: string;
    providerName: string;
    amount: number;
    reference: string;
  }): Promise<BillPaymentResult> {
    const { idUser, idFinancial, providerCode, providerName, amount, reference } = params;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [accRows] = await conn.query<RowDataPacket[]>(
        'SELECT * FROM Financial_account WHERE id_financial = ? FOR UPDATE',
        [idFinancial],
      );
      const account = (accRows as FinancialAccount[])[0] ?? null;
      if (!account) {
        throw new BusinessError('CUENTA_INVALIDA', 'La tarjeta no existe', 404);
      }
      if (account.id_user == null || Number(account.id_user) !== Number(idUser)) {
        throw new BusinessError('CUENTA_INVALIDA', 'La tarjeta no es tuya', 403);
      }

      const balance = money(Number(account.balance ?? 0));
      if (amount > balance) {
        // En una tarjeta de credito el camino no es un error seco: la UI ofrece
        // pedir cupo, asi que se responde con el codigo que la distingue.
        if ((account.card_type ?? 'Debito') === 'Credito') {
          throw new BusinessError(
            'REQUIERE_CREDITO',
            'Tu tarjeta de credito no tiene cupo. Pide uno para pagar la factura.',
            402,
            { disponible: balance, falta: money(amount - balance) },
          );
        }
        throw new BusinessError(
          'SALDO_INSUFICIENTE',
          `Saldo insuficiente. Te faltan Q${money(amount - balance).toFixed(2)}.`,
          402,
          { disponible: balance, falta: money(amount - balance) },
        );
      }

      const saldoFinal = money(balance - amount);
      await conn.query('UPDATE Financial_account SET balance = ? WHERE id_financial = ?', [
        saldoFinal,
        idFinancial,
      ]);

      const [billResult] = await conn.query<ResultSetHeader>(
        `INSERT INTO Bill_payment
           (id_user, id_financial, provider_code, provider_name, reference, amount)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [idUser, idFinancial, providerCode, providerName, reference, amount],
      );

      const description = `Pago ${providerName} · ref ${reference}`;
      const idCategory = await this.firstCategory(conn);
      const [txResult] = await conn.query<ResultSetHeader>(
        `INSERT INTO \`transaction\`
           (amount, type_transacion, description, id_user, id_financial, id_category)
         VALUES (?, 'Gasto', ?, ?, ?, ?)`,
        [amount, description, idUser, idFinancial, idCategory],
      );

      // El aviso viaja en la misma transaccion que el descuento: no puede quedar
      // plata salida sin su notificacion, ni un aviso de un pago que se deshizo.
      await this.notificationRepository.create(
        {
          id_user: idUser,
          type: 'Factura',
          title: `Factura pagada: ${providerName}`,
          message: `Pago de la factura ${reference} por Q${amount.toFixed(2)}.`,
          amount,
        },
        conn,
      );

      await conn.commit();

      return {
        amount,
        provider_name: providerName,
        reference,
        balance: saldoFinal,
        transaction: {
          id_transaction: txResult.insertId,
          amount,
          type_transacion: 'Gasto',
          description,
          id_user: idUser,
          id_category: idCategory,
        },
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /** `transaction.id_category` es obligatorio: sin categoria no hay movimiento. */
  private async firstCategory(conn: PoolConnection): Promise<number> {
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT id_category FROM category ORDER BY id_category LIMIT 1',
    );
    const id = (rows as RowDataPacket[])[0]?.id_category;
    if (id == null) {
      throw new BusinessError('CATEGORIA_INVALIDA', 'No hay categorias configuradas', 500);
    }
    return Number(id);
  }
}
