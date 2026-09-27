import { Request, Response } from 'express';
import { BudgetService } from '../service/budgetService';
import { BusinessError } from '../model/errors';

export class BudgetController {
  private budgetService = new BudgetService();

  getBudgetsByUser = async (req: Request, res: Response): Promise<any> => {
    try {
      const rawParam = req.params.idUser;
      const idUserString = Array.isArray(rawParam) ? rawParam[0] : rawParam;
      const idUser = Number(idUserString);
      if (isNaN(idUser)) {
        return res.status(400).json({ error: 'El ID de usuario no es válido' });
      }
      const budgets = await this.budgetService.obtenerPresupuestos(idUser, this.periodo(req));
      return res.status(200).json(budgets);
    } catch (error: any) {
      if (error instanceof BusinessError) {
        return res.status(error.status).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message });
    }
  };

  createBudget = async (req: Request, res: Response): Promise<any> => {
    try {
      const budget = await this.budgetService.guardarPresupuesto(req.body);
      // 200 y no 201 cuando el limite ya existia y se actualizo: el upsert del
      // repositorio no distingue uno de otro, y el cliente no lo necesita.
      return res.status(200).json(budget);
    } catch (error: any) {
      if (error instanceof BusinessError) {
        return res.status(error.status).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message });
    }
  };

  deleteBudget = async (req: Request, res: Response): Promise<any> => {
    try {
      const rawParam = req.params.idBudget;
      const idBudgetString = Array.isArray(rawParam) ? rawParam[0] : rawParam;
      const idBudget = Number(idBudgetString);
      if (isNaN(idBudget)) {
        return res.status(400).json({ error: 'El ID de presupuesto no es válido' });
      }
      await this.budgetService.eliminarPresupuesto(idBudget, Number(req.params.idUser));
      return res.status(200).json({ eliminado: true });
    } catch (error: any) {
      if (error instanceof BusinessError) {
        return res.status(error.status).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message });
    }
  };

  private periodo(req: Request): string | undefined {
    const query = req.query.periodo;
    if (typeof query === 'string') {
      return query;
    }
    if (Array.isArray(query) && typeof query[0] === 'string') {
      return query[0];
    }
    return undefined;
  }
}
