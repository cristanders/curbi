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
  SavingsContribution,
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
 * Representa los "active wallets" del usuario: tarjetas de dÃ©bito/crÃ©dito y sus
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
  /** Carga en curso: evita que dos llamadas se pisen y vacien la pantalla. */
  private loading = false;
  private pending: Promise<void> | null = null;
  /** El store ya se sembro desde localStorage. */
  private seeded = false;
  /** Clave de localStorage a la que pertenece el store en memoria. */
  private namespace: string | null = null;

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

  /**
   * Descarta el store cuando cambia el usuario en sesion. El servicio vive en
   * root, asi que sin esto las tarjetas del usuario anterior quedarian visibles
   * al entrar con otra cuenta.
   */
  private syncNamespace(): void {
    const namespace = this.storageKey;
    if (this.namespace === namespace) {
      return;
    }
    this.namespace = namespace;
    this.seeded = false;
    this.cardsState.set([]);
    this.activeCardIdState.set(null);
    this.movementsState.set([]);
  }

  /**
   * Lista las tarjetas y sus movimientos.
   *
   * Es idempotente y segura para llamadas concurrentes: el dashboard la invoca
   * en cada sondeo y la pantalla de tarjetas al entrar, asi que dos cargas no
   * pueden pisarse ni vaciar la lista mientras la otra espera al backend.
   */
  async load(): Promise<void> {
    this.syncNamespace();
    if (this.pending) {
      return this.pending;
    }
    this.loading = true;
    this.seedFromStorage();
    const pending = this.loadFromApi().finally(() => {
      this.loading = false;
      this.pending = null;
    });
    this.pending = pending;
    return pending;
  }

  private async loadFromApi(): Promise<void> {
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

    await this.syncMovements();
  }

  /**
   * Reemplaza los movimientos locales por los del backend. Se llama en cada
   * carga para que un movimiento hecho en otra pestana aparezca sin recargar.
   */
  private async syncMovements(): Promise<void> {
    const tx = await this.api.transactions(this.session.idUser);
    if (!tx.ok) {
      return;
    }
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

    const previa = this.movementsState();
    const misma =
      previa.length === movements.length &&
      previa.every((m, i) => m.id === movements[i].id && m.amount === movements[i].amount);
    if (misma) {
      return;
    }
    this.movementsState.set(movements);
    this.saveLocal();
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

  /**
   * Siembra el store desde localStorage la primera vez. Nunca vacia un store ya
   * poblado: hacerlo dejaba la pantalla sin tarjetas durante cada sondeo.
   */
  private seedFromStorage(): void {
    if (this.seeded || !this.isBrowser) {
      return;
    }
    this.seeded = true;
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
      /* sin persistencia: no crÃ­tico */
    }
  }

  setActive(id: string): void {
    if (this.cardsState().some((c) => c.id === id)) {
      this.activeCardIdState.set(id);
      this.saveLocal();
    }
  }

  /**
   * Agrega una tarjeta a partir de los datos reales del plÃ¡stico. El numero
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
    // El saldo lo asigna el servidor (regalo de bienvenida de Curbi), asi que la
    // tarjeta local adopta el valor que respondio y no un 0 optimista.
    // bank_code viaja para que el backend sepa a que banco pertenece la cuenta;
    // account_number lo genera el servidor y se usa para recibir depositos.
    const creada = await this.api.createAccount({
      account_name: `${bank.name} ${data.kind} Â·Â·Â·Â· ${card.last4}`,
      bank_code: bank.id,
      balance: 0,
      card_type: data.kind,
      id_user: this.session.idUser,
    });
    if (creada.ok && creada.data) {
      const id = creada.data.id_financial;
      const balance = Number(creada.data.balance ?? 0);
      const creditLimit = Number(creada.data.credit_limit ?? 0);
      // El numero de cuenta lo asigna el servidor: es lo que el usuario comparte
      // para que le depositen, asi que se guarda apenas se crea la tarjeta.
      const accountNumber = creada.data.account_number ?? undefined;
      this.cardsState.update((cards) =>
        cards.map((c) =>
          c.id === card.id
            ? { ...c, financialId: id, balance, creditLimit, accountNumber }
            : c,
        ),
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

  /**
   * Registra un movimiento en una tarjeta.
   *
   * El saldo lo descuenta o suma el backend dentro de la misma operacion que
   * guarda el movimiento: antes se restaba aqui y se mandaba el POST sin
   * await, asi que al recargar la pagina el movimiento seguia en el historial
   * pero el saldo volvia al valor viejo. Ahora se refleja el saldo que devuelve
   * el servidor y, si el rechaza, se propaga el error para que el modal lo
   * muestre en vez de confirmar un gasto que no ocurrio.
   */
  async addMovement(opts: {
    cardId: string;
    kind: 'Debito' | 'Credito';
    amount: number;
    title: string;
  }): Promise<void> {
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

    const res = await this.api.createTransaction({
      amount,
      type_transacion: opts.kind === 'Credito' ? 'Ingreso' : 'Gasto',
      description: opts.title,
      id_user: this.session.idUser,
      id_financial: card.financialId,
      id_category: 1,
    });
    if (!res.ok || !res.data) {
      throw res.error ?? new ApiBusinessError('ERROR', 'No se pudo registrar el movimiento');
    }

    this.setBalance(card.financialId, res.data.balance ?? card.balance);
    this.pushMovement(card, opts.kind, amount, opts.title);
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
      `Pago ${res.data.provider_name} Â· ref ${res.data.reference}`,
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

  /**
   * Aporta a una meta de ahorro con el saldo de una tarjeta. Igual que la
   * transferencia, el backend descuenta el saldo y aumenta la meta en una sola
   * transaccion y devuelve el saldo que quedo: aqui solo se refleja ese valor.
   *
   * No se valida el saldo en el cliente a proposito. La unica fuente de verdad es
   * el servidor, para que un aporte no dependa de que la UI esteja al dia.
   */
  async contributeToSavings(opts: {
    cardId: string;
    goalId: number;
    goalName?: string;
    amount: number;
  }): Promise<SavingsContribution> {
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

    const res = await this.api.contributeSavings(opts.goalId, {
      amount,
      id_user: this.session.idUser,
      id_financial: card.financialId,
    });
    if (!res.ok || !res.data) {
      throw res.error ?? new ApiBusinessError('ERROR', 'No se pudo registrar el aporte');
    }

    this.setBalance(card.financialId, res.data.balance);
    this.pushMovement(
      card,
      'Debito',
      amount,
      `Aporte a meta: ${opts.goalName ?? opts.goalId}`,
    );
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
    if (n.includes('amÃ©rica') || n.includes('america') || n.includes('bac')) {
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
