import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { ApiBusinessError, ApiService, Transaction } from '../../service/api.service';
import { Transactions } from './transactions';

function movimiento(over: Partial<Transaction>): Transaction {
  return {
    id_transaction: 1,
    amount: 10,
    type_transacion: 'Gasto',
    description: 'Algo',
    id_user: 5,
    id_category: 1,
    ...over,
  };
}

describe('Transactions', () => {
  let component: Transactions;
  let fixture: ComponentFixture<Transactions>;
  let api: ApiService;

  /** Reemplaza los mocks por defecto y vuelve a cargar la tabla. */
  async function cargar(transacciones: Transaction[]): Promise<void> {
    vi.spyOn(api, 'transactions').mockResolvedValue({ data: transacciones, ok: true });
    vi.spyOn(api, 'categories').mockResolvedValue({
      data: [{ id_category: 1, type_category: 'Personal' }],
      ok: true,
    });
    vi.spyOn(api, 'accounts').mockResolvedValue({
      data: [{ id_financial: 6, account_name: 'Principal', balance: 500 }],
      ok: true,
    });
    await component.ngOnInit();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Transactions],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      TRANSACTIONS: {
        TITLE: 'Transactions',
      },
    });
    translate.use('es');

    api = TestBed.inject(ApiService);
    vi.spyOn(api, 'transactions').mockResolvedValue({ data: [], ok: false });
    vi.spyOn(api, 'categories').mockResolvedValue({ data: [], ok: false });
    vi.spyOn(api, 'accounts').mockResolvedValue({ data: [], ok: false });
    vi.spyOn(api, 'createTransaction').mockResolvedValue({ data: null, ok: false });

    fixture = TestBed.createComponent(Transactions);
    component = fixture.componentInstance;
    await component.ngOnInit();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.page-head h1')?.textContent).toContain('Transactions');
  });

  it('should render three stat cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.stat-card').length).toBe(3);
  });

  it('should render zero totals and no rows when there is no data', () => {
    expect(component.rows().length).toBe(0);
    expect(component.incomeTotal()).toBe('0.00');
    expect(component.expenseTotal()).toBe('0.00');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.tx-row').length).toBe(0);
  });

  describe('fecha real', () => {
    it('usa created_at del servidor y no la posicion de la fila', async () => {
      await cargar([
        movimiento({ id_transaction: 30, description: 'Antiguo', created_at: '2026-03-05T10:00:00.000Z' }),
        movimiento({ id_transaction: 31, description: 'Reciente', created_at: '2026-09-20T10:00:00.000Z' }),
      ]);

      const filaReciente = component.rows().find((r) => r.description === 'Reciente');
      const filaAntigua = component.rows().find((r) => r.description === 'Antiguo');

      // Con el metodo viejo (Date.now() - i * 86400000) las dos habrian salido
      // como "hoy" y "ayer", sin importar cuando ocurrieron de verdad.
      expect(filaReciente?.date).toBe('20/09/2026');
      expect(filaAntigua?.date).toBe('05/03/2026');
    });

    it('no inventa una fecha distinta para dos movimientos del mismo dia', async () => {
      await cargar([
        movimiento({ id_transaction: 1, description: 'Cafe', created_at: '2026-09-20T08:00:00.000Z' }),
        movimiento({ id_transaction: 2, description: 'Cena', created_at: '2026-09-20T21:00:00.000Z' }),
      ]);

      const fechas = component.rows().map((r) => r.date);
      expect(new Set(fechas).size).toBe(1);
      expect(fechas[0]).toBe('20/09/2026');
    });
  });

  describe('formulario de movimiento', () => {
    it('empieza oculto y se abre al tocar el boton', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(component.showForm()).toBe(false);
      expect(compiled.querySelector('.form-card')).toBeNull();

      compiled.querySelector<HTMLButtonElement>('.page-head .btn-primary')?.click();
      fixture.detectChanges();

      expect(component.showForm()).toBe(true);
      expect(compiled.querySelector('.form-card')).not.toBeNull();
    });

    it('exige una cuenta: sin ella no llama al backend', async () => {
      const spy = vi.spyOn(api, 'createTransaction');
      component.showForm.set(true);
      component.form = {
        description: 'Cafe',
        amount: '25',
        type: 'Gasto',
        id_category: 1,
        id_financial: 0,
      };

      await component.submit();

      expect(spy).not.toHaveBeenCalled();
      expect(component.formError()).toBe('Elige la cuenta que va a pagar');
    });

    it('rechaza un monto vacio o negativo', async () => {
      const spy = vi.spyOn(api, 'createTransaction');
      component.form = { description: 'Cafe', amount: '0', type: 'Gasto', id_category: 1, id_financial: 6 };

      await component.submit();

      expect(spy).not.toHaveBeenCalled();
      expect(component.formError()).toBe('Escribe un monto mayor a 0');
    });

    it('exige descripcion', async () => {
      const spy = vi.spyOn(api, 'createTransaction');
      component.form = { description: '   ', amount: '25', type: 'Gasto', id_category: 1, id_financial: 6 };

      await component.submit();

      expect(spy).not.toHaveBeenCalled();
      expect(component.formError()).toBe('Escribe de qué se trata');
    });

    it('manda id_financial y cierra el formulario al guardar bien', async () => {
      const spy = vi
        .spyOn(api, 'createTransaction')
        .mockResolvedValue({
          data: { transaction: movimiento({ id_financial: 6 }), balance: 475 },
          ok: true,
        });
      component.showForm.set(true);
      component.form = {
        description: 'Cafe',
        amount: '25',
        type: 'Gasto',
        id_category: 1,
        id_financial: 6,
      };

      await component.submit();

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 25,
          type_transacion: 'Gasto',
          description: 'Cafe',
          id_financial: 6,
        }),
      );
      expect(component.showForm()).toBe(false);
      expect(component.formError()).toBe('');
    });

    it('muestra el motivo cuando el backend rechaza el movimiento', async () => {
      vi.spyOn(api, 'createTransaction').mockResolvedValue({
        data: null,
        ok: false,
        error: new ApiBusinessError('SALDO_INSUFICIENTE', 'Saldo insuficiente. Te faltan Q10.00.'),
      });
      component.showForm.set(true);
      component.form = { description: 'Cafe', amount: '25', type: 'Gasto', id_category: 1, id_financial: 6 };

      await component.submit();

      // El formulario sigue abierto con lo que el usuario escribio.
      expect(component.showForm()).toBe(true);
      expect(component.formError()).toBe('Saldo insuficiente. Te faltan Q10.00.');
      expect(component.form.description).toBe('Cafe');
    });
  });
});
