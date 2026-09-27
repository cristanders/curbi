import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID, computed, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Topbar } from '../shell/topbar';
import {
  ApiService,
  BudgetProgress,
  Category,
  DashboardPayload,
  ExpenditureAttempt,
  FinancialAccount,
  Transaction,
} from '../../service/api.service';
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
  imports: [Topbar, FormsModule],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit, OnDestroy {
  readonly brandUrl = 'assets/icons/curbi-logo.png';
  readonly walletTitleIcon = 'assets/icons/wallet-title.svg';
  readonly savingsIcon = 'assets/icons/savings-star.svg';
  readonly txDefaultIcon = 'assets/icons/icon-transaction.svg';

  readonly user = signal('');
  readonly bankCode = signal('');
  readonly lastUpdate = signal('just now');

  readonly source = signal<'api' | 'demo'>('demo');
  readonly loading = signal(true);

  readonly transactions = computed<TxView[]>(() => this.buildTransactions());

  /* ----- selector de banco para las gráficas ----- */
  readonly selectedBankId = signal('all');

  /* ----- tutorial de primera vez ----- */
  readonly tourOpen = signal(false);
  readonly tourStep = signal(0);
  readonly tourSteps = [0, 1, 2, 3, 4];

  /* ----- control de gastos: presupuestos y freno de compras ----- */
  readonly budgets = signal<BudgetProgress[]>([]);
  readonly attempts = signal<ExpenditureAttempt[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly spendAccounts = signal<FinancialAccount[]>([]);
  readonly budgetSaving = signal(false);
  readonly attemptSaving = signal(false);
  readonly budgetError = signal('');
  readonly attemptError = signal('');
  /** Decision del ultimo intento: 'Aprobado' | 'Frenado' | null. */
  readonly lastDecision = signal<'Aprobado' | 'Frenado' | null>(null);
  readonly lastReason = signal('');

  budgetForm: { amount: string; id_category: number } = { amount: '', id_category: 1 };
  attemptForm: { product_name: string; estimated_amount: string; id_category: number; id_financial: number } = {
    product_name: '',
    estimated_amount: '',
    id_category: 1,
    id_financial: 0,
  };

  /** "2026-09": el mes que Budget.period_month espera. */
  readonly period = new Date().toISOString().slice(0, 7);

  private readonly data = signal<DashboardPayload | null>(null);
  private busy = false;
  private lastCardSignature = '';
  private lastSpendingSignature = '';
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
    return this.market.banks();
  }

  get selectedBank() {
    return this.banks.find((b) => b.monogramClass === this.selectedBankId()) ?? null;
  }

  get visibleBanks() {
    const id = this.selectedBankId();
    return id === 'all' ? this.banks : this.banks.filter((b) => b.monogramClass === id);
  }

  selectBank(id: string): void {
    this.selectedBankId.set(id);
  }

  closeTour(): void {
    this.tourOpen.set(false);
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
    if (this.tourStep() >= this.tourSteps.length - 1) {
      this.closeTour();
      return;
    }
    this.tourStep.update((step) => step + 1);
  }

  private maybeOpenTour(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      if (!localStorage.getItem(this.tourDoneKey)) {
        this.tourOpen.set(true);
      }
    } catch {
      /* sin persistencia: abrir igual */
    }
  }

  readonly summary = computed<DashboardPayload['summary']>(
    () => this.data()?.summary ?? this.walletSummary(),
  );

  private readonly balanceMoney = computed(() =>
    this.market.formatMoney(this.summary().totalBalance),
  );
  readonly balance = computed(() => this.balanceMoney().integer);
  readonly balanceDecimals = computed(() => this.balanceMoney().decimals);

  private readonly savingsMoney = computed(() => this.market.formatMoney(this.summary().totalSaved));
  readonly savings = computed(() => this.savingsMoney().integer);
  readonly savingsDecimals = computed(() => this.savingsMoney().decimals);

  get totalBalance() {
    return this.summary().totalBalance;
  }

  get totalChange(): number {
    return 0;
  }

  get spendNow() {
    return this.summary().expense;
  }

  get spendChange(): number {
    return 0;
  }

  get status() {
    return this.market.status();
  }

  get totalPoints() {
    return this.market.totalPoints();
  }

  get spendPoints() {
    return this.market.spendPoints();
  }

  get totalArea() {
    return this.market.toArea(this.market.totalPoints(), 640, 200, 10);
  }

  get totalLine() {
    return this.market.toPoints(this.market.totalPoints(), 640, 200, 10);
  }

  get spendArea() {
    return this.market.toArea(this.market.spendPoints(), 300, 120, 8);
  }

  get spendLine() {
    return this.market.toPoints(this.market.spendPoints(), 300, 120, 8);
  }

  /** Cuando no hay backend, el dashboard refleja las tarjetas/movimientos locales. */
  private walletSummary(): DashboardPayload['summary'] {
    return {
      totalBalance: this.store.totalBalance(),
      totalSaved: 0,
      income: this.store.income(),
      expense: this.store.expense(),
      net: this.store.income() - this.store.expense(),
      accountCount: this.store.allCards().length,
      transactionCount: this.store.allMovements().length,
      goalCount: 0,
    };
  }

  get sourceLabel(): string {
    return this.source() === 'api' ? 'Backend conectado' : 'Sin conexión al backend';
  }

  async ngOnInit(): Promise<void> {
    this.user.set(this.session.currentUser.name || '');

    this.loading.set(true);
    this.maybeOpenTour();
    await this.refresh();
    this.loading.set(false);

    this.unsubMarket = this.market.subscribe(() => {
      this.lastUpdate.set('just now');
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

      // Las series del mercado se re-siembran solo cuando cambian las tarjetas.
      // Si se re-siembraran en cada sondeo el feed reiniciaria cada 4s y la
      // grafica nunca avanzaria.
      const signature = this.cardSignature();
      if (signature !== this.lastCardSignature) {
        this.lastCardSignature = signature;
        this.market.setBanksFromWallet(
          this.store.allCards().map((c) => this.walletToBankInput(c)),
        );
      }

      const { data } = await this.api.dashboard(this.session.idUser);
      this.data.set(data);
      this.source.set(data ? 'api' : 'demo');
      this.lastUpdate.set('just now');
      this.market.syncSpend(this.spendSources());
      await this.loadSpending();
    } finally {
      this.busy = false;
    }
  }

  /**
   * Presupuestos, intentos y categorias. Van aparte del `dashboard` porque el
   * sondeo corre cada 4s y recargar la lista de intentos en cada pasada haria
   * parpadear la pantalla; con esta firma solo se recarga si algo cambio.
   */
  private async loadSpending(): Promise<void> {
    const signature = this.spendingSignature();
    if (signature === this.lastSpendingSignature) {
      return;
    }
    this.lastSpendingSignature = signature;
    const [budgets, attempts, cats, accs] = await Promise.all([
      this.api.budgets(this.session.idUser, this.period),
      this.api.expenditures(this.session.idUser),
      this.api.categories(),
      this.api.accounts(this.session.idUser),
    ]);
    this.budgets.set(budgets.data ?? []);
    this.attempts.set(attempts.data ?? []);
    this.categories.set(cats.data ?? []);
    this.spendAccounts.set(accs.data ?? []);
    if (!this.attemptForm.id_financial && this.spendAccounts().length > 0) {
      this.attemptForm.id_financial = this.spendAccounts()[0].id_financial;
    }
  }

  /** Lo unico que, si cambia, justifica volver a pedir la seccion de gastos. */
  private spendingSignature(): string {
    const saldo = this.spendAccounts()
      .map((a) => `${a.id_financial}:${a.balance}`)
      .join(',');
    const ultimo = this.attempts()[0];
    return [
      this.period,
      this.budgets().map((b) => `${b.id_budget}:${b.amount}:${b.spent}`).join(','),
      ultimo ? `${ultimo.id_expediture}:${ultimo.status}` : 'sin-intentos',
      saldo,
    ].join('|');
  }

  /** Crea o actualiza el limite de la categoria elegida para el mes actual. */
  async saveBudget(): Promise<void> {
    if (this.budgetSaving()) {
      return;
    }
    const amount = Number(this.budgetForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      this.budgetError.set('El límite debe ser mayor a 0');
      return;
    }
    this.budgetSaving.set(true);
    this.budgetError.set('');
    const { ok, error } = await this.api.createBudget({
      amount,
      id_category: this.budgetForm.id_category,
      period_month: this.period,
      id_user: this.session.idUser,
    });
    this.budgetSaving.set(false);
    if (!ok) {
      this.budgetError.set(error?.message ?? 'No se pudo guardar el presupuesto');
      return;
    }
    this.budgetForm = { amount: '', id_category: this.budgetForm.id_category };
    this.lastSpendingSignature = '';
    await this.loadSpending();
  }

  async removeBudget(budget: BudgetProgress): Promise<void> {
    const { ok, error } = await this.api.deleteBudget(budget.id_budget, this.session.idUser);
    if (!ok) {
      this.budgetError.set(error?.message ?? 'No se pudo quitar el presupuesto');
      return;
    }
    this.budgetError.set('');
    this.lastSpendingSignature = '';
    await this.loadSpending();
  }

  /**
   * Pide un gasto. El frenado no es un error: si el backend lo frena, se muestra el
   * motivo y no se toca ningun saldo. Un 4xx real si no hay saldo o el monto no
   * sirve, que si va al mensaje de error.
   */
  async requestPurchase(): Promise<void> {
    if (this.attemptSaving()) {
      return;
    }
    const monto = Number(this.attemptForm.estimated_amount);
    if (!this.attemptForm.product_name.trim()) {
      this.attemptError.set('Escribe qué quieres comprar');
      return;
    }
    if (!Number.isFinite(monto) || monto <= 0) {
      this.attemptError.set('El monto debe ser mayor a 0');
      return;
    }
    if (!this.attemptForm.id_financial) {
      this.attemptError.set('Elige la cuenta que pagaría');
      return;
    }

    this.attemptSaving.set(true);
    this.attemptError.set('');
    this.lastDecision.set(null);
    this.lastReason.set('');

    const { ok, error, data } = await this.api.createExpenditureAttempt({
      product_name: this.attemptForm.product_name.trim(),
      estimated_amount: monto,
      id_user: this.session.idUser,
      id_category: this.attemptForm.id_category,
      id_financial: this.attemptForm.id_financial,
    });
    this.attemptSaving.set(false);

    if (!ok) {
      this.attemptError.set(error?.message ?? 'No se pudo registrar la compra');
      return;
    }
    // El backend siempre decide (Aprobado o Frenado). Si llegara 'Pendiente' no
    // hay decision que mostrar, asi que se limpia en vez de inventar un veredicto.
    const status = data?.status;
    this.lastDecision.set(status === 'Frenado' || status === 'Aprobado' ? status : null);
    this.lastReason.set(data?.reason ?? '');
    this.attemptForm = { ...this.attemptForm, product_name: '', estimated_amount: '' };
    this.lastSpendingSignature = '';
    await this.loadSpending();
    // El gasto aprobado movio una cuenta: el resto de la pantalla esta obsoleto.
    this.bus.emit();
  }

  /** Identidad de las tarjetas (id + saldo) que alimenta las graficas. */
  private cardSignature(): string {
    return this.store
      .allCards()
      .map((c) => `${c.id}:${c.balance}`)
      .join('|');
  }

  private spendSources(): SpendSource[] {
    const apiRows: SpendSource[] = (this.data()?.transactions ?? []).map((t) => ({
      amount: Number(t.amount) || 0,
      type_transacion: t.type_transacion === 'Ingreso' ? 'Ingreso' : 'Gasto',
    }));
    const walletRows: SpendSource[] = this.store.allMovements().map((m) => ({
      amount: Number(m.amount) || 0,
      type_transacion: m.kind === 'Credito' ? 'Ingreso' : 'Gasto',
    }));
    return [...apiRows, ...walletRows];
  }

  private buildTransactions(): TxView[] {
    const icons: Record<number, string> = {
      1: 'assets/images/tx-efootball.png',
      2: 'assets/images/tx-monoposto.png',
    };

    const apiList = (this.data()?.transactions ?? []).slice(0, 3).map((t, index) => {
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

    const walletList = this.store.allMovements().slice(0, 3).map((m) => this.walletToView(m));

    return [...apiList, ...walletList].slice(0, 6);
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