export type TransactionType = 'Ingreso' | 'Gasto';

export interface Transaction {
  id_transaction: number;
  amount: number;
  type_transacion?: TransactionType;
  description?: string;
  id_user: number;
  /**
   * Opcional a proposito: un movimiento sin cuenta es solo un asiento (por
   * ejemplo el boton de prueba de la pantalla de transactions) y no debe tocar
   * ningun saldo.
   */
  id_financial?: number | null;
  id_category: number;
  /**
   * Fecha real del movimiento, la pone el servidor. Antes no existia y la pantalla
   * se la inventaba a partir de la posicion de la fila, por lo que dos movimientos
   * del mismo dia parecian de dias distintos.
   */
  created_at?: string;
}

export type CreateTransactionDto = Omit<Transaction, 'id_transaction'>;

/**
 * `balance` es el saldo que quedo en la cuenta despues del movimiento, o null si
 * el movimiento no toco ninguna cuenta. El frontend lo usa en vez de calcularlo
 * por su cuenta, para que el saldo local y el del servidor no divergan.
 */
export interface CreateTransactionResult {
  transaction: Transaction;
  balance: number | null;
}
