export interface Budget {
  id_budget: number;
  amount: number;
  id_user: number;
}

export type CreateBudgetDto = Omit<Budget, 'id_budget'>;