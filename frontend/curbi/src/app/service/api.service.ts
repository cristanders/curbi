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
  location?: string;
  avatar?: string;
}

export interface FinancialAccount {
  id_financial: number;
  account_name: string;
  balance: number;
  id_user?: number;
  /** Numero con el que la cuenta recibe Depositos. */
  account_number?: string;
  /** Monograma del banco al que pertenece la cuenta (bi, banrural...). */
  bank_code?: string;
  card_type?: 'Debito' | 'Credito';
  credit_limit?: number;
}

export interface Transaction {
  id_transaction: number;
  amount: number;
  type_transacion?: 'Ingreso' | 'Gasto';
  description?: string;
  id_user: number;
  id_financial?: number | null;
  id_category: number;
  /**
   * Fecha real del movimiento, la pone el servidor. Si no se usa, la tabla la
   * inventa a partir de la posicion de la fila y por eso dos movimientos del mismo
   * dia parecian de dias distintos.
   */
  created_at?: string;
}

/**
 * Respuesta de crear un movimiento: el asiento y el saldo que quedo en la
 * cuenta. `balance` es null cuando el movimiento no toco ninguna cuenta.
 */
export interface CreateTransactionResponse {
  transaction: Transaction;
  balance: number | null;
}

export interface SavingsGoal {
  id_saving: number;
  goal_name?: string;
  target_amount: number;
  current_amount?: number;
  /** Categoria de ahorro; es la que decide el icono de la meta. */
  category?: string;
  id_user: number;
}

/**
 * Resultado de aportar a una meta: la meta ya actualizada y el saldo que quedo
 * en la tarjeta que pago el aporte.
 */
export interface SavingsContribution {
  goal: SavingsGoal;
  balance: number;
}

export interface Budget {
  id_budget: number;
  amount: number;
  id_user: number;
  id_category: number;
  /** Mes al que aplica, en formato YYYY-MM. */
  period_month: string;
  created_at?: string;
}

/**
 * Un presupuesto con lo ya gastado. `spent`, `remaining` y `percent` los calcula
 * el servidor sumando los movimientos reales del mes; el frontend solo los pinta.
 */
export interface BudgetProgress extends Budget {
  category_name: string;
  spent: number;
  remaining: number;
  percent: number;
  exceeded: boolean;
}

export interface Category {
  id_category: number;
  type_category: 'Fijo' | 'Personal' | 'Ahorro';
}

export type HouseRole = 'Admin' | 'Miembro';

export interface HouseMember {
  id_member: number;
  id_house: number;
  id_user: number;
  username: string;
  role: HouseRole;
  created_at?: string;
}

export interface House {
  id_house: number;
  name: string;
  /** Username de quien creo el grupo. */
  username: string;
  created_at?: string;
  /** Miembros del grupo, con el usuario que mira la lista. */
  members: HouseMember[];
  /** Rol del usuario que pidio la lista, no el del dueno. */
  role: HouseRole | null;
  member_count: number;
  is_member: boolean;
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
  | 'META_INEXISTENTE'
  | 'META_COMPLETA'
  | 'MOVIMIENTO_INVALIDO'
  | 'CATEGORIA_INVALIDA'
  | 'PERIODO_INVALIDO'
  | 'PRESUPUESTO_INEXISTENTE'
  | 'PRODUCTO_INVALIDO'
  | 'CASA_INVALIDA'
  | 'CASA_INEXISTENTE'
  | 'YA_ES_MIEMBRO'
  | 'CATEGORIA_INVALIDA'
  | 'PERFIL_INVALIDO'
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
  id_category?: number;
  /** Quedo registrado como movimiento real? Solo si el backend lo aprobó. */
  id_transaction?: number | null;
  /** Por que quedo Frenado, para poder explicarle el caso al usuario. */
  reason?: string | null;
  created_at?: string;
}

/**
 * Respuesta de pedir un gasto. `status` es la decision del freno: un intento
 * frenado NO es un error, es una respuesta valida con su motivo en `reason`.
 */
export interface AttemptResult {
  attempt: ExpenditureAttempt;
  status: 'Frenado' | 'Aprobado' | 'Pendiente';
  reason: string | null;
  balance: number | null;
  transaction: { id_transaction: number } | null;
}

export interface DashboardPayload {
  idUser: number;
  demo: boolean;
  accounts: FinancialAccount[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  budgets: BudgetProgress[];
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

  /**
   * `put` existe para PUT /api/users/:id (guardar el perfil). Los demas metodos
   * siguen usando post aunque el recurso se cree o se lea, porque es lo que ya
   * espera el resto de la API.
   */
  private async call<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    body?: unknown,
    ms = 4000,
  ): Promise<T> {
    const full = `${this.baseUrl}${url}`;
    const req =
      method === 'get'
        ? this.http.get<T>(full)
        : method === 'put'
          ? this.http.put<T>(full, body ?? {})
          : method === 'delete'
            ? this.http.delete<T>(full)
            : this.http.post<T>(full, body ?? {});
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
    } catch (e: unknown) {
      // El backend responde 409 con el motivo (por ejemplo, username repetido).
      // Mostrar "no se pudo conectar" en ese caso seria mentirle al usuario.
      const status = (e as { status?: number })?.status;
      if (typeof status === 'number' && status >= 400 && status < 500) {
        return { data: null, ok: false, error: messageOf(e) };
      }
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

  /** Presupuestos del mes con lo gastado. `periodo` es YYYY-MM; si no, el actual. */
  budgets(idUser: number, periodo?: string): Promise<{ data: BudgetProgress[]; ok: boolean }> {
    const query = periodo ? `?periodo=${encodeURIComponent(periodo)}` : '';
    return this.try(
      () => this.call<BudgetProgress[]>('get', `/budgets/user/${idUser}${query}`),
      [],
    );
  }

  categories(): Promise<{ data: Category[]; ok: boolean }> {
    return this.try(() => this.call<Category[]>('get', '/categories'), []);
  }

  /**
   * Grupos de `username`. Con el username propio son "mi familia"; con el de otra
   * persona, los grupos donde esa persona es dueña, que es como se descubre a quién
   * unirse. `viewerId` va aparte porque el rol y la pertenencia dependen de quien
   * pregunta, no de de quién son los grupos.
   *
   * A diferencia del resto de lecturas, esta propaga el error: el formulario de
   * unirse necesita el motivo (ese usuario no existe) y no un `[]` mudo.
   */
  async houses(
    username: string,
    viewerId: number,
  ): Promise<{ data: House[]; ok: boolean; error?: ApiBusinessError }> {
    if (!this.isBrowser) {
      return {
        data: [],
        ok: false,
        error: new ApiBusinessError('ERROR', 'No se pudo conectar con el servidor.'),
      };
    }
    try {
      const data = await this.call<House[]>(
        'get',
        `/houses/user/${encodeURIComponent(username)}?viewer=${viewerId}`,
      );
      return { data, ok: true };
    } catch (e: unknown) {
      return { data: [], ok: false, error: toBusinessError(e) };
    }
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

  /**
   * Registra un movimiento. Igual que createTransfer no se come el error: si el
   * backend rechaza por saldo o por cuenta ajena, la UI necesita el codigo para
   * explicar que paso en vez de fingir que se registro.
   */
  async createTransaction(
    payload: Partial<Transaction>,
  ): Promise<{ data: CreateTransactionResponse | null; ok: boolean; error?: ApiBusinessError }> {
    if (!this.isBrowser) {
      return { data: null, ok: false, error: new ApiBusinessError('ERROR', 'No se pudo conectar con el servidor.') };
    }
    try {
      const data = await this.call<CreateTransactionResponse>('post', '/transactions', payload, 6000);
      return { data, ok: true };
    } catch (e: unknown) {
      return { data: null, ok: false, error: toBusinessError(e) };
    }
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

  async createSavingsGoal(
    payload: Partial<SavingsGoal>,
  ): Promise<{ data: SavingsGoal | null; ok: boolean; error?: string }> {
    if (!this.isBrowser) {
      return { data: null, ok: false, error: 'No se pudo conectar con el servidor.' };
    }
    try {
      const data = await this.call<SavingsGoal>('post', '/savings', payload, 6000);
      return { data, ok: true };
    } catch (e: unknown) {
      return { data: null, ok: false, error: messageOf(e) };
    }
  }

  /**
   * Aporta dinero a una meta ya existente. El saldo lo descuenta el backend de
   * la tarjeta indicada y devuelve cuanto quedo, asi que el wallet no recarga.
   *
   * No se come el error: la UI necesita el codigo de negocio (saldo
   * insuficiente, meta completa) para explicarle al usuario por que no se
   * acepto el aporte en vez de mostrar un fallo generico.
   */
  async contributeSavings(
    idSaving: number,
    payload: { amount: number; id_user: number; id_financial: number },
  ): Promise<{ data: SavingsContribution | null; ok: boolean; error?: ApiBusinessError }> {
    if (!this.isBrowser) {
      return {
        data: null,
        ok: false,
        error: new ApiBusinessError('ERROR', 'No se pudo conectar con el servidor.'),
      };
    }
    try {
      const data = await this.call<SavingsContribution>(
        'post',
        `/savings/${idSaving}/contribute`,
        payload,
        6000,
      );
      return { data, ok: true };
    } catch (e: unknown) {
      return { data: null, ok: false, error: toBusinessError(e) };
    }
  }

  createAccount(payload: Partial<FinancialAccount>): Promise<{ data: FinancialAccount | null; ok: boolean }> {
    return this.try<FinancialAccount | null>(
      () => this.call<FinancialAccount>('post', '/accounts', payload),
      null,
    );
  }

  /**
   * Guarda el limite de una categoria. El backend responde 200 tanto si lo creo
   * como si actualizo el que ya existia para esa categoria y mes, asi que el
   * cliente no tiene que distinguir los dos casos.
   */
  async createBudget(payload: {
    amount: number;
    id_category: number;
    period_month: string;
    id_user: number;
  }): Promise<{ data: Budget | null; ok: boolean; error?: ApiBusinessError }> {
    if (!this.isBrowser) {
      return {
        data: null,
        ok: false,
        error: new ApiBusinessError('ERROR', 'No se pudo conectar con el servidor.'),
      };
    }
    try {
      const data = await this.call<Budget>('post', '/budgets', payload);
      return { data, ok: true };
    } catch (e: unknown) {
      return { data: null, ok: false, error: toBusinessError(e) };
    }
  }

  async deleteBudget(
    idBudget: number,
    idUser: number,
  ): Promise<{ data: null; ok: boolean; error?: ApiBusinessError }> {
    if (!this.isBrowser) {
      return {
        data: null,
        ok: false,
        error: new ApiBusinessError('ERROR', 'No se pudo conectar con el servidor.'),
      };
    }
    try {
      await this.call<{ eliminado: boolean }>(
        'delete',
        `/budgets/${idBudget}/user/${idUser}`,
      );
      return { data: null, ok: true };
    } catch (e: unknown) {
      return { data: null, ok: false, error: toBusinessError(e) };
    }
  }

  /**
   * Pide un gasto y deja que el servidor decida. Un intento frenado llega como
   * `ok: true` con `status: 'Frenado'`: frenado no es un error, es la respuesta.
   * Solo un 4xx real (no hay saldo, monto invalido) viene con `ok: false`.
   */
  async createExpenditureAttempt(payload: {
    product_name: string;
    estimated_amount: number;
    id_user: number;
    id_category: number;
    id_financial?: number | null;
  }): Promise<{ data: AttemptResult | null; ok: boolean; error?: ApiBusinessError }> {
    if (!this.isBrowser) {
      return {
        data: null,
        ok: false,
        error: new ApiBusinessError('ERROR', 'No se pudo conectar con el servidor.'),
      };
    }
    try {
      const data = await this.call<AttemptResult>('post', '/expenditures', payload);
      return { data, ok: true };
    } catch (e: unknown) {
      return { data: null, ok: false, error: toBusinessError(e) };
    }
  }

  /** Crea un grupo de familia y registra al usuario actual como Admin. */
  async createHouse(
    name: string,
    username: string,
    idUser: number,
  ): Promise<{ data: House | null; ok: boolean; error?: ApiBusinessError }> {
    if (!this.isBrowser) {
      return {
        data: null,
        ok: false,
        error: new ApiBusinessError('ERROR', 'No se pudo conectar con el servidor.'),
      };
    }
    try {
      const data = await this.call<House>('post', '/houses', { name, username, id_user: idUser });
      return { data, ok: true };
    } catch (e: unknown) {
      return { data: null, ok: false, error: toBusinessError(e) };
    }
  }

  /** Une al usuario actual a un grupo existente. */
  async joinHouse(
    idHouse: number,
    username: string,
    idUser: number,
  ): Promise<{ data: House | null; ok: boolean; error?: ApiBusinessError }> {
    if (!this.isBrowser) {
      return {
        data: null,
        ok: false,
        error: new ApiBusinessError('ERROR', 'No se pudo conectar con el servidor.'),
      };
    }
    try {
      const data = await this.call<House>('post', `/houses/${idHouse}/join`, { username, id_user: idUser });
      return { data, ok: true };
    } catch (e: unknown) {
      return { data: null, ok: false, error: toBusinessError(e) };
    }
  }

  updateAvatar(idUser: number, avatar: string): Promise<{ data: User | null; ok: boolean }> {
    return this.try<User | null>(() => this.call<User>('post', `/users/${idUser}/avatar`, { avatar }), null);
  }

  /**
   * Guarda el perfil. A diferencia del resto no se come el error: el backend
   * responde 400 con el motivo (correo invalido, nombre muy corto, correo ya
   * usado) y la pantalla de Perfil necesita mostrarlo junto al campo culpable.
   */
  async updateProfile(
    idUser: number,
    payload: { name?: string; email?: string; phone?: string; location?: string },
  ): Promise<{ data: User | null; ok: boolean; error?: ApiBusinessError }> {
    if (!this.isBrowser) {
      return { data: null, ok: false, error: new ApiBusinessError('ERROR', 'No se pudo conectar con el servidor.') };
    }
    try {
      const data = await this.call<{ user: User }>('put', `/users/${idUser}`, payload, 6000);
      return { data: data.user, ok: true };
    } catch (e: unknown) {
      return { data: null, ok: false, error: toBusinessError(e) };
    }
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

/**
 * Lee el mensaje de error que devuelve el backend en sus rutas simples
 * (`{ error: '...' }`), a diferencia de toBusinessError que espera el codigo de
 * negocio anidado.
 */
function messageOf(e: unknown): string {
  const body = (e as { error?: { error?: string } | string })?.error;
  if (typeof body === 'string') {
    return body || 'No se pudo completar la operacion.';
  }
  if (body && body.error) {
    return body.error;
  }
  return 'No se pudo completar la operacion.';
}
