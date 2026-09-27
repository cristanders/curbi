import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { Saves } from './saves';
import { ApiBusinessError, ApiService, FinancialAccount } from '../../service/api.service';
import { RefreshBusService } from '../../service/refresh-bus.service';

/** Cuenta del backend: el store la convierte en una tarjeta con saldo. */
const CUENTA = (balance: number): FinancialAccount => ({
  id_financial: 1,
  account_name: 'Banco de Desarrollo Rural Debito',
  balance,
  id_user: 1,
});

describe('Saves', () => {
  let component: Saves;
  let fixture: ComponentFixture<Saves>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Saves],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    // El store del wallet persiste en localStorage: sin limpiarlo, las tarjetas de un
    // describe se filtran al siguiente.
    localStorage.clear();

    // El componente lee el wallet al entrar para saber con que tarjeta aportar.
    const api = TestBed.inject(ApiService);
    vi.spyOn(api, 'accounts').mockResolvedValue({ data: [], ok: false });
    vi.spyOn(api, 'transactions').mockResolvedValue({ data: [], ok: false });
    vi.spyOn(api, 'savingsGoals').mockResolvedValue({ data: [], ok: false });

    fixture = TestBed.createComponent(Saves);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render my saves title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.page-title')?.textContent).toContain('My saves');
  });

  it('should render three stat cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.stat-card').length).toBe(3);
  });

  it('should start with no goals and zero totals', () => {
    expect(component.goals().length).toBe(0);
    expect(component.totalSaved()).toBe('0');
    expect(component.cashback()).toBe('0');
    expect(component.interest()).toBe('0');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.goal-card').length).toBe(0);
  });

  it('should show the empty state and the new goal button when there are no goals', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.goals-empty')).toBeTruthy();
    expect(compiled.querySelectorAll('.btn-new-goal').length).toBeGreaterThan(0);
  });

  it('should compute 0% progress for a goal without target', () => {
    const goal = { id: 1, name: 'META', current: 0, target: 0, icon: '', category: 'viaje' };
    expect(component.progressOf(goal)).toBe(0);
  });

  it('should compute progress for a goal with target', () => {
    const goal = { id: 1, name: 'META', current: 3000, target: 4000, icon: '', category: 'viaje' };
    expect(component.progressOf(goal)).toBe(75);
  });

  it('should mark a goal as completed when current reaches target', () => {
    const goal = { id: 1, name: 'META', current: 4000, target: 4000, icon: '', category: 'viaje' };
    expect(component.isCompleted(goal)).toBe(true);
  });

  it('should not mark a goal without target as completed', () => {
    const goal = { id: 1, name: 'META', current: 0, target: 0, icon: '', category: 'viaje' };
    expect(component.isCompleted(goal)).toBe(false);
  });
});

describe('Saves: aportar a una meta', () => {
  let component: Saves;
  let fixture: ComponentFixture<Saves>;
  let api: ApiService;
  let bus: RefreshBusService;

  const goal = { id: 7, name: 'VIAJE', current: 1000, target: 3000, icon: '', category: 'viaje' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Saves],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    // El store del wallet persiste en localStorage: sin limpiarlo, las tarjetas de un
    // describe se filtran al siguiente.
    localStorage.clear();

    api = TestBed.inject(ApiService);
    bus = TestBed.inject(RefreshBusService);
    vi.spyOn(api, 'savingsGoals').mockResolvedValue({ data: [], ok: true });
    vi.spyOn(api, 'contributeSavings').mockResolvedValue({ data: null, ok: false });
    vi.spyOn(api, 'createSavingsGoal').mockResolvedValue({ data: null, ok: false });
    // La tarjeta de la que sale el dinero: con Q2500 alcanza para los montos de
    // estas pruebas (la meta necesita Q2000).
    vi.spyOn(api, 'accounts').mockResolvedValue({ data: [CUENTA(2500)], ok: true });
    vi.spyOn(api, 'transactions').mockResolvedValue({ data: [], ok: false });
    vi.spyOn(bus, 'emit').mockImplementation(() => undefined);

    fixture = TestBed.createComponent(Saves);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
  });

  /** Abre el modal como si el usuario tocara "Aportar $" en la tarjeta de la meta. */
  function openWith(g = goal): void {
    component.openContribute(g);
  }

  it('should start with the modal closed', () => {
    expect(component.contributeOpen()).toBe(false);
    expect(component.selectedGoal()).toBeNull();
  });

  it('should open the modal for the chosen goal', () => {
    openWith();
    expect(component.contributeOpen()).toBe(true);
    expect(component.selectedGoal()?.id).toBe(7);
    expect(component.remaining()).toBe(2000);
  });

  it('should not open the modal for a completed goal', () => {
    openWith({ id: 7, name: 'VIAJE', current: 3000, target: 3000, icon: '', category: 'viaje' });
    expect(component.contributeOpen()).toBe(false);
  });

  it('should expose quarter, half and full as quick amounts', () => {
    openWith();
    expect(component.quickAmounts()).toEqual([500, 1000, 2000]);
  });

  it('should fill the remaining amount when completing the goal', () => {
    openWith();
    component.completeGoal();
    expect(component.contributeAmount()).toBe(2000);
    expect(component.canContribute()).toBe(true);
  });

  it('should round quick amounts to two decimals', () => {
    openWith({ id: 7, name: 'VIAJE', current: 0, target: 100, icon: '', category: 'viaje' });
    expect(component.quickAmounts()).toEqual([25, 50, 100]);
  });

  it('should not allow a zero contribution', () => {
    openWith();
    component.setAmount(0);
    expect(component.canContribute()).toBe(false);
  });

  it('should not allow a contribution over the remaining amount', () => {
    openWith();
    component.setAmount(2500);
    expect(component.canContribute()).toBe(false);
  });

  it('should project progress with the amount in the input', () => {
    openWith();
    expect(component.projectedProgress()).toBe(33);
    component.setAmount(1000);
    expect(component.projectedProgress()).toBe(67);
  });

  it('should reject a zero amount without calling the API', async () => {
    openWith();
    component.setAmount(0);
    await component.confirmContribute();
    expect(api.contributeSavings).not.toHaveBeenCalled();
    expect(component.contributeError()).toBe('Ingresa un monto mayor a 0');
  });

  it('should reject an amount over the remaining without calling the API', async () => {
    openWith();
    component.setAmount(2500);
    await component.confirmContribute();
    expect(api.contributeSavings).not.toHaveBeenCalled();
    expect(component.contributeError()).toContain('Faltan Q2000.00');
  });

  it('should send the contribution to the API and reload the goals', async () => {
    vi.mocked(api.contributeSavings).mockResolvedValue({
      data: {
        goal: { id_saving: 7, target_amount: 3000, current_amount: 1500, id_user: 1 },
        balance: 2000,
      },
      ok: true,
    });
    vi.mocked(api.savingsGoals).mockClear();

    openWith();
    component.setAmount(500);
    await component.confirmContribute();

    expect(api.contributeSavings).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ amount: 500, id_financial: 1 }),
    );
    expect(api.savingsGoals).toHaveBeenCalled();
    expect(bus.emit).toHaveBeenCalled();
    expect(component.contributeOpen()).toBe(false);
    expect(component.toast()).toContain('Aporte de Q500.00');
  });

  it('should keep the modal open and show the message when the API rejects', async () => {
    vi.mocked(api.contributeSavings).mockResolvedValue({
      data: null,
      ok: false,
      error: new ApiBusinessError('META_COMPLETA', 'Esta meta ya esta completa'),
    });

    openWith();
    component.setAmount(500);
    await component.confirmContribute();

    expect(component.contributeOpen()).toBe(true);
    expect(component.contributeError()).toBe('Esta meta ya esta completa');
    expect(bus.emit).not.toHaveBeenCalled();
  });

  it('should show the backend message and resync the card when the balance is not enough', async () => {
    vi.mocked(api.contributeSavings).mockResolvedValue({
      data: null,
      ok: false,
      error: new ApiBusinessError('SALDO_INSUFICIENTE', 'Saldo insuficiente. Te faltan Q50.00.'),
    });
    vi.mocked(api.accounts).mockClear();

    openWith();
    component.setAmount(500);
    await component.confirmContribute();

    expect(component.contributeOpen()).toBe(true);
    expect(component.contributeError()).toBe('Saldo insuficiente. Te faltan Q50.00.');
    // El saldo real pudo haber cambiado en otra pestana: se vuelve a leer.
    expect(api.accounts).toHaveBeenCalled();
  });

  it('should release the busy state after a failed contribution', async () => {
    vi.mocked(api.contributeSavings).mockResolvedValue({
      data: null,
      ok: false,
      error: new ApiBusinessError('ERROR', 'boom'),
    });

    openWith();
    component.setAmount(500);
    await component.confirmContribute();

    expect(component.contributeBusy()).toBe(false);
  });

  it('should reset the input when the modal is closed', () => {
    openWith();
    component.setAmount(500);
    component.closeContribute();
    expect(component.contributeAmount()).toBe(0);
    expect(component.contributeError()).toBe('');
  });
});

describe('Saves: el aporte sale del saldo de la tarjeta', () => {
  let component: Saves;
  let fixture: ComponentFixture<Saves>;
  let api: ApiService;

  /** Meta que necesita Q2000 y tarjeta con solo Q300. */
  const goal = { id: 7, name: 'VIAJE', current: 1000, target: 3000, icon: '', category: 'viaje' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Saves],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    // El store del wallet persiste en localStorage: sin limpiarlo, las tarjetas de un
    // describe se filtran al siguiente.
    localStorage.clear();

    api = TestBed.inject(ApiService);
    vi.spyOn(api, 'savingsGoals').mockResolvedValue({ data: [], ok: true });
    vi.spyOn(api, 'contributeSavings').mockResolvedValue({ data: null, ok: false });
    vi.spyOn(api, 'accounts').mockResolvedValue({ data: [CUENTA(300)], ok: true });
    vi.spyOn(api, 'transactions').mockResolvedValue({ data: [], ok: false });

    fixture = TestBed.createComponent(Saves);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should only offer cards registered in the server', () => {
    component.openContribute(goal);
    expect(component.contributeCards().length).toBe(1);
    expect(component.selectedCard()?.financialId).toBe(1);
  });

  it('should show the available balance of the chosen card', () => {
    component.openContribute(goal);
    expect(component.availableOnCard()).toBe(300);
  });

  it('should not allow an amount bigger than the card balance', () => {
    component.openContribute(goal);
    component.setAmount(500);
    expect(component.canContribute()).toBe(false);
  });

  it('should allow an amount the card can cover', () => {
    component.openContribute(goal);
    component.setAmount(300);
    expect(component.canContribute()).toBe(true);
  });

  it('should cap what the card can pay at the smaller of balance and remaining', () => {
    component.openContribute(goal);
    component.completeGoal();
    expect(component.maxAffordable()).toBe(300);
  });

  it('should block the contribution and name the shortfall when the card is short', async () => {
    component.openContribute(goal);
    component.setAmount(500);
    await component.confirmContribute();

    expect(api.contributeSavings).not.toHaveBeenCalled();
    expect(component.contributeError()).toContain('Te faltan Q200.00');
    expect(component.contributeOpen()).toBe(true);
  });
});

describe('Saves: sin tarjetas no se puede aportar', () => {
  let component: Saves;
  let fixture: ComponentFixture<Saves>;
  let api: ApiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Saves],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    // El store del wallet persiste en localStorage: sin limpiarlo, las tarjetas de un
    // describe se filtran al siguiente.
    localStorage.clear();

    api = TestBed.inject(ApiService);
    vi.spyOn(api, 'savingsGoals').mockResolvedValue({ data: [], ok: true });
    vi.spyOn(api, 'contributeSavings').mockResolvedValue({ data: null, ok: false });
    vi.spyOn(api, 'accounts').mockResolvedValue({ data: [], ok: true });
    vi.spyOn(api, 'transactions').mockResolvedValue({ data: [], ok: false });

    fixture = TestBed.createComponent(Saves);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should not allow any contribution without a card', () => {
    component.openContribute({ id: 7, name: 'VIAJE', current: 0, target: 1000, icon: '', category: 'viaje' });
    component.setAmount(100);
    expect(component.contributeCards().length).toBe(0);
    expect(component.canContribute()).toBe(false);
  });

  it('should tell the user to add a card', async () => {
    component.openContribute({ id: 7, name: 'VIAJE', current: 0, target: 1000, icon: '', category: 'viaje' });
    component.setAmount(100);
    await component.confirmContribute();

    expect(api.contributeSavings).not.toHaveBeenCalled();
    expect(component.contributeError()).toContain('Agrega una tarjeta');
  });
});

describe('Saves: nueva meta', () => {
  let component: Saves;
  let fixture: ComponentFixture<Saves>;
  let api: ApiService;
  let bus: RefreshBusService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Saves],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    // El store del wallet persiste en localStorage: sin limpiarlo, las tarjetas de un
    // describe se filtran al siguiente.
    localStorage.clear();

    api = TestBed.inject(ApiService);
    bus = TestBed.inject(RefreshBusService);
    vi.spyOn(api, 'savingsGoals').mockResolvedValue({ data: [], ok: true });
    vi.spyOn(api, 'createSavingsGoal').mockResolvedValue({ data: null, ok: false });
    vi.spyOn(api, 'accounts').mockResolvedValue({ data: [], ok: true });
    vi.spyOn(api, 'transactions').mockResolvedValue({ data: [], ok: false });
    vi.spyOn(bus, 'emit').mockImplementation(() => undefined);

    fixture = TestBed.createComponent(Saves);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should start with the modal closed', () => {
    expect(component.newGoalOpen()).toBe(false);
  });

  it('should open the modal with empty fields', () => {
    component.openNewGoal();
    expect(component.newGoalOpen()).toBe(true);
    expect(component.newGoalName()).toBe('');
    expect(component.newGoalTarget()).toBe(0);
  });

  it('should require a name of at least 3 letters', () => {
    component.openNewGoal();
    component.newGoalTarget.set(3000);
    component.newGoalName.set('ab');
    expect(component.canCreateGoal()).toBe(false);
    component.newGoalName.set('abc');
    expect(component.canCreateGoal()).toBe(true);
  });

  it('should require a target greater than zero', () => {
    component.openNewGoal();
    component.newGoalName.set('Viaje');
    component.newGoalTarget.set(0);
    expect(component.canCreateGoal()).toBe(false);
    component.newGoalTarget.set(0.01);
    expect(component.canCreateGoal()).toBe(true);
  });

  it('should reject a short name without calling the API', async () => {
    component.openNewGoal();
    component.newGoalName.set('ab');
    component.newGoalTarget.set(3000);
    await component.confirmNewGoal();
    expect(api.createSavingsGoal).not.toHaveBeenCalled();
    expect(component.newGoalError()).toBe('Ponle un nombre de al menos 3 letras');
  });

  it('should reject a zero target without calling the API', async () => {
    component.openNewGoal();
    component.newGoalName.set('Viaje');
    component.newGoalTarget.set(0);
    await component.confirmNewGoal();
    expect(api.createSavingsGoal).not.toHaveBeenCalled();
    expect(component.newGoalError()).toBe('El monto objetivo debe ser mayor a 0');
  });

  it('should create the goal trimming the name and rounding the target', async () => {
    vi.mocked(api.createSavingsGoal).mockResolvedValue({
      data: { id_saving: 9, goal_name: 'Viaje', target_amount: 3000, id_user: 1 },
      ok: true,
    });
    vi.mocked(api.savingsGoals).mockClear();

    component.openNewGoal();
    component.newGoalName.set('  Viaje a Antigua  ');
    component.newGoalTarget.set(3000.567);
    await component.confirmNewGoal();

    expect(api.createSavingsGoal).toHaveBeenCalledWith(
      expect.objectContaining({ goal_name: 'Viaje a Antigua', target_amount: 3000.57 }),
    );
    expect(api.savingsGoals).toHaveBeenCalled();
    expect(bus.emit).toHaveBeenCalled();
    expect(component.newGoalOpen()).toBe(false);
    expect(component.toast()).toContain('Meta "Viaje a Antigua" creada');
  });

  it('should keep the modal open and show the message when the API rejects', async () => {
    vi.mocked(api.createSavingsGoal).mockResolvedValue({
      data: null,
      ok: false,
      error: 'La meta de ahorro debe ser mayor a 0',
    });

    component.openNewGoal();
    component.newGoalName.set('Viaje');
    component.newGoalTarget.set(3000);
    await component.confirmNewGoal();

    expect(component.newGoalOpen()).toBe(true);
    expect(component.newGoalError()).toBe('La meta de ahorro debe ser mayor a 0');
    expect(bus.emit).not.toHaveBeenCalled();
    expect(component.newGoalBusy()).toBe(false);
  });

  it('should reset the fields when closed', () => {
    component.openNewGoal();
    component.newGoalName.set('Viaje');
    component.newGoalTarget.set(3000);
    component.closeNewGoal();
    expect(component.newGoalName()).toBe('');
    expect(component.newGoalTarget()).toBe(0);
    expect(component.newGoalError()).toBe('');
  });
});

describe('Saves: categorias e iconos', () => {
  let component: Saves;
  let fixture: ComponentFixture<Saves>;
  let api: ApiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Saves],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    localStorage.clear();

    api = TestBed.inject(ApiService);
    vi.spyOn(api, 'accounts').mockResolvedValue({ data: [], ok: false });
    vi.spyOn(api, 'transactions').mockResolvedValue({ data: [], ok: false });
    vi.spyOn(api, 'savingsGoals').mockResolvedValue({ data: [], ok: true });
    vi.spyOn(api, 'createSavingsGoal').mockResolvedValue({ data: null, ok: false });

    fixture = TestBed.createComponent(Saves);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should take the icon from the category, not from the position in the list', async () => {
    // Este es el bug reportado: el icono se ciclaba entre tres fijos por posicion,
    // asi que una meta de viaje en tercera posicion salia con el icono de consola.
    vi.mocked(api.savingsGoals).mockResolvedValue({
      data: [
        { id_saving: 1, goal_name: 'Casa propia', target_amount: 90000, current_amount: 1000, category: 'casa', id_user: 1 },
        { id_saving: 2, goal_name: 'Fondo de emergencia', target_amount: 6000, current_amount: 0, category: 'emergencia', id_user: 1 },
        { id_saving: 3, goal_name: 'Viaje a Antigua', target_amount: 4000, current_amount: 500, category: 'viaje', id_user: 1 },
        { id_saving: 4, goal_name: 'PlayStation', target_amount: 5000, current_amount: 0, category: 'gaming', id_user: 1 },
      ],
      ok: true,
    });

    await component['loadGoals']();

    const icons = component.goals().map((g) => g.icon);
    expect(icons).toEqual([
      'assets/icons/goal-house.svg',
      'assets/icons/goal-lock.svg',
      'assets/icons/goal-plane.svg',
      'assets/icons/goal-gamepad.svg',
    ]);
  });

  it('should fall back to the name when the backend sends no category', async () => {
    vi.mocked(api.savingsGoals).mockResolvedValue({
      data: [{ id_saving: 1, goal_name: 'Viaje a Antigua', target_amount: 4000, current_amount: 0, id_user: 1 }],
      ok: true,
    });

    await component['loadGoals']();

    expect(component.goals()[0].icon).toBe('assets/icons/goal-plane.svg');
    expect(component.goals()[0].category).toBe('viaje');
  });

  it('should offer a picker with every category', () => {
    component.openNewGoal();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.category-option').length).toBe(component.categories.length);
    expect(component.categories.length).toBeGreaterThanOrEqual(12);
  });

  it('should preselect the category that matches what is being typed', () => {
    component.openNewGoal();
    component.onGoalNameInput('Viaje a Antigua');
    expect(component.newGoalCategory()).toBe('viaje');

    component.onGoalNameInput('Educacion de mi hija');
    expect(component.newGoalCategory()).toBe('educacion');
  });

  it('should not change the category for a name that says nothing', () => {
    component.openNewGoal();
    component.setNewGoalCategory('mascota');
    component.onGoalNameInput('qqq');
    expect(component.newGoalCategory()).toBe('mascota');
  });

  it('should mark the selected category in the picker', () => {
    component.openNewGoal();
    component.setNewGoalCategory('salud');
    fixture.detectChanges();

    const selected = (fixture.nativeElement as HTMLElement).querySelectorAll('.category-option.is-selected');
    expect(selected.length).toBe(1);
    expect(selected[0].textContent).toContain('Salud');
  });

  it('should send the category to the backend when creating a goal', async () => {
    vi.mocked(api.createSavingsGoal).mockResolvedValue({
      data: { id_saving: 9, goal_name: 'Auto', target_amount: 50000, current_amount: 0, category: 'auto', id_user: 1 },
      ok: true,
    });

    component.openNewGoal();
    component.newGoalName.set('Comprar carro');
    component.newGoalTarget.set(50000);
    component.setNewGoalCategory('auto');
    await component.confirmNewGoal();

    expect(api.createSavingsGoal).toHaveBeenCalledWith(
      expect.objectContaining({ goal_name: 'Comprar carro', category: 'auto' }),
    );
  });
});
