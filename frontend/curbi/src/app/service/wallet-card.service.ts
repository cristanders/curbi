import { Injectable, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  AccountState,
  ApiBusinessError,
  ApiService,
  BankAccount,
  BillPaymentResult,
  CreditRequest,
  FinancialAccount,
  Transaction,
  TransferResult,
} from './api.service';
import { SessionService } from './session.service';
import {
  bankById,
  CardBrand,
  CardKind,
  detectCardBrand,
  digitsOnly,
  last4Of,
  luhnValid,
} from './bank-catalog';

export interface WalletCard {
  id: string;
  bankId: string;
  holder: string;
  last4: string;
  brand: CardBrand;
  expiry?: string;
  type: CardKind;
  balance: number;
  /**
   * Fila de Financial_account que respalda la tarjeta. Es el id que viaja al
   * backend: sin el, la API no puede validar saldo ni debitar.
   */
  financialId?: number;
  /** Numero con el que la cuenta recibe Depositos de otros usuarios. */
  accountNumber?: string;
  /** Cupo de credito aprobado (solo tarjetas de credito). */
  creditLimit?: number;
}

/** Datos que se piden en el paso de formulario al agregar una tarjeta. */
export interface NewCardData {
  bankId: string;
  kind: CardKind;
  holder: string;
  number: string;
  expiry: string;
  cvv: string;
}

export interface WalletMovement {
  id: string;
  title: string;
  date: string;
  origin: string;
  kind: 'Debito' | 'Credito';
  amount: string;
  sign: '-' | '+';
  at: number;
  syncedToApi?: boolean;
}

interface WalletStore {
  cards: WalletCard[];
  activeCardId: string | null;
  movements: WalletMovement[];
}

/**
 * Representa los "active wallets" del usuario: tarjetas de débito/crédito y sus
 * movimientos. Persiste en localStorage (sobrevive recargas) e intenta
 * sincronizar con el backend (best-effort: si la API falla, sigue en local).
 */
@Injectable({ providedIn: 'root' })
export class WalletCardService {
  private readonly cardsState = signal<WalletCard[]>([]);
  private readonly activeCardIdState = signal<string | null>(null);
  private readonly movementsState = signal<WalletMovement[]>([]);
  /** Cuentas de prueba, se cargan una vez para validar transferencias. */
  private accountCatalog: BankAccount[] | null = null;

  readonly allCards = this.cardsState.asReadonly();
  readonly allMovements = computed(() => this.movementsState().slice(0, 8));
  readonly activeCard = computed<WalletCard | null>(() => {
    const cards = this.cardsState();
    return cards.find((c) => c.id === this.activeCardIdState()) ?? cards[0] ?? null;
  });
  readonly totalBalance = computed(() =>
    this.cardsState().reduce((s, c) => s + c.balance, 0),
  );
  readonly income = computed(() => this.sumByKind('Credito'));
  readonly expense = computed(() => this.sumByKind('Debito'));

  private readonly platformId = inject(PLATFORM_ID);

  constructor(
    private readonly api: ApiService,
    private readonly session: SessionService,
  ) {}

  private sumByKind(kind: 'Debito' | 'Credito'): number {
    return this.movementsState()
      .filter((m) => m.kind === kind)
      .reduce((s, m) => s + Number(m.amount), 0);
  }

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private get storageKey(): string {
    const u = this.session.currentUser;
    const namespace = u?.id_user && u?.username ? `${u.id_user}.${encodeURIComponent(u.username)}` : String(u?.id_user || 0);
    return `curbi.wallet.v3.${namespace}`;
  }

  /** Lista las tarjetas, intentando completar con las cuentas del backend. */
  async load(): Promise<void> {
    this.loadLocal();

    if (this.cardsState().length === 0) {
      const acc = await this.api.accounts(this.session.idUser);
      const cards = (acc.data ?? []).map((a): WalletCard => ({
        id: `acc-${a.id_financial}`,
        bankId: this.bankIdFromName(a.account_name),
        holder: this.session.currentUser?.name || '',
        last4: this.last4FromId(a.id_financial),
        brand: 'Visa',
        type: a.card_type ?? 'Debito',
        balance: Number(a.balance ?? 0),
        financialId: a.id_financial,
        accountNumber: a.account_number,
        creditLimit: Number(a.credit_limit ?? 0),
      }));
      if (cards.length > 0) {
        this.cardsState.set(cards);
        if (!this.activeCardIdState()) {
          this.activeCardIdState.set(cards[0].id);
        }
        this.saveLocal();
      }
    } else {
      // Las tarjetas ya existen en local: el saldo del servidor manda, asi que
      // una transferencia hecha en otra pestana no deja la UI desfasada.
      await this.syncBalances();
    }

    if (this.movementsState().length === 0) {
      const tx = await this.api.transactions(this.session.idUser);
      const movements = (tx.data ?? []).map((t): WalletMovement => {
        const credit = t.type_transacion === 'Ingreso';
        const d = new Date(t.id_transaction ? Date.now() - t.id_transaction * 3600000 : Date.now());
        return {
          id: `tx-${t.id_transaction}`,
          title: (t.description ?? 'MOVIMIENTO').split('|')[0].trim().toUpperCase(),
          date: this.shortDate(d),
          origin: `ID #${t.id_transaction}`,
          kind: credit ? 'Credito' : 'Debito',
          amount: Number(t.amount).toFixed(2),
          sign: credit ? '+' : '-',
          at: d.getTime(),
          syncedToApi: true,
        };
      });
      movements.sort((a, b) => b.at - a.at);
      if (movements.length > 0) {
        this.movementsState.set(movements);
        this.saveLocal();
      }
    }
  }

  /**
   * Copia el saldo y el cupo del backend a las tarjetas locales. El servidor es
   * la fuente de verdad: aqui solo se refleja lo que ya desconto el backend.
   */
  async syncBalances(): Promise<void> {
    const acc = await this.api.accounts(this.session.idUser);
    const cuentas = acc.data ?? [];
    if (cuentas.length === 0) {
      return;
    }
    let cambio = false;
    this.cardsState.update((cards) =>
      cards.map((card) => {
        const remota = cuentas.find((a) => a.id_financial === card.financialId);
        if (!remota) {
          return card;
        }
        const balance = Number(remota.balance ?? 0);
        const creditLimit = Number(remota.credit_limit ?? 0);
        if (card.balance === balance && card.creditLimit === creditLimit) {
          return card;
        }
        cambio = true;
        return {
          ...card,
          balance,
          creditLimit,
          type: remota.card_type ?? card.type,
          accountNumber: remota.account_number ?? card.accountNumber,
        };
      }),
    );
    if (cambio) {
      this.saveLocal();
    }
  }

  private loadLocal(): void {
    this.cardsState.set([]);
    this.activeCardIdState.set(null);
    this.movementsState.set([]);
    if (!this.isBrowser) {
      return;
    }
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as WalletStore;
        this.cardsState.set(parsed.cards ?? []);
        this.activeCardIdState.set(parsed.activeCardId ?? null);
        this.movementsState.set(parsed.movements ?? []);
      }
    } catch {
      /* quedan vacios */
    }
  }

  private saveLocal(): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      const store: WalletStore = {
        cards: this.cardsState(),
        activeCardId: this.activeCardIdState(),
        movements: this.movementsState().slice(0, 30),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(store));
    } catch {
      /* sin persistencia: no crítico */
    }
  }

  setActive(id: string): void {
    if (this.cardsState().some((c) => c.id === id)) {
      this.activeCardIdState.set(id);
      this.saveLocal();
    }
  }

  /**
   * Agrega una tarjeta a partir de los datos reales del plástico. El numero
   * completo y el cvv no se guardan: solo el brand deduced y los ultimos 4.
   */
  async addCard(data: NewCardData): Promise<WalletCard> {
    if (!luhnValid(data.number)) {
      throw new Error('El numero de tarjeta no es valido');
    }
    const bank = bankById(data.bankId);
    const card: WalletCard = {
      id: `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      bankId: data.bankId,
      holder: data.holder.trim() || this.session.currentUser?.name || '',
      last4: last4Of(data.number),
      brand: detectCardBrand(data.number),
      expiry: (data.expiry ?? '').trim(),
      type: data.kind,
      balance: 0,
      creditLimit: 0,
    };
    this.cardsState.update((cards) => [card, ...cards]);
    this.activeCardIdState.set(card.id);
    this.saveLocal();

    // Se registra en el backend para que la tarjeta tenga saldo real. El id que
    // devuelve se guarda en la tarjeta: es lo que permite transferir despues.
    const creada = await this.api.createAccount({
      account_name: `${bank.name} ${data.kind} ···· ${card.last4}`,
      balance: 0,
      card_type: data.kind,
      id_user: this.session.idUser,
    });
    if (creada.ok && creada.data) {
      const id = creada.data.id_financial;
      this.cardsState.update((cards) =>
        cards.map((c) => (c.id === card.id ? { ...c, financialId: id } : c)),
      );
      this.saveLocal();
    }
    return card;
  }

  async removeCard(id: string): Promise<void> {
    const cards = this.cardsState();
    const index = cards.findIndex((c) => c.id === id);
    if (index < 0) {
      return;
    }
    const rest = cards.filter((c) => c.id !== id);
    this.cardsState.set(rest);
    if (this.activeCardIdState() === id) {
      this.activeCardIdState.set(rest[0]?.id ?? null);
    }
    this.saveLocal();
  }

  /** Registra un movimiento: actualiza saldo de la tarjeta y agrega al historial. */
  async addMovement(opts: {
    cardId: string;
    kind: 'Debito' | 'Credito';
    amount: number;
    title: string;
  }): Promise<void> {
    const amount = Number(opts.amount) || 0;
    if (!this.recordMovement(opts.cardId, opts.kind, amount, opts.title)) {
      return;
    }

    void this.api.createTransaction({
      amount,
      type_transacion: opts.kind === 'Credito' ? 'Ingreso' : 'Gasto',
      description: opts.title,
      id_user: this.session.idUser,
      id_category: 1,
    });
  }

  /**
   * Transfiere a otra cuenta bancaria. El saldo lo valida y descuenta el
   * backend: aqui solo se refleja el resultado. Si no alcanza, el error que
   * llega es un ApiBusinessError con codigo SALDO_INSUFICIENTE o
   * REQUIERE_CREDITO, para que el modal ofrezca pedir cupo.
   */
  async transfer(opts: {
    cardId: string;
    amount: number;
    accountNumber: string;
    description?: string;
  }): Promise<TransferResult> {
    const amount = Number(opts.amount) || 0;
    if (amount <= 0) {
      throw new ApiBusinessError('MONTO_INVALIDO', 'Ingresa un monto valido');
    }

    const card = this.cardsState().find((c) => c.id === opts.cardId) ?? this.activeCard();
    if (!card?.financialId) {
      throw new ApiBusinessError(
        'CUENTA_INVALIDA',
        'Esta tarjeta todavia no esta registrada en el servidor.',
      );
    }

    const res = await this.api.createTransfer({
      amount,
      account_number: digitsOnly(opts.accountNumber),
      description: (opts.description ?? '').trim() || undefined,
      id_user: this.session.idUser,
      id_financial: card.financialId,
    });
    if (!res.ok || !res.data) {
      throw res.error ?? new ApiBusinessError('ERROR', 'No se pudo completar la transferencia');
    }

    // El backend ya debito y registro la transaccion: aqui se refleja el saldo
    // que devuelve y se agrega el movimiento al historial de la tarjeta.
    this.setBalance(card.financialId, res.data.balance);
    this.pushMovement(
      card,
      'Debito',
      amount,
      (opts.description ?? '').trim() || `Transferencia a ${res.data.destination.account_holder}`,
    );
    return res.data;
  }

  /**
   * Paga una factura a una entidad. Igual que la transferencia, el descuento lo
   * hace el backend; el cliente solo refleja el nuevo saldo.
   */
  async payBill(opts: {
    cardId: string;
    amount: number;
    providerCode: string;
    providerName: string;
    reference: string;
  }): Promise<BillPaymentResult> {
    const amount = Number(opts.amount) || 0;
    if (amount <= 0) {
      throw new ApiBusinessError('MONTO_INVALIDO', 'Ingresa un monto valido');
    }

    const card = this.cardsState().find((c) => c.id === opts.cardId) ?? this.activeCard();
    if (!card?.financialId) {
      throw new ApiBusinessError(
        'CUENTA_INVALIDA',
        'Esta tarjeta todavia no esta registrada en el servidor.',
      );
    }

    const res = await this.api.payBill({
      id_user: this.session.idUser,
      id_financial: card.financialId,
      provider_code: opts.providerCode,
      provider_name: opts.providerName,
      amount,
      reference: opts.reference.trim(),
    });
    if (!res.ok || !res.data) {
      throw res.error ?? new ApiBusinessError('ERROR', 'No se pudo completar el pago');
    }

    this.setBalance(card.financialId, res.data.balance);
    this.pushMovement(
      card,
      'Debito',
      amount,
      `Pago ${res.data.provider_name} · ref ${res.data.reference}`,
    );
    return res.data;
  }

  /** Pide cupo extra en una tarjeta de credito. La banca responde en 1-2 min. */
  async requestCredit(opts: { cardId: string; amount: number }): Promise<CreditRequest> {
    const amount = Number(opts.amount) || 0;
    if (amount <= 0) {
      throw new ApiBusinessError('MONTO_INVALIDO', 'Ingresa un monto valido');
    }
    const card = this.cardsState().find((c) => c.id === opts.cardId) ?? this.activeCard();
    if (!card?.financialId) {
      throw new ApiBusinessError(
        'CUENTA_INVALIDA',
        'Esta tarjeta todavia no esta registrada en el servidor.',
      );
    }
    const res = await this.api.requestCredit({
      id_user: this.session.idUser,
      id_financial: card.financialId,
      amount,
    });
    if (!res.ok || !res.data) {
      throw res.error ?? new ApiBusinessError('ERROR', 'No se pudo solicitar el cupo');
    }
    return res.data;
  }

  /** Saldo, cupo y solicitud en espera de la cuenta de una tarjeta. */
  async accountState(cardId: string): Promise<AccountState | null> {
    const card = this.cardsState().find((c) => c.id === cardId) ?? this.activeCard();
    if (!card?.financialId) {
      return null;
    }
    const res = await this.api.accountState(card.financialId);
    return res.data;
  }

  /** Busca la cuenta de destino por numero. `null` si no esta en el catalogo. */
  async findDestination(accountNumber: string): Promise<BankAccount | null> {
    if (!this.accountCatalog) {
      const res = await this.api.bankAccounts();
      this.accountCatalog = res.data ?? [];
    }
    const limpio = digitsOnly(accountNumber);
    if (!limpio) {
      return null;
    }
    return this.accountCatalog.find((a) => digitsOnly(a.account_number) === limpio) ?? null;
  }

  /** Escribe el saldo que devolvio el backend. */
  private setBalance(financialId: number, balance: number): void {
    this.cardsState.update((cards) =>
      cards.map((c) => (c.financialId === financialId ? { ...c, balance } : c)),
    );
    this.saveLocal();
  }

  /** Agrega un movimiento al historial sin tocar el saldo. */
  private pushMovement(
    card: WalletCard,
    kind: 'Debito' | 'Credito',
    amount: number,
    title: string,
  ): void {
    const now = new Date();
    this.movementsState.update((movements) => [
      {
        id: `mv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        title: title.toUpperCase(),
        date: this.shortDate(now),
        origin: `${card.last4}`,
        kind,
        amount: amount.toFixed(2),
        sign: kind === 'Credito' ? '+' : '-',
        at: now.getTime(),
      },
      ...movements,
    ]);
    this.saveLocal();
  }

  /** Aplica el movimiento al estado local. `false` si no hay tarjeta o monto. */
  private recordMovement(
    cardId: string,
    kind: 'Debito' | 'Credito',
    amount: number,
    title: string,
  ): boolean {
    const card = this.cardsState().find((c) => c.id === cardId) ?? this.activeCard();
    if (!card || amount <= 0) {
      return false;
    }

    const credit = kind === 'Credito';
    const balance = credit ? card.balance + amount : card.balance - amount;
    this.cardsState.update((cards) => cards.map((c) => (c.id === card.id ? { ...c, balance } : c)));

    const now = new Date();
    this.movementsState.update((movements) => [
      {
        id: `mv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        title: title.toUpperCase(),
        date: this.shortDate(now),
        origin: `${card.last4}`,
        kind,
        amount: amount.toFixed(2),
        sign: credit ? '+' : '-',
        at: now.getTime(),
      },
      ...movements,
    ]);
    this.saveLocal();
    return true;
  }

  private bankIdFromName(name: string): string {
    const n = (name ?? '').toLowerCase();
    if (n.includes('banrural') || n.includes('desarrollo rural')) {
      return 'banrural';
    }
    if (n.includes('caf')) {
      return 'bancafe';
    }
    if (n.includes('bantrab') || n.includes('trabajadores')) {
      return 'bantrab';
    }
    if (n.includes('agromercantil')) {
      return 'bam';
    }
    if (n.includes('continental') || n.includes('g&t')) {
      return 'gt';
    }
    if (n.includes('américa') || n.includes('america') || n.includes('bac')) {
      return 'bac';
    }
    if (n.includes('promerica')) {
      return 'promerica';
    }
    return 'bi';
  }

  private last4FromId(id: number): string {
    return String(id).padStart(4, '0').slice(-4);
  }

  private shortDate(d: Date): string {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
  }
}

export type { FinancialAccount, Transaction };