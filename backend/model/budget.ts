export interface Budget {
  id_budget: number;
  /** Limite del mes para esta categoria. */
  amount: number;
  id_category: number;
  /** Mes al que aplica, en formato YYYY-MM. */
  period_month: string;
  id_user: number;
  created_at?: string;
}

export type CreateBudgetDto = Omit<Budget, 'id_budget' | 'created_at'>;

/**
 * Un presupuesto con lo que ya se gasto. `spent` se calcula en el backend
 * sumando los movimientos reales del mes, no un valor que manda el cliente: si lo
 * mandara el cliente, la barra de progreso podria mostrar cualquier cosa.
 */
export interface BudgetProgress extends Budget {
  category_name: string;
  spent: number;
  /** Cuanto queda del limite. Nunca negativo: si se paso, es 0. */
  remaining: number;
  /** spent / amount, ya acotado a 100 para la barra. */
  percent: number;
  exceeded: boolean;
}
