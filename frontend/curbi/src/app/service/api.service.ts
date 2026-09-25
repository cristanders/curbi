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
