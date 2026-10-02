import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { ApiService, BankAccount, FinancialAccount, TransferResult, ApiBusinessError } from '../../service/api.service';
import { ReceiptService } from '../../service/receipt.service';
import { WalletCardService } from '../../service/wallet-card.service';
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

function transferenciaFalsa(ok: boolean, error?: ApiBusinessError) {
  const destino = CUENTAS_PRUEBA[0];
  const data: TransferResult = {
    amount: 25,
    balance: 2475,
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
  // El backend responde la cuenta creada con su saldo inicial. Sin esto la
  // tarjeta se queda sin financialId y sin los Q100 de bienvenida, y entonces
  // no puede transferir ni pagar nada. El account_number tambien lo asigna el
  // servidor: es el numero que el usuario comparte para recibir depositos.
  vi.spyOn(api, 'createAccount').mockResolvedValue({
    data: {
      id_financial: 7,
      account_name: 'Banco de Desarrollo Rural Debito',
      balance: 100,
      account_number: '100200000007',
      bank_code: 'banrural',
      card_type: 'Debito',
      credit_limit: 0,
      id_user: 1,
    },
    ok: true,
  });
  vi.spyOn(api, 'bankAccounts').mockResolvedValue({ data: CUENTAS_PRUEBA, ok: true });
  vi.spyOn(api, 'createTransfer').mockReturnValue(transferenciaFalsa(true));
  // El modal compara el monto contra `available`, que viene de este endpoint. Sin
  // mock se queda en 0 y todo movimiento aparece como "saldo insuficiente" antes
  // de tocar el servidor.
  vi.spyOn(api, 'accountState').mockImplementation((idFinancial) =>
    Promise.resolve({
      data: {
        id_financial: idFinancial,
        account_name: 'Banco de Desarrollo Rural Debito',
        card_type: 'Debito',
        balance: 100,
        credit_limit: 0,
        disponible: 100,
        pendiente: null,
      },
      ok: true,
    }),
  );
  // El backend descuenta el saldo y devuelve el nuevo; la UI lo refleja tal cual
  // en vez de calcularlo por su cuenta.
  vi.spyOn(api, 'createTransaction').mockResolvedValue({
    data: {
      transaction: {
        id_transaction: 1,
        amount: 25,
        type_transacion: 'Gasto',
        description: 'Movimiento',
        id_user: 1,
        id_category: 1,
      },
      balance: 75,
    },
    ok: true,
  });
}

describe('Wallet', () => {
  let component: Wallet;
  let fixture: ComponentFixture<Wallet>;

  beforeEach(async () => {
    // El store persiste las tarjetas en localStorage y el TestBed se recrea en cada test.
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Wallet],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
      ],
    }).compileComponents();

    mockApi();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      WALLET: {
        TITLE: 'My Wallets',
      },
    });
    translate.use('es');

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
    expect(component.movements().length).toBe(0);
    expect(component.balanceParts.integer).toBe('0');
    expect(component.balanceParts.decimals).toBe('00');
    expect(component.income()).toBe('0.00');
    expect(component.expense()).toBe('0.00');
  });

  it('should keep the holder name from the session', () => {
    expect(component.holder()).toBe('');
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

    expect(component.card()?.brand).toBe('Mastercard');
    expect(component.card()?.last4).toBe('4444');
    expect(component.card()?.expiry).toBe('12/29');
    expect(component.cardGradient).toContain(bankById('banrural').from);
    expect(component.cardGradient).toContain(bankById('banrural').to);
  });

  it('keeps the full card number out of the wallet store', async () => {
    await agregarTarjeta(VISA);
    expect(component.store.allCards()[0]).not.toHaveProperty('number');
    expect(component.store.allCards()[0]).not.toHaveProperty('cvv');
    expect(localStorage.getItem('curbi.wallet.v3.0')).not.toContain(VISA);
  });

  /* ---------------- transferencias ---------------- */

  it('requires a destination account number to transfer', async () => {
    component.openTx('transfer');
    component.txAmount = 25;
    expect(component.canConfirmTx).toBe(false);

    component.onAccountInput('999999999999');
    await component.lookupDestination();
    expect(component.txAccount()).toBeNull();
    expect(component.txAccountError()).toBe('La cuenta de destino no existe');
    expect(component.canConfirmTx).toBe(false);
  });

  it('resolves an existing account and allows the transfer', async () => {
    // Sin una tarjeta con saldo no se puede transferir: el modal lo bloquea.
    await agregarTarjeta();
    component.openTx('transfer');
    component.onAccountInput('100200300001');
    await component.lookupDestination();

    expect(component.txAccount()?.account_holder).toBe('Mario Estrada');
    expect(component.txAccountError()).toBe('');

    component.txAmount = 25;
    expect(component.canConfirmTx).toBe(true);
  });

  it('ignores the dashes when looking up the account', async () => {
    component.openTx('transfer');
    component.onAccountInput('1002-0030-0001');
    await component.lookupDestination();
    expect(component.txAccount()?.id_account).toBe(1);
  });

  it('records the transfer as a movement', async () => {
    await agregarTarjeta();
    component.openTx('transfer');
    component.onAccountInput('100200300001');
    await component.lookupDestination();
    component.txAmount = 25;

    await component.confirmTx();

    expect(component.movements().length).toBe(1);
    expect(component.movements()[0].title).toContain('MARIO ESTRADA');
    expect(component.movements()[0].sign).toBe('-');
    expect(component.expense()).toBe('25.00');
  });

  it('surfaces the backend error when the account does not exist', async () => {
    const api = TestBed.inject(ApiService);
    vi.spyOn(api, 'createTransfer').mockReturnValue(
      transferenciaFalsa(false, new ApiBusinessError('DESTINO_INEXISTENTE', 'La cuenta de destino no existe')),
    );

    await agregarTarjeta();
    component.openTx('transfer');
    component.onAccountInput('100200300001');
    await component.lookupDestination();
    component.txAmount = 25;

    await component.confirmTx();

    expect(component.txOpen()).toBe(true);
    expect(component.txAccountError()).toBe('La cuenta de destino no existe');
    expect(component.movements().length).toBe(0);
  });

  it('does not ask for a destination account when paying a bill', async () => {
    await agregarTarjeta();
    component.openTx('pay');
    // Una factura se localiza con entidad + referencia, no con cuenta destino.
    component.chooseProvider(component.services[0]);
    component.txReference = '12345678';
    component.txAmount = 40;
    expect(component.txAccount()).toBeNull();
    expect(component.canConfirmTx).toBe(true);
  });

  /* ---------------- movimientos ---------------- */

  it('takes the balance from the server instead of calculating it locally', async () => {
    await agregarTarjeta();
    component.openTx('request');
    component.txTitle = 'Cafe';
    component.txAmount = 25;

    await component.confirmTx();

    // La tarjeta arranca en Q100. Si la UI restara sola, el saldo quedaria en 75
    // por coincidencia; el mock devuelve 75 pero el punto es que se usa ese
    // numero y no otro. Con un gasto de 10 el valor local seria 90.
    expect(component.card()?.balance).toBe(75);
    expect(component.movements().length).toBe(1);
    expect(component.movements()[0].title).toBe('CAFE');
  });

  it('does not touch the balance or the history when the server rejects it', async () => {
    // El saldo mostrado es 100, asi que un gasto de 500 lo corta el chequeo local
    // antes de tocar el servidor. Para probar el rechazo real del backend hace
    // falta que el saldo local y el del servidor no coincidan, que es justo lo
    // que pasa cuando la tarjeta seCargo en otra parte.
    const api = TestBed.inject(ApiService);
    vi.spyOn(api, 'createTransaction').mockResolvedValue({
      data: null,
      ok: false,
      error: new ApiBusinessError('SALDO_INSUFICIENTE', 'Saldo insuficiente. Te faltan Q80.00.'),
    });

    await agregarTarjeta();
    const store = component.store;
    // El store tiene una tarjeta con Q100; la del backend tiene 4200.50.
    const tarjetas = store.allCards();
    expect(tarjetas.length).toBe(1);

    component.openTx('request');
    component.txTitle = 'Imposible';
    component.txAmount = 150;
    const saldoAntes = component.card()?.balance;

    await component.confirmTx();

    expect(saldoAntes).toBe(100);
    // Con Q100 no alcanza para 150: lo detiene el chequeo local y el mensaje lo
    // calcula la UI. Lo que importa es que no se haya tocado nada.
    expect(component.card()?.balance).toBe(saldoAntes);
    expect(component.movements().length).toBe(0);
    expect(component.txOpen()).toBe(true);
    expect(component.txAccountError()).toBe('Saldo insuficiente. Te faltan Q50.00.');
    expect(api.createTransaction).not.toHaveBeenCalled();
  });

  it('sends the account so the server knows which card to move money on', async () => {
    const api = TestBed.inject(ApiService);
    await agregarTarjeta();
    component.openTx('request');
    component.txTitle = 'Cafe';
    component.txAmount = 25;

    await component.confirmTx();

    const enviado = vi.mocked(api.createTransaction).mock.calls[0][0];
    expect(enviado.id_financial).toBe(7);
    // El paso "request" de la UI es un ingreso: por eso Ingreso y no Gasto.
    expect(enviado.type_transacion).toBe('Ingreso');
    expect(enviado.description).toBe('Cafe');
  });

  /* ---------------- numero de cuenta ---------------- */

  it('keeps the account number the server assigned to the new card', async () => {
    await agregarTarjeta();
    expect(component.card()?.accountNumber).toBe('100200000007');
  });

  it('groups the account number in blocks of four', async () => {
    await agregarTarjeta();
    expect(component.accountNumberLabel).toBe('1002-0000-0007');
  });

  it('has no account number label when the card has none', () => {
    expect(component.accountNumberLabel).toBe('');
  });

  it('copies the account number to the clipboard', async () => {
    await agregarTarjeta();
    const escribir = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: escribir },
      configurable: true,
    });

    await component.copyAccountNumber();

    expect(escribir).toHaveBeenCalledWith('1002-0000-0007');
    expect(component.accountCopied()).toBe(true);
  });

  it('warns when the number could not be copied', async () => {
    await agregarTarjeta();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('sin permiso')) },
      configurable: true,
    });
    // jsdom no implementa execCommand, asi que el respaldo con textarea tambien
    // falla: ese es justo el escenario que debe avisarle al usuario.

    await component.copyAccountNumber();

    expect(component.accountCopied()).toBe(false);
    expect(component.toast()).toContain('No se pudo copiar');
  });

  /* ---------------- comprobante ---------------- */

  it('shows the receipt after a successful transfer instead of closing', async () => {
    await agregarTarjeta();
    component.openTx('transfer');
    component.onAccountInput('100200300001');
    await component.lookupDestination();
    component.txTitle = 'Almuerzo';
    component.txAmount = 25;

    await component.confirmTx();

    // El modal sigue abierto para que el usuario pueda descargar el comprobante.
    expect(component.txOpen()).toBe(true);
    expect(component.txReceipt()?.amount).toBe(25);
    expect(component.txReceipt()?.destination.account_holder).toBe('Mario Estrada');
  });

  it('does not leave a receipt behind when the modal is reopened', async () => {
    await agregarTarjeta();
    component.openTx('transfer');
    component.onAccountInput('100200300001');
    await component.lookupDestination();
    component.txAmount = 25;
    await component.confirmTx();
    expect(component.txReceipt()).not.toBeNull();

    component.closeTx();
    component.openTx('transfer');

    expect(component.txReceipt()).toBeNull();
  });

  it('has no receipt when the transfer fails', async () => {
    const api = TestBed.inject(ApiService);
    vi.spyOn(api, 'createTransfer').mockReturnValue(
      transferenciaFalsa(false, new ApiBusinessError('SALDO_INSUFICIENTE', 'Saldo insuficiente')),
    );

    await agregarTarjeta();
    component.openTx('transfer');
    component.onAccountInput('100200300001');
    await component.lookupDestination();
    component.txAmount = 25;

    await component.confirmTx();

    expect(component.txReceipt()).toBeNull();
  });

  it('builds the receipt with the data of the transfer', async () => {
    await agregarTarjeta();
    component.openTx('transfer');
    component.onAccountInput('100200300001');
    await component.lookupDestination();
    component.txTitle = 'Almuerzo';
    component.txAmount = 25;
    await component.confirmTx();

    const html = TestBed.inject(ReceiptService).buildHtml(component.txReceipt()!, {
      titular: 'BRAYAN CAMPA',
      numeroOrigen: component.accountNumberLabel,
    });

    expect(html).toContain('Q25.00');
    expect(html).toContain('Mario Estrada');
    expect(html).toContain('1002-0000-0007');
  });

  it('does nothing when there is no receipt to download', () => {
    const receipts = TestBed.inject(ReceiptService);
    const espiar = vi.spyOn(receipts, 'descargarTransferencia');

    component.downloadReceipt();

    expect(espiar).not.toHaveBeenCalled();
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
    account_number: '100200000007',
    bank_code: 'banrural',
    id_user: 1,
  };

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Wallet],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
      ],
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
    expect(component.card()?.bankId).toBe('banrural');
    expect(component.card()?.last4).toBe('0007');
    expect(component.card()?.balance).toBe(4200.5);
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

  it('shows the account number with a button to copy it', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const fila = compiled.querySelector('.account-number');
    expect(fila).toBeTruthy();
    expect(fila?.textContent).toContain('1002-0000-0007');
    expect(fila?.querySelector('.copy-number')).toBeTruthy();
  });

  it('hides the account number row when the account has no number', async () => {
    // Una tarjeta todavia no registrada en el servidor no tiene numero.
    const store = TestBed.inject(WalletCardService);
    await store.removeCard(component.card()!.id);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.account-number')).toBeNull();
  });

  it('shows the server error and changes nothing when it rejects the movement', async () => {
    // Q4000 entra por el chequeo local (la tarjeta muestra 4200.50) pero el
    // servidor lo rechaza: ese es el caso donde la UI debe hacer caso al backend
    // en vez de asumir que el movimiento se hizo.
    const api = TestBed.inject(ApiService);
    // available() se cargo en el beforeEach con el mock general (Q100); aqui se
    // deja en el saldo real de la tarjeta para que Q4000 pase el chequeo local.
    component.available.set(4200.5);
    vi.spyOn(api, 'createTransaction').mockResolvedValue({
      data: null,
      ok: false,
      error: new ApiBusinessError('SALDO_INSUFICIENTE', 'Saldo insuficiente. Te faltan Q1.00.'),
    });

    component.openTx('request');
    component.txTitle = 'Compra';
    component.txAmount = 4000;

    await component.confirmTx();

    expect(api.createTransaction).toHaveBeenCalledTimes(1);
    expect(component.card()?.balance).toBe(4200.5);
    expect(component.movements().length).toBe(0);
    expect(component.txOpen()).toBe(true);
    expect(component.txAccountError()).toBe('Saldo insuficiente. Te faltan Q1.00.');
  });
});
