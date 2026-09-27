import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { db } from '../config/database';
import { Budget, BudgetProgress, CreateBudgetDto } from '../model/budget';
import { money } from '../utils/money';

interface ProgressRow extends RowDataPacket {
  id_budget: number;
  amount: number;
  id_category: number;
  period_month: string;
  id_user: number;
  created_at: Date;
  type_category: string | null;
  spent: number | null;
}

/** Mes en curso en formato YYYY-MM, el que espera Budget.period_month. */
export function currentPeriod(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export class BudgetRepository {
  /**
   * Presupuestos del usuario con lo gastado en cada categoria.
   *
   * El `spent` sale de un LEFT JOIN con los Gastos del mismo mes y la misma
   * categoria: asi la barra de progreso y el "freno" de la pantalla de intentos
   * de gasto cuentan exactamente los mismos numeros.
   */
  async findProgressByUser(idUser: number, period: string): Promise<BudgetProgress[]> {
    const [rows] = await db.query<ProgressRow[]>(
      `SELECT b.id_budget,
              b.amount,
              b.id_category,
              b.period_month,
              b.id_user,
              b.created_at,
              c.type_category,
              COALESCE(SUM(t.amount), 0) AS spent
         FROM Budget b
         LEFT JOIN Category c ON c.id_category = b.id_category
         LEFT JOIN Transaction t
                ON t.id_user = b.id_user
               AND t.id_category = b.id_category
               AND t.type_transacion = 'Gasto'
               AND t.created_at >= STR_TO_DATE(CONCAT(b.period_month, '-01'), '%Y-%m-%d')
               AND t.created_at <  DATE_ADD(STR_TO_DATE(CONCAT(b.period_month, '-01'), '%Y-%m-%d'), INTERVAL 1 MONTH)
        WHERE b.id_user = ?
          AND b.period_month = ?
     GROUP BY b.id_budget, b.amount, b.id_category, b.period_month, b.id_user, b.created_at, c.type_category
     ORDER BY b.id_budget`,
      [idUser, period],
    );

    return rows.map((r) => this.toProgress(r));
  }

  async findByCategoryAndPeriod(
    idUser: number,
    idCategory: number,
    period: string,
  ): Promise<Budget | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM Budget WHERE id_user = ? AND id_category = ? AND period_month = ?',
      [idUser, idCategory, period],
    );
    return (rows[0] as Budget) ?? null;
  }

  /**
   * Crea el limite, o actualiza el que ya existe para esa categoria y mes.
   * Un upsert en vez de un insert a secas: el indice unico esta ahi para que
   * cambiar el limite de "Comida" en marzo no sea un error 500.
   */
  async upsert(budget: CreateBudgetDto): Promise<Budget> {
    await db.query(
      `INSERT INTO Budget (amount, id_category, period_month, id_user)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
      [budget.amount, budget.id_category, budget.period_month, budget.id_user],
    );
    return (
      (await this.findByCategoryAndPeriod(
        budget.id_user,
        budget.id_category,
        budget.period_month,
      )) ?? { id_budget: 0, ...budget }
    );
  }

  async remove(idBudget: number, idUser: number): Promise<boolean> {
    const [result] = await db.query<ResultSetHeader>(
      'DELETE FROM Budget WHERE id_budget = ? AND id_user = ?',
      [idBudget, idUser],
    );
    return Number(result.affectedRows) > 0;
  }

  private toProgress(r: ProgressRow): BudgetProgress {
    const amount = money(Number(r.amount));
    const spent = money(Number(r.spent ?? 0));
    const remaining = money(Math.max(0, amount - spent));
    return {
      id_budget: r.id_budget,
      amount,
      id_category: r.id_category,
      period_month: r.period_month,
      id_user: r.id_user,
      created_at: new Date(r.created_at).toISOString(),
      category_name: r.type_category ?? `Categoria #${r.id_category}`,
      spent,
      remaining,
      percent: amount > 0 ? Math.min(100, Math.round((spent / amount) * 100)) : 0,
      exceeded: spent > amount,
    };
  }
}
