import { Request, Response } from 'express';
import { FinancialAccountService } from '../service/financialService';
import { TransactionService } from '../service/transactionService';
import { SavingsGoalService } from '../service/savingsService';
import { BudgetService } from '../service/budgetService';

export class DashboardController {
  private accountService = new FinancialAccountService();
  private transactionService = new TransactionService();
  private goalService = new SavingsGoalService();
  private budgetService = new BudgetService();

  // GET /api/dashboard/user/:idUser
  // Devuelve en una sola llamada todo lo que necesita el dashboard.
  getDashboard = async (req: Request, res: Response): Promise<any> => {
    const raw = req.params.idUser;
    const idUser = Number(Array.isArray(raw) ? raw[0] : raw);
    if (isNaN(idUser)) {
      return res.status(400).json({ error: 'El ID de usuario no es válido' });
    }

    const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
      try {
        const value = await fn();
        return value ?? fallback;
      } catch {
        return fallback;
      }
    };

    const [accounts, transactions, savingsGoals, budgets] = await Promise.all([
      safe(() => this.accountService.obtenerCuentasPorUsuario(idUser), []),
      safe(() => this.transactionService.obtenerTransaccionesPorUsuario(idUser), []),
      safe(() => this.goalService.obtenerMetasPorUsuario(idUser), []),
      safe(() => this.budgetService.obtenerPresupuestosPorUsuario(idUser), []),
    ]);

    const totalBalance = accounts.reduce(
      (sum: number, a: any) => sum + Number(a.balance || 0),
      0,
    );
    const totalSaved = savingsGoals.reduce(
      (sum: number, g: any) => sum + Number(g.current_amount || 0),
      0,
    );
    const income = transactions
      .filter((t: any) => t.type_transacion === 'Ingreso')
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const expense = transactions
      .filter((t: any) => t.type_transacion === 'Gasto')
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

    const demo = accounts.length === 0 && transactions.length === 0 && savingsGoals.length === 0;

    return res.status(200).json({
      idUser,
      demo,
      accounts,
      transactions,
      savingsGoals,
      budgets,
      summary: {
        totalBalance,
        totalSaved,
        income,
        expense,
        net: income - expense,
        accountCount: accounts.length,
        transactionCount: transactions.length,
        goalCount: savingsGoals.length,
      },
    });
  };
}
