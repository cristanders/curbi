import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiService, FinancialAccount, Transaction } from './api.service';
import { SessionService } from './session.service';
import { bankById, CardKind } from './bank-catalog';

export interface WalletCard {
  id: string;
  bankId: string;
  holder: string;
  last4: string;
  type: CardKind;
  balance: number;
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
  private cards: WalletCard[] = [];
  private activeCardId: string | null = null;
  private movements: WalletMovement[] = [];

  private readonly platformId = inject(PLATFORM_ID);

  constructor(
    private readonly api: ApiService,
    private readonly session: SessionService,
  ) {}

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private get storageKey(): string {
    const u = this.session.currentUser;
    const namespace = u?.id_user && u?.username ? `${u.id_user}.${encodeURIComponent(u.username)}` : String(u?.id_user || 0);
    return `curbi.wallet.v2.${namespace}`;
  }

  /** Lista las tarjetas, intentando completar con las cuentas del backend. */
  async load(): Promise<void> {
    this.loadLocal();

    if (this.cards.length === 0) {
      const acc = await this.api.accounts(this.session.idUser);
      for (const a of acc.data ?? []) {
        this.cards.push({
          id: `acc-${a.id_financial}`,
          bankId: this.bankIdFromName(a.account_name),
          holder: this.session.currentUser?.name || '',
          last4: this.last4FromId(a.id_financial),
          type: 'Debito',
          balance: Number(a.balance ?? 0),
        });
      }
      if (this.cards.length > 0) {
        this.activeCardId ||= this.cards[0].id;
      }
      this.saveLocal();
    }

    if (this.movements.length === 0) {
      const tx = await this.api.transactions(this.session.idUser);
      for (const t of tx.data ?? []) {
        const credit = t.type_transacion === 'Ingreso';
        const d = new Date(t.id_transaction ? Date.now() - t.id_transaction * 3600000 : Date.now());
        this.movements.push({
          id: `tx-${t.id_transaction}`,
          title: (t.description ?? 'MOVIMIENTO').split('|')[0].trim().toUpperCase(),
          date: this.shortDate(d),
          origin: `ID #${t.id_transaction}`,
          kind: credit ? 'Credito' : 'Debito',
          amount: Number(t.amount).toFixed(2),
          sign: credit ? '+' : '-',
          at: d.getTime(),
          syncedToApi: true,
        });
      }
      this.movements.sort((a, b) => b.at - a.at);
      this.saveLocal();
    }
  }

  private loadLocal(): void {
    this.cards = [];
    this.activeCardId = null;
    this.movements = [];
    if (!this.isBrowser) {
      return;
    }
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as WalletStore;
        this.cards = parsed.cards ?? [];
        this.activeCardId = parsed.activeCardId ?? null;
        this.movements = parsed.movements ?? [];
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
        cards: this.cards,
        activeCardId: this.activeCardId,
        movements: this.movements.slice(0, 30),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(store));
    } catch {
      /* sin persistencia: no crítico */
    }
  }

  get allCards(): WalletCard[] {
    return this.cards;
  }

  get totalBalance(): number {
    return this.cards.reduce((s, c) => s + c.balance, 0);
  }

  get income(): number {
    return this.movements
      .filter((m) => m.kind === 'Credito')
      .reduce((s, m) => s + Number(m.amount), 0);
  }

  get expense(): number {
    return this.movements
      .filter((m) => m.kind === 'Debito')
      .reduce((s, m) => s + Number(m.amount), 0);
  }

  get activeCard(): WalletCard | null {
    return this.cards.find((c) => c.id === this.activeCardId) ?? this.cards[0] ?? null;
  }

  get allMovements(): WalletMovement[] {
    return this.movements.slice(0, 8);
  }

  setActive(id: string): void {
    if (this.cards.some((c) => c.id === id)) {
      this.activeCardId = id;
      this.saveLocal();
    }
  }

  async addCard(bankId: string, kind: CardKind): Promise<WalletCard> {
    const bank = bankById(bankId);
    const card: WalletCard = {
      id: `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      bankId,
      holder: this.session.currentUser?.name || '',
      last4: this.random4(),
      type: kind,
      balance: 0,
    };
    this.cards.unshift(card);
    this.activeCardId = card.id;
    this.saveLocal();

    void this.api.createAccount({
      account_name: `${bank.name} ${kind} ···· ${card.last4}`,
      balance: 0,
      id_user: this.session.idUser,
    });
    return card;
  }

  async removeCard(id: string): Promise<void> {
    const index = this.cards.findIndex((c) => c.id === id);
    if (index < 0) {
      return;
    }
    this.cards.splice(index, 1);
    if (this.activeCardId === id) {
      this.activeCardId = this.cards[0]?.id ?? null;
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
    const card = this.cards.find((c) => c.id === opts.cardId) ?? this.activeCard;
    const amount = Number(opts.amount) || 0;
    if (!card || amount <= 0) {
      return;
    }

    const credit = opts.kind === 'Credito';
    card.balance = credit ? card.balance + amount : card.balance - amount;

    const now = new Date();
    this.movements.unshift({
      id: `mv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title: opts.title.toUpperCase(),
      date: this.shortDate(now),
      origin: `${card.last4}`,
      kind: opts.kind,
      amount: amount.toFixed(2),
      sign: credit ? '+' : '-',
      at: now.getTime(),
    });
    this.saveLocal();

    void this.api.createTransaction({
      amount,
      type_transacion: credit ? 'Ingreso' : 'Gasto',
      description: opts.title,
      id_user: this.session.idUser,
      id_category: 1,
    });
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

  private random4(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  private shortDate(d: Date): string {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
  }
}

export type { FinancialAccount, Transaction };