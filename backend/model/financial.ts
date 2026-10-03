export type CardType = 'Debito' | 'Credito';

export interface FinancialAccount {
  id_financial: number;
  account_name: string;
  /** Monograma del banco (bi, banrural, bac...). */
  bank_code?: string | null;
  /** Numero con el que la cuenta recibe Depositos de otros usuarios. */
  account_number?: string | null;
  /**
   * Dinero disponible de la cuenta. Para una tarjeta de credito el cupo aprobado
   * se acredita aqui, asi que `balance` siempre es lo que se puede gastar.
   */
  balance?: number;
  /** Cupo total que la tarjeta puede alcanzar con solicitudes de credito. */
  credit_limit?: number;
  card_type?: CardType;
  id_user?: number | null;
}

export type CreateFinancialAccountDto = Omit<FinancialAccount, 'id_financial'>;

/** Cuenta vista desde el catalogo de destinos de una transferencia. */
export interface BankAccountView {
  id_account: number;
  account_number: string;
  account_holder: string;
  account_type?: CardType;
  balance?: number;
  id_bank: number;
  bank_name?: string;
  bank_code?: string;
}

/** Transferencia entre dos cuentas de Curbi. */
export interface CreateTransferDto {
  amount: number;
  /** Numero de la cuenta que recibe el dinero. */
  account_number: string;
  description?: string;
  id_user: number;
  /** Cuenta de la que sale el dinero. */
  id_financial: number;
}

export interface TransferResult {
  amount: number;
  description: string;
  destination: BankAccountView;
  transaction: {
    id_transaction: number;
    amount: number;
    type_transacion: 'Ingreso' | 'Gasto';
    description: string;
    id_user: number;
    id_category: number;
  };
  /** Saldo de la cuenta origen despues del movimiento. */
  balance: number;
}

export interface CreateCreditRequestDto {
  id_user: number;
  id_financial: number;
  amount: number;
}

export interface CreditRequest {
  id_credit: number;
  id_user: number;
  id_financial: number;
  amount: number;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado';
  /**
   * MySQL devuelve las columnas timestamp como Date, pero el mismo valor puede
   * llegar como string si la fila se arma a mano. Se tipan las dos formas porque
   * financialService las normaliza con `instanceof Date` antes de mandarlas al
   * frontend, y con `created_at: string` ese instanceof no compila.
   */
  created_at: string | Date;
  resolved_at?: string | Date | null;
}

/** Estado de cuenta que consume el modal para decidir si alcanza o hay que pedir cupo. */
export interface AccountState {
  id_financial: number;
  account_name: string;
  card_type: CardType;
  balance: number;
  credit_limit: number;
  /** Dinero con el que se puede pagar ahora. */
  disponible: number;
  /** Solicitud de cupo en espera, si la hay. */
  pendiente: {
    id_credit: number;
    amount: number;
    created_at: string;
    /** Cuantos segundos faltan para que la banca responda. */
    segundos_restantes: number;
  } | null;
}
