import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Topbar } from '../shell/topbar';
import { ApiService, Category, FinancialAccount, Transaction } from '../../service/api.service';
import { SessionService } from '../../service/session.service';
import { RefreshBusService } from '../../service/refresh-bus.service';

interface TxRow {
  id: number;
  date: string;
  description: string;
  category: string;
  categoryId: number;
  type: 'Ingreso' | 'Gasto';
  amount: number;
}

@Component({
  imports: [FormsModule, Topbar, TranslatePipe],
  selector: 'app-transactions',
  styleUrl: './transactions.css',
  templateUrl: './transactions.html',
})
export class Transactions implements OnInit, OnDestroy {
  readonly defaultIcon = 'assets/icons/icon-transaction.svg';

  /**
   * Lo que llega del backend va en signals: la app es zoneless y escribir una
   * propiedad normal tras un await no repintaba la tabla.
   */
  readonly rows = signal<TxRow[]>([]);
  readonly filtered = signal<TxRow[]>([]);
  readonly categories = signal<Category[]>([]);

  search = '';
  typeFilter: 'todas' | 'Ingreso' | 'Gasto' = 'todas';
  categoryId = 0;

  readonly incomeTotal = signal('0.00');
  readonly expenseTotal = signal('0.00');
  readonly source = signal<'api' | 'demo'>('demo');
  readonly lastUpdate = signal('just now');

  /** Cuentas propias: sin una de estas el backend no moveria ningun saldo. */
  readonly accounts = signal<FinancialAccount[]>([]);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly showForm = signal(false);
  form: { description: string; amount: string; type: 'Ingreso' | 'Gasto'; id_category: number; id_financial: number } = {
    description: '',
    amount: '',
    type: 'Gasto',
    id_category: 1,
    id_financial: 0,
  };

  private busSub: Subscription | null = null;

  constructor(
    private readonly api: ApiService,
    private readonly session: SessionService,
    private readonly bus: RefreshBusService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.load();
    // Otra pantalla pudo mover el saldo: las transacciones se releen solas.
    this.busSub = this.bus.changes$.subscribe(() => void this.load());
  }

  ngOnDestroy(): void {
    this.busSub?.unsubscribe();
  }

  private async load(): Promise<void> {
    const [tx, cats, accs] = await Promise.all([
      this.api.transactions(this.session.idUser),
      this.api.categories(),
      this.api.accounts(this.session.idUser),
    ]);

    const list = tx.data ?? [];
    this.source.set(tx.ok ? 'api' : 'demo');
    this.categories.set(cats.data ?? []);
    this.accounts.set(accs.data ?? []);
    if (!this.form.id_financial && this.accounts().length > 0) {
      this.form.id_financial = this.accounts()[0].id_financial;
    }

    this.rows.set(list.map((t: Transaction) => this.toRow(t)));

    this.applyTotals();
    this.applyFilter();
    this.lastUpdate.set('just now');
  }

  /**
   * La fecha sale de `created_at` del servidor. Antes se armaba con
   * `Date.now() - i * 86400000`, o sea un dia por fila: como el historial llega de
   * mas nuevo a mas viejo, la fila mas nueva siempre decia "hoy" y dos movimientos
   * del mismo dia parecian de dias distintos. `indice` solo se usa como respaldo
   * para los datos de demo, que no tienen fecha.
   */
  private toRow(t: Transaction, indice = 0): TxRow {
    const real = t.created_at ? new Date(t.created_at) : null;
    const d = real && !isNaN(real.getTime()) ? real : new Date(Date.now() - indice * 86400000);
    return {
      id: t.id_transaction,
      date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
      description: String(t.description ?? 'Transacción'),
      category: this.categoryName(t.id_category),
      categoryId: t.id_category,
      type: t.type_transacion === 'Ingreso' ? 'Ingreso' : 'Gasto',
      amount: Number(t.amount),
    };
  }

  private categoryName(id: number): string {
    const found = this.categories().find((c) => c.id_category === id);
    return found ? found.type_category : `Categoría #${id}`;
  }

  private applyTotals(): void {
    const income = this.rows()
      .filter((r) => r.type === 'Ingreso')
      .reduce((s, r) => s + r.amount, 0);
    const expense = this.rows()
      .filter((r) => r.type === 'Gasto')
      .reduce((s, r) => s + r.amount, 0);
    this.incomeTotal.set(income.toFixed(2));
    this.expenseTotal.set(expense.toFixed(2));
  }

  applyFilter(): void {
    const term = this.search.trim().toLowerCase();
    this.filtered.set(
      this.rows().filter((r) => {
        const okType = this.typeFilter === 'todas' || r.type === this.typeFilter;
        const okCat = !this.categoryId || r.categoryId === this.categoryId;
        const okTerm =
          !term ||
          r.description.toLowerCase().includes(term) ||
          r.category.toLowerCase().includes(term);
        return okType && okCat && okTerm;
      }),
    );
  }

  reset(): void {
    this.search = '';
    this.typeFilter = 'todas';
    this.categoryId = 0;
    this.applyFilter();
  }

  /**
   * Movimiento real. La cuenta es obligatoria: sin ella el backend no tocaria
   * ningun saldo, y una pantalla de historial cuyo boton principal no mueve plata
   * es la trampa de la que salio este formulario. Se pide la cuenta al backend
   * para no inventar el saldo de la cuenta ajena.
   */
  async submit(): Promise<void> {
    if (this.saving()) {
      return;
    }
    const monto = Number(this.form.amount);
    if (!Number.isFinite(monto) || monto <= 0) {
      this.formError.set('Escribe un monto mayor a 0');
      return;
    }
    if (!this.form.id_financial) {
      this.formError.set('Elige la cuenta que va a pagar');
      return;
    }
    if (!this.form.description.trim()) {
      this.formError.set('Escribe de qué se trata');
      return;
    }

    this.saving.set(true);
    this.formError.set('');
    const { ok, error } = await this.api.createTransaction({
      amount: monto,
      type_transacion: this.form.type,
      description: this.form.description.trim(),
      id_user: this.session.idUser,
      id_financial: this.form.id_financial,
      id_category: this.form.id_category,
    });
    this.saving.set(false);

    if (!ok) {
      this.formError.set(error?.message ?? 'No se pudo guardar el movimiento');
      return;
    }
    this.resetForm();
    this.showForm.set(false);
    await this.load();
    this.bus.emit();
  }

  resetForm(): void {
    this.form = { description: '', amount: '', type: 'Gasto', id_category: 1, id_financial: 0 };
    this.formError.set('');
  }
}
