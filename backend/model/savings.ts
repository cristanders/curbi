export interface SavingsGoal {
  id_saving: number;
  goal_name?: string;
  target_amount: number;
  current_amount?: number;
  id_user: number;
}

export type CreateSavingsGoalDto = Omit<SavingsGoal, 'id_saving'>;