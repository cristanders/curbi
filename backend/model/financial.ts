export interface FinancialAccount {
  id_financial: number;
  account_name: string;
  balance?: number;
  id_user?: number;
}

export type CreateFinancialAccountDto = Omit<FinancialAccount, 'id_financial'>;