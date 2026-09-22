import { Injectable } from '@angular/core';
import {
  Budget,
  DashboardPayload,
  FinancialAccount,
  SavingsGoal,
  Transaction,
} from './api.service';

/** Datos de demostracion usados cuando el backend no esta disponible. */
@Injectable({ providedIn: 'root' })
export class DemoDataService {
  readonly accounts: FinancialAccount[] = [
    { id_financial: 1, account_name: 'Cuenta principal', balance: 233.15, id_user: 1 },
    { id_financial: 2, account_name: 'Ahorro Banrural', balance: 142.8, id_user: 1 },
    { id_financial: 3, account_name: 'Banco del Café', balance: 64.15, id_user: 1 },
  ];

  readonly transactions: Transaction[] = [
    {
      id_transaction: 1,
      amount: 99.99,
      type_transacion: 'Gasto',
      description: 'eFootball Coins 1,050 | QR efootball_coin_1500',
      id_user: 1,
      id_category: 1,
    },
    {
      id_transaction: 2,
      amount: 16.61,
      type_transacion: 'Gasto',
      description: 'eFootball Coins 1,050 | QR efootball_coin_1500',
      id_user: 1,
      id_category: 1,
    },
    {
      id_transaction: 3,
      amount: 15.99,
      type_transacion: 'Gasto',
      description: 'Monoposto Coins 15,000 | QR monoposto_coins_15000',
      id_user: 1,
      id_category: 2,
    },
    {
      id_transaction: 4,
      amount: 100.0,
      type_transacion: 'Ingreso',
      description: 'ACH JORGE.ERNESTO.A',
      id_user: 1,
      id_category: 3,
    },
  ];

  readonly savingsGoals: SavingsGoal[] = [
    { id_saving: 1, goal_name: 'VIAJE A LA ANTIGUA', target_amount: 4000, current_amount: 3000, id_user: 1 },
    { id_saving: 2, goal_name: 'FONDOS DE EMERGENCIA', target_amount: 8500, current_amount: 8500, id_user: 1 },
    { id_saving: 3, goal_name: 'NINTENDO SWITCH 2', target_amount: 6500, current_amount: 1500, id_user: 1 },
  ];

  readonly budgets: Budget[] = [{ id_budget: 1, amount: 500, id_user: 1 }];

  dashboard(): DashboardPayload {
    const totalBalance = this.accounts.reduce((s, a) => s + a.balance, 0);
    const totalSaved = this.savingsGoals.reduce((s, g) => s + (g.current_amount || 0), 0);
    const income = this.transactions
      .filter((t) => t.type_transacion === 'Ingreso')
      .reduce((s, t) => s + t.amount, 0);
    const expense = this.transactions
      .filter((t) => t.type_transacion === 'Gasto')
      .reduce((s, t) => s + t.amount, 0);

    return {
      idUser: 1,
      demo: true,
      accounts: this.accounts,
      transactions: this.transactions,
      savingsGoals: this.savingsGoals,
      budgets: this.budgets,
      summary: {
        totalBalance,
        totalSaved,
        income,
        expense,
        net: income - expense,
        accountCount: this.accounts.length,
        transactionCount: this.transactions.length,
        goalCount: this.savingsGoals.length,
      },
    };
  }
}
