import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Topbar } from '../shell/topbar';
import { LiveMarketService } from '../../service/live-market.service';
import { SessionService } from '../../service/session.service';
import { WalletCardService, WalletCard, WalletMovement } from '../../service/wallet-card.service';
import {
  cardNetworkLabel,
  cardNetworkLogo,
  detectCardBrand,
  formatCardExpiry,
  formatCardNumber,
  GUATEMALAN_BANKS,
  bankById,
  CardBrand,
  CardKind,
  digitsOnly,
  last4Of,
  luhnValid,
} from '../../service/bank-catalog';
import { BankAccount, ApiBusinessError } from '../../service/api.service';
import { RefreshBusService } from '../../service/refresh-bus.service';
import { SERVICE_PROVIDERS, ServiceProvider } from '../../service/service-catalog';

type TxKind = 'transfer' | 'request' | 'pay';
type AddStep = 'bank' | 'kind' | 'data';

@Component({
  imports: [FormsModule, RouterLink, Topbar],
  selector: 'app-wallet',
  styleUrl: './wallet.css',
  templateUrl: './wallet.html',
})
export class Wallet implements OnInit, OnDestroy {
  readonly chipUrl = 'assets/images/card-chip.png';
  readonly contactlessUrl = 'assets/icons/contactless.svg';
  readonly banks = GUATEMALAN_BANKS;
  readonly bankById = bankById;
  readonly services = SERVICE_PROVIDERS;
  readonly quickIcons = {
    transfer: 'assets/icons/quick-transfer.svg',
    request: 'assets/icons/quick-request.svg',
    pay: 'assets/icons/quick-pay.svg',
    add: 'assets/icons/quick-add.svg',
  };

  holder = '';

  /** Estado de sincronizacion con el backend, para el subtitulo de la pagina. */
  readonly source = signal<'api' | 'demo'>('demo');
  readonly lastUpdate = signal('just now');

  private readonly storeRef = inject(WalletCardService);
  readonly store = this.storeRef;
  readonly card = this.storeRef.activeCard;
  readonly movements = this.storeRef.allMovements;
  readonly income = computed(() => this.sumByKind('Credito').toFixed(2));
  readonly expense = computed(() => this.sumByKind('Debito').toFixed(2));

  /* ----- modal agregar tarjeta ----- */
  readonly addOpen = signal(false);
  addStep: AddStep = 'bank';
  selectedBankId = 'bi';
  selectedKind: CardKind = 'Debito';
  cardNumber = '';
  cardHolder = '';
  cardExpiry = '';
  cardCvv = '';
  readonly addError = signal('');

  /* ----- modal transacciones ----- */
  readonly txOpen = signal(false);
  txKind: TxKind = 'transfer';
  txAmount = 0;
  txTitle = '';
  txAccountNumber = '';
  readonly txAccount = signal<BankAccount | null>(null);
  readonly txAccountError = signal('');
  readonly txBusy = signal(false);

  /* ----- pago de facturas: entidad y referencia ----- */
  txProvider: ServiceProvider | null = null;
  txReference = '';

  /* ----- pedir cupo a la tarjeta de credito ----- */
  readonly creditOpen = signal(false);
  creditAmount = 0;
  creditBusy = signal(false);
  creditError = signal('');
  /** Cuenta de la que sale el dinero, segun lo que reporta el backend. */
  readonly available = signal(0);
  readonly isCredit = signal(false);
  /** Solicitud en espera de la banca, con los segundos que faltan. */
  readonly creditPending = signal<{ amount: number; segundos: number } | null>(null);
  readonly creditDone = signal(false);
  private creditTicker: ReturnType<typeof setInterval> | null = null;

  readonly toast = signal('');

  constructor(
    readonly market: LiveMarketService,
    private readonly session: SessionService,
    private readonly bus: RefreshBusService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.holder = this.session.currentUser.name || '';
    await this.store.load();
    if (this.store.allCards().length > 0) {
      this.source.set('api');
    }
    this.lastUpdate.set('just now');
  }

  ngOnDestroy(): void {
    this.stopCreditTicker();
  }

  private sumByKind(kind: 'Debito' | 'Credito'): number {
    return this.movements()
      .filter((m) => m.kind === kind)
      .reduce((s, m) => s + Number(m.amount), 0);
  }

  get cardBank(): ReturnType<typeof bankById> {
    return bankById(this.card()?.bankId ?? 'bi');
  }

  get bankCardLogo(): string {
    return this.cardBank.logo || '';
  }

  get cardLast4(): string {
    return this.card()?.last4 ?? '0000';
  }

  get cardType(): CardKind {
    return this.card()?.type ?? 'Debito';
  }

  /** Degradado con los colores del banco de la tarjeta. */
  get cardGradient(): string {
    const bank = this.cardBank;
    return `linear-gradient(145deg, ${bank.from} 0%, ${bank.to} 100%)`;
  }

  get cardBrand(): CardBrand {
    return this.card()?.brand ?? 'Desconocida';
  }

  get cardBrandLogo(): string {
    return cardNetworkLogo(this.cardBrand);
  }

  get cardBrandLabel(): string {
    return cardNetworkLabel(this.cardBrand);
  }

  /** Vigencia de la tarjeta activa. */
  get activeCardExpiry(): string {
    return this.card()?.expiry ?? '';
  }

  get balanceParts(): { integer: string; decimals: string } {
    return this.market.formatMoney(this.card()?.balance ?? 0);
  }

  /* ---------------------- tarjetas ---------------------- */

  selectCard(id: string): void {
    this.store.setActive(id);
  }

  openAdd(): void {
    this.addStep = 'bank';
    this.selectedBankId = this.card()?.bankId ?? 'bi';
    this.selectedKind = 'Debito';
    this.cardNumber = '';
    this.cardHolder = this.holder;
    this.cardExpiry = '';
    this.cardCvv = '';
    this.addError.set('');
    this.addOpen.set(true);
  }

  closeAdd(): void {
    this.addOpen.set(false);
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

  /** Manda al paso de datos del plástico. */
  nextToCardData(): void {
    this.addError.set('');
    this.addStep = 'data';
  }

  backToKinds(): void {
    this.addStep = 'kind';
  }

  onCardNumberInput(value: string): void {
    this.cardNumber = formatCardNumber(value);
  }

  onCardExpiryInput(value: string): void {
    this.cardExpiry = formatCardExpiry(value);
  }

  /** Red deducida del numero mientras se escribe. */
  get draftBrand(): CardBrand {
    return detectCardBrand(this.cardNumber);
  }

  /** Ultimos 4 del numero en captura, para la vista previa del modal. */
  get cardLast4Draft(): string {
    return last4Of(this.cardNumber) || '····';
  }

  get draftBrandLogo(): string {
    return cardNetworkLogo(this.draftBrand);
  }

  get draftBrandLabel(): string {
    return cardNetworkLabel(this.draftBrand);
  }

  get cardNumberValid(): boolean {
    return luhnValid(this.cardNumber);
  }

  /** Habilita el guardado solo con banco, tipo y datos del plástico completos. */
  get canSaveCard(): boolean {
    return (
      !!this.selectedBankId &&
      this.cardNumberValid &&
      this.cardHolder.trim().length > 2 &&
      digitsOnly(this.cardExpiry).length === 4 &&
      digitsOnly(this.cardCvv).length >= 3
    );
  }

  async confirmAddCard(): Promise<void> {
    if (!this.selectedBankId) {
      return;
    }
    if (!this.canSaveCard) {
      this.addError.set('Revisa los datos de la tarjeta: el numero, la vigencia y el cvv no son válidos.');
      return;
    }
    try {
      await this.store.addCard({
        bankId: this.selectedBankId,
        kind: this.selectedKind,
        holder: this.cardHolder,
        number: this.cardNumber,
        expiry: this.cardExpiry,
        cvv: this.cardCvv,
      });
      this.addOpen.set(false);
      this.bus.emit();
      this.showToast('Tarjeta agregada correctamente');
    } catch (error: unknown) {
      this.addError.set((error as Error)?.message || 'No se pudo agregar la tarjeta');
    }
  }

  async removeActiveCard(): Promise<void> {
    const active = this.card();
    if (!active) {
      return;
    }
    await this.store.removeCard(active.id);
    this.bus.emit();
    this.showToast('Tarjeta eliminada');
  }

  /* ---------------------- transacciones ---------------------- */

  openTx(kind: TxKind): void {
    this.txKind = kind;
    this.txAmount = 0;
    this.txTitle = '';
    this.txAccountNumber = '';
    this.txProvider = null;
    this.txReference = '';
    this.txAccount.set(null);
    this.txAccountError.set('');
    this.txOpen.set(true);
    void this.refreshAccountState();
  }

  closeTx(): void {
    this.txOpen.set(false);
    this.txAccountError.set('');
  }

  /** El backend es quien sabe cuanto hay disponible y si hay cupo en espera. */
  async refreshAccountState(): Promise<void> {
    const cardId = this.card()?.id ?? '';
    const state = await this.store.accountState(cardId);
    if (!state) {
      const card = this.card();
      this.available.set(Number(card?.balance ?? 0));
      this.isCredit.set(card?.type === 'Credito');
      return;
    }
    this.available.set(state.disponible);
    this.isCredit.set(state.card_type === 'Credito');
    if (state.pendiente) {
      this.creditPending.set({
        amount: state.pendiente.amount,
        segundos: state.pendiente.segundos_restantes,
      });
      this.startCreditTicker();
    } else if (this.creditPending() && !this.creditDone()) {
      // La espera termino: el backend ya aprobo el cupo.
      this.creditDone.set(true);
      this.creditPending.set(null);
      this.stopCreditTicker();
      this.available.set(state.disponible);
      this.showToast('Cupo aprobado, ya puedes usarlo');
    }
  }

  get availableLabel(): string {
    return `Q${Number(this.available() || 0).toFixed(2)}`;
  }

  /** Falta dinero para la operacion: se avisa en el modal. */
  get lacksFunds(): boolean {
    const amount = Number(this.txAmount) || 0;
    return amount > this.available() && this.available() >= 0;
  }

  /** Cuanto le falta al usuario para poder pagar. */
  get shortfall(): number {
    return Math.max(0, Number((Number(this.txAmount || 0) - this.available()).toFixed(2)));
  }

  get isTransfer(): boolean {
    return this.txKind === 'transfer';
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

  /** Formatea el numero de cuenta destino en bloques de 4. */
  onAccountInput(value: string): void {
    this.txAccountNumber = digitsOnly(value).slice(0, 20).replace(/(\d{4})(?=\d)/g, '$1-');
    this.txAccount.set(null);
    this.txAccountError.set('');
  }

  /** Busca la cuenta destino en el catalogo de cuentas de prueba. */
  async lookupDestination(): Promise<void> {
    this.txAccount.set(null);
    this.txAccountError.set('');
    if (!digitsOnly(this.txAccountNumber)) {
      return;
    }
    const found = await this.store.findDestination(this.txAccountNumber);
    if (!found) {
      this.txAccountError.set('La cuenta de destino no existe');
      return;
    }
    this.txAccount.set(found);
  }

  chooseProvider(provider: ServiceProvider): void {
    this.txProvider = provider;
    this.txAccountError.set('');
  }

  get isPay(): boolean {
    return this.txKind === 'pay';
  }

  /** Pagar factura exige entidad y referencia ademas del monto. */
  get payReady(): boolean {
    if (!this.txProvider) {
      return false;
    }
    return this.txReference.trim().length >= 4;
  }

  /**
   * Una transferencia exige cuenta valida y saldo; una factura, entidad y
   * referencia. En ambos casos no se puede confirmar sin dinero.
   */
  get canConfirmTx(): boolean {
    const amount = Number(this.txAmount);
    if (!amount || amount <= 0 || this.txBusy() || this.lacksFunds) {
      return false;
    }
    if (this.isTransfer) {
      return !!this.txAccount();
    }
    if (this.isPay) {
      return this.payReady;
    }
    return true;
  }

  async confirmTx(): Promise<void> {
    const amount = Number(this.txAmount);
    if (!amount || amount <= 0) {
      this.showToast('Ingresa un monto válido');
      return;
    }

    if (this.lacksFunds) {
      this.txAccountError.set(
        `Saldo insuficiente. Te faltan Q${this.shortfall.toFixed(2)}.`,
      );
      return;
    }

    if (this.isTransfer) {
      if (!this.txAccount()) {
        this.txAccountError.set('Verifica el número de cuenta de destino');
        return;
      }
      this.txBusy.set(true);
      try {
        const result = await this.store.transfer({
          cardId: this.card()?.id ?? '',
          amount,
          accountNumber: this.txAccountNumber,
          description: this.txTitle.trim(),
        });
        this.closeTx();
        this.bus.emit();
        this.showToast(
          `Transferencia enviada a ${result.destination.account_holder}: Q${amount.toFixed(2)}`,
        );
        void this.refreshAccountState();
      } catch (error: unknown) {
        this.txAccountError.set(this.errorMessage(error));
      } finally {
        this.txBusy.set(false);
      }
      return;
    }

    if (this.isPay) {
      if (!this.txProvider) {
        this.txAccountError.set('Elige la entidad a la que vas a pagar');
        return;
      }
      if (this.txReference.trim().length < 4) {
        this.txAccountError.set(
          `Ingresa ${this.txProvider.referenceLabel.toLowerCase()} para localizar la factura`,
        );
        return;
      }
      this.txBusy.set(true);
      try {
        const result = await this.store.payBill({
          cardId: this.card()?.id ?? '',
          amount,
          providerCode: this.txProvider.code,
          providerName: this.txProvider.name,
          reference: this.txReference,
        });
        this.closeTx();
        this.bus.emit();
        this.showToast(`Factura de ${result.provider_name} pagada: Q${amount.toFixed(2)}`);
        void this.refreshAccountState();
      } catch (error: unknown) {
        this.txAccountError.set(this.errorMessage(error));
      } finally {
        this.txBusy.set(false);
      }
      return;
    }

    const title = this.txTitle.trim() || this.defaultTitle(this.txKind);
    await this.store.addMovement({
      cardId: this.card()?.id ?? '',
      kind: this.txKindLabel,
      amount,
      title,
    });
    this.closeTx();
    this.bus.emit();
    this.showToast(`${this.txKindLabel === 'Credito' ? 'Ingreso' : 'Movimiento'} registrado: Q${amount.toFixed(2)}`);
  }

  private errorMessage(error: unknown): string {
    const e = error as ApiBusinessError;
    return e?.message || 'No se pudo completar la operación';
  }

  /* ---------------------- pedir cupo ---------------------- */

  openCredit(): void {
    this.creditError.set('');
    if (!this.creditPending() && !this.creditDone()) {
      // Al abrirlo se propone el monto que falta para poder pagar.
      this.creditAmount = this.shortfall > 0 ? this.shortfall : 500;
    }
    this.creditOpen.set(true);
    void this.refreshAccountState();
  }

  closeCredit(): void {
    this.creditOpen.set(false);
    this.creditError.set('');
  }

  get canRequestCredit(): boolean {
    const amount = Number(this.creditAmount) || 0;
    return amount > 0 && !this.creditBusy() && !this.creditPending() && !this.creditDone();
  }

  async confirmCredit(): Promise<void> {
    const amount = Number(this.creditAmount) || 0;
    if (amount <= 0) {
      this.creditError.set('Ingresa un monto válido');
      return;
    }
    this.creditBusy.set(true);
    this.creditError.set('');
    try {
      await this.store.requestCredit({ cardId: this.card()?.id ?? '', amount });
      this.creditDone.set(false);
      this.creditPending.set({ amount, segundos: 60 });
      this.startCreditTicker();
      this.showToast('Solicitud enviada, esperando aprobación');
    } catch (error: unknown) {
      this.creditError.set(this.errorMessage(error));
    } finally {
      this.creditBusy.set(false);
    }
  }

  /** Cuenta regresiva de la espera, y refresco del estado al terminar. */
  private startCreditTicker(): void {
    this.stopCreditTicker();
    this.creditTicker = setInterval(() => {
      const pending = this.creditPending();
      if (!pending) {
        this.stopCreditTicker();
        return;
      }
      const restantes = pending.segundos - 1;
      if (restantes <= 0) {
        this.creditPending.set(null);
        this.stopCreditTicker();
        void this.refreshAccountState();
        return;
      }
      this.creditPending.set({ ...pending, segundos: restantes });
    }, 1000) as ReturnType<typeof setInterval>;
  }

  private stopCreditTicker(): void {
    if (this.creditTicker !== null) {
      clearInterval(this.creditTicker);
      this.creditTicker = null;
    }
  }

  /** "1:24" o "en un minuto" para la espera de la banca. */
  get creditCountdown(): string {
    const pending = this.creditPending();
    if (!pending) {
      return '';
    }
    const m = Math.floor(pending.segundos / 60);
    const s = pending.segundos % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
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
    this.toast.set(msg);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toast.set('');
    }, 2600) as ReturnType<typeof setTimeout>;
  }

  private toastTimer: ReturnType<typeof setTimeout> | null = null;
}