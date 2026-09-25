import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

export interface ApiOptions {
  /** ms antes de considerar que el backend no responde */
  ms?: number;
  /** valor a devolver si el backend falla o no responde */
  fallback: unknown;
}

export interface User {
  id_user: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
}

export interface FinancialAccount {
  id_financial: number;
  account_name: string;
  balance: number;
  id_user?: number;
  /** Numero con el que la cuenta recibe Depositos. */
  account_number?: string;
  card_type?: 'Debito' | 'Credito';
  credit_limit?: number;
}

export interface Transaction {
  id_transaction: number;
  amount: number;
  type_transacion?: 'Ingreso' | 'Gasto';
  description?: string;
  id_user: number;
  id_category: number;
}

export interface SavingsGoal {
  id_saving: number;
  goal_name?: string;
  target_amount: number;
  current_amount?: number;
  id_user: number;
}

export interface Budget {
  id_budget: number;
  amount: number;
  id_user: number;
}

export interface Category {
  id_category: number;
  type_category: 'Fijo' | 'Personal' | 'Ahorro';
}

export interface House {
  id_house: number;
  name: string;
  username: string;
}

export interface Bank {
  id_bank: number;
  bank_code: string;
  bank_name: string;
}

export interface BankAccount {
  id_account: number;
  account_number: string;
  account_holder: string;
  account_type?: 'Debito' | 'Credito';
  balance?: number;
  id_bank: number;
  bank_name?: string;
  bank_code?: string;
}

export interface TransferResult {
  amount: number;
  description: string;
  destination: BankAccount;
  transaction: Transaction;
  /** Saldo de la cuenta origen despues del movimiento. */
  balance: number;
}

/** Codigos de error de negocio que devuelve el backend. */
export type ApiErrorCode =
  | 'MONTO_INVALIDO'
  | 'USUARIO_INVALIDO'
  | 'CUENTA_INVALIDA'
  | 'DESTINO_INEXISTENTE'
  | 'DESTINO_INVALIDO'
  | 'SALDO_INSUFICIENTE'
  | 'REQUIERE_CREDITO'
  | 'ENTIDAD_INVALIDA'
  | 'REFERENCIA_INVALIDA'
  | 'NO_ES_CREDITO'
  | 'YA_PENDIENTE'
  | 'ERROR';

/** Error que la API devuelve con codigo de negocio. */
export class ApiBusinessError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly details: Record<string, number> = {},
  ) {
    super(message);
    this.name = 'ApiBusinessError';
  }
}

export interface BillPaymentResult {
  amount: number;
  provider_name: string;
  reference: string;
  balance: number;
  transaction: Transaction;
}

export interface AppNotification {
  id_notification: number;
  id_user: number;
  type: 'Transferencia' | 'Deposito' | 'Credito' | 'Factura' | 'Sistema';
  title: string;
  message: string;
  amount?: number;
  is_read: boolean | 0 | 1;
  created_at: string;
}

export interface NotificationsPayload {
  notifications: AppNotification[];
  unread: number;
}

export interface CreditRequest {
  id_credit: number;
  id_user: number;
  id_financial: number;
  amount: number;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado';
  created_at: string;
  resolved_at?: string | null;
}

/** Estado de cuenta que necesita el modal para decidir si alcanza o hay que pedir cupo. */
export interface AccountState {
  id_financial: number;
  account_name: string;
  card_type: 'Debito' | 'Credito';
  balance: number;
  credit_limit: number;
  /** Dinero con el que se puede pagar ahora: saldo + cupo aprobado. */
  disponible: number;
  pendiente: {
    id_credit: number;
    amount: number;
    created_at: string;
    /** Cuantos segundos faltan para que la banca responda. */
    segundos_restantes: number;
  } | null;
}

export interface ExpenditureAttempt {
  id_expediture: number;
  product_name?: string;
  estimated_amount: number;
  status?: 'Frenado' | 'Aprobado' | 'Pendiente';
  id_user: number;
}

export interface DashboardPayload {
  idUser: number;
  demo: boolean;
  accounts: FinancialAccount[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  budgets: Budget[];
  summary: {
    totalBalance: number;
    totalSaved: number;
    income: number;
    expense: number;
    net: number;
    accountCount: number;
    transactionCount: number;
    goalCount: number;
  };
}

export interface AuthResponse {
  demo: boolean;
  user: User;
  warning?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  /** En dev usa el proxy (proxy.conf.json) hacia la API local */
  readonly baseUrl = '/api';

  private readonly platformId = inject(PLATFORM_ID);

  constructor(private readonly http: HttpClient) {}

  /** En SSR/prerender no hay proxy: se usa el fallback sin salir de la peticion. */
  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private async call<T>(method: 'get' | 'post', url: string, body?: unknown, ms = 4000): Promise<T> {
    const req =
      method === 'get'
        ? this.http.get<T>(`${this.baseUrl}${url}`)
        : this.http.post<T>(`${this.baseUrl}${url}`, body ?? {});
    return await firstValueFrom(req.pipe(timeout(ms)));
  }

  /** Hace la petición; si falla (o no es navegador) devuelve `fallback`. */
  private async try<T>(fn: () => Promise<T>, fallback: T): Promise<{ data: T; ok: boolean }> {
    if (!this.isBrowser) {
      return { data: fallback, ok: false };
    }
    try {
      const data = await fn();
      return { data, ok: true };
    } catch {
      return { data: fallback, ok: false };
    }
  }

  async health(): Promise<{ status: string } | null> {
    if (!this.isBrowser) {
      return null;
    }
    try {
      return await this.call<{ status: string }>('get', '/health', undefined, 2500);
    } catch {
      return null;
    }
  }

  async login(
    identifier: string,
    password: string,
  ): Promise<{ data: AuthResponse | null; ok: boolean; error?: string }> {
    if (!this.isBrowser) {
      return { data: null, ok: false, error: 'No se pudo conectar con el servidor.' };
    }
    try {
      const data = await this.call<AuthResponse>('post', '/auth/login', { identifier, password }, 6000);
      return { data, ok: true };
    } catch (e: unknown) {
      const status = (e as { status?: number })?.status;
      if (status === 401) {
        return { data: null, ok: false, error: 'Usuario o contraseña incorrectos.' };
      }
      return { data: null, ok: false, error: 'No se pudo conectar con el servidor. Inténtalo de nuevo.' };
    }
  }

  async register(payload: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ data: AuthResponse | null; ok: boolean; error?: string }> {
    if (!this.isBrowser) {
      return { data: null, ok: false, error: 'No se pudo conectar con el servidor.' };
    }
    try {
      const data = await this.call<AuthResponse>('post', '/auth/register', payload, 6000);
      return { data, ok: true };
    } catch {
      return { data: null, ok: false, error: 'No se pudo conectar con el servidor. Inténtalo de nuevo.' };
    }
  }

  dashboard(idUser: number): Promise<{ data: DashboardPayload | null; ok: boolean }> {
    return this.try<DashboardPayload | null>(
      () => this.call<DashboardPayload>('get', `/dashboard/user/${idUser}`, undefined, 5000),
      null,
    );
  }

  accounts(idUser: number): Promise<{ data: FinancialAccount[]; ok: boolean }> {
    return this.try(
      () => this.call<FinancialAccount[]>('get', `/accounts/user/${idUser}`),
      [],
    );
  }

  transactions(idUser: number): Promise<{ data: Transaction[]; ok: boolean }> {
    return this.try(
      () => this.call<Transaction[]>('get', `/transactions/user/${idUser}`),
      [],
    );
  }

  savingsGoals(idUser: number): Promise<{ data: SavingsGoal[]; ok: boolean }> {
    return this.try(() => this.call<SavingsGoal[]>('get', `/savings/user/${idUser}`), []);
  }

  budgets(idUser: number): Promise<{ data: Budget[]; ok: boolean }> {
    return this.try(() => this.call<Budget[]>('get', `/budgets/user/${idUser}`), []);
  }

  categories(): Promise<{ data: Category[]; ok: boolean }> {
    return this.try(() => this.call<Category[]>('get', '/categories'), []);
  }

  houses(username: string): Promise<{ data: House[]; ok: boolean }> {
    return this.try(() => this.call<House[]>('get', `/houses/user/${username}`), []);
  }

  banks(): Promise<{ data: Bank[]; ok: boolean }> {
    return this.try(() => this.call<Bank[]>('get', '/banks'), []);
  }

  /** Cuentas de prueba: sirven para validar la cuenta destino de una transferencia. */
  bankAccounts(): Promise<{ data: BankAccount[]; ok: boolean }> {
    return this.try(() => this.call<BankAccount[]>('get', '/bank-accounts'), []);
  }

  expenditures(idUser: number): Promise<{ data: ExpenditureAttempt[]; ok: boolean }> {
    return this.try(
      () => this.call<ExpenditureAttempt[]>('get', `/expenditures/user/${idUser}`),
      [],
    );
  }

  createTransaction(payload: Partial<Transaction>): Promise<{ data: Transaction | null; ok: boolean }> {
    return this.try<Transaction | null>(
      () => this.call<Transaction>('post', '/transactions', payload),
      null,
    );
  }

  /**
   * Transfiere a otra cuenta bancaria. A diferencia del resto de metodos no se
   * come el error: el backend responde 402 si no hay saldo y la UI necesita el
   * codigo para ofrecer "pedir cupo" en vez de un mensaje generico.
   */
  async createTransfer(payload: {
    amount: number;
    account_number: string;
    description?: string;
    id_user: number;
    id_financial: number;
  }): Promise<{ data: TransferResult | null; ok: boolean; error?: ApiBusinessError }> {
    if (!this.isBrowser) {
      return { data: null, ok: false, error: new ApiBusinessError('ERROR', 'No se pudo conectar con el servidor.') };
    }
    try {
      const data = await this.call<TransferResult>('post', '/transfers', payload, 6000);
      return { data, ok: true };
    } catch (e: unknown) {
      return { data: null, ok: false, error: toBusinessError(e) };
    }
  }

  /**
   * Paga una factura a una entidad (luz, agua, cable). El backend descuenta del
   * saldo y devuelve el nuevo balance.
   */
  async payBill(payload: {
    id_user: number;
    id_financial: number;
    provider_code: string;
    provider_name: string;
    amount: number;
    reference: string;
  }): Promise<{ data: BillPaymentResult | null; ok: boolean; error?: ApiBusinessError }> {
    if (!this.isBrowser) {
      return { data: null, ok: false, error: new ApiBusinessError('ERROR', 'No se pudo conectar con el servidor.') };
    }
    try {
      const data = await this.call<BillPaymentResult>('post', '/bills/pay', payload, 6000);
      return { data, ok: true };
    } catch (e: unknown) {
      return { data: null, ok: false, error: toBusinessError(e) };
    }
  }

  /** Pide cupo extra. La banca responde entre 1 y 2 minutos. */
  async requestCredit(payload: {
    id_user: number;
    id_financial: number;
    amount: number;
  }): Promise<{ data: CreditRequest | null; ok: boolean; error?: ApiBusinessError }> {
    if (!this.isBrowser) {
      return { data: null, ok: false, error: new ApiBusinessError('ERROR', 'No se pudo conectar con el servidor.') };
    }
    try {
      const data = await this.call<CreditRequest>('post', '/credit-requests', payload, 6000);
      return { data, ok: true };
    } catch (e: unknown) {
      return { data: null, ok: false, error: toBusinessError(e) };
    }
  }

  /** Saldo, cupo aprobado y si hay una solicitud en espera. */
  async accountState(
    idFinancial: number
  ): Promise<{ data: AccountState | null; ok: boolean }> {
    return this.try<AccountState | null>(
      () => this.call<AccountState>('get', `/accounts/${idFinancial}/state`),
      null,
    );
  }

  /** Notificaciones del usuario + cuantas quedan sin leer. */
  async notifications(idUser: number): Promise<{ data: NotificationsPayload | null; ok: boolean }> {
    return this.try<NotificationsPayload | null>(
      () => this.call<NotificationsPayload>('get', `/notifications/user/${idUser}`, undefined, 6000),
      null,
    );
  }

  async markNotificationsRead(idUser: number): Promise<{ ok: boolean }> {
    return this.try(() => this.call('post', `/notifications/user/${idUser}/read-all`), { ok: true });
  }

  createSavingsGoal(payload: Partial<SavingsGoal>): Promise<{ data: SavingsGoal | null; ok: boolean }> {
    return this.try<SavingsGoal | null>(
      () => this.call<SavingsGoal>('post', '/savings', payload),
      null,
    );
  }

  createAccount(payload: Partial<FinancialAccount>): Promise<{ data: FinancialAccount | null; ok: boolean }> {
    return this.try<FinancialAccount | null>(
      () => this.call<FinancialAccount>('post', '/accounts', payload),
      null,
    );
  }

  createBudget(payload: Partial<Budget>): Promise<{ data: Budget | null; ok: boolean }> {
    return this.try<Budget | null>(() => this.call<Budget>('post', '/budgets', payload), null);
  }

  updateAvatar(idUser: number, avatar: string): Promise<{ data: User | null; ok: boolean }> {
    return this.try<User | null>(() => this.call<User>('post', `/users/${idUser}/avatar`, { avatar }), null);
  }
}

/**
 * Convierte la respuesta de error del backend en un ApiBusinessError, para que
 * los modales puedan reaccionar segun el codigo (falta saldo, falta cupo, etc).
 */
function toBusinessError(e: unknown): ApiBusinessError {
  const body = (e as { error?: { error?: string; code?: ApiErrorCode; details?: Record<string, number> } })
    ?.error;
  if (body?.error) {
    return new ApiBusinessError(body.code ?? 'ERROR', body.error, body.details ?? {});
  }
  return new ApiBusinessError('ERROR', 'No se pudo completar la operacion.');
}
