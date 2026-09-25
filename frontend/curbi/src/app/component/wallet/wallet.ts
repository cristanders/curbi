import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Topbar } from '../shell/topbar';
import { LiveMarketService } from '../../service/live-market.service';
import { SessionService } from '../../service/session.service';
import { WalletCardService, WalletCard, WalletMovement } from '../../service/wallet-card.service';
import { GUATEMALAN_BANKS, bankById, CardKind } from '../../service/bank-catalog';
import { RefreshBusService } from '../../service/refresh-bus.service';

type TxKind = 'transfer' | 'request' | 'pay';

@Component({
  imports: [FormsModule, RouterLink, Topbar],
  selector: 'app-wallet',
  styleUrl: './wallet.css',
  templateUrl: './wallet.html',
})
export class Wallet implements OnInit {
  readonly chipUrl = 'assets/images/card-chip.png';
  readonly visaUrl = 'assets/images/visa.png';
  readonly contactlessUrl = 'assets/icons/contactless.svg';
  readonly banks = GUATEMALAN_BANKS;
  readonly bankById = bankById;
  readonly quickIcons = {
    transfer: 'assets/icons/quick-transfer.svg',
    request: 'assets/icons/quick-request.svg',
    pay: 'assets/icons/quick-pay.svg',
    add: 'assets/icons/quick-add.svg',
  };

  holder = '';
  source: 'api' | 'demo' = 'demo';
  lastUpdate = 'just now';

  card: WalletCard | null = null;
  movements: WalletMovement[] = [];

  income = '0.00';
  expense = '0.00';

  /* ----- modal agregar tarjeta ----- */
  addOpen = false;
  addStep: 'bank' | 'kind' = 'bank';
  selectedBankId = 'bi';
  selectedKind: CardKind = 'Debito';

  /* ----- modal transacciones ----- */
  txOpen = false;
  txKind: TxKind = 'transfer';
  txAmount = 0;
  txTitle = '';

  toast = '';

  constructor(
    readonly market: LiveMarketService,
    private readonly session: SessionService,
    readonly store: WalletCardService,
    private readonly bus: RefreshBusService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.holder = this.session.currentUser.name || '';
    console.log(
      'WALLET-DEBUG pre-load ' +
        JSON.stringify({
          idUser: this.session.idUser,
          cards: this.store.allCards,
        }),
    );
    await this.store.load();
    console.log(
      'WALLET-DEBUG post-load ' +
        JSON.stringify({
          cards: this.store.allCards,
          active: this.store.activeCard
            ? {
                id: this.store.activeCard.id,
                last4: this.store.activeCard.last4,
                balance: this.store.activeCard.balance,
              }
            : null,
        }),
    );
    this.applyState();
  }

  private applyState(): void {
    this.card = this.store.activeCard;
    this.movements = this.store.allMovements;
    this.applyMiniStats();
  }

  private applyMiniStats(): void {
    const rows = this.store.allMovements;
    const income = rows
      .filter((m) => m.kind === 'Credito')
      .reduce((s, m) => s + Number(m.amount), 0);
    const expense = rows
      .filter((m) => m.kind === 'Debito')
      .reduce((s, m) => s + Number(m.amount), 0);
    this.income = income.toFixed(2);
    this.expense = expense.toFixed(2);
  }

  get cardBank(): ReturnType<typeof bankById> {
    return bankById(this.card?.bankId ?? 'bi');
  }

  get bankCardLogo(): string {
    return this.cardBank.logo || '';
  }

  get cardLast4(): string {
    return this.card?.last4 ?? '0000';
  }

  get cardType(): CardKind {
    return this.card?.type ?? 'Debito';
  }

  get balanceParts(): { integer: string; decimals: string } {
    return this.market.formatMoney(this.card?.balance ?? 0);
  }

  /* ---------------------- tarjetas ---------------------- */

  selectCard(id: string): void {
    this.store.setActive(id);
    this.applyState();
  }

  openAdd(): void {
    this.addStep = 'bank';
    this.selectedBankId = this.card?.bankId ?? 'bi';
    this.addOpen = true;
  }

  closeAdd(): void {
    this.addOpen = false;
  }

  chooseBank(id: string): void {
    this.selectedBankId = id;
    this.addStep = 'kind';
  }

  backToBanks(): void {
    this.addStep = 'bank';
  }

  chooseKind(kind: CardKind): void {
    this.selectedKind = kind;
  }

  async confirmAddCard(): Promise<void> {
    if (!this.selectedBankId) {
      return;
    }
    await this.store.addCard(this.selectedBankId, this.selectedKind);
    this.addOpen = false;
    this.applyState();
    this.bus.emit();
    this.showToast('Tarjeta agregada correctamente');
  }

  async removeActiveCard(): Promise<void> {
    if (!this.card) {
      return;
    }
    await this.store.removeCard(this.card.id);
    this.applyState();
    this.bus.emit();
    this.showToast('Tarjeta eliminada');
  }

  /* ---------------------- transacciones ---------------------- */

  openTx(kind: TxKind): void {
    this.txKind = kind;
    this.txAmount = 0;
    this.txTitle = '';
    this.txOpen = true;
  }

  closeTx(): void {
    this.txOpen = false;
  }

  get txTitleLabel(): string {
    switch (this.txKind) {
      case 'transfer':
        return 'Transferir dinero';
      case 'pay':
        return 'Pagar factura';
      case 'request':
        return 'Solicitar dinero';
    }
  }

  get txKindLabel(): 'Debito' | 'Credito' {
    return this.txKind === 'request' ? 'Credito' : 'Debito';
  }

  async confirmTx(): Promise<void> {
    const amount = Number(this.txAmount);
    if (!amount || amount <= 0) {
      this.showToast('Ingresa un monto válido');
      return;
    }
    const title = this.txTitle.trim() || this.defaultTitle(this.txKind);
    await this.store.addMovement({
      cardId: this.card?.id ?? '',
      kind: this.txKindLabel,
      amount,
      title,
    });
    this.txOpen = false;
    this.applyState();
    this.bus.emit();
    this.showToast(
      `${this.txKindLabel === 'Credito' ? 'Ingreso' : 'Movimiento'} registrado: Q${amount.toFixed(2)}`,
    );
  }

  private defaultTitle(kind: TxKind): string {
    switch (kind) {
      case 'transfer':
        return 'Transferencia';
      case 'pay':
        return 'Pago de factura';
      case 'request':
        return 'Solicitud de dinero';
    }
  }

  private showToast(msg: string): void {
    this.toast = msg;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toast = '';
    }, 2600) as ReturnType<typeof setTimeout>;
  }

  private toastTimer: ReturnType<typeof setTimeout> | null = null;
}
