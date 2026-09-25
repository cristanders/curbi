import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topbar } from '../shell/topbar';
import { ApiService, Category, Transaction } from '../../service/api.service';
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
  imports: [FormsModule, Topbar],
  selector: 'app-transactions',
  styleUrl: './transactions.css',
  templateUrl: './transactions.html',
})
export class Transactions implements OnInit {
  readonly defaultIcon = 'assets/icons/icon-transaction.svg';

  rows: TxRow[] = [];
  filtered: TxRow[] = [];
  categories: Category[] = [];

  search = '';
  typeFilter: 'todas' | 'Ingreso' | 'Gasto' = 'todas';
  categoryId = 0;

  incomeTotal = '0.00';
  expenseTotal = '0.00';
  source: 'api' | 'demo' = 'demo';
  lastUpdate = 'just now';

  constructor(
    private readonly api: ApiService,
    private readonly session: SessionService,
    private readonly bus: RefreshBusService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    const [tx, cats] = await Promise.all([
      this.api.transactions(this.session.idUser),
      this.api.categories(),
    ]);

    const list = tx.data ?? [];
    this.source = tx.ok ? 'api' : 'demo';
    this.categories = cats.data;

    this.rows = list.map((t: Transaction, i: number) => {
      const d = new Date(Date.now() - i * 86400000);
      return {
        id: t.id_transaction,
        date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
        description: String(t.description ?? 'Transacción'),
        category: this.categoryName(t.id_category),
        categoryId: t.id_category,
        type: t.type_transacion === 'Ingreso' ? 'Ingreso' : 'Gasto',
        amount: Number(t.amount),
      };
    });

    this.applyTotals();
    this.applyFilter();
  }

  private categoryName(id: number): string {
    const found = this.categories.find((c) => c.id_category === id);
    return found ? found.type_category : `Categoría #${id}`;
  }

  private applyTotals(): void {
    const income = this.rows.filter((r) => r.type === 'Ingreso').reduce((s, r) => s + r.amount, 0);
    const expense = this.rows.filter((r) => r.type === 'Gasto').reduce((s, r) => s + r.amount, 0);
    this.incomeTotal = income.toFixed(2);
    this.expenseTotal = expense.toFixed(2);
  }

  applyFilter(): void {
    const term = this.search.trim().toLowerCase();
    this.filtered = this.rows.filter((r) => {
      const okType = this.typeFilter === 'todas' || r.type === this.typeFilter;
      const okCat = !this.categoryId || r.categoryId === this.categoryId;
      const okTerm =
        !term ||
        r.description.toLowerCase().includes(term) ||
        r.category.toLowerCase().includes(term);
      return okType && okCat && okTerm;
    });
  }

  reset(): void {
    this.search = '';
    this.typeFilter = 'todas';
    this.categoryId = 0;
    this.applyFilter();
  }

  async addSample(): Promise<void> {
    const { ok } = await this.api.createTransaction({
      amount: 25.5,
      type_transacion: 'Gasto',
      description: 'Movimiento de prueba|Creado desde la UI',
      id_user: this.session.idUser,
      id_category: 1,
    });
    if (ok) {
      await this.load();
      this.bus.emit();
    }
    this.lastUpdate = 'just now';
  }
}
