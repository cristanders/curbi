import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { Home } from './home';
import { BankSerie, LiveMarketService } from '../../service/live-market.service';
import { SessionService } from '../../service/session.service';
import { WalletCardService } from '../../service/wallet-card.service';
import {
  ApiBusinessError,
  ApiService,
  BudgetProgress,
  ExpenditureAttempt,
} from '../../service/api.service';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  /** Una serie por cada tarjeta activa: el dashboard pinta una `.bank-card` por serie. */
  const serie = (id: number, monogramClass: string): BankSerie => ({
    id,
    monogram: monogramClass.slice(0, 2).toUpperCase(),
    logo: '',
    monogramClass,
    name: `Banco ${id}`,
    color: '#123456',
    base: 1000,
    balance: 1000,
    change: 0,
    points: [1000, 1000],
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    // Sin backend el feed arranca vacio: se siembran tres series para poder
    // comprobar que el componente dibuja una tarjeta por cada una.
    TestBed.inject(LiveMarketService).banks.set([
      serie(1, 'bi'),
      serie(2, 'banrural'),
      serie(3, 'bac'),
    ]);

    // La seccion de control de gastos llama a cuatro endpoints mas al cargar.
    const api = TestBed.inject(ApiService);
    vi.spyOn(api, 'budgets').mockResolvedValue({ data: [], ok: true });
    vi.spyOn(api, 'expenditures').mockResolvedValue({ data: [], ok: true });
    vi.spyOn(api, 'categories').mockResolvedValue({
      data: [
        { id_category: 1, type_category: 'Personal' },
        { id_category: 2, type_category: 'Fijo' },
      ],
      ok: true,
    });
    vi.spyOn(api, 'accounts').mockResolvedValue({
      data: [{ id_financial: 6, account_name: 'Principal', balance: 500 }],
      ok: true,
    });
    vi.spyOn(api, 'dashboard').mockResolvedValue({ data: null, ok: false });

    // refresh() resiembra las graficas con las tarjetas de la wallet cada vez que
    // cambian. Sin esto las tres series de arriba se perdian al cargar, porque
    // ngOnInit si llega a terminar (con el dashboard mockeado) y sobreescribe el
    // feed del mercado con una lista vacia.
    const store = TestBed.inject(WalletCardService);
    vi.spyOn(store, 'load').mockResolvedValue(undefined);
    vi.spyOn(store, 'allCards').mockReturnValue([]);
    vi.spyOn(store, 'allMovements').mockReturnValue([]);

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the active wallets title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.section-title')?.textContent).toContain(
      'YOUR ACTIVE WALLETS',
    );
  });

  it('should render three bank cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.bank-card').length).toBe(3);
  });

  it('should render the live status chips', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.status-chip').length).toBeGreaterThan(0);
  });

  it('should render four kpi cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.kpi').length).toBe(4);
  });

  describe('control de gastos', () => {
    const budget = (over: Partial<BudgetProgress> = {}): BudgetProgress => ({
      id_budget: 1,
      amount: 600,
      id_user: 5,
      id_category: 1,
      period_month: '2026-09',
      category_name: 'Personal',
      spent: 300,
      remaining: 300,
      percent: 50,
      exceeded: false,
      ...over,
    });

    const intento = (over: Partial<ExpenditureAttempt> = {}): ExpenditureAttempt => ({
      id_expediture: 1,
      product_name: 'Audifonos',
      estimated_amount: 500,
      status: 'Frenado',
      id_user: 5,
      id_category: 1,
      reason: 'Te pasarias de tu limite de Personal: llevas 300 y con esta compra serian 800 de 600',
      ...over,
    });

    it('pinta la barra con el progreso que calculo el servidor', async () => {
      vi.spyOn(TestBed.inject(ApiService), 'budgets').mockResolvedValue({
        data: [budget()],
        ok: true,
      });
      await component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const item = compiled.querySelector('.budget-item');
      expect(item?.textContent).toContain('Personal');
      expect(item?.textContent).toContain('Q300.00 / Q600.00');
      expect(item?.textContent).toContain('Te quedan Q300.00');
      expect(compiled.querySelector<HTMLElement>('.budget-fill')?.style.width).toBe('50%');
    });

    it('avisa cuanto se paso del limite en vez de mostrar un negativo', async () => {
      vi.spyOn(TestBed.inject(ApiService), 'budgets').mockResolvedValue({
        data: [budget({ spent: 700, remaining: 0, percent: 100, exceeded: true })],
        ok: true,
      });
      await component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.budget-item')?.textContent).toContain(
        'Te pasaste por Q100.00',
      );
      expect(compiled.querySelector('.budget-fill')?.classList.contains('is-over')).toBe(true);
    });

    it('rechaza un limite de 0 sin llamar al backend', async () => {
      const api = TestBed.inject(ApiService);
      const crear = vi.spyOn(api, 'createBudget');

      component.budgetForm = { amount: '0', id_category: 1 };
      await component.saveBudget();

      expect(crear).not.toHaveBeenCalled();
      expect(component.budgetError()).toBe('El límite debe ser mayor a 0');
    });

    it('manda el mes actual al crear el limite y lo limpia al guardar', async () => {
      const api = TestBed.inject(ApiService);
      const crear = vi
        .spyOn(api, 'createBudget')
        .mockResolvedValue({ data: budget(), ok: true });

      component.budgetForm = { amount: '600', id_category: 2 };
      await component.saveBudget();

      const periodo = new Date().toISOString().slice(0, 7);
      expect(crear).toHaveBeenCalledWith({
        amount: 600,
        id_category: 2,
        period_month: periodo,
        id_user: TestBed.inject(SessionService).idUser,
      });
      expect(component.budgetForm.amount).toBe('');
    });

    it('exige producto, monto y cuenta antes de pedir una compra', async () => {
      const api = TestBed.inject(ApiService);
      const pedir = vi.spyOn(api, 'createExpenditureAttempt');

      component.attemptForm = {
        product_name: '  ',
        estimated_amount: '100',
        id_category: 1,
        id_financial: 6,
      };
      await component.requestPurchase();
      expect(pedir).not.toHaveBeenCalled();
      expect(component.attemptError()).toBe('Escribe qué quieres comprar');

      component.attemptForm = { product_name: 'Algo', estimated_amount: '0', id_category: 1, id_financial: 6 };
      await component.requestPurchase();
      expect(pedir).not.toHaveBeenCalled();
      expect(component.attemptError()).toBe('El monto debe ser mayor a 0');

      component.attemptForm = { product_name: 'Algo', estimated_amount: '100', id_category: 1, id_financial: 0 };
      await component.requestPurchase();
      expect(pedir).not.toHaveBeenCalled();
      expect(component.attemptError()).toBe('Elige la cuenta que pagaría');
    });

    it('muestra el veredicto Frenado sin tratarlo como error', async () => {
      const api = TestBed.inject(ApiService);
      vi.spyOn(api, 'createExpenditureAttempt').mockResolvedValue({
        data: {
          attempt: intento(),
          status: 'Frenado',
          reason: 'Te pasarias de tu limite de Personal: llevas 300 y con esta compra serian 800 de 600',
          balance: null,
          transaction: null,
        },
        ok: true,
      });

      component.attemptForm = {
        product_name: 'Audifonos',
        estimated_amount: '500',
        id_category: 1,
        id_financial: 6,
      };
      await component.requestPurchase();
      fixture.detectChanges();

      // Frenado viene con ok:true: es una decision, no un fallo de la peticion.
      expect(component.attemptError()).toBe('');
      expect(component.lastDecision()).toBe('Frenado');
      const compiled = fixture.nativeElement as HTMLElement;
      const veredicto = compiled.querySelector('.spend-verdict');
      expect(veredicto?.textContent).toContain('Frenado');
      expect(veredicto?.classList.contains('is-frenado')).toBe(true);
    });

    it('avisa que se aprobo y que se desconto', async () => {
      const api = TestBed.inject(ApiService);
      vi.spyOn(api, 'createExpenditureAttempt').mockResolvedValue({
        data: {
          attempt: intento({ status: 'Aprobado', reason: null, id_transaction: 34 }),
          status: 'Aprobado',
          reason: null,
          balance: 100,
          transaction: { id_transaction: 34 },
        },
        ok: true,
      });

      component.attemptForm = {
        product_name: 'Audifonos',
        estimated_amount: '400',
        id_category: 1,
        id_financial: 6,
      };
      await component.requestPurchase();
      fixture.detectChanges();

      expect(component.lastDecision()).toBe('Aprobado');
      expect(fixture.nativeElement.querySelector('.spend-verdict')?.textContent).toContain(
        'Se descontó de la cuenta',
      );
    });

    it('muestra el motivo cuando el backend rechaza de verdad', async () => {
      const api = TestBed.inject(ApiService);
      vi.spyOn(api, 'createExpenditureAttempt').mockResolvedValue({
        data: null,
        ok: false,
        error: new ApiBusinessError('SALDO_INSUFICIENTE', 'Saldo insuficiente. Te faltan Q500.00.'),
      });

      component.attemptForm = {
        product_name: 'Audifonos',
        estimated_amount: '900',
        id_category: 1,
        id_financial: 6,
      };
      await component.requestPurchase();

      expect(component.lastDecision()).toBeNull();
      expect(component.attemptError()).toBe('Saldo insuficiente. Te faltan Q500.00.');
    });

    it('lista los intentos recientes con su estado', async () => {
      vi.spyOn(TestBed.inject(ApiService), 'expenditures').mockResolvedValue({
        data: [intento(), intento({ id_expediture: 2, product_name: 'Cafe', status: 'Aprobado' })],
        ok: true,
      });
      await component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const items = compiled.querySelectorAll('.attempt-item');
      expect(items.length).toBe(2);
      expect(items[0].textContent).toContain('Audifonos');
      expect(items[0].textContent).toContain('Frenado');
      expect(items[1].textContent).toContain('Aprobado');
    });
  });
});
