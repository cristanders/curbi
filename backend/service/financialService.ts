import {
  AccountState,
  BankAccountView,
  CardType,
  CreateCreditRequestDto,
  CreateFinancialAccountDto,
  CreateTransferDto,
  CreditRequest,
  FinancialAccount,
  TransferResult,
} from '../model/financial';
import {
  CreditResponseSeconds,
  FinancialAccountRepository,
} from '../repository/financialRepository';
import { BusinessError } from '../model/errors';
import { db } from '../config/database';
import { money } from '../utils/money';

/**
 * Regalo de bienvenida de Curbi. Toda cuenta nueva arranca con Q100 para que el
 * usuario pueda probar el wallet, transferir y aportar a sus metas sin esperar un
 * Deposito. Se aplica solo al crear la cuenta (nunca en cada lectura) para no
 * regalar Q100 extra cada vez que el wallet sincroniza saldos.
 */
export const WELCOME_BONUS = 100;

/**
 * Linea de credito que recibe una tarjeta de credito al crearse. El cupo no se
 * entrega: la tarjeta nace sin dinero disponible y el usuario tiene que pedirlo,
 * que es justo lo que la pantalla de cupo refleja.
 */
export const DEFAULT_CREDIT_LINE = 5000;

export class FinancialAccountService {
  private accountRepository = new FinancialAccountRepository();

  async obtenerCuentasPorUsuario(idUser: number): Promise<FinancialAccount[]> {
    return await this.accountRepository.findByUser(idUser);
  }

  async obtenerCatalogoCuentas(): Promise<BankAccountView[]> {
    return await this.accountRepository.findTransferCatalog();
  }

  /**
   * El saldo y el tipo los decide el servidor: el cliente no elige cuanto se le
   * acredita. Una tarjeta de credito nace sin cupo usado y con la linea lista
   * para solicitar.
   */
  async crearCuenta(accountDto: CreateFinancialAccountDto): Promise<FinancialAccount> {
    const cardType: CardType = accountDto.card_type === 'Credito' ? 'Credito' : 'Debito';
    return await this.accountRepository.create({
      ...accountDto,
      card_type: cardType,
      balance: WELCOME_BONUS,
      credit_limit: cardType === 'Credito' ? DEFAULT_CREDIT_LINE : 0,
    });
  }

  /* ------------------------- transferencias ------------------------- */

  async transferir(dto: CreateTransferDto): Promise<TransferResult> {
    const amount = money(Number(dto.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BusinessError('MONTO_INVALIDO', 'Ingresa un monto valido');
    }
    if (dto.id_user === undefined || Number.isNaN(Number(dto.id_user))) {
      throw new BusinessError('USUARIO_INVALIDO', 'El usuario no es valido', 401);
    }
    if (dto.id_financial === undefined || Number.isNaN(Number(dto.id_financial))) {
      throw new BusinessError('CUENTA_INVALIDA', 'La tarjeta de origen no es valida');
    }
    const accountNumber = String(dto.account_number ?? '').replace(/\D/g, '');
    if (!accountNumber) {
      throw new BusinessError('DESTINO_INVALIDO', 'Ingresa el numero de cuenta de destino');
    }

    return await this.accountRepository.transfer(
      { ...dto, id_user: Number(dto.id_user), id_financial: Number(dto.id_financial), account_number: accountNumber },
      amount,
    );
  }

  /* ----------------------------- cupo ----------------------------- */

  /**
   * Pide cupo para una tarjeta de credito. Solo de debito no: una tarjeta de
   * debito no tiene linea que ampliar, y el error lo dice para que la UI no le
   * ofrezca pedir cupo donde no aplica.
   */
  async solicitarCupo(dto: CreateCreditRequestDto): Promise<CreditRequest> {
    const amount = money(Number(dto.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BusinessError('MONTO_INVALIDO', 'Ingresa un monto valido');
    }
    if (dto.id_user === undefined || Number.isNaN(Number(dto.id_user))) {
      throw new BusinessError('USUARIO_INVALIDO', 'El usuario no es valido', 401);
    }

    const account = await this.accountRepository.findById(Number(dto.id_financial));
    if (!account) {
      throw new BusinessError('CUENTA_INVALIDA', 'La tarjeta no existe', 404);
    }
    if (account.id_user == null || Number(account.id_user) !== Number(dto.id_user)) {
      throw new BusinessError('CUENTA_INVALIDA', 'La tarjeta no es tuya', 403);
    }
    if ((account.card_type ?? 'Debito') !== 'Credito') {
      throw new BusinessError(
        'NO_ES_CREDITO',
        'Solo las tarjetas de credito pueden pedir cupo. Esta tarjeta es de debito.',
        400,
      );
    }

    const pendiente = await this.accountRepository.findPendingCredit(Number(dto.id_financial));
    if (pendiente) {
      throw new BusinessError('YA_PENDIENTE', 'Ya tienes una solicitud de cupo en espera', 409);
    }

    // El cupo aprobado se acredita al saldo, asi que la linea es el techo: pedir
    // mas de lo que falta para llegar a la linea no tendria sentido.
    const disponible = money(Number(account.balance ?? 0));
    const linea = money(Number(account.credit_limit ?? 0));
    const porAprobar = money(linea - disponible);
    if (amount > porAprobar) {
      throw new BusinessError(
        'MONTO_INVALIDO',
        `Tu linea de credito es de Q${linea.toFixed(2)} y ya usas Q${disponible.toFixed(2)}.`,
        409,
        { disponible, linea, porAprobar },
      );
    }

    try {
      return await this.accountRepository.createCreditRequest(
        { ...dto, id_user: Number(dto.id_user), id_financial: Number(dto.id_financial) },
        amount,
      );
    } catch (error: any) {
      // El indice unico pending_slot es la red de seguridad: si dos solicitudes
      // llegan a la vez, MySQL rechaza la segunda en vez de duplicar el cupo.
      if (error?.code === 'ER_DUP_ENTRY') {
        throw new BusinessError('YA_PENDIENTE', 'Ya tienes una solicitud de cupo en espera', 409);
      }
      throw error;
    }
  }

  /**
   * Estado de cuenta para el modal de operaciones. Al leerlo se resuelven las
   * solicitudes cuya respuesta ya tocaba, asi que consultar el saldo es tambien
   * la forma de que el cupo aprobado se refleje sin depender de un temporizador.
   */
  async estadoCuenta(idFinancial: number): Promise<AccountState> {
    if (Number.isNaN(Number(idFinancial))) {
      throw new BusinessError('CUENTA_INVALIDA', 'La tarjeta no es valida');
    }
    const conn = await db.getConnection();
    let account: FinancialAccount;
    let pendiente: CreditRequest | null;
    try {
      account = await this.accountRepository.findLockedById(conn, Number(idFinancial));
      pendiente = await this.accountRepository.findPendingCredit(Number(idFinancial));
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    const balance = money(Number(account.balance ?? 0));
    return {
      id_financial: Number(account.id_financial),
      account_name: account.account_name,
      card_type: (account.card_type as CardType) ?? 'Debito',
      balance,
      credit_limit: money(Number(account.credit_limit ?? 0)),
      // El cupo aprobado se suma al saldo al acreditarse, asi que lo disponible
      // es el saldo y no el saldo mas la linea.
      disponible: balance,
      pendiente: pendiente ? this.describirPendiente(pendiente) : null,
    };
  }

  /** Segundos que faltan para que la banca responda la solicitud en espera. */
  private describirPendiente(pendiente: CreditRequest): NonNullable<AccountState['pendiente']> {
    const created = new Date(pendiente.created_at).getTime();
    const elapsed = Math.floor((Date.now() - created) / 1000);
    return {
      id_credit: Number(pendiente.id_credit),
      amount: money(Number(pendiente.amount)),
      // MySQL entrega las fechas como Date; sin convertir, JSON las serializa
      // en el formato local del servidor y el frontend recibe algo disparejo.
      created_at:
        pendiente.created_at instanceof Date
          ? pendiente.created_at.toISOString()
          : String(pendiente.created_at),
      segundos_restantes: Math.max(0, CreditResponseSeconds - elapsed),
    };
  }
}
