export type TransactionType = 'Ingreso' | 'Gasto';

export interface Transaction {
  id_transaction: number;
  amount: number;
  type_transacion?: TransactionType;
  description?: string;
  id_user: number;
  id_category: number;
}

export type CreateTransactionDto = Omit<Transaction, 'id_transaction'>;