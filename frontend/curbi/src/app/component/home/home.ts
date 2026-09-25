import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { Topbar } from '../shell/topbar';
import { ApiService, DashboardPayload, Transaction } from '../../service/api.service';
import { LiveMarketService, WalletCardInput } from '../../service/live-market.service';
import { SessionService } from '../../service/session.service';
import { WalletCardService, WalletCard, WalletMovement } from '../../service/wallet-card.service';
import { RefreshBusService } from '../../service/refresh-bus.service';
import { bankById } from '../../service/bank-catalog';

interface TxView {
  when: string;
  title: string;
  detail: string;
  amount: string;
  icon: string;
}

interface SpendSource {
  amount: number;
  type_transacion?: 'Ingreso' | 'Gasto';
}

const EMPTY_SUMMARY: DashboardPayload['summary'] = {
  totalBalance: 0,
  totalSaved: 0,
  income: 0,
  expense: 0,
  net: 0,
  accountCount: 0,
  transactionCount: 0,
  goalCount: 0,
};

/** Cada cuánto se vuelve a consultar el dashboard en busca de cambios externos. */
const POLL_MS = 4000;

@Component({
  imports: [Topbar],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit, OnDestroy {
  readonly brandUrl = 'assets/icons/curbi-logo.png';
  readonly walletTitleIcon = 'assets/icons/wallet-title.svg';
  readonly savingsIcon = 'assets/icons/savings-star.svg';
  readonly txDefaultIcon = 'assets/icons/icon-transaction.svg';

  user = '';
  bankCode = '';
  balance = '0';
  balanceDecimals = '00';
  savings = '0';
  savingsDecimals = '00';
  lastUpdate = 'just now';

  source: 'api' | 'demo' = 'demo';
  loading = true;

  transactions: TxView[] = [];

  /* ----- selector de banco para las gráficas ----- */
  selectedBankId = 'all';

  /* ----- tutorial de primera vez ----- */
  tourOpen = false;
  tourStep = 0;
  readonly tourSteps = [0, 1, 2, 3, 4];

  private data: DashboardPayload | null = null;
  private busy = false;
  private unsubMarket: (() => void) | null = null;
  private busSub: Subscription | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly api: ApiService,
    readonly market: LiveMarketService,
    private readonly session: SessionService,
    readonly store: WalletCardService,
    private readonly bus: RefreshBusService,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  get banks() {
    return this.market.banks;
  }

  get selectedBank() {
    return this.banks.find((b) => b.monogramClass === this.selectedBankId) ?? null;
  }

  get visibleBanks() {
    return this.selectedBankId === 'all'
      ? this.banks
      : this.banks.filter((b) => b.monogramClass === this.selectedBankId);
  }

  selectBank(id: string): void {
    this.selectedBankId = id;
  }

  closeTour(): void {
    this.tourOpen = false;
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem('curbi.tour.done');
        localStorage.setItem(this.tourDoneKey, '1');
      } catch {
        /* sin persistencia: no crítico */
      }
    }
  }

  private get tourDoneKey(): string {
    const u = this.session.currentUser;
    const namespace =
      u?.id_user && u?.username ? `${u.id_user}.${encodeURIComponent(u.username)}` : String(u?.id_user || 0);
    return `curbi.tour.done.${namespace}`;
  }

  nextTour(): void {
    if (this.tourStep >= this.tourSteps.length - 1) {
      this.closeTour();
      return;
    }
    this.tourStep++;
  }

  private maybeOpenTour(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      if (!localStorage.getItem(this.tourDoneKey)) {
        this.tourOpen = true;
      }
    } catch {
      /* sin persistencia: abrir igual */
    }
  }

  get totalBalance() {
    return this.summary.totalBalance;
  }

  get totalChange(): number {
    return 0;
  }

  get spendNow() {
    return this.summary.expense;
  }

  get spendChange(): number {
    return 0;
  }

  get status() {
    return this.market.status;
  }

  get totalPoints() {
    return this.market.totalPoints;
  }

  get spendPoints() {
    return this.market.spendPoints;
  }

  get totalArea() {
    return this.market.toArea(this.market.totalPoints, 640, 200, 10);
  }

  get totalLine() {
    return this.market.toPoints(this.market.totalPoints, 640, 200, 10);
  }

  get spendArea() {
    return this.market.toArea(this.market.spendPoints, 300, 120, 8);
  }

  get spendLine() {
    return this.market.toPoints(this.market.spendPoints, 300, 120, 8);
  }

  get summary(): DashboardPayload['summary'] {
    return this.data?.summary ?? this.walletSummary();
  }

  /** Cuando no hay backend, el dashboard refleja las tarjetas/movimientos locales. */
  private walletSummary(): DashboardPayload['summary'] {
    return {
      totalBalance: this.store.totalBalance,
      totalSaved: 0,
      income: this.store.income,
      expense: this.store.expense,
      net: this.store.income - this.store.expense,
      accountCount: this.store.allCards.length,
      transactionCount: this.store.allMovements.length,
      goalCount: 0,
    };
  }

  get sourceLabel(): string {
    return this.source === 'api' ? 'Backend conectado' : 'Sin conexión al backend';
  }

  async ngOnInit(): Promise<void> {
    this.user = this.session.currentUser.name || '';

    console.log('HOME-DEBUG init ' + JSON.stringify({
      hasBus: !!this.bus,
      busType: typeof this.bus,
      hasChanges: !!(this.bus as any)?.changes$,
      hasSubscribe: typeof (this.bus as any)?.changes$?.subscribe,
      busCtor: (this.bus as any)?.constructor?.name ?? null,
      busIdsWarningOk: true,
    }));

    this.loading = true;
    this.maybeOpenTour();
    await this.refresh();
    this.loading = false;

    this.unsubMarket = this.market.subscribe(() => {
      this.lastUpdate = 'just now';
      this.applySummary();
    });

    this.busSub = this.bus.changes$.subscribe(() => void this.refresh());

    this.pollTimer = setInterval(() => void this.refresh(), POLL_MS);
  }

  ngOnDestroy(): void {
    this.unsubMarket?.();
    this.busSub?.unsubscribe();
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
    }
  }

  /** Recarga el dashboard (backend + tarjetas/movimientos locales). */
  async refresh(): Promise<void> {
    if (this.busy) {
      return;
    }
    this.busy = true;
    try {
      await this.store.load();
      this.market.setBanksFromWallet(this.store.allCards.map((c) => this.walletToBankInput(c)));
      const { data } = await this.api.dashboard(this.session.idUser);
      this.data = data;
      if (data) {
        this.source = 'api';
      }
      this.lastUpdate = 'just now';
      this.applySummary();
      this.buildTransactions();
      this.market.syncSpend(this.spendSources());
    } finally {
      this.busy = false;
    }
  }

  private applySummary(): void {
    const s = this.summary;
    const total = this.market.formatMoney(s.totalBalance);
    this.balance = total.integer;
    this.balanceDecimals = total.decimals;

    const sav = this.market.formatMoney(s.totalSaved);
    this.savings = sav.integer;
    this.savingsDecimals = sav.decimals;
  }

  private spendSources(): SpendSource[] {
    const apiRows: SpendSource[] = (this.data?.transactions ?? []).map((t) => ({
      amount: Number(t.amount) || 0,
      type_transacion: t.type_transacion === 'Ingreso' ? 'Ingreso' : 'Gasto',
    }));
    const walletRows: SpendSource[] = this.store.allMovements.map((m) => ({
      amount: Number(m.amount) || 0,
      type_transacion: m.kind === 'Credito' ? 'Ingreso' : 'Gasto',
    }));
    return [...apiRows, ...walletRows];
  }

  private buildTransactions(): void {
    const icons: Record<number, string> = {
      1: 'assets/images/tx-efootball.png',
      2: 'assets/images/tx-monoposto.png',
    };

    const apiList = (this.data?.transactions ?? []).slice(0, 3).map((t, index) => {
      const desc = String(t.description ?? '').split('|');
      const title = (desc[0] ?? 'Transacción').trim();
      const detail = (desc[1] ?? `Categoría #${t.id_category}`).trim();
      const when = index < 2 ? 'TODAY' : 'YESTERDAY';
      return {
        when,
        title,
        detail,
        amount: `${t.type_transacion === 'Ingreso' ? '+' : '-'}Q${t.amount.toFixed(2)}`,
        icon: icons[t.id_category] ?? this.txDefaultIcon,
      };
    });

    const walletList = this.store.allMovements.slice(0, 3).map((m) => this.walletToView(m));

    this.transactions = [...apiList, ...walletList].slice(0, 6);
  }

  private walletToBankInput(c: WalletCard): WalletCardInput {
    const bank = bankById(c.bankId);
    return {
      bankId: c.bankId,
      name: bank.name,
      monogram: bank.monogram,
      logo: bank.logo ?? '',
      color: bank.color,
      balance: c.balance,
    };
  }

  private walletToView(m: WalletMovement): TxView {
    const d = new Date(m.at);
    const today = new Date();
    const days = Math.round((today.getTime() - d.getTime()) / 86400000);
    const when = days <= 0 ? 'TODAY' : days <= 1 ? 'YESTERDAY' : 'THIS WEEK';
    return {
      when,
      title: m.title,
      detail: `${m.origin} · ${m.kind}`,
      amount: `${m.sign}Q${Number(m.amount).toFixed(2)}`,
      icon: this.txDefaultIcon,
    };
  }

  bankLine(bank: { points: number[] }): string {
    return this.market.toPoints(bank.points, 240, 80, 6);
  }

  bankArea(bank: { points: number[] }): string {
    return this.market.toArea(bank.points, 240, 80, 6);
  }

  money(value: number): string {
    return value.toFixed(2);
  }
}