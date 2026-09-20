export type AttemptStatus = 'Frenado' | 'Aprobado' | 'Pendiente';

export interface ExpenditureAttempt {
  id_expediture: number;
  product_name?: string;
  estimated_amount: number;
  status?: AttemptStatus;
  id_user: number;
}

export type CreateExpenditureAttemptDto = Omit<ExpenditureAttempt, 'id_expediture'>;