import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Topbar } from '../shell/topbar';
import { ApiService, FinancialAccount, Transaction } from '../../service/api.service';
import { DemoDataService } from '../../service/demo-data.service';
import { LiveMarketService } from '../../service/live-market.service';
import { SessionService } from '../../service/session.service';

interface Movement {
  title: string;
  date: string;
  origin: string;
  kind: 'Debito' | 'Credito';
  amount: string;
  sign: '-' | '+';
}

@Component({
  imports: [RouterLink, Topbar],
  selector: 'app-wallet',
  styleUrl: './wallet.css',
  templateUrl: './wallet.html',
})
export class Wallet implements OnInit, OnDestroy {
  readonly biLogo = 'assets/images/bank-bi.png';
  readonly chipUrl = 'assets/images/card-chip.png';
  readonly visaUrl = 'assets/images/visa.png';
  readonly contactlessUrl = 'assets/icons/contactless.png';
  readonly quickIcons = {
    transfer: 'assets/icons/quick-transfer.png',
    request: 'assets/icons/quick-request.png',
    pay: 'assets/icons/quick-pay.png',
    add: 'assets/icons/quick-add.png',
  };

  holder = 'BRAYAN OSWALDO COMPA FUENTES';
  cardType = 'CLASICA';
  last4 = '6904';
  balance = '67';
  balanceDecimals = '95';

  income = '100.00';
  expense = '35.00';
  source: 'api' | 'demo' = 'demo';
  lastUpdate = 'just now';

  movements: Movement[] = [];
  accounts: FinancialAccount[] = [];

  private unsub: (() => void) | null = null;

  constructor(
    private readonly api: ApiService,
    private readonly demo: DemoDataService,
    readonly market: LiveMarketService,
    private readonly session: SessionService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.holder = this.session.currentUser.name || this.holder;

    const [acc, tx] = await Promise.all([
      this.api.accounts(this.session.idUser),
      this.api.transactions(this.session.idUser),
    ]);

    const accounts = acc.ok && acc.data.length ? acc.data : this.demo.accounts;
    const transactions = tx.ok && tx.data.length ? tx.data : this.demo.transactions;
    this.source = acc.ok && acc.data.length ? 'api' : 'demo';

    this.accounts = accounts;
    this.applyBalance(accounts);
    this.applyMovements(transactions);
    this.applyMiniStats(transactions);

    this.unsub = this.market.subscribe(() => this.tick());
  }

  ngOnDestroy(): void {
    this.unsub?.();
  }

  private tick(): void {
    this.lastUpdate = 'just now';
    // el saldo de la tarjeta acompana la serie en vivo del dashboard
    const live = this.market.formatMoney(this.market.totalBalance);
    this.balance = live.integer;
    this.balanceDecimals = live.decimals;
  }

  private applyBalance(accounts: FinancialAccount[]): void {
    const total = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);
    const f = this.market.formatMoney(total || 67.95);
    this.balance = f.integer;
    this.balanceDecimals = f.decimals;
    if (accounts[0]) {
      this.last4 = String(accounts[0].id_financial).padStart(4, '0').slice(-4);
    }
  }

  private applyMovements(list: Transaction[]): void {
    this.movements = list.slice(0, 8).map((t, i) => {
      const credit = t.type_transacion === 'Ingreso';
      const d = new Date(Date.now() - i * 86400000);
      const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
      return {
        title: (t.description ?? 'MOVIMIENTO').split('|')[0].trim().toUpperCase(),
        date,
        origin: `ID #${t.id_transaction}`,
        kind: credit ? 'Credito' : 'Debito',
        amount: Number(t.amount).toFixed(2),
        sign: credit ? '+' : '-',
      };
    });
  }

  private applyMiniStats(list: Transaction[]): void {
    const income = list
      .filter((t) => t.type_transacion === 'Ingreso')
      .reduce((s, t) => s + Number(t.amount), 0);
    const expense = list
      .filter((t) => t.type_transacion === 'Gasto')
      .reduce((s, t) => s + Number(t.amount), 0);
    this.income = (income || 100).toFixed(2);
    this.expense = (expense || 35).toFixed(2);
  }

  transfer(): void {
    console.log('transfer');
  }

  pay(): void {
    console.log('pay');
  }

  addCard(): void {
    void this.api.createAccount({
      account_name: 'Nueva cuenta',
      balance: 0,
      id_user: this.session.idUser,
    });
    console.log('add card');
  }
}
