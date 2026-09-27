import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Topbar } from '../shell/topbar';
import { ApiBusinessError, ApiService, SavingsGoal } from '../../service/api.service';
import { SessionService } from '../../service/session.service';
import { RefreshBusService } from '../../service/refresh-bus.service';
import { WalletCard, WalletCardService } from '../../service/wallet-card.service';
import { bankById } from '../../service/bank-catalog';
import { DEFAULT_CATEGORY_ID, SAVINGS_CATEGORIES, iconForGoal, matchCategory } from '../../service/savings-catalog';

interface SaveGoal {
  id: number;
  name: string;
  current: number;
  target: number;
  icon: string;
  category: string;
}

/** Los montos llegan de MySQL como double; se redondean a 2 decimales. */
const money = (value: number): number => Math.round(value * 100) / 100;

/**
 * El store lanza ApiBusinessError con el mensaje que ya le paso el backend, asi
 * que alcanza con leerlo: "Saldo insuficiente. Te faltan Q50.00." llega tal cual
 * en vez de un error generico.
 */
function messageOf(e: unknown): string {
  if (e instanceof ApiBusinessError && e.message) {
    return e.message;
  }
  if (e instanceof Error && e.message) {
    return e.message;
  }
  return 'No se pudo registrar el aporte';
}

@Component({
  imports: [FormsModule, Topbar],
  selector: 'app-saves',
  styleUrl: './saves.css',
  templateUrl: './saves.html',
})
export class Saves implements OnInit, OnDestroy {
  /** Opciones del selector de categoria, cada una con su icono. */
  readonly categories = SAVINGS_CATEGORIES;

  /**
   * Las metas y sus totales se cargan tras un await, asi que van en signals:
   * la app es zoneless y una propiedad normal no hubiera repintado la pagina.
   */
  readonly totalSaved = signal('0');
  readonly cashback = signal('0');
  readonly interest = signal('0');
  readonly interestDecimals = signal('00');
  readonly source = signal<'api' | 'demo'>('demo');
  readonly lastUpdate = signal('just now');

  readonly goals = signal<SaveGoal[]>([]);

  /* ----- modal aportar a una meta ----- */
  readonly contributeOpen = signal(false);
  readonly selectedGoal = signal<SaveGoal | null>(null);
  readonly contributeAmount = signal(0);
  readonly contributeError = signal('');
  readonly contributeBusy = signal(false);
  /** Atajos del modal: un cuarto, la mitad, o cerrar la meta de una vez. */
  readonly quickAmounts = computed<number[]>(() => {
    const restante = this.remaining();
    return [restante / 4, restante / 2, restante].map((v) => money(v));
  });

  /* ----- con que tarjeta se paga el aporte ----- */
  /** Solo las tarjetas registradas en el servidor pueden financiar una meta. */
  readonly contributeCards = computed<WalletCard[]>(() =>
    this.store.allCards().filter((c) => c.financialId != null),
  );
  readonly contributeCardId = signal('');
  /** La tarjeta elegida; si el id guardado ya no existe, la primera disponible. */
  readonly selectedCard = computed<WalletCard | null>(() => {
    const cards = this.contributeCards();
    return cards.find((c) => c.id === this.contributeCardId()) ?? cards[0] ?? null;
  });
  /** Dinero que hay en esa tarjeta: el tope real del aporte. */
  readonly availableOnCard = computed(() => money(Number(this.selectedCard()?.balance ?? 0)));

  /** El aporte sale de la tarjeta: no puede pasar la meta ni el saldo disponible. */
  readonly canContribute = computed(() => {
    const amount = money(Number(this.contributeAmount()));
    return (
      amount > 0 &&
      amount <= this.remaining() &&
      amount <= this.availableOnCard() &&
      this.selectedCard() !== null &&
      !this.contributeBusy()
    );
  });

  /* ----- modal nueva meta ----- */
  readonly newGoalOpen = signal(false);
  readonly newGoalName = signal('');
  readonly newGoalTarget = signal(0);
  readonly newGoalCategory = signal(DEFAULT_CATEGORY_ID);
  readonly newGoalError = signal('');
  readonly newGoalBusy = signal(false);
  /** Nombreutil y monto objetivo positivo: lo minimo para que la meta serva. */
  readonly canCreateGoal = computed(
    () => this.newGoalName().trim().length >= 3 && money(Number(this.newGoalTarget())) > 0,
  );

  readonly toast = signal('');

  private busSub: Subscription | null = null;

  constructor(
    private readonly api: ApiService,
    private readonly session: SessionService,
    private readonly bus: RefreshBusService,
    readonly store: WalletCardService,
  ) {}

  async ngOnInit(): Promise<void> {
    // Las tarjetas son el origen del dinero del aporte, asi que la pantalla
    // necesita conocerlas aunque el usuario llegue directo desde el dashboard.
    await this.store.load();
    await this.loadGoals();
    this.busSub = this.bus.changes$.subscribe(() => void this.loadGoals());
  }

  ngOnDestroy(): void {
    this.busSub?.unsubscribe();
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  /**
   * El backend es la fuente de verdad: despues de aportar se vuelve a leer la
   * lista en vez de parchear el saldo en memoria.
   */
  private async loadGoals(): Promise<void> {
    const { data, ok } = await this.api.savingsGoals(this.session.idUser);
    const list = data ?? [];
    this.source.set(ok ? 'api' : 'demo');
    this.lastUpdate.set('just now');

    this.goals.set(
      list.map((g: SavingsGoal) => {
        // El icono sale de la CATEGORIA de la meta, no de su posicion en la
        // lista. Antes se ciclaba entre tres iconos fijos y una meta de viaje
        // podia salir con el icono de consola.
        const category = g.category ?? matchCategory(g.goal_name);
        return {
          id: g.id_saving,
          name: String(g.goal_name ?? 'META DE AHORRO').toUpperCase(),
          current: money(Number(g.current_amount ?? 0)),
          target: money(Number(g.target_amount ?? 0)),
          icon: iconForGoal(g.category, g.goal_name),
          category,
        };
      }),
    );

    this.applyTotals();
  }

  private applyTotals(): void {
    const saved = this.goals().reduce((s, g) => s + g.current, 0);
    const cashback = Math.round(saved * 0.0925);
    const interest = saved * 0.0622;

    this.totalSaved.set(this.group(saved).int);
    this.cashback.set(this.group(cashback).int);
    const i = this.group(interest);
    this.interest.set(i.int);
    this.interestDecimals.set(i.dec);
  }

  private group(value: number): { int: string; dec: string } {
    const [int, dec] = Math.max(0, value).toFixed(2).split('.');
    return { int: Number(int).toLocaleString('en-US'), dec };
  }

  progressOf(goal: SaveGoal): number {
    if (!goal.target) {
      return 0;
    }
    return Math.min(100, Math.round((goal.current / goal.target) * 100));
  }

  /** Dinero que falta para completar la meta; 0 si ya esta completa. */
  remaining(): number {
    const goal = this.selectedGoal();
    return goal ? money(Math.max(0, goal.target - goal.current)) : 0;
  }

  isCompleted(goal: SaveGoal): boolean {
    return goal.target > 0 && goal.current >= goal.target;
  }

  fmt(n: number): string {
    return n.toLocaleString('en-US');
  }

  viewDetails(goal: SaveGoal): void {
    console.log('details', goal);
  }

  /* ---------------------- aportar ---------------------- */

  openContribute(goal: SaveGoal): void {
    if (this.isCompleted(goal)) {
      this.showToast('Esta meta ya esta completa');
      return;
    }
    this.selectedGoal.set(goal);
    this.contributeAmount.set(0);
    this.contributeError.set('');
    // Se arranca con la tarjeta activa: es la que el usuario ya venia usando.
    this.contributeCardId.set(this.store.activeCard()?.id ?? this.contributeCards()[0]?.id ?? '');
    this.contributeOpen.set(true);
  }

  closeContribute(): void {
    if (this.contributeBusy()) {
      return;
    }
    this.contributeOpen.set(false);
    this.selectedGoal.set(null);
    this.contributeAmount.set(0);
    this.contributeError.set('');
  }

  setAmount(value: number): void {
    this.contributeAmount.set(money(value));
    this.contributeError.set('');
  }

  setContributeCard(id: string): void {
    this.contributeCardId.set(id);
    this.contributeError.set('');
  }

  /** Nombre del banco para el selector: la tarjeta guarda el id, no el nombre. */
  bankName(card: WalletCard): string {
    return bankById(card.bankId).name;
  }

  /** Cierra la meta con un solo aporte por el monto que falta. */
  completeGoal(): void {
    this.setAmount(this.remaining());
  }

  /** Cuanto se puede aportar con la tarjeta elegida sin dejarla en negativo. */
  maxAffordable(): number {
    return money(Math.min(this.remaining(), this.availableOnCard()));
  }

  /** Como quedaria la barra de progreso si se aceptara el monto capturado. */
  projectedProgress(): number {
    const goal = this.selectedGoal();
    if (!goal?.target) {
      return 0;
    }
    const amount = money(Number(this.contributeAmount()));
    if (!(amount > 0)) {
      return this.progressOf(goal);
    }
    return Math.min(100, Math.round(((goal.current + amount) / goal.target) * 100));
  }

  async confirmContribute(): Promise<void> {
    const goal = this.selectedGoal();
    if (!goal) {
      return;
    }

    const amount = money(Number(this.contributeAmount()));
    if (!(amount > 0)) {
      this.contributeError.set('Ingresa un monto mayor a 0');
      return;
    }
    if (amount > this.remaining()) {
      this.contributeError.set(`El aporte no puede pasar la meta. Faltan Q${this.remaining().toFixed(2)}`);
      return;
    }

    const card = this.selectedCard();
    if (!card) {
      this.contributeError.set('Agrega una tarjeta para poder aportar a tus metas');
      return;
    }
    if (amount > money(Number(card.balance))) {
      this.contributeError.set(
        `Tu tarjeta tiene Q${money(Number(card.balance)).toFixed(2)}. Te faltan Q${money(amount - Number(card.balance)).toFixed(2)}.`,
      );
      return;
    }

    this.contributeBusy.set(true);
    this.contributeError.set('');
    try {
      // El store llama a la API y refleja el saldo que devuelve el backend. El
      // saldo no se calcula aqui: el servidor es el unico que puede descontarlo.
      await this.store.contributeToSavings({
        cardId: card.id,
        goalId: goal.id,
        goalName: goal.name,
        amount,
      });

      // Se libera el busy antes de cerrar: closeContribute() no cierra con el
      // boton bloqueado, para que el usuario no pueda cerrar a media peticion.
      this.contributeBusy.set(false);
      this.closeContribute();
      await this.loadGoals();
      this.bus.emit();
      this.showToast(`Aporte de Q${amount.toFixed(2)} guardado en ${goal.name}`);
    } catch (e: unknown) {
      // El backend es el que sabe si de verdad no alcanza: su codigo se muestra
      // tal cual, y si fallo por saldo se refresca el saldo de la tarjeta.
      this.contributeError.set(messageOf(e));
      if (e instanceof ApiBusinessError && e.code === 'SALDO_INSUFICIENTE') {
        await this.store.syncBalances();
      }
    } finally {
      this.contributeBusy.set(false);
    }
  }

  /* ---------------------- nueva meta ---------------------- */

  openNewGoal(): void {
    this.newGoalName.set('');
    this.newGoalTarget.set(0);
    this.newGoalCategory.set(DEFAULT_CATEGORY_ID);
    this.newGoalError.set('');
    this.newGoalOpen.set(true);
  }

  closeNewGoal(): void {
    if (this.newGoalBusy()) {
      return;
    }
    this.newGoalOpen.set(false);
    this.newGoalName.set('');
    this.newGoalTarget.set(0);
    this.newGoalCategory.set(DEFAULT_CATEGORY_ID);
    this.newGoalError.set('');
  }

  setNewGoalCategory(id: string): void {
    this.newGoalCategory.set(id);
    this.newGoalError.set('');
  }

  /**
   * Mientras se escribe el nombre se propone la categoria: alguien que escribe
   * "Viaje a Antigua" ve marcado el avion sin tener que buscarlo en la lista. Si
   * ya habia elegido una a mano no se le pisa la eleccion.
   */
  onGoalNameInput(value: string): void {
    this.newGoalName.set(value);
    this.newGoalError.set('');
    const sugerida = matchCategory(value);
    if (sugerida !== DEFAULT_CATEGORY_ID) {
      this.newGoalCategory.set(sugerida);
    }
  }

  async confirmNewGoal(): Promise<void> {
    const name = this.newGoalName().trim();
    const target = money(Number(this.newGoalTarget()));

    if (name.length < 3) {
      this.newGoalError.set('Ponle un nombre de al menos 3 letras');
      return;
    }
    if (!(target > 0)) {
      this.newGoalError.set('El monto objetivo debe ser mayor a 0');
      return;
    }

    this.newGoalBusy.set(true);
    this.newGoalError.set('');
    try {
      const { data, ok, error } = await this.api.createSavingsGoal({
        goal_name: name,
        target_amount: target,
        category: this.newGoalCategory(),
        id_user: this.session.idUser,
      });

      if (!ok || !data) {
        this.newGoalError.set(error ?? 'No se pudo crear la meta');
        return;
      }

      // Se libera el busy antes de cerrar: closeNewGoal() no cierra con el boton
      // bloqueado, para que el usuario no pueda cerrar a media peticion.
      this.newGoalBusy.set(false);
      this.closeNewGoal();
      await this.loadGoals();
      this.bus.emit();
      this.showToast(`Meta "${name}" creada`);
    } finally {
      this.newGoalBusy.set(false);
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
