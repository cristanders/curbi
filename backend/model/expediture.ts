export type AttemptStatus = 'Frenado' | 'Aprobado' | 'Pendiente';

export interface ExpenditureAttempt {
  id_expediture: number;
  product_name?: string;
  estimated_amount: number;
  status?: AttemptStatus;
  id_user: number;
  /** Categoria contra la que se evalua el limite. */
  id_category?: number;
  /** Quedo registrado como movimiento real? Solo cuando el backend lo aprueba. */
  id_transaction?: number | null;
  /** Por que quedo Frenado, para poder explicarle el caso al usuario. */
  reason?: string | null;
  created_at?: string;
}

export type CreateExpenditureAttemptDto = Omit<
  ExpenditureAttempt,
  'id_expediture' | 'id_transaction' | 'reason' | 'created_at'
>;

/**
 * Resultado de pedir un gasto. `status` es la decision del backend: si el monto
 * se pasa del limite de la categoria, el intento queda Frenado y no se toca el
 * saldo; si cabe, queda Aprobado y se registra el movimiento.
 */
export interface AttemptResult {
  attempt: ExpenditureAttempt;
  status: AttemptStatus;
  reason: string | null;
  /** Saldo de la cuenta despues de aplicar el movimiento, si se aplico. */
  balance: number | null;
  transaction: { id_transaction: number } | null;
}
