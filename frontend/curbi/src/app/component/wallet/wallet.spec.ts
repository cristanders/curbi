import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ApiService, BankAccount, FinancialAccount, TransferResult } from '../../service/api.service';
import { bankById } from '../../service/bank-catalog';
import { Wallet } from './wallet';

/* Numeros de prueba: pasan o fallan el algoritmo de Luhn. */
const VISA = '4111111111111111';
const MASTERCARD = '5555555555554444';
const MASTERCARD_2 = '2223003122003222';
const Luhn_INVALID = '4111111111111112';

const CUENTAS_PRUEBA: BankAccount[] = [
  {
    id_account: 1,
    account_number: '100200300001',
    account_holder: 'Mario Estrada',
    account_type: 'Debito',
    balance: 2500,
    id_bank: 1,
    bank_name: 'Banco Industrial',
    bank_code: 'bi',
  },
];

function transferenciaFalsa(ok: boolean, error?: string) {
  const destino = CUENTAS_PRUEBA[0];
  const data: TransferResult = {
    amount: 25,
    description: `Transferencia a ${destino.account_holder} · ${destino.bank_name}`,
    destination: destino,
    transaction: {
      id_transaction: 99,
      amount: 25,
      type_transacion: 'Gasto',
      description: 'Transferencia',
      id_user: 1,
      id_category: 1,
    },
  };
  return Promise.resolve({ data: ok ? data : null, ok, error });
}

function mockApi(accounts: FinancialAccount[] = []): void {
  const api = TestBed.inject(ApiService);
  vi.spyOn(api, 'accounts').mockResolvedValue({ data: accounts, ok: accounts.length > 0 });
  vi.spyOn(api, 'transactions').mockResolvedValue({ data: [], ok: false });
  vi.spyOn(api, 'createAccount').mockResolvedValue({ data: null, ok: false });
  vi.spyOn(api, 'bankAccounts').mockResolvedValue({ data: CUENTAS_PRUEBA, ok: true });
  vi.spyOn(api, 'createTransfer').mockReturnValue(transferenciaFalsa(true));
}

describe('Wallet', () => {
  let component: Wallet;
  let fixture: ComponentFixture<Wallet>;

  beforeEach(async () => {
    // El store persiste las tarjetas en localStorage y el TestBed se recrea en cada test.
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Wallet],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    mockApi();

    fixture = TestBed.createComponent(Wallet);
    component = fixture.componentInstance;
    await component.ngOnInit();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  /** Llena el paso 3 del modal y guarda la tarjeta. */
  async function agregarTarjeta(numero = VISA, banco = 'banrural'): Promise<void> {
    component.openAdd();
    component.chooseBank(banco);
    component.nextToCardData();
    component.onCardNumberInput(numero);
    component.cardHolder = 'BRAYAN CAMPA';
    component.onCardExpiryInput('1229');
    component.cardCvv = '123';
    await component.confirmAddCard();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render my wallets title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.page-head h1')?.textContent).toContain('My Wallets');
  });

  it('should start with an empty balance and no movements', () => {
    expect(component.movements.length).toBe(0);
    expect(component.balanceParts.integer).toBe('0');
    expect(component.balanceParts.decimals).toBe('00');
    expect(component.income).toBe('0.00');
    expect(component.expense).toBe('0.00');
  });

  it('should keep the holder name from the session', () => {
    expect(component.holder).toBe('');
  });

  /* ---------------- red de la tarjeta ---------------- */

  it('detects visa from the card number', () => {
    component.openAdd();
    component.nextToCardData();
    component.onCardNumberInput(VISA);
    expect(component.cardNumber).toBe('4111 1111 1111 1111');
    expect(component.draftBrand).toBe('Visa');
    expect(component.draftBrandLogo).toContain('visa.png');
  });

  it('detects mastercard from a 55 number', () => {
    component.openAdd();
    component.nextToCardData();
    component.onCardNumberInput(MASTERCARD);
    expect(component.draftBrand).toBe('Mastercard');
    expect(component.draftBrandLogo).toContain('mastercard.svg');
  });

  it('detects mastercard from a 2-series number', () => {
    component.openAdd();
    component.nextToCardData();
    component.onCardNumberInput(MASTERCARD_2);
    expect(component.draftBrand).toBe('Mastercard');
  });

  it('rejects a number that fails luhn', () => {
    component.openAdd();
    component.nextToCardData();
    component.onCardNumberInput(Luhn_INVALID);
    expect(component.cardNumberValid).toBe(false);
    expect(component.draftBrand).toBe('Desconocida');
    expect(component.canSaveCard).toBe(false);
  });

  /* ---------------- modal de agregar tarjeta ---------------- */

  it('walks bank, type and card data in three steps', () => {
    component.openAdd();
    expect(component.addStep).toBe('bank');
    component.chooseBank('bac');
    expect(component.addStep).toBe('kind');
    component.chooseKind('Credito');
    component.nextToCardData();
    expect(component.addStep).toBe('data');
    component.backToKinds();
    expect(component.addStep).toBe('kind');
  });

  it('only enables the save button with complete card data', () => {
    component.openAdd();
    component.nextToCardData();
    component.onCardNumberInput(VISA);
    expect(component.canSaveCard).toBe(false);

    component.cardHolder = 'BRAYAN CAMPA';
    component.onCardExpiryInput('1229');
    component.cardCvv = '123';
    expect(component.canSaveCard).toBe(true);
  });

  it('formats the expiry as MM/AA', () => {
    component.onCardExpiryInput('1229');
    expect(component.cardExpiry).toBe('12/29');
  });

  it('saves the card with the detected network and the bank colors', async () => {
    await agregarTarjeta(MASTERCARD, 'banrural');

    expect(component.card?.brand).toBe('Mastercard');
    expect(component.card?.last4).toBe('4444');
    expect(component.card?.expiry).toBe('12/29');
    expect(component.cardGradient).toContain(bankById('banrural').from);
    expect(component.cardGradient).toContain(bankById('banrural').to);
  });

  it('keeps the full card number out of the wallet store', async () => {
    await agregarTarjeta(VISA);
    expect(component.store.allCards[0]).not.toHaveProperty('number');
    expect(component.store.allCards[0]).not.toHaveProperty('cvv');
    expect(localStorage.getItem('curbi.wallet.v3.0')).not.toContain(VISA);
  });

  /* ---------------- transferencias ---------------- */

  it('requires a destination account number to transfer', async () => {
    component.openTx('transfer');
    component.txAmount = 25;
    expect(component.canConfirmTx).toBe(false);

    component.onAccountInput('999999999999');
    await component.lookupDestination();
    expect(component.txAccount).toBeNull();
    expect(component.txAccountError).toBe('La cuenta de destino no existe');
    expect(component.canConfirmTx).toBe(false);
  });

  it('resolves an existing account and allows the transfer', async () => {
    component.openTx('transfer');
    component.onAccountInput('100200300001');
    await component.lookupDestination();

    expect(component.txAccount?.account_holder).toBe('Mario Estrada');
    expect(component.txAccountError).toBe('');

    component.txAmount = 25;
    expect(component.canConfirmTx).toBe(true);
  });

  it('ignores the dashes when looking up the account', async () => {
    component.openTx('transfer');
    component.onAccountInput('1002-0030-0001');
    await component.lookupDestination();
    expect(component.txAccount?.id_account).toBe(1);
  });

  it('records the transfer as a movement', async () => {
    await agregarTarjeta();
    component.openTx('transfer');
    component.onAccountInput('100200300001');
    await component.lookupDestination();
    component.txAmount = 25;

    await component.confirmTx();

    expect(component.movements.length).toBe(1);
    expect(component.movements[0].title).toContain('MARIO ESTRADA');
    expect(component.movements[0].sign).toBe('-');
    expect(component.expense).toBe('25.00');
  });

  it('surfaces the backend error when the account does not exist', async () => {
    const api = TestBed.inject(ApiService);
    vi.spyOn(api, 'createTransfer').mockReturnValue(
      transferenciaFalsa(false, 'La cuenta de destino no existe'),
    );

    await agregarTarjeta();
    component.openTx('transfer');
    component.onAccountInput('100200300001');
    await component.lookupDestination();
    component.txAmount = 25;

    await component.confirmTx();

    expect(component.txOpen).toBe(true);
    expect(component.txAccountError).toBe('La cuenta de destino no existe');
    expect(component.movements.length).toBe(0);
  });

  it('does not ask for a destination account when paying a bill', () => {
    component.openTx('pay');
    component.txAmount = 40;
    expect(component.canConfirmTx).toBe(true);
  });
});

/**
 * La tarjeta llega desde la API, asi que ya esta presente en el primer render:
 * estas pruebas si pueden revisar el DOM de la cara de la tarjeta.
 */
/** El navegador normaliza los colores inline a rgb(), hay que compararlos asi. */
function rgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

describe('Wallet con una tarjeta del backend', () => {
  let component: Wallet;
  let fixture: ComponentFixture<Wallet>;

  const CUENTA: FinancialAccount = {
    id_financial: 7,
    account_name: 'Banco de Desarrollo Rural (Banrural) Debito ···· 0007',
    balance: 4200.5,
    id_user: 1,
  };

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Wallet],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    mockApi([CUENTA]);

    fixture = TestBed.createComponent(Wallet);
    component = fixture.componentInstance;
    await component.ngOnInit();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('reads the bank from the account name', () => {
    expect(component.card?.bankId).toBe('banrural');
    expect(component.card?.last4).toBe('0007');
    expect(component.card?.balance).toBe(4200.5);
  });

  it('paints the card with the colors of its bank', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const card = compiled.querySelector<HTMLElement>('.credit-card');
    expect(card).toBeTruthy();
    expect(card?.style.background).toContain(rgb(bankById('banrural').from));
    expect(card?.style.background).toContain(rgb(bankById('banrural').to));
  });

  it('leaves pay and transfer out of the card face', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const card = compiled.querySelector('.credit-card');
    expect(card).toBeTruthy();
    expect(card?.querySelector('.card-actions')).toBeNull();
    // siguen disponibles en el panel de acciones rapidas
    expect(compiled.querySelectorAll('.quick-panel .quick').length).toBe(4);
  });

  it('shows the network mark of the card', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const network = compiled.querySelector('.credit-card .card-network');
    expect(network).toBeTruthy();
    expect(network?.querySelector('img')?.getAttribute('src')).toContain('visa.png');
  });
});
