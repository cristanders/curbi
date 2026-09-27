import { db } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
// PoolConnection viene de mysql2/promise: el de mysql2 a secas es la version con
// callbacks y no acepta await.
import type { PoolConnection } from 'mysql2/promise';
import {
  BankAccountView,
  CardType,
  CreateCreditRequestDto,
  CreateFinancialAccountDto,
  CreateTransferDto,
  CreditRequest,
  FinancialAccount,
  TransferResult,
} from '../model/financial';
import { BusinessError } from '../model/errors';
import { money } from '../utils/money';
import { NotificationRepository } from './notificationRepository';

/** Plazo que tarda la banca en responder una solicitud de cupo. */
export const CreditResponseSeconds = 60;

/** Prefijo de los numeros de cuenta generados: 1002 + 8 digitos = 12. */
const ACCOUNT_NUMBER_PREFIX = '1002';

export class FinancialAccountRepository {
  private notificationRepository = new NotificationRepository();

  async findByUser(idUser: number): Promise<FinancialAccount[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM Financial_account WHERE id_user = ?',
      [idUser]
    );
    return rows as FinancialAccount[];
  }

  async findById(idFinancial: number): Promise<FinancialAccount | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM Financial_account WHERE id_financial = ?',
      [idFinancial]
    );
    return (rows as FinancialAccount[])[0] ?? null;
  }

  async create(accountDto: CreateFinancialAccountDto): Promise<FinancialAccount> {
    const { account_name, account_number, bank_code, card_type, balance, credit_limit, id_user } =
      accountDto;
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO Financial_account
         (account_name, account_number, bank_code, card_type, balance, credit_limit, id_user)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        account_name,
        account_number ?? null,
        bank_code ?? null,
        card_type ?? 'Debito',
        balance ?? 0.0,
        credit_limit ?? 0.0,
        id_user || null,
      ]
    );

    // Toda cuenta necesita numero para poder recibir Depositos. Si el cliente no
    // manda uno, se deriva del id autoincremental: es unico por definicion y
    // evita tener que reintentar ante colisiones de numeros aleatorios.
    let numero = account_number ?? null;
    if (!numero) {
      numero = `${ACCOUNT_NUMBER_PREFIX}${String(result.insertId).padStart(8, '0')}`;
      await db.query('UPDATE Financial_account SET account_number = ? WHERE id_financial = ?', [
        numero,
        result.insertId,
      ]);
    }

    return {
      id_financial: result.insertId,
      account_name,
      account_number: numero,
      bank_code: bank_code ?? null,
      card_type: card_type ?? 'Debito',
      balance: balance ?? 0.0,
      credit_limit: credit_limit ?? 0.0,
      id_user: id_user || null,
    };
  }

  /**
   * Catalogo de cuentas que pueden recibir una transferencia. Solo las que ya
   * tienen numero asignado: una cuenta sin numero no se puede buscar a mano.
   */
  async findTransferCatalog(): Promise<BankAccountView[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT f.id_financial, f.account_number, f.card_type, f.balance, f.bank_code,
              u.name AS account_holder
         FROM Financial_account f
         LEFT JOIN users u ON u.id_user = f.id_user
        WHERE f.account_number IS NOT NULL
        ORDER BY u.name, f.id_financial`,
    );
    return (rows as RowDataPacket[]).map((r) => ({
      id_account: Number(r.id_financial),
      account_number: String(r.account_number),
      account_holder: String(r.account_holder ?? 'Titular desconocido'),
      account_type: (r.card_type as CardType) ?? 'Debito',
      balance: money(Number(r.balance ?? 0)),
      // El catalogo de bancos vive en el frontend; aqui solo viaja el monograma.
      id_bank: 0,
      bank_code: r.bank_code ?? undefined,
    }));
  }

  /**
   * Mueve dinero entre dos cuentas en una sola transaccion.
   *
   * Las dos filas se bloquean con FOR UPDATE y siempre en orden de id: si dos
   * personas se transfieren entre si al mismo tiempo, ordenarlas asi evita el
   * deadlock en vez de dejar que MySQL elija. El descuento, el deposito y los dos
   * movimientos viajan juntos: o se aplica todo o no queda nada.
   */
  async transfer(dto: CreateTransferDto, amount: number): Promise<TransferResult> {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // El destino se resuelve sin bloquear para conocer su id: asi las dos
      // filas pueden bloquearse en orden ascendente y dos personas que se
      // transfieren entre si al mismo tiempo no se bloquean mutuamente.
      const [destIdRows] = await conn.query<RowDataPacket[]>(
        'SELECT id_financial FROM Financial_account WHERE account_number = ?',
        [dto.account_number],
      );
      const destId = Number((destIdRows as RowDataPacket[])[0]?.id_financial ?? 0);
      if (!destId) {
        throw new BusinessError('DESTINO_INEXISTENTE', 'La cuenta de destino no existe', 404);
      }
      if (destId === Number(dto.id_financial)) {
        throw new BusinessError('DESTINO_INVALIDO', 'No puedes transferirte a tu misma cuenta', 400);
      }

      const [menor, mayor] =
        Number(dto.id_financial) < destId
          ? [Number(dto.id_financial), destId]
          : [destId, Number(dto.id_financial)];
      await conn.query('SELECT id_financial FROM Financial_account WHERE id_financial = ? FOR UPDATE', [
        menor,
      ]);
      await conn.query('SELECT id_financial FROM Financial_account WHERE id_financial = ? FOR UPDATE', [
        mayor,
      ]);

      const [originRows] = await conn.query<RowDataPacket[]>(
        'SELECT * FROM Financial_account WHERE id_financial = ?',
        [dto.id_financial],
      );
      const origin = (originRows as FinancialAccount[])[0] ?? null;
      if (!origin) {
        throw new BusinessError('CUENTA_INVALIDA', 'La tarjeta de origen no existe', 404);
      }
      if (origin.id_user == null || Number(origin.id_user) !== Number(dto.id_user)) {
        throw new BusinessError('CUENTA_INVALIDA', 'La tarjeta de origen no es tuya', 403);
      }

      const [destRows] = await conn.query<RowDataPacket[]>(
        'SELECT * FROM Financial_account WHERE id_financial = ?',
        [destId],
      );
      const destination = (destRows as FinancialAccount[])[0] ?? null;
      if (!destination) {
        throw new BusinessError('DESTINO_INEXISTENTE', 'La cuenta de destino no existe', 404);
      }

      const balance = money(Number(origin.balance ?? 0));
      if (amount > balance) {
        // En una tarjeta de credito el camino no es un error seco: la UI ofrece
        // pedir cupo, asi que se responde con el codigo que la distingue.
        if ((origin.card_type ?? 'Debito') === 'Credito') {
          throw new BusinessError(
            'REQUIERE_CREDITO',
            'Tu tarjeta de credito no tiene cupo. Pide uno para transferir.',
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

      const description =
        dto.description?.trim() || `Transferencia a ${destination.account_name}`;

      await conn.query('UPDATE Financial_account SET balance = ? WHERE id_financial = ?', [
        money(balance - amount),
        Number(origin.id_financial),
      ]);
      await conn.query('UPDATE Financial_account SET balance = ? WHERE id_financial = ?', [
        money(Number(destination.balance ?? 0) + amount),
        Number(destination.id_financial),
      ]);

      const idCategory = await this.firstCategory(conn);
      const [originTx] = await conn.query<ResultSetHeader>(
        `INSERT INTO \`transaction\`
           (amount, type_transacion, description, id_user, id_financial, id_category)
         VALUES (?, 'Gasto', ?, ?, ?, ?)`,
        [amount, description, Number(dto.id_user), Number(origin.id_financial), idCategory],
      );

      if (destination.id_user != null) {
        await conn.query(
          `INSERT INTO \`transaction\`
             (amount, type_transacion, description, id_user, id_financial, id_category)
           VALUES (?, 'Ingreso', ?, ?, ?, ?)`,
          [amount, `Transferencia desde ${origin.account_name}`, Number(destination.id_user), Number(destination.id_financial), idCategory],
        );

        // El deposito es del otro usuario: es a el a quien le tiene que llegar el
        // aviso, no a quien hizo la transferencia.
        await this.notificationRepository.create(
          {
            id_user: Number(destination.id_user),
            type: 'Deposito',
            title: 'Recibiste un deposito',
            message: `${origin.account_name} te deposited Q${amount.toFixed(2)}.`,
            amount,
          },
          conn,
        );
      }

      await this.notificationRepository.create(
        {
          id_user: Number(dto.id_user),
          type: 'Transferencia',
          title: 'Transferencia enviada',
          message: `Q${amount.toFixed(2)} a ${destination.account_name}.`,
          amount,
        },
        conn,
      );

      await conn.commit();

      return {
        amount,
        description,
        balance: money(balance - amount),
        destination: {
          id_account: Number(destination.id_financial),
          account_number: String(destination.account_number),
          account_holder: destination.account_name,
          account_type: (destination.card_type as CardType) ?? 'Debito',
          balance: money(Number(destination.balance ?? 0) + amount),
          id_bank: 0,
          bank_code: destination.bank_code ?? undefined,
        },
        transaction: {
          id_transaction: originTx.insertId,
          amount,
          type_transacion: 'Gasto',
          description,
          id_user: Number(dto.id_user),
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

  async createCreditRequest(
    dto: CreateCreditRequestDto,
    amount: number,
  ): Promise<CreditRequest> {
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO Credit_request (id_financial, id_user, amount)
       VALUES (?, ?, ?)`,
      [dto.id_financial, dto.id_user, amount],
    );
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM Credit_request WHERE id_credit = ?',
      [result.insertId],
    );
    return rows[0] as CreditRequest;
  }

  /** Solicitud en espera de una tarjeta, si la hay. */
  async findPendingCredit(idFinancial: number): Promise<CreditRequest | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT * FROM Credit_request
        WHERE id_financial = ? AND status = 'Pendiente'
        ORDER BY created_at DESC LIMIT 1`,
      [idFinancial],
    );
    return (rows as CreditRequest[])[0] ?? null;
  }

  /**
   * Aprueba las solicitudes cuya respuesta ya correspondia y acredita el cupo.
   *
   * No hay un scheduler: la banca "responde" cuando alguien mira la cuenta. Se
   * corre dentro de la misma transaccion que la lectura del estado y con la
   * fila bloqueada, asi dos consultas simultaneas no acreditan el cupo dos veces.
   */
  async approveDueCredits(conn: PoolConnection, idFinancial: number): Promise<number> {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT * FROM Credit_request
        WHERE id_financial = ? AND status = 'Pendiente'
          AND created_at <= DATE_SUB(NOW(), INTERVAL ? SECOND)
        FOR UPDATE`,
      [idFinancial, CreditResponseSeconds],
    );
    const due = rows as CreditRequest[];
    for (const request of due) {
      await conn.query(
        `UPDATE Credit_request SET status = 'Aprobado', resolved_at = NOW() WHERE id_credit = ?`,
        [request.id_credit],
      );
      await conn.query('UPDATE Financial_account SET balance = balance + ? WHERE id_financial = ?', [
        money(Number(request.amount)),
        idFinancial,
      ]);
      // El cupo ya esta acreditado cuando se inserta el aviso, asi que si el
      // rollback lo deshace, tampoco queda un "cupo aprobado" que no ocurrio.
      await this.notificationRepository.create(
        {
          id_user: Number(request.id_user),
          type: 'Credito',
          title: 'Cupo aprobado',
          message: `Tu banco approve Q${money(Number(request.amount)).toFixed(2)} de cupo extra.`,
          amount: money(Number(request.amount)),
        },
        conn,
      );
    }
    return due.length;
  }

  /** Cuenta bloqueada con sus solicitudes vencidas ya resueltas. */
  async findLockedById(conn: PoolConnection, idFinancial: number): Promise<FinancialAccount> {
    await this.approveDueCredits(conn, idFinancial);
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT * FROM Financial_account WHERE id_financial = ? FOR UPDATE',
      [idFinancial],
    );
    const account = (rows as FinancialAccount[])[0] ?? null;
    if (!account) {
      throw new BusinessError('CUENTA_INVALIDA', 'La tarjeta no existe', 404);
    }
    return account;
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
