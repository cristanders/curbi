import { Component, OnDestroy, OnInit } from '@angular/core';
import { Topbar } from '../shell/topbar';
import { ApiService, DashboardPayload, Transaction } from '../../service/api.service';
import { DemoDataService } from '../../service/demo-data.service';
import { LiveMarketService } from '../../service/live-market.service';
import { SessionService } from '../../service/session.service';

interface TxView {
  when: string;
  title: string;
  detail: string;
  amount: string;
  icon: string;
}

@Component({
  imports: [Topbar],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit, OnDestroy {
  readonly brandUrl = 'assets/icons/curbi-logo.png';
  readonly walletTitleIcon = 'assets/icons/wallet-title.png';
  readonly savingsIcon = 'assets/icons/savings-star.png';
  readonly txDefaultIcon = 'assets/icons/icon-transaction.png';

  user = 'BRAYAN CAMPA';
  bankCode = 'BANRURAL';
  balance = '67';
  balanceDecimals = '95';
  savings = '17';
  savingsDecimals = '00';
  lastUpdate = 'just now';

  source: 'api' | 'demo' = 'demo';
  loading = true;

  transactions: TxView[] = [];

  private unsub: (() => void) | null = null;

  constructor(
    private readonly api: ApiService,
    private readonly demo: DemoDataService,
    readonly market: LiveMarketService,
    private readonly session: SessionService,
  ) {}

  get banks() {
    return this.market.banks;
  }

  get totalBalance() {
    return this.market.totalBalance;
  }

  get totalChange() {
    return this.market.totalChange;
  }

  get spendNow() {
    return this.market.spendNow;
  }

  get spendChange() {
    return this.market.spendChange;
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

  get summary() {
    return this.data?.summary ?? this.demo.dashboard().summary;
  }

  get sourceLabel(): string {
    return this.source === 'api' ? 'Datos del backend' : 'Datos de demostración';
  }

  private data: DashboardPayload | null = null;

  async ngOnInit(): Promise<void> {
    this.user = this.session.currentUser.name || this.user;

    const { data, ok } = await this.api.dashboard(this.session.idUser);
    this.data = data ?? this.demo.dashboard();
    this.source = ok && data ? 'api' : 'demo';
    this.loading = false;

    this.applySummary();
    this.mapTransactions(this.data!.transactions);

    this.unsub = this.market.subscribe(() => {
      this.lastUpdate = 'just now';
      this.applyTotals();
    });
  }

  ngOnDestroy(): void {
    this.unsub?.();
  }

  private applySummary(): void {
    const s = this.data!.summary;
    const total = this.market.formatMoney(s.totalBalance || this.market.totalBalance);
    this.balance = total.integer;
    this.balanceDecimals = total.decimals;

    const sav = this.market.formatMoney(s.totalSaved || 17);
    this.savings = sav.integer;
    this.savingsDecimals = sav.decimals;
  }

  private applyTotals(): void {
    const total = this.market.formatMoney(this.market.totalBalance);
    this.balance = total.integer;
    this.balanceDecimals = total.decimals;
  }

  private mapTransactions(list: Transaction[]): void {
    const icons: Record<number, string> = {
      1: 'assets/images/tx-efootball.png',
      2: 'assets/images/tx-monoposto.png',
    };

    this.transactions = list.slice(0, 6).map((t, index) => {
      const desc = String(t.description ?? '').split('|');
      const title = (desc[0] ?? 'Transacción').trim();
      const detail = (desc[1] ?? `Categoría #${t.id_category}`).trim();
      const when = index < 2 ? 'TODAY' : index < 4 ? 'YESTERDAY' : 'THIS WEEK';
      return {
        when,
        title,
        detail,
        amount: `${t.type_transacion === 'Ingreso' ? '+' : '-'}Q${t.amount.toFixed(2)}`,
        icon: icons[t.id_category] ?? this.txDefaultIcon,
      };
    });
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
